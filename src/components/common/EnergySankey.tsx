import React from 'react';
import { Zap, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

interface EnergySankeyProps {
  totalKWh: number;
  activeKWh: number;
  idleKWh: number;
}

export const EnergySankey: React.FC<EnergySankeyProps> = ({
  totalKWh,
  activeKWh,
  idleKWh
}) => {
  const { settings, summary } = useTelemetry();

  const total = Math.max(0.001, totalKWh);
  const activePercent = Math.min(100, Math.max(0, (activeKWh / total) * 100));
  const idlePercent = Math.min(100, Math.max(0, (idleKWh / total) * 100));

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color="var(--cyan-primary)" />
          <span className="card-title">Energy Decomposition: Active vs Hidden Idle</span>
        </div>
        <span className="badge badge-cyan">Edge Classified</span>
      </div>

      {/* Visual Split Bar */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            height: 18,
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 6,
            overflow: 'hidden',
            display: 'flex',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div
            style={{
              width: `${activePercent}%`,
              backgroundColor: 'var(--emerald-primary)',
              transition: 'width 0.3s ease'
            }}
            title={`Active: ${activeKWh.toFixed(3)} kWh (${activePercent.toFixed(1)}%)`}
          />
          <div
            style={{
              width: `${idlePercent}%`,
              backgroundColor: 'var(--amber-primary)',
              transition: 'width 0.3s ease'
            }}
            title={`Idle Leak: ${idleKWh.toFixed(3)} kWh (${idlePercent.toFixed(1)}%)`}
          />
        </div>
      </div>

      {/* Grid of Two Columns */}
      <div className="grid-2" style={{ gap: 12 }}>
        {/* Active Productive */}
        <div
          style={{
            padding: 14,
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--emerald-primary)' }}>
              PRODUCTIVE WORK
            </span>
            <span className="mono-num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--emerald-primary)' }}>
              {activePercent.toFixed(1)}%
            </span>
          </div>
          <div className="mono-num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            {activeKWh.toFixed(4)} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>kWh</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Electrical energy converted to mechanical work
          </div>
        </div>

        {/* Hidden Idle Leak */}
        <div
          style={{
            padding: 14,
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={13} color="var(--amber-primary)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber-primary)' }}>
                HIDDEN IDLE LEAK
              </span>
            </div>
            <span className="mono-num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber-primary)' }}>
              {idlePercent.toFixed(1)}%
            </span>
          </div>
          <div className="mono-num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            {idleKWh.toFixed(4)} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>kWh</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Unproductive standby power dissipation
          </div>
        </div>
      </div>

      {/* Financial & Carbon Saving Potential Banner */}
      <div
        style={{
          marginTop: 14,
          padding: '10px 14px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingDown size={16} color="var(--cyan-primary)" />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Mitigation Potential (Idle Auto-Stop):
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="mono-num" style={{ fontSize: 12, color: 'var(--emerald-primary)', fontWeight: 600 }}>
            {settings.currencySymbol}{summary.potentialCostSaving.toFixed(2)} cost saved today
          </div>
          <div className="mono-num" style={{ fontSize: 12, color: 'var(--cyan-primary)', fontWeight: 600 }}>
            {summary.potentialCarbonSavingKgCO2e.toFixed(3)} kg CO₂e abated
          </div>
        </div>
      </div>
    </div>
  );
};
