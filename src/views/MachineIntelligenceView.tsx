import React from 'react';
import {
  BrainCircuit,
  Cpu,
  Zap,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  SlidersHorizontal,
  Flame,
  Activity,
  Play,
  Layers,
  ArrowRight,
  Sparkles,
  Workflow,
  ArrowDown,
  Info
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { Badge } from '../components/common/Badge';
import { StateTimeline } from '../components/common/StateTimeline';

export const MachineIntelligenceView: React.FC = () => {
  const {
    currentPacket,
    machineInfo,
    stateSegments,
    settings,
    alerts,
    resolveAlert,
    setMotorLoadPreset,
    setFaultInjection,
    updateSettings
  } = useTelemetry();

  const states = [
    {
      name: 'OFF',
      condition: `V < ${settings.minOperatingVoltageV}V or I < ${settings.offCurrentThresholdA}A (P < 0.5W)`,
      desc: 'No meaningful electrical activity. Machine unpowered or isolated from 12V mains.',
      badge: 'muted' as const,
      isCurrent: currentPacket.state === 'OFF'
    },
    {
      name: 'IDLE',
      condition: `Power < ${settings.idlePowerThresholdW}W (Zero torque load)`,
      desc: 'Motor energized & rotating with zero mechanical load. Standby parasitic energy waste detected.',
      badge: 'amber' as const,
      isCurrent: currentPacket.state === 'IDLE'
    },
    {
      name: 'WARMUP',
      condition: 'Inductive transient (I > 1.0A for < 1.5s during startup)',
      desc: 'Startup transient inrush suppression. Transient filter prevents false overload alarms.',
      badge: 'cyan' as const,
      isCurrent: currentPacket.state === 'WARMUP'
    },
    {
      name: 'ACTIVE',
      condition: `Power >= ${settings.idlePowerThresholdW}W, I < ${settings.overloadCurrentThresholdA}A`,
      desc: 'Normal operating manufacturing load under productive mechanical work.',
      badge: 'emerald' as const,
      isCurrent: currentPacket.state === 'ACTIVE'
    },
    {
      name: 'ABNORMAL',
      condition: `Current >= ${settings.overloadCurrentThresholdA}A or V > 24.5V (Mechanical bind/stall)`,
      desc: 'Unexpectedly high or unstable current/voltage. Thermal risk & rotor stall protection triggered.',
      badge: 'red' as const,
      isCurrent: currentPacket.state === 'ABNORMAL'
    }
  ];

  return (
    <div className="view-content animate-fade-in">
      {/* Top Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #131238 0%, #1F1C54 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '20px 24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BrainCircuit size={26} color="var(--indigo-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                Machine Intelligence & State Classifier Architecture
              </h1>
              <span className="badge badge-indigo">Edge Rule Engine — MVP</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Deterministic real-time machine state classification, idle waste leak isolation, and roadmap to future on-device Edge AI.
            </p>
          </div>
        </div>
      </div>

      {/* ARCHITECTURE COMPARISON: EDGE RULE ENGINE (MVP) vs EDGE AI (PLANNED) */}
      <div className="grid-2" style={{ gap: 16 }}>
        {/* Current MVP: Edge Rule Engine */}
        <div
          className="card"
          style={{
            borderLeft: '4px solid var(--cyan-primary)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={16} color="var(--cyan-primary)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cyan-primary)' }}>
                CURRENT IMPLEMENTATION: Edge Rule Engine — MVP
              </span>
            </div>
            <span className="badge badge-cyan">ACTIVE ON ESP32-S3</span>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 10px 0' }}>
              Evaluates deterministic electrical thresholds at 2Hz on the ESP32-S3 microcontroller:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <strong>1. OFF:</strong> Voltage &lt; {settings.minOperatingVoltageV}V or Current &lt; {settings.offCurrentThresholdA}A (Power &lt; 0.5W)
              </div>
              <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <strong>2. IDLE:</strong> Power &lt; {settings.idlePowerThresholdW}W (Motor energized, zero mechanical torque)
              </div>
              <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <strong>3. ACTIVE:</strong> Power &ge; {settings.idlePowerThresholdW}W and Current &lt; {settings.overloadCurrentThresholdA}A (Productive work)
              </div>
              <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <strong>4. ABNORMAL:</strong> Current &ge; {settings.overloadCurrentThresholdA}A or Voltage &gt; 24.5V (Rotor bind / Overload)
              </div>
            </div>
          </div>
        </div>

        {/* Future Capability: Edge AI — Planned Enhancement */}
        <div
          className="card"
          style={{
            borderLeft: '4px solid var(--indigo-primary)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--indigo-primary)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--indigo-primary)' }}>
                FUTURE CAPABILITY: Edge AI — Planned Enhancement
              </span>
            </div>
            <span className="badge badge-indigo">PLANNED UPGRADE</span>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 10px 0' }}>
              Planned on-device TinyML pipeline (TensorFlow Lite Micro / Edge Impulse on ESP32-S3):
            </p>
            {/* Visual Pipeline Flow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              <div style={{ padding: '5px 10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 4, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                Raw Sensor Data (ADS1115 Voltage & Current 50Hz Waveforms)
              </div>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
              <div style={{ padding: '5px 10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 4, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                Signal Filtering & FFT Spectral Decomposition
              </div>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
              <div style={{ padding: '5px 10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 4, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                Feature Extraction (RMS, Crest Factor, Harmonic Distortion)
              </div>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
              <div style={{ padding: '5px 10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 4, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                TFLite Micro ML Model → ACTIVE / IDLE / ABNORMAL / BEARING WEAR
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time State Classification Ribbon */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="var(--cyan-primary)" />
            <span className="card-title">Real-Time State Transition Sequence</span>
          </div>
          <span className="badge badge-muted">Continuous Edge Stream</span>
        </div>

        <StateTimeline segments={stateSegments} height={38} />
      </div>

      {/* State Machine Rules Live Status Map */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={16} color="var(--indigo-primary)" />
            <span className="card-title">Edge Rule Engine Classifier Rules (Real-time Evaluation)</span>
          </div>
          <span className="badge badge-cyan">Sampling Rate: 2Hz</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {states.map(s => (
            <div
              key={s.name}
              style={{
                padding: '14px 18px',
                backgroundColor: s.isCurrent ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: s.isCurrent ? '1px solid var(--cyan-primary)' : '1px solid var(--border-subtle)',
                boxShadow: s.isCurrent ? '0 0 16px var(--cyan-glow)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className={`status-dot ${s.isCurrent ? (s.badge === 'emerald' ? 'green' : s.badge === 'amber' ? 'amber' : s.badge === 'red' ? 'red' : 'cyan') : 'off'}`} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {s.name}
                    </span>
                    <Badge variant={s.badge}>{s.condition}</Badge>
                    {s.isCurrent && (
                      <span className="badge badge-cyan">CURRENT ACTIVE STATE</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                    {s.desc}
                  </div>
                </div>
              </div>

              <div className="mono-num" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {s.isCurrent ? `${currentPacket.power.toFixed(1)} W / ${currentPacket.current.toFixed(2)} A` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Simulation & Fault Injection Test Bench */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal size={16} color="var(--amber-primary)" />
            <span className="card-title">Interactive Test Bench & Load Simulator (Demo Controls)</span>
          </div>
          <Badge variant="simulated">DEMO STRESS TEST</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Motor Mechanical Load Profile (Simulate realistic factory operating regimes):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { id: 'DYNAMIC_CYCLE', label: 'Dynamic Factory Cycle (Auto Active/Idle)' },
                { id: 'NORMAL', label: 'Normal Active Workload (~10W)' },
                { id: 'IDLE', label: 'Force Idle Run (~3W Hidden Leak)' },
                { id: 'HIGH', label: 'Heavy Mechanical Load (~17W)' },
                { id: 'STALL', label: 'Motor Rotor Stall (>23W Abnormal)' }
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setMotorLoadPreset(preset.id as any)}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: settings.simulatedMotorLoad === preset.id ? 'var(--cyan-primary)' : 'var(--bg-surface)',
                    color: settings.simulatedMotorLoad === preset.id ? '#080C14' : 'var(--text-secondary)',
                    border: '1px solid var(--border-medium)',
                    fontWeight: 600
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Fault Injection Test (Evaluate edge detection & alarms):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { id: 'NONE', label: 'Clear Faults (Nominal)' },
                { id: 'OVERLOAD', label: 'Inject Current Spike (> 2.1A)' },
                { id: 'VOLTAGE_SAG', label: 'Inject Voltage Brownout (< 8.5V)' }
              ].map(fault => (
                <button
                  key={fault.id}
                  onClick={() => setFaultInjection(fault.id as any)}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: settings.simulatedFaultInjection === fault.id ? 'var(--amber-primary)' : 'var(--bg-surface)',
                    color: settings.simulatedFaultInjection === fault.id ? '#080C14' : 'var(--text-secondary)',
                    border: '1px solid var(--border-medium)',
                    fontWeight: 600
                  }}
                >
                  {fault.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Alerts Table & Resolution */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--red-primary)" />
            <span className="card-title">Anomaly Log & Edge Diagnostics</span>
          </div>
          <span className="badge badge-muted">{alerts.length} Total Logged</span>
        </div>

        <div className="table-container">
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Title & Description</th>
                <th>Observed Value</th>
                <th>Threshold</th>
                <th>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id}>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </td>
                  <td>
                    <Badge variant={a.type === 'CURRENT_OVERLOAD' ? 'red' : 'amber'}>
                      {a.type}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={a.severity === 'CRITICAL' ? 'red' : a.severity === 'HIGH' ? 'amber' : 'muted'}>
                      {a.severity}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{a.description}</div>
                  </td>
                  <td className="mono-num" style={{ color: 'var(--amber-primary)', fontWeight: 600 }}>{a.value}</td>
                  <td className="mono-num" style={{ color: 'var(--text-muted)' }}>{a.threshold}</td>
                  <td>
                    {a.resolved ? (
                      <span className="badge badge-emerald">RESOLVED</span>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => resolveAlert(a.id)}
                        style={{ fontSize: 11, padding: '3px 8px' }}
                      >
                        <CheckCircle size={12} color="var(--emerald-primary)" /> Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
