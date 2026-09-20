import React, { useState } from 'react';
import {
  Leaf,
  Globe,
  Trees,
  Car,
  Lightbulb,
  Smartphone,
  TrendingDown,
  ShieldCheck,
  Award,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { GRID_EMISSION_PRESETS, getCarbonEquivalents } from '../services/carbonEngine';
import { GridRegion } from '../types/telemetry';
import { AnalyticsCharts } from '../components/common/AnalyticsCharts';

export const CarbonFootprintView: React.FC = () => {
  const { summary, currentPacket, history, settings, updateSettings, batchList } = useTelemetry();
  const [timeRange, setTimeRange] = useState<'SESSION' | '1HOUR' | 'TODAY'>('TODAY');

  const equivalents = getCarbonEquivalents(summary.todayCarbonKgCO2e);
  const currentPreset = GRID_EMISSION_PRESETS[settings.gridRegion] || GRID_EMISSION_PRESETS.IN_CEA;

  const handleRegionChange = (region: GridRegion) => {
    updateSettings({ gridRegion: region });
  };

  const carbonIntensityPerKWh = settings.gridEmissionFactor;

  return (
    <div className="view-content animate-fade-in">
      {/* Top Banner with Strict Methodology Notice */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #06281E 0%, #0E3D2E 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
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
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Leaf size={26} color="var(--emerald-primary)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Energy-Based Carbon Intelligence & Scope 2 Accounting
                </h1>
                <span className="badge badge-emerald">GHG PROTOCOL SCOPE 2</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Estimated indirect carbon emissions quantified from empirical electrical energy consumption and regional grid emission factors.
              </p>
            </div>
          </div>

          {/* Regional Grid Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe size={16} color="var(--emerald-primary)" />
            <select
              className="input-field"
              value={settings.gridRegion}
              onChange={e => handleRegionChange(e.target.value as GridRegion)}
              style={{ width: 'auto', minWidth: 220, borderColor: 'rgba(16, 185, 129, 0.4)' }}
            >
              {Object.values(GRID_EMISSION_PRESETS).map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.factor} kg/kWh)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* METHODOLOGY & ESTIMATION DISCLAIMER CALLOUT */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12,
          color: 'var(--text-secondary)'
        }}
      >
        <Info size={18} color="var(--cyan-primary)" style={{ flexShrink: 0 }} />
          <strong style={{ color: 'var(--cyan-primary)' }}>Measurement Methodology Notice:</strong> The hardware test bench measures physical electrical parameters (voltage, current, power). Carbon values shown on this platform are <strong>energy-based estimates</strong> calculated via Carbon (kg CO₂e) = Energy (kWh) × Emission Factor. C-TRACK does not claim direct chemical measurement of CO₂ exhaust from the electric motor.
      </div>

      {/* Carbon Estimation Primary KPI Grid */}
      <div className="grid-4">
        {/* 1. Total Estimated Scope 2 Carbon */}
        <MetricCard
          title="Estimated Scope 2 CO₂e"
          value={summary.todayCarbonKgCO2e.toFixed(4)}
          unit="kg CO₂e"
          icon={<Leaf size={16} />}
          subtitle={`From ${summary.todayTotalEnergyKWh.toFixed(3)} kWh measured energy`}
          accentColor="emerald"
          badge={{ text: 'ENERGY ESTIMATE', variant: 'emerald' }}
        />

        {/* 2. Productive vs Idle Carbon Breakdown */}
        <MetricCard
          title="Productive Carbon"
          value={summary.todayProductiveCarbonKgCO2e.toFixed(4)}
          unit="kg CO₂e"
          icon={<Award size={16} />}
          subtitle={`${((summary.todayActiveEnergyKWh / Math.max(0.001, summary.todayTotalEnergyKWh)) * 100).toFixed(1)}% productive load`}
          accentColor="cyan"
          badge={{ text: 'ACTIVE WORK', variant: 'cyan' }}
        />

        {/* 3. Idle Standby Carbon (Avoidable) */}
        <MetricCard
          title="Idle Carbon Penalty"
          value={summary.todayIdleCarbonKgCO2e.toFixed(4)}
          unit="kg CO₂e"
          icon={<TrendingDown size={16} />}
          subtitle="Avoidable carbon from zero-load standby"
          accentColor="amber"
          badge={{ text: 'AVOIDABLE LEAK', variant: 'amber' }}
        />

        {/* 4. Grid Emission Factor (GEF) */}
        <MetricCard
          title="Configured GEF"
          value={settings.gridEmissionFactor.toFixed(3)}
          unit="kg/kWh"
          icon={<Globe size={16} />}
          subtitle={`Authority: ${currentPreset.name}`}
          accentColor="indigo"
          badge={{ text: settings.gridRegion, variant: 'indigo' }}
        />
      </div>

      {/* DETAILED CARBON EMISSIONS & ENERGY RELATIONSHIP PANEL */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="var(--emerald-primary)" />
            <span className="card-title">Energy-to-Carbon Conversion Accounting Matrix</span>
          </div>
          <span className="badge badge-muted">Scope 2 Indirect</span>
        </div>

        <div className="grid-3" style={{ gap: 16 }}>
          <div style={{ padding: 14, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>MEASURED ELECTRICAL ENERGY</div>
            <div className="mono-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
              {summary.todayTotalEnergyKWh.toFixed(4)} <span style={{ fontSize: 12 }}>kWh</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Active: {summary.todayActiveEnergyKWh.toFixed(4)} kWh | Idle: {summary.todayIdleEnergyKWh.toFixed(4)} kWh
            </div>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>GRID EMISSION FACTOR (GEF)</div>
            <div className="mono-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--cyan-primary)', margin: '4px 0' }}>
              {settings.gridEmissionFactor.toFixed(3)} <span style={{ fontSize: 12 }}>kg CO₂e/kWh</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Source: {currentPreset.source}
            </div>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ESTIMATED TOTAL EMISSIONS</div>
            <div className="mono-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--emerald-primary)', margin: '4px 0' }}>
              {summary.todayCarbonKgCO2e.toFixed(4)} <span style={{ fontSize: 12 }}>kg CO₂e</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Carbon = Energy × GEF
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-METRIC TIME SERIES CHARTS (CARBON & ENERGY ACCUMULATION) */}
      <AnalyticsCharts
        history={history}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* Real-World Environmental Equivalencies */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trees size={16} color="var(--emerald-primary)" />
            <span className="card-title">Real-World Environmental Equivalency Context</span>
          </div>
          <span className="badge badge-muted">Tangible Context</span>
        </div>

        <div className="grid-4" style={{ gap: 14 }}>
          <div style={{ padding: 16, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--emerald-primary)' }}>
              <Trees size={18} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>TREE ABSORPTION</span>
            </div>
            <div className="mono-num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              {equivalents.treeDaysAbsorbed} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>tree-days</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Days of mature tree absorption required to offset today's energy emissions
            </p>
          </div>

          <div style={{ padding: 16, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--cyan-primary)' }}>
              <Car size={18} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>PASSENGER VEHICLE</span>
            </div>
            <div className="mono-num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              {equivalents.kmDriven} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>km driven</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Equivalent exhaust emissions of an average gasoline car
            </p>
          </div>

          <div style={{ padding: 16, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--amber-primary)' }}>
              <Lightbulb size={18} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>LED LIGHTING</span>
            </div>
            <div className="mono-num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              {equivalents.ledBulbHours} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>hours</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Hours of 9W commercial LED lighting powered
            </p>
          </div>

          <div style={{ padding: 16, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--indigo-primary)' }}>
              <Smartphone size={18} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>DEVICE RECHARGES</span>
            </div>
            <div className="mono-num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              {equivalents.smartphonesCharged} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>charges</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Full smartphone battery charging cycles
            </p>
          </div>
        </div>
      </div>

      {/* Production Batch Carbon Traceability Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={16} color="var(--indigo-primary)" />
            <span className="card-title">Production Batch Carbon Allocation (DPP Genesis Registry)</span>
          </div>
          <span className="badge badge-indigo">Batch Carbon Intensity</span>
        </div>

        <div className="table-container">
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Product / SKU</th>
                <th>Units Produced</th>
                <th>Batch Energy (kWh)</th>
                <th>Total Carbon (kg CO₂e)</th>
                <th>Carbon / Unit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {batchList.map(b => (
                <tr key={b.batchId}>
                  <td className="mono" style={{ fontWeight: 600 }}>{b.batchId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.productName}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.sku}</div>
                  </td>
                  <td className="mono-num">{b.unitsCompleted} / {b.unitsPlanned}</td>
                  <td className="mono-num">{b.totalEnergyKWh.toFixed(4)}</td>
                  <td className="mono-num" style={{ color: 'var(--cyan-primary)', fontWeight: 700 }}>
                    {b.totalCarbonKgCO2e.toFixed(4)}
                  </td>
                  <td className="mono-num" style={{ color: 'var(--emerald-primary)', fontWeight: 700 }}>
                    {b.carbonPerUnit.toFixed(5)} kg
                  </td>
                  <td>
                    <Badge variant={b.status === 'ACTIVE' ? 'indigo' : b.status === 'COMPLETED' ? 'emerald' : 'muted'}>
                      {b.status}
                    </Badge>
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
