export type MachineState = 'ACTIVE' | 'IDLE' | 'OFF' | 'ABNORMAL' | 'WARMUP';

export type DataSource = 'LIVE_SENSOR' | 'SIMULATION';

export type IngestionMethod = 'WEB_SERIAL' | 'WEBSOCKET' | 'HTTP_REST' | 'SIMULATOR';

export type GridRegion = 'IN_CEA' | 'US_EGRID' | 'EU_EEA' | 'UK_DESNZ' | 'CUSTOM';

/**
 * Standard Canonical C-TRACK IoT Data Model
 * Exactly matching the ESP32-S3 ingestion payload specification
 */
export interface StandardTelemetryPayload {
  timestamp: number;
  deviceId: string;
  machineId: string;
  voltage: number;
  current: number;
  temperature: number; // Measured DS18B20 reading
  power: number; // Voltage * Current
  energy: number; // Integrated kWh
  machineState: MachineState;
  dataSource: DataSource;
}

export interface TelemetryPacket extends StandardTelemetryPayload {
  measuredTemperature: number; // Explicit physical DS18B20 temperature
  simulatedProcessTemperature: number; // Explicit Demo Simulated process temperature (e.g. furnace)
  state: MachineState; // Alias for machineState
  cumulativeEnergyKWh: number; // Alias for energy
  activeEnergyKWh: number;
  idleEnergyKWh: number;
  carbonKgCO2e: number;
  isSimulated: boolean;
  edgeBufferIndex?: number;
  motorRpm?: number;
  rawAdc?: {
    ads1115_v: number;
    ads1115_i: number;
  };
  validationErrors?: string[];
}

export interface StateTimeSegment {
  id: string;
  state: MachineState;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  averagePowerW: number;
  energyKWh: number;
}

export interface SensorValidationStatus {
  isValid: boolean;
  voltageStatus: 'OK' | 'OUT_OF_RANGE' | 'DISCONNECTED';
  currentStatus: 'OK' | 'OUT_OF_RANGE' | 'FAULT';
  temperatureStatus: 'OK' | 'DISCONNECTED' | 'ERROR';
  ads1115Status: 'OK' | 'COMMUNICATION_ERROR';
  errors: string[];
  lastLivePacketTimestamp: number | null;
  lastPacketAgeSeconds: number;
  isStale: boolean;
  connectionMethod: IngestionMethod;
  hasReceivedLivePacket: boolean;
}

export interface TelemetrySummary {
  // Power
  currentPowerW: number;
  peakPowerTodayW: number;
  avgVoltageTodayV: number;
  avgCurrentTodayA: number;

  // Energy
  sessionEnergyWh: number;
  sessionEnergyKWh: number;
  todayTotalEnergyKWh: number;
  todayActiveEnergyKWh: number;
  todayIdleEnergyKWh: number;
  totalCumulativeEnergyKWh: number;

  // Carbon (Energy-based Estimates)
  todayCarbonKgCO2e: number;
  todayProductiveCarbonKgCO2e: number;
  todayIdleCarbonKgCO2e: number;
  sessionCarbonKgCO2e: number;

  // Time & Economic Accounting
  todayActiveTimeSeconds: number;
  todayIdleTimeSeconds: number;
  todayOffTimeSeconds: number;
  todayIdleCost: number;
  potentialEnergySavingKWh: number;
  potentialCarbonSavingKgCO2e: number;
  potentialCostSaving: number;
}

export interface HumanInsight {
  id: string;
  category: 'IDLE_EFFICIENCY' | 'ENERGY_PROFILE' | 'CARBON_INTENSITY' | 'ANOMALY';
  title: string;
  text: string;
  metricValue?: string;
  actionableRecommendation?: string;
  severity: 'INFO' | 'OPPORTUNITY' | 'WARNING';
}

export interface MachineInfo {
  id: string; // 'Motor-01'
  name: string; // '12V DC Motor Test Bench'
  controller: string; // 'ESP32-S3'
  firmwareVersion: string; // 'v1.4.2-edge'
  driver: string; // 'L298N H-Bridge'
  sensors: string[];
  ratedVoltage: number; // 12.0 V
  ratedCurrent: number; // 1.2 A
  idleThresholdW: number; // 4.5 W
  overloadThresholdA: number; // 1.8 A
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  offlineBufferCount: number;
  flashMemoryUsedPercent: number;
  rssi?: number;
  coreTempC?: number;
}

export interface BatchInfo {
  batchId: string;
  machineId: string;
  productName: string;
  sku: string;
  productionDate: string;
  unitsPlanned: number;
  unitsCompleted: number;
  startedAt: number;
  endedAt?: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  verificationStatus: 'VERIFIED' | 'PENDING';
  initialEnergyKWh: number;
  totalEnergyKWh: number;
  activeEnergyKWh: number;
  idleEnergyKWh: number;
  totalCarbonKgCO2e: number;
  emissionFactor: number;
  carbonPerUnit: number;
  activeDurationSec: number;
  idleDurationSec: number;
  recordHash?: string;
}

export interface AnomalyAlert {
  id: string;
  timestamp: number;
  type: 'IDLE_WASTE' | 'CURRENT_OVERLOAD' | 'VOLTAGE_SAG' | 'THERMAL_SPIKE' | 'SENSOR_DISCONNECT' | 'SENSOR_OUT_OF_BOUNDS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  value: string;
  threshold: string;
  resolved: boolean;
}

export interface SensorCalibration {
  acs712ZeroMv: number; // Default: 2500 mV (VCC/2)
  acs712SensitivityMvPerA: number; // Default: 185 mV/A (5A model)
  voltageDividerRatio: number; // Default: 5.0 (0-25V -> 0-5V)
  ds18b20OffsetC: number; // Default: 0.0 °C
}

export interface SystemSettings {
  mode: 'LIVE' | 'DEMO'; // Top-level operational mode
  ingestionMethod: IngestionMethod;
  httpEndpointUrl: string; // e.g. 'http://localhost:3001/api/telemetry'
  webSocketUrl: string; // e.g. 'ws://localhost:3001/ws'
  serialBaudRate: number; // e.g. 115200
  gridRegion: GridRegion;
  gridEmissionFactor: number; // kg CO2/kWh (e.g. 0.716)
  electricityRatePerKWh: number; // e.g. 7.50
  currencySymbol: string; // '₹', '$', '€', '£'
  
  // Configurable Machine State Thresholds
  idlePowerThresholdW: number; // e.g. 4.5 W
  overloadCurrentThresholdA: number; // e.g. 1.8 A
  offCurrentThresholdA: number; // e.g. 0.08 A
  minOperatingVoltageV: number; // e.g. 8.0 V
  
  // Physical Sensor Safety Bounds
  voltageMinLimitV: number; // e.g. 0.0 V
  voltageMaxLimitV: number; // e.g. 25.0 V
  currentMaxLimitA: number; // e.g. 5.0 A
  tempMaxLimitC: number; // e.g. 80.0 °C
  
  offlineBufferSyncIntervalSec: number;
  simulatedProcessTempTarget: number; // e.g. 450 °C
  simulatedMotorLoad: 'IDLE' | 'NORMAL' | 'HIGH' | 'STALL' | 'DYNAMIC_CYCLE';
  simulatedFaultInjection: 'NONE' | 'OVERLOAD' | 'VOLTAGE_SAG' | 'HEAT_RUNAWAY' | 'SENSOR_DISCONNECT';
  sensorCalibration: SensorCalibration;
}
