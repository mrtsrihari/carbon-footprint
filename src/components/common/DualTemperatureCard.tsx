import React from 'react';
import { Thermometer, Flame, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MiniSparkline } from './MiniSparkline';

interface DualTemperatureCardProps {
  measuredTempC: number;
  simulatedProcessTempC: number;
  measuredHistory?: number[];
  simulatedHistory?: number[];
  temperatureStatus?: 'OK' | 'DISCONNECTED' | 'ERROR';
}

export const DualTemperatureCard: React.FC<DualTemperatureCardProps> = ({
  measuredTempC,
  simulatedProcessTempC,
  measuredHistory = [],
  simulatedHistory = [],
  temperatureStatus = 'OK'
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Thermometer size={15} color="var(--cyan-primary)" />
          <span className="card-title">Dual-Stream Thermal Telemetry & Verification Ledger</span>
        </div>
        <span className="badge badge-muted">
          PHYSICAL vs PROCESS MODEL
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Stream 1: Measured Sensor Temperature (Real Physical DS18B20) */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Thermometer size={14} color="var(--emerald-primary)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--emerald-primary)', textTransform: 'uppercase' }}>
                  Measured Motor Housing
                </span>
              </div>
              <span className="badge badge-emerald">PHYSICAL 1-WIRE</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 4px 0' }}>
              <span className="mono-num" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                {temperatureStatus === 'OK' ? measuredTempC.toFixed(1) : '--'}
              </span>
              <span className="mono" style={{ fontSize: 14, color: 'var(--text-muted)' }}>°C</span>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
              Direct physical transducer on motor chassis (Dallas DS18B20 digital 1-Wire IC).
            </p>
          </div>

          {measuredHistory.length > 1 && (
            <div style={{ paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                Physical Transducer Trend
              </div>
              <MiniSparkline data={measuredHistory} color="#10B981" width={180} height={24} />
            </div>
          )}
        </div>

        {/* Stream 2: Simulated Process Temperature */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={14} color="var(--amber-primary)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-primary)', textTransform: 'uppercase' }}>
                  Kiln Process Thermal Model
                </span>
              </div>
              <span className="badge badge-amber">SIMULATED</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 4px 0' }}>
              <span className="mono-num" style={{ fontSize: 28, fontWeight: 700, color: 'var(--amber-primary)' }}>
                {simulatedProcessTempC.toFixed(1)}
              </span>
              <span className="mono" style={{ fontSize: 14, color: 'var(--text-muted)' }}>°C</span>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
              Mathematical demonstration model of industrial furnace/kiln thermal profile.
            </p>
          </div>

          {simulatedHistory.length > 1 && (
            <div style={{ paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                Simulated Thermal Curve
              </div>
              <MiniSparkline data={simulatedHistory} color="#F59E0B" width={180} height={24} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
