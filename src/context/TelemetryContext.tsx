import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  TelemetryPacket,
  TelemetrySummary,
  MachineInfo,
  BatchInfo,
  AnomalyAlert,
  SystemSettings,
  SensorValidationStatus,
  IngestionMethod,
  StateTimeSegment,
  HumanInsight
} from '../types/telemetry';
import { DPPRecord } from '../types/dpp';
import { telemetryEngine } from '../services/telemetryEngine';
import { GRID_EMISSION_PRESETS, calculateCarbonEmissions, calculateProductiveAndIdleCarbon } from '../services/carbonEngine';
import { createDigitalProductPassport } from '../services/dppEngine';
import { generateMachineInsights } from '../services/insightEngine';

export interface TelemetryContextType {
  currentPacket: TelemetryPacket;
  history: TelemetryPacket[];
  stateSegments: StateTimeSegment[];
  summary: TelemetrySummary;
  insights: HumanInsight[];
  machineInfo: MachineInfo;
  activeBatch: BatchInfo | null;
  batchList: BatchInfo[];
  dppList: DPPRecord[];
  alerts: AnomalyAlert[];
  settings: SystemSettings;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  connectionError: string | null;
  sensorValidation: SensorValidationStatus;
  
  // Actions
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  setMode: (mode: 'LIVE' | 'DEMO') => void;
  setIngestionMethod: (method: IngestionMethod) => void;
  startNewBatch: (name: string, sku: string, units: number) => void;
  completeActiveBatch: () => Promise<DPPRecord | null>;
  createDppFromBatch: (batchId: string) => Promise<DPPRecord | null>;
  resolveAlert: (alertId: string) => void;
  setMotorLoadPreset: (load: 'IDLE' | 'NORMAL' | 'HIGH' | 'STALL' | 'DYNAMIC_CYCLE') => void;
  setFaultInjection: (fault: 'NONE' | 'OVERLOAD' | 'VOLTAGE_SAG' | 'HEAT_RUNAWAY' | 'SENSOR_DISCONNECT') => void;
  connectWebSerial: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectHardware: () => void;
  toggleDataSource: () => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
  mode: 'DEMO',
  ingestionMethod: 'SIMULATOR',
  httpEndpointUrl: 'http://localhost:3001/api/telemetry',
  webSocketUrl: 'ws://localhost:3001/ws',
  serialBaudRate: 115200,
  gridRegion: 'IN_CEA',
  gridEmissionFactor: 0.716,
  electricityRatePerKWh: 7.50,
  currencySymbol: '₹',
  
  idlePowerThresholdW: 4.5,
  overloadCurrentThresholdA: 1.8,
  offCurrentThresholdA: 0.08,
  minOperatingVoltageV: 8.0,
  
  voltageMinLimitV: 0.0,
  voltageMaxLimitV: 25.0,
  currentMaxLimitA: 5.0,
  tempMaxLimitC: 80.0,
  
  offlineBufferSyncIntervalSec: 10,
  simulatedProcessTempTarget: 450,
  simulatedMotorLoad: 'DYNAMIC_CYCLE',
  simulatedFaultInjection: 'NONE',
  sensorCalibration: {
    acs712ZeroMv: 2500,
    acs712SensitivityMvPerA: 185,
    voltageDividerRatio: 5.0,
    ds18b20OffsetC: 0.0
  }
};

const INITIAL_PACKET: TelemetryPacket = {
  timestamp: Date.now(),
  deviceId: 'ESP32-S3-CTRACK-01',
  machineId: 'MOTOR-01',
  voltage: 12.05,
  current: 0.84,
  temperature: 28.5,
  power: 10.12,
  energy: 0.412,
  machineState: 'ACTIVE',
  dataSource: 'SIMULATION',
  
  measuredTemperature: 28.5,
  simulatedProcessTemperature: 385.0,
  state: 'ACTIVE',
  cumulativeEnergyKWh: 0.412,
  activeEnergyKWh: 0.318,
  idleEnergyKWh: 0.094,
  carbonKgCO2e: 0.295,
  isSimulated: true,
  motorRpm: 1650,
  edgeBufferIndex: 104
};

const INITIAL_VALIDATION: SensorValidationStatus = {
  isValid: true,
  voltageStatus: 'OK',
  currentStatus: 'OK',
  temperatureStatus: 'OK',
  ads1115Status: 'OK',
  errors: [],
  lastLivePacketTimestamp: null,
  lastPacketAgeSeconds: 0,
  isStale: false,
  connectionMethod: 'SIMULATOR',
  hasReceivedLivePacket: false
};

const INITIAL_BATCHES: BatchInfo[] = [
  {
    batchId: 'BATCH-2026-0901-A',
    machineId: 'Motor-01',
    productName: 'M12 High-Tensile Fasteners',
    sku: 'SKU-HTF-M12',
    productionDate: '2026-09-01',
    unitsPlanned: 500,
    unitsCompleted: 340,
    startedAt: Date.now() - 7200000,
    status: 'ACTIVE',
    verificationStatus: 'PENDING',
    initialEnergyKWh: 0.120,
    totalEnergyKWh: 0.292,
    activeEnergyKWh: 0.231,
    idleEnergyKWh: 0.061,
    totalCarbonKgCO2e: 0.209,
    emissionFactor: 0.716,
    carbonPerUnit: 0.00061,
    activeDurationSec: 5400,
    idleDurationSec: 1800
  },
  {
    batchId: 'BATCH-2026-0831-C',
    machineId: 'Motor-01',
    productName: 'Alloy Bushing Spindles',
    sku: 'SKU-ABS-08',
    productionDate: '2026-08-31',
    unitsPlanned: 200,
    unitsCompleted: 200,
    startedAt: Date.now() - 86400000,
    endedAt: Date.now() - 72000000,
    status: 'COMPLETED',
    verificationStatus: 'VERIFIED',
    initialEnergyKWh: 0.0,
    totalEnergyKWh: 0.650,
    activeEnergyKWh: 0.540,
    idleEnergyKWh: 0.110,
    totalCarbonKgCO2e: 0.465,
    emissionFactor: 0.716,
    carbonPerUnit: 0.00232,
    activeDurationSec: 12400,
    idleDurationSec: 2000,
    recordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  }
];

const INITIAL_ALERTS: AnomalyAlert[] = [
  {
    id: 'ALT-101',
    timestamp: Date.now() - 1200000,
    type: 'IDLE_WASTE',
    severity: 'MEDIUM',
    title: 'Extended Standby Idle Run Detected',
    description: 'Motor-01 has been idling without mechanical load for > 15 minutes. Parasitic energy leak.',
    value: '2.8W (Zero Torque)',
    threshold: '< 4.5W for > 5 min',
    resolved: false
  },
  {
    id: 'ALT-102',
    timestamp: Date.now() - 3600000,
    type: 'CURRENT_OVERLOAD',
    severity: 'HIGH',
    title: 'Startup Inrush Transient Suppressed',
    description: 'Brief inductive startup current surge during cold start. Suppressed by Edge State classifier.',
    value: '1.92 A',
    threshold: '1.80 A',
    resolved: true
  }
];

const TelemetryContext = createContext<TelemetryContextType | null>(null);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('ctrack_settings_v2');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [currentPacket, setCurrentPacket] = useState<TelemetryPacket>(INITIAL_PACKET);
  const [history, setHistory] = useState<TelemetryPacket[]>([INITIAL_PACKET]);
  const [stateSegments, setStateSegments] = useState<StateTimeSegment[]>(() => [
    {
      id: 'SEG-1',
      state: 'ACTIVE',
      startTime: Date.now() - 180000,
      endTime: Date.now() - 60000,
      durationSeconds: 120,
      averagePowerW: 10.4,
      energyKWh: 0.00035
    },
    {
      id: 'SEG-2',
      state: 'IDLE',
      startTime: Date.now() - 60000,
      endTime: Date.now() - 20000,
      durationSeconds: 40,
      averagePowerW: 2.8,
      energyKWh: 0.00003
    },
    {
      id: 'SEG-3',
      state: 'ACTIVE',
      startTime: Date.now() - 20000,
      endTime: Date.now(),
      durationSeconds: 20,
      averagePowerW: 10.8,
      energyKWh: 0.00006
    }
  ]);

  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR'>('CONNECTED');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sensorValidation, setSensorValidation] = useState<SensorValidationStatus>(INITIAL_VALIDATION);

  const [batchList, setBatchList] = useState<BatchInfo[]>(() => {
    const saved = localStorage.getItem('ctrack_batches');
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [dppList, setDppList] = useState<DPPRecord[]>(() => {
    const saved = localStorage.getItem('ctrack_dpps');
    return saved ? JSON.parse(saved) : [];
  });

  const [alerts, setAlerts] = useState<AnomalyAlert[]>(INITIAL_ALERTS);

  const activeBatch = batchList.find(b => b.status === 'ACTIVE') || null;

  // Session start baseline
  const sessionStartEnergyRef = useRef<number>(INITIAL_PACKET.cumulativeEnergyKWh);

  // Summary State Store
  const [summary, setSummary] = useState<TelemetrySummary>({
    currentPowerW: 10.12,
    peakPowerTodayW: 24.2,
    avgVoltageTodayV: 12.08,
    avgCurrentTodayA: 0.72,
    sessionEnergyWh: 14.5,
    sessionEnergyKWh: 0.0145,
    todayTotalEnergyKWh: 0.412,
    todayActiveEnergyKWh: 0.318,
    todayIdleEnergyKWh: 0.094,
    totalCumulativeEnergyKWh: 12.84,
    todayCarbonKgCO2e: 0.295,
    todayProductiveCarbonKgCO2e: 0.228,
    todayIdleCarbonKgCO2e: 0.067,
    sessionCarbonKgCO2e: 0.0104,
    todayActiveTimeSeconds: 14200,
    todayIdleTimeSeconds: 3800,
    todayOffTimeSeconds: 1200,
    todayIdleCost: 0.705,
    potentialEnergySavingKWh: 0.094,
    potentialCarbonSavingKgCO2e: 0.067,
    potentialCostSaving: 0.705
  });

  const [machineInfo, setMachineInfo] = useState<MachineInfo>({
    id: 'Motor-01',
    name: '12V DC Motor Test Bench',
    controller: 'ESP32-S3',
    firmwareVersion: 'v1.4.2-edge',
    driver: 'L298N H-Bridge',
    sensors: [
      'ACS712-05B Current Sensor (Hall Effect)',
      'ADS1115 16-Bit Precision I2C ADC',
      'DS18B20 1-Wire Digital Thermometer',
      '0–25V Analog Voltage Sensor (Divider)'
    ],
    ratedVoltage: 12.0,
    ratedCurrent: 1.2,
    idleThresholdW: 4.5,
    overloadThresholdA: 1.8,
    connectionStatus: 'CONNECTED',
    offlineBufferCount: 14,
    flashMemoryUsedPercent: 18.5,
    rssi: -58,
    coreTempC: 41.2
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
    localStorage.setItem('ctrack_settings_v2', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('ctrack_batches', JSON.stringify(batchList));
  }, [batchList]);

  useEffect(() => {
    localStorage.setItem('ctrack_dpps', JSON.stringify(dppList));
  }, [dppList]);

  // Derived Human Insights
  const insights = generateMachineInsights(summary, machineInfo, settings);

  // Handle incoming packets
  const handlePacket = useCallback((packet: TelemetryPacket) => {
    setCurrentPacket(packet);

    setHistory(prev => {
      const next = [...prev, packet];
      if (next.length > 120) next.shift(); // Keep last 120 points (1 minute at 2Hz)
      return next;
    });

    // Update state timeline segments
    setStateSegments(prev => {
      const lastSeg = prev[prev.length - 1];
      const now = packet.timestamp;

      if (lastSeg && lastSeg.state === packet.state) {
        // Extend existing segment
        const duration = Math.max(1, Math.round((now - lastSeg.startTime) / 1000));
        const updatedSeg = {
          ...lastSeg,
          endTime: now,
          durationSeconds: duration,
          averagePowerW: Number(((lastSeg.averagePowerW + packet.power) / 2).toFixed(2)),
          energyKWh: Number((lastSeg.energyKWh + (packet.power * (0.5 / 3600000))).toFixed(5))
        };
        return [...prev.slice(0, -1), updatedSeg];
      } else {
        // Start new state segment
        const newSeg: StateTimeSegment = {
          id: `SEG-${Date.now().toString().slice(-4)}`,
          state: packet.state,
          startTime: now,
          endTime: now + 500,
          durationSeconds: 1,
          averagePowerW: packet.power,
          energyKWh: Number((packet.power * (0.5 / 3600000)).toFixed(5))
        };
        const next = [...prev, newSeg];
        if (next.length > 20) next.shift(); // Keep recent 20 state transitions
        return next;
      }
    });

    // Update active batch if running
    setBatchList(prevBatches => {
      return prevBatches.map(batch => {
        if (batch.status !== 'ACTIVE') return batch;
        
        const dEnergy = packet.power * (0.5 / 3600000); // 500ms interval
        const nextTotal = batch.totalEnergyKWh + dEnergy;
        const nextActive = packet.state === 'ACTIVE' ? batch.activeEnergyKWh + dEnergy : batch.activeEnergyKWh;
        const nextIdle = packet.state === 'IDLE' ? batch.idleEnergyKWh + dEnergy : batch.idleEnergyKWh;
        const nextCarbon = nextTotal * settingsRef.current.gridEmissionFactor;
        const nextCarbonPerUnit = batch.unitsCompleted > 0 ? nextCarbon / batch.unitsCompleted : 0;

        return {
          ...batch,
          totalEnergyKWh: nextTotal,
          activeEnergyKWh: nextActive,
          idleEnergyKWh: nextIdle,
          totalCarbonKgCO2e: nextCarbon,
          carbonPerUnit: nextCarbonPerUnit,
          activeDurationSec: packet.state === 'ACTIVE' ? batch.activeDurationSec + 0.5 : batch.activeDurationSec,
          idleDurationSec: packet.state === 'IDLE' ? batch.idleDurationSec + 0.5 : batch.idleDurationSec
        };
      });
    });

    // Update Summary
    setSummary(prev => {
      const tariff = settingsRef.current.electricityRatePerKWh;
      const gef = settingsRef.current.gridEmissionFactor;
      
      const sessionDeltaKWh = Math.max(0, packet.cumulativeEnergyKWh - sessionStartEnergyRef.current);
      const sessionEnergyWh = sessionDeltaKWh * 1000;
      const sessionCarbon = sessionDeltaKWh * gef;

      const idleCost = packet.idleEnergyKWh * tariff;
      const idleCarbon = packet.idleEnergyKWh * gef;
      const productiveCarbon = packet.activeEnergyKWh * gef;

      return {
        ...prev,
        currentPowerW: packet.power,
        sessionEnergyWh: Number(sessionEnergyWh.toFixed(2)),
        sessionEnergyKWh: Number(sessionDeltaKWh.toFixed(5)),
        sessionCarbonKgCO2e: Number(sessionCarbon.toFixed(5)),
        
        todayTotalEnergyKWh: packet.cumulativeEnergyKWh,
        todayActiveEnergyKWh: packet.activeEnergyKWh,
        todayIdleEnergyKWh: packet.idleEnergyKWh,
        totalCumulativeEnergyKWh: Number((12.4 + packet.cumulativeEnergyKWh).toFixed(3)),
        
        todayCarbonKgCO2e: packet.carbonKgCO2e,
        todayProductiveCarbonKgCO2e: productiveCarbon,
        todayIdleCarbonKgCO2e: idleCarbon,
        todayIdleCost: Number(idleCost.toFixed(2)),
        potentialEnergySavingKWh: packet.idleEnergyKWh,
        potentialCarbonSavingKgCO2e: idleCarbon,
        potentialCostSaving: Number(idleCost.toFixed(2)),
        peakPowerTodayW: Math.max(prev.peakPowerTodayW, packet.power),
        todayActiveTimeSeconds: packet.state === 'ACTIVE' ? prev.todayActiveTimeSeconds + 0.5 : prev.todayActiveTimeSeconds,
        todayIdleTimeSeconds: packet.state === 'IDLE' ? prev.todayIdleTimeSeconds + 0.5 : prev.todayIdleTimeSeconds,
        todayOffTimeSeconds: packet.state === 'OFF' ? prev.todayOffTimeSeconds + 0.5 : prev.todayOffTimeSeconds
      };
    });

    // Check for abnormal electrical excursion
    if (packet.state === 'ABNORMAL' || packet.current > settingsRef.current.overloadCurrentThresholdA) {
      setAlerts(prev => {
        if (prev.some(a => !a.resolved && a.type === 'CURRENT_OVERLOAD')) return prev;
        return [
          {
            id: `ALT-${Date.now().toString().slice(-4)}`,
            timestamp: Date.now(),
            type: 'CURRENT_OVERLOAD',
            severity: 'CRITICAL',
            title: 'Abnormal Current Excursion / Motor Overload',
            description: `Current draw (${packet.current.toFixed(2)}A) exceeded configured limit (${settingsRef.current.overloadCurrentThresholdA}A). Possible rotor stall.`,
            value: `${packet.current.toFixed(2)} A`,
            threshold: `${settingsRef.current.overloadCurrentThresholdA} A`,
            resolved: false
          },
          ...prev
        ];
      });
    }

    // Check for sensor disconnect or out of bounds alert
    if (packet.validationErrors && packet.validationErrors.length > 0) {
      setAlerts(prev => {
        const errorTitle = packet.validationErrors![0];
        if (prev.some(a => !a.resolved && a.title === errorTitle)) return prev;
        return [
          {
            id: `ALT-SENS-${Date.now().toString().slice(-4)}`,
            timestamp: Date.now(),
            type: 'SENSOR_OUT_OF_BOUNDS',
            severity: 'HIGH',
            title: errorTitle,
            description: `Hardware validation failed: ${packet.validationErrors!.join(', ')}`,
            value: `${packet.voltage}V / ${packet.current}A / ${packet.temperature}°C`,
            threshold: 'Calibrated limits',
            resolved: false
          },
          ...prev
        ];
      });
    }
  }, []);

  const handleStatus = useCallback((status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR', errorMsg?: string) => {
    setConnectionStatus(status);
    setConnectionError(errorMsg || null);
    setMachineInfo(m => ({ ...m, connectionStatus: status }));
  }, []);

  const handleValidation = useCallback((status: SensorValidationStatus) => {
    setSensorValidation(status);
  }, []);

  // Initialize Telemetry Engine
  useEffect(() => {
    const unsubPacket = telemetryEngine.subscribe(handlePacket);
    const unsubStatus = telemetryEngine.subscribeStatus(handleStatus);
    const unsubValidation = telemetryEngine.subscribeValidation(handleValidation);
    
    telemetryEngine.start(settings);

    return () => {
      unsubPacket();
      unsubStatus();
      unsubValidation();
      telemetryEngine.stop();
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.gridRegion && newSettings.gridRegion !== prev.gridRegion) {
        updated.gridEmissionFactor = GRID_EMISSION_PRESETS[newSettings.gridRegion].factor;
      }
      telemetryEngine.start(updated);
      return updated;
    });
  }, []);

  const setMode = useCallback((mode: 'LIVE' | 'DEMO') => {
    const ingestionMethod: IngestionMethod = mode === 'LIVE' ? 'WEB_SERIAL' : 'SIMULATOR';
    updateSettings({ mode, ingestionMethod });
  }, [updateSettings]);

  const setIngestionMethod = useCallback((method: IngestionMethod) => {
    const mode = method === 'SIMULATOR' ? 'DEMO' : 'LIVE';
    updateSettings({ mode, ingestionMethod: method });
  }, [updateSettings]);

  const startNewBatch = useCallback((name: string, sku: string, units: number) => {
    const newBatch: BatchInfo = {
      batchId: `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
      machineId: machineInfo.id,
      productName: name || 'Custom Precision Part',
      sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
      productionDate: new Date().toISOString().slice(0, 10),
      unitsPlanned: units || 100,
      unitsCompleted: 0,
      startedAt: Date.now(),
      status: 'ACTIVE',
      verificationStatus: 'PENDING',
      initialEnergyKWh: currentPacket.cumulativeEnergyKWh,
      totalEnergyKWh: 0,
      activeEnergyKWh: 0,
      idleEnergyKWh: 0,
      totalCarbonKgCO2e: 0,
      emissionFactor: settingsRef.current.gridEmissionFactor,
      carbonPerUnit: 0,
      activeDurationSec: 0,
      idleDurationSec: 0
    };

    setBatchList(prev => [
      newBatch,
      ...prev.map(b => b.status === 'ACTIVE' ? { ...b, status: 'PAUSED' as const } : b)
    ]);
  }, [currentPacket.cumulativeEnergyKWh]);

  const completeActiveBatch = useCallback(async (): Promise<DPPRecord | null> => {
    if (!activeBatch) return null;

    const dpp = await createDigitalProductPassport(
      { ...activeBatch, status: 'COMPLETED', endedAt: Date.now(), unitsCompleted: activeBatch.unitsPlanned },
      machineInfo.id,
      settings.gridEmissionFactor,
      GRID_EMISSION_PRESETS[settings.gridRegion].name
    );

    const completedBatch: BatchInfo = {
      ...activeBatch,
      status: 'COMPLETED',
      verificationStatus: 'VERIFIED',
      endedAt: Date.now(),
      unitsCompleted: activeBatch.unitsPlanned,
      recordHash: dpp.genesisHash
    };

    setBatchList(prev => prev.map(b => b.batchId === activeBatch.batchId ? completedBatch : b));
    setDppList(prev => [dpp, ...prev]);
    return dpp;
  }, [activeBatch, machineInfo.id, settings.gridEmissionFactor, settings.gridRegion]);

  const createDppFromBatch = useCallback(async (batchId: string): Promise<DPPRecord | null> => {
    const batch = batchList.find(b => b.batchId === batchId);
    if (!batch) return null;

    const dpp = await createDigitalProductPassport(
      batch,
      machineInfo.id,
      settings.gridEmissionFactor,
      GRID_EMISSION_PRESETS[settings.gridRegion].name
    );

    const updatedBatch: BatchInfo = {
      ...batch,
      verificationStatus: 'VERIFIED',
      recordHash: dpp.genesisHash
    };

    setBatchList(prev => prev.map(b => b.batchId === batchId ? updatedBatch : b));
    setDppList(prev => [dpp, ...prev.filter(d => d.batchId !== batchId)]);
    return dpp;
  }, [batchList, machineInfo.id, settings.gridEmissionFactor, settings.gridRegion]);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a));
  }, []);

  const setMotorLoadPreset = useCallback((load: 'IDLE' | 'NORMAL' | 'HIGH' | 'STALL' | 'DYNAMIC_CYCLE') => {
    updateSettings({ simulatedMotorLoad: load });
  }, [updateSettings]);

  const setFaultInjection = useCallback((fault: 'NONE' | 'OVERLOAD' | 'VOLTAGE_SAG' | 'HEAT_RUNAWAY' | 'SENSOR_DISCONNECT') => {
    updateSettings({ simulatedFaultInjection: fault });
  }, [updateSettings]);

  const connectWebSerial = useCallback(async () => {
    updateSettings({ mode: 'LIVE', ingestionMethod: 'WEB_SERIAL' });
    await telemetryEngine.connectWebSerial(settingsRef.current);
  }, [updateSettings]);

  const connectWebSocket = useCallback(() => {
    updateSettings({ mode: 'LIVE', ingestionMethod: 'WEBSOCKET' });
    telemetryEngine.connectWebSocket(settingsRef.current);
  }, [updateSettings]);

  const disconnectHardware = useCallback(() => {
    updateSettings({ mode: 'DEMO', ingestionMethod: 'SIMULATOR' });
  }, [updateSettings]);

  const toggleDataSource = useCallback(() => {
    if (settings.mode === 'DEMO') {
      setMode('LIVE');
    } else {
      setMode('DEMO');
    }
  }, [settings.mode, setMode]);

  return (
    <TelemetryContext.Provider
      value={{
        currentPacket,
        history,
        stateSegments,
        summary,
        insights,
        machineInfo,
        activeBatch,
        batchList,
        dppList,
        alerts,
        settings,
        connectionStatus,
        connectionError,
        sensorValidation,
        updateSettings,
        setMode,
        setIngestionMethod,
        startNewBatch,
        completeActiveBatch,
        createDppFromBatch,
        resolveAlert,
        setMotorLoadPreset,
        setFaultInjection,
        connectWebSerial,
        connectWebSocket,
        disconnectHardware,
        toggleDataSource
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
