import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Thermometer,
  Flame,
  AlertTriangle,
  Play,
  Pause,
  Copy,
  Check,
  Usb,
  Cpu,
  Terminal,
  Layers,
  Sliders,
  Wifi,
  Globe,
  CheckCircle2,
  AlertCircle,
  Database,
  Radio,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { Oscilloscope } from '../components/common/Oscilloscope';
import { Badge } from '../components/common/Badge';

export const LiveMonitoringView: React.FC = () => {
  const {
    currentPacket,
    history,
    machineInfo,
    settings,
    connectionStatus,
    connectionError,
    sensorValidation,
    setMode,
    setIngestionMethod,
    connectWebSerial,
    connectWebSocket,
    disconnectHardware
  } = useTelemetry();

  const [isPaused, setIsPaused] = useState(false);
  const [showVoltageChannel, setShowVoltageChannel] = useState(true);
  const [showCurrentChannel, setShowCurrentChannel] = useState(true);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const displayHistory = isPaused ? history : history;
  const isLive = settings.mode === 'LIVE';

  const copyRawPacket = () => {
    const standardPayload = {
      timestamp: currentPacket.timestamp,
      deviceId: currentPacket.deviceId,
      machineId: currentPacket.machineId,
      voltage: currentPacket.voltage,
      current: currentPacket.current,
      temperature: currentPacket.measuredTemperature,
      power: currentPacket.power,
      energy: currentPacket.cumulativeEnergyKWh,
      machineState: currentPacket.state,
      dataSource: currentPacket.dataSource
    };
    navigator.clipboard.writeText(JSON.stringify(standardPayload, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div className="view-content animate-fade-in">
      {/* 1. Hardware Bus & Acquisition Header */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Activity size={20} color="var(--cyan-primary)" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Hardware Telemetry Bus & Waveform Oscilloscope
                </span>
                {isLive ? (
                  <span className="badge badge-emerald">HARDWARE INGESTION: {settings.ingestionMethod}</span>
                ) : (
                  <span className="badge badge-amber">SIMULATION RUNTIME</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Transducers: ACS712-05B (AIN1) • 0–25V Divider (AIN0) • ADS1115 16-Bit ADC • Dallas DS18B20 1-Wire (GPIO 4)
              </div>
            </div>
          </div>

          {/* Sweep Controls & Ingestion Mode Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLive ? (
              <button className="btn btn-secondary btn-sm" onClick={disconnectHardware}>
                Switch to Simulation
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={connectWebSerial} style={{ gap: 6 }}>
                <Usb size={13} /> Connect ESP32 (Web Serial)
              </button>
            )}

            <button
              className={`btn btn-sm ${isPaused ? 'btn-emerald' : 'btn-secondary'}`}
              onClick={() => setIsPaused(!isPaused)}
              style={{ gap: 5 }}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
              {isPaused ? 'Resume Sweep' : 'Freeze Sweep'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Integrated Hardware Bus Diagnostics Ribbon */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div className="card-header" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={14} color="var(--cyan-primary)" />
            <span className="card-title">IoT Transducer & ADC Bus Health Matrix</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Frame Delta: {sensorValidation.lastPacketAgeSeconds}s
            </span>
            <span className={`badge ${sensorValidation.isStale ? 'badge-red' : 'badge-emerald'}`}>
              {sensorValidation.isStale ? 'BUS STALE' : 'BUS NOMINAL'}
            </span>
          </div>
        </div>

        <div className="grid-4" style={{ gap: 10 }}>
          {/* Channel A: Temperature Sensor */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                DS18B20 1-Wire
              </span>
              <span className={`badge ${sensorValidation.temperatureStatus === 'OK' ? 'badge-emerald' : 'badge-red'}`}>
                {sensorValidation.temperatureStatus}
              </span>
            </div>
            <div className="mono-num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {sensorValidation.temperatureStatus === 'OK' ? `${currentPacket.measuredTemperature.toFixed(1)} °C` : '--'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              GPIO 4 • Resolution 12-Bit
            </div>
          </div>

          {/* Channel B: Voltage Divider */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                0–25V Divider
              </span>
              <span className={`badge ${sensorValidation.voltageStatus === 'OK' ? 'badge-cyan' : 'badge-red'}`}>
                {sensorValidation.voltageStatus}
              </span>
            </div>
            <div className="mono-num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan-primary)' }}>
              {sensorValidation.voltageStatus === 'OK' ? `${currentPacket.voltage.toFixed(2)} V` : '--'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              ADS1115 AIN0 • Ratio 5:1
            </div>
          </div>

          {/* Channel C: Current Transducer */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ACS712-05B
              </span>
              <span className={`badge ${sensorValidation.currentStatus === 'OK' ? 'badge-emerald' : 'badge-red'}`}>
                {sensorValidation.currentStatus}
              </span>
            </div>
            <div className="mono-num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {sensorValidation.currentStatus === 'OK' ? `${currentPacket.current.toFixed(3)} A` : '--'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              ADS1115 AIN1 • 185 mV/A
            </div>
          </div>

          {/* Channel D: ADS1115 ADC Chipset */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ADS1115 ADC
              </span>
              <span className={`badge ${sensorValidation.ads1115Status === 'OK' ? 'badge-indigo' : 'badge-red'}`}>
                {sensorValidation.ads1115Status}
              </span>
            </div>
            <div className="mono-num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--indigo-primary)' }}>
              {currentPacket.edgeBufferIndex ? `#${currentPacket.edgeBufferIndex}` : 'LOCK'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              I2C (0x48) • SDA 21, SCL 22
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dual-Channel Digital Storage Oscilloscope (DSO) */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={15} color="var(--cyan-primary)" />
            <span className="card-title">Dual-Channel Realtime Oscilloscope</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Channel 1 Toggle (Voltage) */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                cursor: 'pointer',
                color: showVoltageChannel ? 'var(--cyan-primary)' : 'var(--text-muted)'
              }}
            >
              <input
                type="checkbox"
                checked={showVoltageChannel}
                onChange={e => setShowVoltageChannel(e.target.checked)}
                style={{ accentColor: 'var(--cyan-primary)' }}
              />
              <span className="mono" style={{ fontWeight: 600 }}>CH1: VOLTAGE ({currentPacket.voltage.toFixed(2)} V)</span>
            </label>

            {/* Channel 2 Toggle (Current) */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                cursor: 'pointer',
                color: showCurrentChannel ? 'var(--emerald-primary)' : 'var(--text-muted)'
              }}
            >
              <input
                type="checkbox"
                checked={showCurrentChannel}
                onChange={e => setShowCurrentChannel(e.target.checked)}
                style={{ accentColor: 'var(--emerald-primary)' }}
              />
              <span className="mono" style={{ fontWeight: 600 }}>CH2: CURRENT ({currentPacket.current.toFixed(3)} A)</span>
            </label>
          </div>
        </div>

        {/* Oscilloscope Canvas */}
        <Oscilloscope
          history={displayHistory}
          showVoltage={showVoltageChannel}
          showCurrent={showCurrentChannel}
          height={250}
        />

        {/* Signal Readout Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginTop: 12,
            padding: '10px 14px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>V_RMS (BUS MEASURED)</div>
            <div className="mono-num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan-primary)', marginTop: 2 }}>
              {currentPacket.voltage.toFixed(2)} V
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>I_PEAK (TRANSDUCER)</div>
            <div className="mono-num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--emerald-primary)', marginTop: 2 }}>
              {currentPacket.current.toFixed(3)} A
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>INGESTION LINK</div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: isLive ? 'var(--emerald-primary)' : 'var(--amber-primary)', marginTop: 2 }}>
              {currentPacket.dataSource}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>EDGE STATE CLASSIFICATION</div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              {currentPacket.state}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Dual-Stream Thermal Telemetry & Verification Ledger */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Thermometer size={15} color="var(--amber-primary)" />
            <span className="card-title">Dual Thermal Telemetry Verification Ledger</span>
          </div>
          <span className="badge badge-muted">ARCHITECTURAL ISOLATION</span>
        </div>

        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            marginBottom: 14,
            lineHeight: 1.4
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Integrity Verification:</strong> <strong>Measured Temperature</strong> reflects the physical Dallas DS18B20 digital probe on the motor chassis. <strong>Simulated Process Temperature</strong> models an isolated thermal kiln furnace process.
        </div>

        {/* Side by Side Comparison Grid */}
        <div className="grid-2" style={{ gap: 14 }}>
          {/* Stream 1: Physical Motor Thermistor */}
          <div
            style={{
              padding: 14,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Thermometer size={14} color="var(--emerald-primary)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--emerald-primary)', textTransform: 'uppercase' }}>
                  Measured Motor Housing
                </span>
              </div>
              <span className="badge badge-emerald">PHYSICAL SENSOR</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0' }}>
              <span className="mono-num" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>
                {sensorValidation.temperatureStatus === 'OK' ? currentPacket.measuredTemperature.toFixed(1) : '--'}
              </span>
              <span className="mono" style={{ fontSize: 16, color: 'var(--text-muted)' }}>°C</span>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Source: Dallas DS18B20 1-Wire Digital IC on motor chassis.<br />
              Status: <span className="mono" style={{ color: 'var(--text-primary)' }}>{sensorValidation.temperatureStatus}</span>.
            </div>
          </div>

          {/* Stream 2: Simulated Process Kiln */}
          <div
            style={{
              padding: 14,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={14} color="var(--amber-primary)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-primary)', textTransform: 'uppercase' }}>
                  Kiln Process Thermal Model
                </span>
              </div>
              <span className="badge badge-amber">SIMULATED MODEL</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0' }}>
              <span className="mono-num" style={{ fontSize: 32, fontWeight: 700, color: 'var(--amber-primary)' }}>
                {currentPacket.simulatedProcessTemperature.toFixed(1)}
              </span>
              <span className="mono" style={{ fontSize: 16, color: 'var(--text-muted)' }}>°C</span>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Model: Industrial thermal mass & setpoint simulator ({settings.simulatedProcessTempTarget}°C).<br />
              Isolated synthetic calculation.
            </div>
          </div>
        </div>
      </div>

      {/* 5. Canonical Telemetry Packet Frame Inspector */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal size={15} color="var(--cyan-primary)" />
            <span className="card-title">Canonical Edge Packet Frame Inspector</span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={copyRawPacket} style={{ gap: 5 }}>
            {copiedRaw ? <Check size={12} color="var(--emerald-primary)" /> : <Copy size={12} />}
            {copiedRaw ? 'Copied' : 'Copy JSON Frame'}
          </button>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-inset)',
            padding: 14,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--cyan-primary)',
            maxHeight: 200,
            overflowY: 'auto'
          }}
        >
          <pre style={{ margin: 0, lineHeight: 1.4 }}>
            {JSON.stringify(
              {
                timestamp: currentPacket.timestamp,
                deviceId: currentPacket.deviceId,
                machineId: currentPacket.machineId,
                voltage: currentPacket.voltage,
                current: currentPacket.current,
                temperature: currentPacket.measuredTemperature,
                power: currentPacket.power,
                energy: currentPacket.cumulativeEnergyKWh,
                machineState: currentPacket.state,
                dataSource: currentPacket.dataSource
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};
