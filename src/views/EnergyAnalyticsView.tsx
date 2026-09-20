import React, { useState } from 'react';
import {
  Zap,
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3,
  Calendar,
  Layers,
  Award,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { EnergySankey } from '../components/common/EnergySankey';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { StateTimeline } from '../components/common/StateTimeline';
import { AnalyticsCharts } from '../components/common/AnalyticsCharts';

export const EnergyAnalyticsView: React.FC = () => {
  const { summary, currentPacket, history, stateSegments, insights, settings } = useTelemetry();
  const [timeRange, setTimeRange] = useState<'SESSION' | '1HOUR' | 'TODAY'>('TODAY');

  // Realistic Shift-wise Energy distribution
  const shifts = [
    {
      name: 'Shift A (06:00 - 14:00)',
      totalKWh: 0.185,
      activeKWh: 0.152,
      idleKWh: 0.033,
      idleCost: 0.033 * settings.electricityRatePerKWh,
      efficiency: '82.2%'
    },
    {
      name: 'Shift B (14:00 - 22:00)',
      totalKWh: 0.162,
      activeKWh: 0.124,
      idleKWh: 0.038,
      idleCost: 0.038 * settings.electricityRatePerKWh,
      efficiency: '76.5%'
    },
    {
      name: 'Shift C (22:00 - 06:00)',
      totalKWh: 0.065,
      activeKWh: 0.042,
      idleKWh: 0.023,
      idleCost: 0.023 * settings.electricityRatePerKWh,
      efficiency: '64.6%'
    }
  ];

  // Hourly profile simulation data
  const hourlyData = [
    { hour: '06:00', active: 14, idle: 3 },
    { hour: '08:00', active: 22, idle: 4 },
    { hour: '10:00', active: 28, idle: 6 },
    { hour: '12:00', active: 18, idle: 9 }, // Lunch standby spike!
    { hour: '14:00', active: 26, idle: 5 },
    { hour: '16:00', active: 30, idle: 4 },
    { hour: '18:00', active: 24, idle: 7 },
    { hour: '20:00', active: 16, idle: 8 }
  ];

  const maxHourPower = 40;

  return (
    <div className="view-content animate-fade-in">
      {/* Top Banner & Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0B172E 0%, #102144 100%)',
          border: '1px solid var(--border-medium)',
          padding: '20px 24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                Machine Energy Analytics & Idle Leak Detection
              </h1>
              <span className="badge badge-cyan">Energy Measurement Layer</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              High-resolution power calculations ($P = V \times I$), integrated session & cumulative energy, and empirical idle loss quantification for Motor-01.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Energy & Power KPI Grid with proper units (W, kW, Wh, kWh) */}
      <div className="grid-4">
        {/* 1. Instantaneous Power */}
        <MetricCard
          title="Instantaneous Power"
          value={currentPacket.power > 1000 ? (currentPacket.power / 1000).toFixed(3) : currentPacket.power.toFixed(1)}
          unit={currentPacket.power > 1000 ? 'kW' : 'W'}
          icon={<Zap size={16} />}
          subtitle={`${currentPacket.voltage.toFixed(1)}V × ${currentPacket.current.toFixed(2)}A`}
          accentColor="cyan"
          badge={{ text: 'P = V × I', variant: 'cyan' }}
        />

        {/* 2. Session Energy */}
        <MetricCard
          title="Session Energy"
          value={summary.sessionEnergyWh < 1000 ? summary.sessionEnergyWh.toFixed(1) : summary.sessionEnergyKWh.toFixed(4)}
          unit={summary.sessionEnergyWh < 1000 ? 'Wh' : 'kWh'}
          icon={<Clock size={16} />}
          subtitle="Energy in current continuous session"
          accentColor="indigo"
          badge={{ text: 'SESSION', variant: 'indigo' }}
        />

        {/* 3. Today's Total Energy */}
        <MetricCard
          title="Today Energy"
          value={summary.todayTotalEnergyKWh.toFixed(3)}
          unit="kWh"
          icon={<Award size={16} />}
          subtitle={`${summary.todayActiveEnergyKWh.toFixed(3)} kWh active productive`}
          accentColor="emerald"
          badge={{ text: 'METERED', variant: 'emerald' }}
        />

        {/* 4. Total Cumulative Energy */}
        <MetricCard
          title="Total Lifetime Energy"
          value={summary.totalCumulativeEnergyKWh.toFixed(2)}
          unit="kWh"
          icon={<Layers size={16} />}
          subtitle="All-time integrated machine total"
          accentColor="cyan"
          badge={{ text: 'LIFETIME', variant: 'muted' }}
        />
      </div>

      {/* PROMINENT SECTION: HIDDEN IDLE ENERGY DETECTED */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1C1608 0%, #29200B 100%)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          padding: '20px 24px'
        }}
      >
        <div className="card-header" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={20} color="var(--amber-primary)" />
            <div>
              <span className="card-title" style={{ color: '#FCD34D', fontSize: 15 }}>
                Hidden Idle Energy Leak Detected
              </span>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Empirical standby dissipation while motor is connected with zero mechanical work load
              </div>
            </div>
          </div>
          <span className="badge badge-amber">ACTIONABLE COST LEAK</span>
        </div>

        <div className="grid-3" style={{ gap: 16 }}>
          <div style={{ padding: 14, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>MEASURED IDLE ENERGY</div>
            <div className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: 'var(--amber-primary)', margin: '4px 0' }}>
              {summary.todayIdleEnergyKWh.toFixed(3)} <span style={{ fontSize: 13 }}>kWh</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {((summary.todayIdleEnergyKWh / Math.max(0.001, summary.todayTotalEnergyKWh)) * 100).toFixed(1)}% of today's electricity consumed in zero-load standby
            </div>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ESTIMATED IDLE CARBON</div>
            <div className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: 'var(--cyan-primary)', margin: '4px 0' }}>
              {summary.todayIdleCarbonKgCO2e.toFixed(3)} <span style={{ fontSize: 13 }}>kg CO₂e</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Avoidable Scope 2 emissions (based on {settings.gridEmissionFactor} kg/kWh GEF)
            </div>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>POTENTIAL FINANCIAL SAVING</div>
            <div className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: 'var(--emerald-primary)', margin: '4px 0' }}>
              {settings.currencySymbol}{summary.todayIdleCost.toFixed(2)} <span style={{ fontSize: 13 }}>/day</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Tariff: {settings.currencySymbol}{settings.electricityRatePerKWh}/kWh (~{settings.currencySymbol}{(summary.todayIdleCost * 26).toFixed(0)}/mo potential saving)
            </div>
          </div>
        </div>
      </div>

      {/* REAL-TIME MACHINE STATE TIMELINE (GANTT RIBBON) */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--cyan-primary)" />
            <span className="card-title">Continuous Machine State Timeline (Active / Idle / Abnormal)</span>
          </div>
          <span className="badge badge-muted">Edge Event Sequence</span>
        </div>

        <StateTimeline segments={stateSegments} height={38} />
      </div>

      {/* INTERACTIVE MULTI-METRIC TIME SERIES CHARTS */}
      <AnalyticsCharts
        history={history}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* HUMAN-READABLE ENGINEERING INSIGHTS */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--indigo-primary)" />
            <span className="card-title">Empirical Analytics & Operational Insights</span>
          </div>
          <span className="badge badge-indigo">Grounded Machine Diagnostics</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {insights.map(ins => (
            <div
              key={ins.id}
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: ins.severity === 'WARNING'
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : ins.severity === 'OPPORTUNITY'
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}
            >
              <Info
                size={18}
                color={ins.severity === 'WARNING' ? 'var(--red-primary)' : ins.severity === 'OPPORTUNITY' ? 'var(--amber-primary)' : 'var(--cyan-primary)'}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {ins.title}
                  </span>
                  {ins.metricValue && (
                    <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--cyan-primary)' }}>
                      {ins.metricValue}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  {ins.text}
                </p>
                {ins.actionableRecommendation && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: 'var(--emerald-primary)',
                      fontWeight: 600,
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      display: 'inline-block'
                    }}
                  >
                    👉 Recommendation: {ins.actionableRecommendation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active vs Hidden Idle Decomposition Flow */}
      <EnergySankey
        totalKWh={summary.todayTotalEnergyKWh}
        activeKWh={summary.todayActiveEnergyKWh}
        idleKWh={summary.todayIdleEnergyKWh}
      />

      {/* Hourly Energy Consumption Breakdown Chart */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} color="var(--cyan-primary)" />
            <span className="card-title">Hourly Energy Consumption Profile (Active vs Idle)</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--emerald-primary)' }}>
              <span style={{ width: 10, height: 10, backgroundColor: 'var(--emerald-primary)', borderRadius: 2 }} />
              Productive Work
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--amber-primary)' }}>
              <span style={{ width: 10, height: 10, backgroundColor: 'var(--amber-primary)', borderRadius: 2 }} />
              Idle Waste Leak
            </span>
          </div>
        </div>

        {/* Stacked Bar Chart Visualization */}
        <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 16, padding: '16px 8px 8px 8px' }}>
          {hourlyData.map(d => {
            const activeH = (d.active / maxHourPower) * 160;
            const idleH = (d.idle / maxHourPower) * 160;

            return (
              <div
                key={d.hour}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 36,
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    borderRadius: '4px 4px 0 0',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <div
                    style={{
                      height: activeH,
                      backgroundColor: 'var(--emerald-primary)',
                      transition: 'height 0.3s ease'
                    }}
                    title={`Active: ${d.active} Wh`}
                  />
                  <div
                    style={{
                      height: idleH,
                      backgroundColor: 'var(--amber-primary)',
                      transition: 'height 0.3s ease'
                    }}
                    title={`Idle: ${d.idle} Wh`}
                  />
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {d.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shift-Wise Energy Analysis Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--cyan-primary)" />
            <span className="card-title">Shift-Wise Energy & Efficiency Distribution</span>
          </div>
          <span className="badge badge-muted">3 Shifts / Day</span>
        </div>

        <div className="table-container">
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Shift Schedule</th>
                <th>Total Energy (kWh)</th>
                <th>Productive (kWh)</th>
                <th>Idle Waste (kWh)</th>
                <th>Idle Cost Loss</th>
                <th>Energy Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td className="mono-num">{s.totalKWh.toFixed(3)}</td>
                  <td className="mono-num" style={{ color: 'var(--emerald-primary)' }}>{s.activeKWh.toFixed(3)}</td>
                  <td className="mono-num" style={{ color: 'var(--amber-primary)' }}>{s.idleKWh.toFixed(3)}</td>
                  <td className="mono-num" style={{ color: 'var(--red-primary)' }}>{settings.currencySymbol}{s.idleCost.toFixed(2)}</td>
                  <td>
                    <span className="badge badge-emerald">{s.efficiency}</span>
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
