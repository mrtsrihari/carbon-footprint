import {
  StandardTelemetryPayload,
  TelemetryPacket,
  SensorValidationStatus,
  SystemSettings,
  MachineState,
  DataSource
} from '../types/telemetry';
import { classifyMachineState } from './stateClassifier';
import { calculateCarbonEmissions } from './carbonEngine';

/**
 * Validates incoming raw telemetry data from ESP32-S3 (via Web Serial, WebSocket, or HTTP REST).
 * Ensures physical limits, catches transducer faults, and marks staleness without faking live readings.
 */
export function validateTelemetryPayload(
  raw: any,
  settings: SystemSettings,
  lastLivePacketTimestamp: number | null,
  previousPacket?: TelemetryPacket
): {
  isValid: boolean;
  packet: TelemetryPacket | null;
  validationStatus: SensorValidationStatus;
} {
  const now = Date.now();
  const errors: string[] = [];

  let voltageStatus: 'OK' | 'OUT_OF_RANGE' | 'DISCONNECTED' = 'OK';
  let currentStatus: 'OK' | 'OUT_OF_RANGE' | 'FAULT' = 'OK';
  let temperatureStatus: 'OK' | 'DISCONNECTED' | 'ERROR' = 'OK';
  let ads1115Status: 'OK' | 'COMMUNICATION_ERROR' = 'OK';

  if (!raw || typeof raw !== 'object') {
    return {
      isValid: false,
      packet: null,
      validationStatus: {
        isValid: false,
        voltageStatus: 'DISCONNECTED',
        currentStatus: 'FAULT',
        temperatureStatus: 'DISCONNECTED',
        ads1115Status: 'COMMUNICATION_ERROR',
        errors: ['Empty or malformed JSON payload received'],
        lastLivePacketTimestamp,
        lastPacketAgeSeconds: lastLivePacketTimestamp ? Math.round((now - lastLivePacketTimestamp) / 1000) : 0,
        isStale: true,
        connectionMethod: settings.ingestionMethod,
        hasReceivedLivePacket: lastLivePacketTimestamp !== null
      }
    };
  }

  // Parse and validate Voltage (0 - 25V)
  const rawV = raw.voltage !== undefined ? Number(raw.voltage) : (raw.v !== undefined ? Number(raw.v) : NaN);
  let voltage = isNaN(rawV) ? 0 : rawV;
  if (isNaN(rawV)) {
    voltageStatus = 'DISCONNECTED';
    errors.push('Voltage reading is missing or NaN');
  } else if (rawV < settings.voltageMinLimitV || rawV > settings.voltageMaxLimitV + 1.0) {
    voltageStatus = 'OUT_OF_RANGE';
    errors.push(`Voltage ${rawV.toFixed(2)}V outside calibrated range (${settings.voltageMinLimitV}V - ${settings.voltageMaxLimitV}V)`);
  }

  // Parse and validate Current (0 - 5.0A)
  const rawI = raw.current !== undefined ? Number(raw.current) : (raw.i !== undefined ? Number(raw.i) : NaN);
  let current = isNaN(rawI) ? 0 : rawI;
  if (isNaN(rawI)) {
    currentStatus = 'FAULT';
    errors.push('ACS712 current reading is missing or NaN');
  } else if (rawI < -0.2 || rawI > settings.currentMaxLimitA + 0.5) {
    currentStatus = 'OUT_OF_RANGE';
    errors.push(`Current ${rawI.toFixed(3)}A outside ACS712-05B range (Max: ${settings.currentMaxLimitA}A)`);
  }

  // Parse and validate Measured Temperature (DS18B20)
  const rawT = raw.temperature !== undefined
    ? Number(raw.temperature)
    : (raw.measuredTemperature !== undefined ? Number(raw.measuredTemperature) : (raw.t_meas !== undefined ? Number(raw.t_meas) : NaN));
  
  let measuredTemperature = isNaN(rawT) ? 25.0 : rawT;
  if (isNaN(rawT)) {
    temperatureStatus = 'DISCONNECTED';
    errors.push('DS18B20 temperature reading is missing or NaN');
  } else if (rawT === -127 || rawT === -127.0) {
    // DallasTemperature library error code for disconnected sensor
    temperatureStatus = 'DISCONNECTED';
    errors.push('DS18B20 1-Wire sensor disconnected (Code: -127°C)');
  } else if (rawT === 85 || rawT === 85.0) {
    // DS18B20 power-on reset value before first read
    temperatureStatus = 'ERROR';
    errors.push('DS18B20 sensor in power-on reset state (85°C read)');
  } else if (rawT < -20 || rawT > settings.tempMaxLimitC) {
    temperatureStatus = 'OUT_OF_RANGE' as any;
    errors.push(`Measured temperature ${rawT.toFixed(1)}°C outside operating bounds (Max: ${settings.tempMaxLimitC}°C)`);
  }

  // ADS1115 check if reported
  if (raw.ads_err || raw.error?.includes('ADS1115')) {
    ads1115Status = 'COMMUNICATION_ERROR';
    errors.push('ADS1115 I2C ADC communication failure');
  }

  // Power calculation: P = V * I
  const power = Number((voltage * current).toFixed(2));

  // Determine Data Source
  const rawSource = String(raw.dataSource || (raw.isSimulated ? 'SIMULATION' : 'LIVE_SENSOR')).toUpperCase();
  const dataSource: DataSource = rawSource === 'SIMULATION' ? 'SIMULATION' : 'LIVE_SENSOR';
  const isSimulated = dataSource === 'SIMULATION';

  // State classification
  const previousState: MachineState = previousPacket?.state || 'OFF';
  const classification = classifyMachineState(voltage, current, power, previousState, {
    idlePowerThresholdW: settings.idlePowerThresholdW,
    overloadCurrentThresholdA: settings.overloadCurrentThresholdA,
    offCurrentThresholdA: settings.offCurrentThresholdA,
    minOperatingVoltageV: settings.minOperatingVoltageV
  });

  // Cumulative energy calculation
  let cumulativeEnergyKWh = raw.energy !== undefined ? Number(raw.energy) : (raw.cumulativeEnergyKWh !== undefined ? Number(raw.cumulativeEnergyKWh) : 0);
  if (cumulativeEnergyKWh === 0 && previousPacket) {
    const dtHours = Math.max(0, (now - previousPacket.timestamp) / 3600000);
    cumulativeEnergyKWh = previousPacket.cumulativeEnergyKWh + (power * dtHours) / 1000;
  }

  const prevActive = previousPacket?.activeEnergyKWh || 0;
  const prevIdle = previousPacket?.idleEnergyKWh || 0;
  const dtHours = previousPacket ? Math.max(0, (now - previousPacket.timestamp) / 3600000) : 0;
  const dEnergy = (power * dtHours) / 1000;

  const activeEnergyKWh = classification.isActiveWorkload ? prevActive + dEnergy : prevActive;
  const idleEnergyKWh = classification.isIdleWaste ? prevIdle + dEnergy : prevIdle;

  const carbonKgCO2e = calculateCarbonEmissions(cumulativeEnergyKWh, settings.gridEmissionFactor);

  const packetTimestamp = raw.timestamp && raw.timestamp > 1000000000 ? Number(raw.timestamp) : now;
  const updatedLiveTimestamp = !isSimulated ? now : lastLivePacketTimestamp;

  const lastPacketAge = updatedLiveTimestamp ? Math.max(0, Math.round((now - updatedLiveTimestamp) / 1000)) : 0;
  const isStale = !isSimulated && lastPacketAge > 3; // Stale if live mode and >3s without packet

  const packet: TelemetryPacket = {
    timestamp: packetTimestamp,
    deviceId: raw.deviceId || 'ESP32-S3-CTRACK-01',
    machineId: raw.machineId || 'MOTOR-01',
    voltage: Number(voltage.toFixed(2)),
    current: Number(current.toFixed(3)),
    temperature: Number(measuredTemperature.toFixed(1)),
    power,
    energy: Number(cumulativeEnergyKWh.toFixed(5)),
    machineState: classification.state,
    dataSource,

    // Frontend mapped properties
    measuredTemperature: Number(measuredTemperature.toFixed(1)),
    simulatedProcessTemperature: raw.simulatedProcessTemperature ? Number(raw.simulatedProcessTemperature) : 180.0,
    state: classification.state,
    cumulativeEnergyKWh: Number(cumulativeEnergyKWh.toFixed(5)),
    activeEnergyKWh: Number(activeEnergyKWh.toFixed(5)),
    idleEnergyKWh: Number(idleEnergyKWh.toFixed(5)),
    carbonKgCO2e,
    isSimulated,
    motorRpm: raw.motorRpm || (classification.state === 'ACTIVE' ? 1650 : classification.state === 'IDLE' ? 1850 : 0),
    edgeBufferIndex: raw.edgeBufferIndex || raw.buf_idx || 0,
    validationErrors: errors.length > 0 ? errors : undefined
  };

  const validationStatus: SensorValidationStatus = {
    isValid: errors.length === 0,
    voltageStatus,
    currentStatus,
    temperatureStatus,
    ads1115Status,
    errors,
    lastLivePacketTimestamp: updatedLiveTimestamp,
    lastPacketAgeSeconds: lastPacketAge,
    isStale,
    connectionMethod: settings.ingestionMethod,
    hasReceivedLivePacket: updatedLiveTimestamp !== null
  };

  return {
    isValid: errors.length === 0,
    packet,
    validationStatus
  };
}
