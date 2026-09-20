import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Zap,
  Globe,
  DollarSign,
  Sliders,
  Save,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Check,
  Wifi,
  Usb,
  Radio,
  Server
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { Badge } from '../components/common/Badge';
import { GRID_EMISSION_PRESETS } from '../services/carbonEngine';
import { GridRegion, IngestionMethod } from '../types/telemetry';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, machineInfo } = useTelemetry();
  const [formData, setFormData] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRegionChange = (region: GridRegion) => {
    const preset = GRID_EMISSION_PRESETS[region];
    setFormData({
      ...formData,
      gridRegion: region,
      gridEmissionFactor: preset ? preset.factor : formData.gridEmissionFactor
    });
  };

  return (
    <div className="view-content animate-fade-in">
      {/* Top Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #1A2438 100%)',
          border: '1px solid var(--border-medium)',
          padding: '20px 24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Settings size={26} color="var(--cyan-primary)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                  IoT Hardware Ingestion & Calibration Settings
                </h1>
                <span className="badge badge-cyan">Edge & Protocol Config</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Configure ESP32-S3 communication protocols, REST/WebSocket gateways, sensor calibration offsets, and machine state thresholds.
              </p>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{ gap: 6 }}
          >
            {savedSuccess ? <Check size={16} /> : <Save size={16} />}
            {savedSuccess ? 'Settings Saved!' : 'Save System Settings'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 1: IoT Communication & Protocol Gateway */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={16} color="var(--cyan-primary)" />
              <span className="card-title">1. IoT Hardware Data Ingestion Bridge</span>
            </div>
            <span className="badge badge-cyan">HTTP REST / WebSocket / Web Serial</span>
          </div>

          <div className="grid-3" style={{ gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Operational Mode
              </label>
              <select
                className="input-field"
                value={formData.mode}
                onChange={e => setFormData({ ...formData, mode: e.target.value as any })}
              >
                <option value="LIVE">LIVE SENSOR MODE (Real Hardware Telemetry)</option>
                <option value="DEMO">DEMO MODE (Simulation Engine)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Ingestion Communication Method
              </label>
              <select
                className="input-field"
                value={formData.ingestionMethod}
                onChange={e => setFormData({ ...formData, ingestionMethod: e.target.value as IngestionMethod })}
              >
                <option value="WEB_SERIAL">Web Serial API (Direct USB COM Port)</option>
                <option value="WEBSOCKET">WebSocket Streaming (ws://...)</option>
                <option value="HTTP_REST">HTTP REST POST (http://...)</option>
                <option value="SIMULATOR">Built-in Test Bench Simulator</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Serial Baud Rate (USB)
              </label>
              <select
                className="input-field"
                value={formData.serialBaudRate}
                onChange={e => setFormData({ ...formData, serialBaudRate: Number(e.target.value) })}
              >
                <option value={115200}>115200 baud (ESP32-S3 Standard)</option>
                <option value={9600}>9600 baud</option>
                <option value={57600}>57600 baud</option>
                <option value={230400}>230400 baud (High Speed)</option>
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 14, marginTop: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                HTTP REST Ingestion Endpoint URL
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.httpEndpointUrl}
                onChange={e => setFormData({ ...formData, httpEndpointUrl: e.target.value })}
                placeholder="http://localhost:3001/api/telemetry"
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ESP32 HTTP POST target endpoint</span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                WebSocket Stream Gateway URL
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.webSocketUrl}
                onChange={e => setFormData({ ...formData, webSocketUrl: e.target.value })}
                placeholder="ws://localhost:3001/ws"
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>WebSocket broadcast stream URL</span>
            </div>
          </div>
        </div>

        {/* Section 2: Sensor Calibration & ADC Offsets */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SlidersHorizontal size={16} color="var(--emerald-primary)" />
              <span className="card-title">2. Hardware Transducer Calibration (ADS1115 & ACS712)</span>
            </div>
            <span className="badge badge-emerald">Physical Sensor Tuning</span>
          </div>

          <div className="grid-4" style={{ gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                ACS712 Zero Offset (mV)
              </label>
              <input
                type="number"
                className="input-field"
                value={formData.sensorCalibration.acs712ZeroMv}
                onChange={e =>
                  setFormData({
                    ...formData,
                    sensorCalibration: {
                      ...formData.sensorCalibration,
                      acs712ZeroMv: Number(e.target.value)
                    }
                  })
                }
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Nominal VCC/2 (2500mV)</span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                ACS712 Sensitivity (mV/A)
              </label>
              <input
                type="number"
                className="input-field"
                value={formData.sensorCalibration.acs712SensitivityMvPerA}
                onChange={e =>
                  setFormData({
                    ...formData,
                    sensorCalibration: {
                      ...formData.sensorCalibration,
                      acs712SensitivityMvPerA: Number(e.target.value)
                    }
                  })
                }
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>185 mV/A for 5A model</span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Voltage Divider Ratio
              </label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                value={formData.sensorCalibration.voltageDividerRatio}
                onChange={e =>
                  setFormData({
                    ...formData,
                    sensorCalibration: {
                      ...formData.sensorCalibration,
                      voltageDividerRatio: Number(e.target.value)
                    }
                  })
                }
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>5.0 for 0-25V sensor</span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                DS18B20 Offset (°C)
              </label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                value={formData.sensorCalibration.ds18b20OffsetC}
                onChange={e =>
                  setFormData({
                    ...formData,
                    sensorCalibration: {
                      ...formData.sensorCalibration,
                      ds18b20OffsetC: Number(e.target.value)
                    }
                  })
                }
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Physical temperature offset</span>
            </div>
          </div>
        </div>

        {/* Section 3: Machine State Classification & Safety Thresholds */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={16} color="var(--indigo-primary)" />
              <span className="card-title">3. Configurable Machine State & Safety Thresholds</span>
            </div>
            <span className="badge badge-indigo">Rule Engine Parameters</span>
          </div>

          <div className="grid-4" style={{ gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Idle Power Threshold (W)
              </label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                value={formData.idlePowerThresholdW}
                onChange={e => setFormData({ ...formData, idlePowerThresholdW: Number(e.target.value) })}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Below this = IDLE standby leak</span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Overload / Stall Limit (A)
              </label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                value={formData.overloadCurrentThresholdA}
                onChange={e => setFormData({ ...formData, overloadCurrentThresholdA: Number(e.target.value) })}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Above this = ABNORMAL state</span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Min Operating Voltage (V)
              </label>
              <input
                type="number"
                step="0.5"
                className="input-field"
                value={formData.minOperatingVoltageV}
                onChange={e => setFormData({ ...formData, minOperatingVoltageV: Number(e.target.value) })}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Below this = OFF unpowered</span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Max Temperature Limit (°C)
              </label>
              <input
                type="number"
                step="1"
                className="input-field"
                value={formData.tempMaxLimitC}
                onChange={e => setFormData({ ...formData, tempMaxLimitC: Number(e.target.value) })}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Max physical motor temp</span>
            </div>
          </div>
        </div>

        {/* Section 4: Grid Emission Factors & Economics */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={16} color="var(--cyan-primary)" />
              <span className="card-title">4. Carbon Emission Factor & Electricity Tariffs</span>
            </div>
            <span className="badge badge-cyan">Scope 2 Parameters</span>
          </div>

          <div className="grid-3" style={{ gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Regional Grid Authority Preset
              </label>
              <select
                className="input-field"
                value={formData.gridRegion}
                onChange={e => handleRegionChange(e.target.value as GridRegion)}
              >
                {Object.values(GRID_EMISSION_PRESETS).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.factor} kg CO₂e/kWh)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Configured Emission Factor (kg CO₂e/kWh)
              </label>
              <input
                type="number"
                step="0.001"
                className="input-field"
                value={formData.gridEmissionFactor}
                onChange={e => setFormData({ ...formData, gridEmissionFactor: Number(e.target.value) })}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Formula: CO₂e = kWh × EmissionFactor</span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Commercial Electricity Tariff
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="input-field"
                  style={{ width: 70 }}
                  value={formData.currencySymbol}
                  onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                >
                  <option value="₹">₹ (INR)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={formData.electricityRatePerKWh}
                  onChange={e => setFormData({ ...formData, electricityRatePerKWh: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
