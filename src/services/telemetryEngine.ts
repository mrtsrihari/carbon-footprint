import {
  TelemetryPacket,
  MachineState,
  SystemSettings,
  SensorValidationStatus,
  IngestionMethod
} from '../types/telemetry';
import { validateTelemetryPayload } from './sensorValidator';
import { calculateCarbonEmissions } from './carbonEngine';

export type TelemetryCallback = (packet: TelemetryPacket) => void;
export type ConnectionStatusCallback = (
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR',
  errorMsg?: string
) => void;
export type ValidationStatusCallback = (status: SensorValidationStatus) => void;

export class TelemetryEngine {
  private isRunning: boolean = false;
  private timerId: number | null = null;
  private heartbeatTimerId: number | null = null;
  private pollTimerId: number | null = null;
  
  private callbacks: Set<TelemetryCallback> = new Set();
  private statusCallbacks: Set<ConnectionStatusCallback> = new Set();
  private validationCallbacks: Set<ValidationStatusCallback> = new Set();
  
  // Last received packet cache
  private lastPacket: TelemetryPacket | null = null;
  private lastLivePacketTimestamp: number | null = null;
  private currentValidationStatus: SensorValidationStatus;

  // Accumulated simulated state
  private cumulativeEnergyKWh: number = 0.412;
  private activeEnergyKWh: number = 0.318;
  private idleEnergyKWh: number = 0.094;
  private lastTimestamp: number = Date.now();
  private edgeBufferIndex: number = 104;

  // Thermal state models (Simulator only)
  private motorSurfaceTempC: number = 29.5; // Realistic DS18B20 motor surface reading
  private simulatedFurnaceTempC: number = 180.0; // High-temp industrial furnace process curve

  // Web Serial Port handles
  private serialPort: any = null;
  private serialReader: any = null;

  // WebSocket handle
  private webSocket: WebSocket | null = null;

  // Simulator state cycle
  private simCycleTimeSec: number = 0;
  private currentSimState: MachineState = 'ACTIVE';

  constructor() {
    this.currentValidationStatus = {
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
  }

  public subscribe(cb: TelemetryCallback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  public subscribeStatus(cb: ConnectionStatusCallback): () => void {
    this.statusCallbacks.add(cb);
    return () => this.statusCallbacks.delete(cb);
  }

  public subscribeValidation(cb: ValidationStatusCallback): () => void {
    this.validationCallbacks.add(cb);
    return () => this.validationCallbacks.delete(cb);
  }

  private notifyStatus(
    status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR',
    errorMsg?: string
  ) {
    this.statusCallbacks.forEach(cb => cb(status, errorMsg));
  }

  private notifyValidation(status: SensorValidationStatus) {
    this.currentValidationStatus = status;
    this.validationCallbacks.forEach(cb => cb(status));
  }

  /**
   * Starts telemetry streaming depending on the top-level mode (LIVE vs DEMO)
   */
  public start(settings: SystemSettings) {
    this.stop();
    this.isRunning = true;

    if (settings.mode === 'DEMO' || settings.ingestionMethod === 'SIMULATOR') {
      this.notifyStatus('CONNECTED');
      this.startSimulator(settings);
    } else {
      // LIVE MODE: Connect via selected hardware ingestion channel
      this.startLiveIngestion(settings);
    }

    // Start 1Hz heartbeat for staleness checking & connection health
    this.startHeartbeatTimer(settings);
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.heartbeatTimerId !== null) {
      clearInterval(this.heartbeatTimerId);
      this.heartbeatTimerId = null;
    }
    if (this.pollTimerId !== null) {
      clearInterval(this.pollTimerId);
      this.pollTimerId = null;
    }
    if (this.webSocket) {
      try {
        this.webSocket.close();
      } catch (e) {
        // Ignore
      }
      this.webSocket = null;
    }
    if (this.serialReader) {
      try {
        this.serialReader.cancel();
      } catch (e) {
        // Ignore
      }
      this.serialReader = null;
    }
    if (this.serialPort) {
      try {
        this.serialPort.close();
      } catch (e) {
        // Ignore
      }
      this.serialPort = null;
    }
    this.notifyStatus('DISCONNECTED');
  }

  /**
   * 1-Second Heartbeat to monitor live telemetry freshness
   */
  private startHeartbeatTimer(settings: SystemSettings) {
    this.heartbeatTimerId = window.setInterval(() => {
      if (!this.isRunning) return;

      if (settings.mode === 'LIVE') {
        const now = Date.now();
        const ageSec = this.lastLivePacketTimestamp
          ? Math.max(0, Math.round((now - this.lastLivePacketTimestamp) / 1000))
          : 0;

        const isStale = this.lastLivePacketTimestamp !== null && ageSec > 3;

        if (isStale) {
          this.notifyStatus('DISCONNECTED', `ESP32 OFFLINE: No telemetry packet received in the last ${ageSec}s`);
        }

        this.notifyValidation({
          ...this.currentValidationStatus,
          lastPacketAgeSeconds: ageSec,
          isStale,
          hasReceivedLivePacket: this.lastLivePacketTimestamp !== null
        });
      }
    }, 1000);
  }

  /**
   * Initiates Live Data Ingestion based on method
   */
  private startLiveIngestion(settings: SystemSettings) {
    switch (settings.ingestionMethod) {
      case 'WEB_SERIAL':
        this.connectWebSerial(settings);
        break;
      case 'WEBSOCKET':
        this.connectWebSocket(settings);
        break;
      case 'HTTP_REST':
        this.startHttpPolling(settings);
        break;
      default:
        this.connectWebSerial(settings);
    }
  }

  /**
   * Ingestion Method 1: Web Serial API (Direct USB connection to ESP32-S3)
   */
  public async connectWebSerial(settings: SystemSettings) {
    if (!('serial' in navigator)) {
      this.notifyStatus(
        'ERROR',
        'Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge, or connect via WebSocket.'
      );
      return;
    }

    try {
      this.notifyStatus('CONNECTING');
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate: settings.serialBaudRate || 115200 });
      this.notifyStatus('CONNECTED');

      const textDecoder = new TextDecoderStream();
      this.serialPort.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      this.serialReader = reader;

      let buffer = '';
      while (this.isRunning) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              this.processRawJsonString(trimmed, settings);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Web Serial Connection error:', err);
      this.notifyStatus('ERROR', err.message || 'Failed to open Serial Port');
    }
  }

  /**
   * Ingestion Method 2: WebSocket Streaming Client
   */
  public connectWebSocket(settings: SystemSettings) {
    const wsUrl = settings.webSocketUrl || 'ws://localhost:3001/ws';
    try {
      this.notifyStatus('CONNECTING');
      this.webSocket = new WebSocket(wsUrl);

      this.webSocket.onopen = () => {
        this.notifyStatus('CONNECTED');
      };

      this.webSocket.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          this.processRawJsonObject(raw, settings);
        } catch (e) {
          console.error('Invalid WS payload:', event.data);
        }
      };

      this.webSocket.onerror = (err) => {
        console.warn('WebSocket connection warning:', err);
        this.notifyStatus('ERROR', 'WebSocket Gateway unreachable at ' + wsUrl);
      };

      this.webSocket.onclose = () => {
        if (this.isRunning && settings.mode === 'LIVE' && settings.ingestionMethod === 'WEBSOCKET') {
          this.notifyStatus('DISCONNECTED', 'WebSocket connection closed');
        }
      };
    } catch (err: any) {
      this.notifyStatus('ERROR', err.message || 'Failed to connect WebSocket');
    }
  }

  /**
   * Ingestion Method 3: HTTP REST Ingestion Gateway Polling
   */
  private startHttpPolling(settings: SystemSettings) {
    const endpoint = settings.httpEndpointUrl || 'http://localhost:3001/api/telemetry';
    this.notifyStatus('CONNECTING');

    const fetchLatest = async () => {
      if (!this.isRunning) return;
      try {
        const res = await fetch(`${endpoint}/latest`, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          this.notifyStatus('CONNECTED');
          this.processRawJsonObject(data, settings);
        } else {
          this.notifyStatus('ERROR', `HTTP Ingestion endpoint returned status ${res.status}`);
        }
      } catch (err: any) {
        this.notifyStatus('DISCONNECTED', `HTTP Gateway unreachable at ${endpoint}`);
      }
    };

    fetchLatest();
    this.pollTimerId = window.setInterval(fetchLatest, 1000); // 1Hz polling
  }

  /**
   * Processes and validates raw incoming JSON string
   */
  private processRawJsonString(jsonStr: string, settings: SystemSettings) {
    try {
      const raw = JSON.parse(jsonStr);
      this.processRawJsonObject(raw, settings);
    } catch (e) {
      console.warn('Malformed JSON packet:', jsonStr);
    }
  }

  /**
   * Core Live Packet Processing with Physical Validation
   */
  public processRawJsonObject(raw: any, settings: SystemSettings) {
    const { isValid, packet, validationStatus } = validateTelemetryPayload(
      raw,
      settings,
      this.lastLivePacketTimestamp,
      this.lastPacket || undefined
    );

    this.notifyValidation(validationStatus);

    if (packet) {
      this.lastPacket = packet;
      if (!packet.isSimulated) {
        this.lastLivePacketTimestamp = packet.timestamp;
      }
      this.callbacks.forEach(cb => cb(packet));
    }
  }

  /**
   * ============================================================================
   * High-Fidelity Motor-01 Test Bench Simulator (Demo Mode)
   * All values are strictly marked dataSource: 'SIMULATION' / isSimulated: true
   * ============================================================================
   */
  private startSimulator(settings: SystemSettings) {
    const INTERVAL_MS = 500; // 2Hz sampling for UI smoothness

    this.timerId = window.setInterval(() => {
      if (!this.isRunning) return;

      const now = Date.now();
      const dtHours = INTERVAL_MS / 3600000;
      this.simCycleTimeSec += INTERVAL_MS / 1000;

      // Base simulated electrical cycle
      let v = 12.05 + (Math.random() * 0.15 - 0.075);
      let i = 0.0;
      let motorRpm = 0;

      // Handle user load preset / dynamic cycle
      if (settings.simulatedMotorLoad === 'IDLE') {
        i = 0.24 + (Math.random() * 0.04 - 0.02); // ~2.9W idle running
        motorRpm = 1850;
      } else if (settings.simulatedMotorLoad === 'NORMAL') {
        i = 0.85 + (Math.random() * 0.12 - 0.06); // ~10.2W mechanical load
        motorRpm = 1620;
      } else if (settings.simulatedMotorLoad === 'HIGH') {
        i = 1.45 + (Math.random() * 0.15 - 0.075); // ~17.5W heavy torque
        motorRpm = 1380;
      } else if (settings.simulatedMotorLoad === 'STALL') {
        i = 1.95 + (Math.random() * 0.1 - 0.05); // ~23.5W stall
        v = 11.4; // Voltage sag
        motorRpm = 0;
      } else {
        // DYNAMIC_CYCLE: 30s active, 15s idle, 5s warmup, 2s overload spike
        const cycleMod = this.simCycleTimeSec % 52;
        if (cycleMod < 2) {
          // Warmup transient
          i = 1.4 + Math.random() * 0.2;
          motorRpm = 800;
        } else if (cycleMod < 32) {
          // Productive running
          i = 0.82 + Math.sin(this.simCycleTimeSec * 0.5) * 0.2 + (Math.random() * 0.05);
          motorRpm = 1600 + Math.round(Math.sin(this.simCycleTimeSec * 0.5) * 150);
        } else if (cycleMod < 34) {
          // Quick load surge / abnormal
          i = 1.88 + Math.random() * 0.1;
          motorRpm = 1100;
        } else if (cycleMod < 48) {
          // Idle no-load run (hidden waste leak)
          i = 0.26 + (Math.random() * 0.03);
          motorRpm = 1860;
        } else {
          // Brief rest/stop
          i = 0.0;
          v = 0.0;
          motorRpm = 0;
        }
      }

      // Handle Fault Injections
      if (settings.simulatedFaultInjection === 'OVERLOAD') {
        i = 2.15 + (Math.random() * 0.1);
        v = 11.2;
      } else if (settings.simulatedFaultInjection === 'VOLTAGE_SAG') {
        v = 8.2 + (Math.random() * 0.3);
      }

      v = Math.max(0, Number(v.toFixed(2)));
      i = Math.max(0, Number(i.toFixed(3)));
      const p = Number((v * i).toFixed(2));

      // 1. Measured Temperature Model (DS18B20 on physical motor frame: 28°C - 34°C)
      if (i > 0.5) {
        this.motorSurfaceTempC = Math.min(35.5, this.motorSurfaceTempC + 0.012);
      } else if (i > 0.1) {
        this.motorSurfaceTempC = Math.min(30.8, this.motorSurfaceTempC + 0.003);
      } else {
        this.motorSurfaceTempC = Math.max(28.2, this.motorSurfaceTempC - 0.008);
      }
      const measuredTemp = Number((this.motorSurfaceTempC + (Math.random() * 0.1 - 0.05)).toFixed(1));

      // 2. Simulated Process Temperature Model (Furnace Demo: 120°C - Target 450°C)
      const targetFurnace = settings.simulatedProcessTempTarget || 450;
      if (p > 5.0) {
        this.simulatedFurnaceTempC += (targetFurnace - this.simulatedFurnaceTempC) * 0.01;
      } else {
        this.simulatedFurnaceTempC -= (this.simulatedFurnaceTempC - 60.0) * 0.005;
      }
      const simulatedTemp = Number((this.simulatedFurnaceTempC + (Math.random() * 1.5 - 0.75)).toFixed(1));

      // Validate and classify simulated packet
      const rawPayload = {
        timestamp: now,
        deviceId: 'ESP32-S3-CTRACK-01',
        machineId: 'MOTOR-01',
        voltage: v,
        current: i,
        temperature: measuredTemp,
        measuredTemperature: measuredTemp,
        simulatedProcessTemperature: simulatedTemp,
        power: p,
        dataSource: 'SIMULATION',
        motorRpm,
        buf_idx: ++this.edgeBufferIndex
      };

      const { packet, validationStatus } = validateTelemetryPayload(
        rawPayload,
        settings,
        this.lastLivePacketTimestamp,
        this.lastPacket || undefined
      );

      this.notifyValidation(validationStatus);

      if (packet) {
        this.lastPacket = packet;
        this.callbacks.forEach(cb => cb(packet));
      }
    }, INTERVAL_MS);
  }
}

export const telemetryEngine = new TelemetryEngine();
