import React from 'react';
import {
  Thermometer,
  Zap,
  Activity,
  Gauge,
  Leaf,
  Clock,
  AlertTriangle,
  Cpu,
  Layers,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  RotateCw,
  FolderGit2,
  AlertCircle,
  Radio,
  Wifi,
  Usb,
  Info,
  QrCode,
  FileSpreadsheet,
  Award,
  DollarSign,
  Flame,
  CheckCircle2,
  SlidersHorizontal,
  Server
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { StateTimeline } from '../components/common/StateTimeline';
import { DualTemperatureCard } from '../components/common/DualTemperatureCard';
import { FutureIndustrialRoadmap } from '../components/common/FutureIndustrialRoadmap';
import { NavView } from '../components/layout/Sidebar';

interface DashboardViewProps {
  onNavigate: (view: NavView) => void;
  onOpenBatchModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenBatchModal }) => {
  const {
    currentPacket,
    history,
    stateSegments,
    summary,
    insights,
    machineInfo,
    activeBatch,
    settings,
    alerts,
    sensorValidation,
    connectionStatus,
    setMode,
    connectWebSerial
  } = useTelemetry();

  const isLive = settings.mode === 'LIVE';
  const isStale = isLive && sensorValidation.isStale;
  const isSimulated = currentPacket.dataSource === 'SIMULATION' || currentPacket.isSimulated;

  // Extract sparkline data series from historical ring buffer
  const voltageSeries = history.map(p => p.voltage);
  const currentSeries = history.map(p => p.current);
  const powerSeries = history.map(p => p.power);
  const tempSeries = history.map(p => p.measuredTemperature);
  const simTempSeries = history.map(p => p.simulatedProcessTemperature);

  // Machine state configuration
  const getStateInfo = () => {
    switch (currentPacket.state) {
      case 'ACTIVE':
        return {
          label: 'ACTIVE / LOADED',
          variant: 'emerald' as const,
          desc: 'Operational torque under active mechanical workload. Productive manufacturing in progress.',
          dot: 'green'
        };
      case 'IDLE':
        return {
          label: 'IDLE (PARASITIC LEAK)',
          variant: 'amber' as const,
          desc: 'Motor energized at zero mechanical load. Standby parasitic energy loss detected.',
          dot: 'amber'
        };
      case 'ABNORMAL':
        return {
          label: 'ABNORMAL / OVERLOAD',
          variant: 'red' as const,
          desc: `Current draw exceeded safety threshold (${settings.overloadCurrentThresholdA.toFixed(2)} A). Mechanical bind or rotor stall protection triggered.`,
          dot: 'red'
        };
      case 'WARMUP':
        return {
          label: 'WARMUP / TRANSIENT',
          variant: 'cyan' as const,
          desc: 'Inrush current surge filtered by edge state classifier.',
          dot: 'cyan'
        };
      default:
        return {
          label: 'STANDBY / OFF',
          variant: 'muted' as const,
          desc: 'Zero electrical load detected across 12V DC bus.',
          dot: 'off'
        };
    }
  };

  const stateInfo = getStateInfo();

  // Energy distribution percentage calculations
  const totalEnergy = summary.todayTotalEnergyKWh || 0.001;
  const activePercent = Math.min(100, Math.round((summary.todayActiveEnergyKWh / totalEnergy) * 100));
  const idlePercent = Math.max(0, 100 - activePercent);

  return (
    <div className="view-content animate-fade-in">
      {/* 1. Hardware Stale / Connection Alert */}
      {isLive && isStale && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--red-dark)',
            border: '1px solid var(--red-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} color="var(--red-primary)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                ESP32-S3 Hardware Link Inactive ({sensorValidation.lastPacketAgeSeconds}s elapsed)
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Packet timeout exceeded on {settings.ingestionMethod}. Visualizing last valid edge buffer frame.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setMode('DEMO')}>
              Switch to Simulation
            </button>
            <button className="btn btn-primary btn-sm" onClick={connectWebSerial}>
              Reconnect Serial
            </button>
          </div>
        </div>
      )}

      {/* 2. Operational Status Header */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Cpu size={22} color="var(--cyan-primary)" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {machineInfo.id}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>|</span>
                <span className={`status-dot ${stateInfo.dot}`} />
                <Badge variant={stateInfo.variant}>
                  {stateInfo.label}
                </Badge>
                {isSimulated ? (
                  <span className="badge badge-amber">
                    SYNTHETIC TELEMETRY
                  </span>
                ) : (
                  <span className="badge badge-emerald">
                    HARDWARE: ESP32-S3 ({settings.ingestionMethod})
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {stateInfo.desc}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => onNavigate('dpp')}
              className="btn btn-secondary btn-sm"
              style={{ gap: 6 }}
            >
              <QrCode size={13} /> Digital Passport
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="btn btn-secondary btn-sm"
              style={{ gap: 6 }}
            >
              <FileSpreadsheet size={13} /> Export Ledger
            </button>
            <button
              onClick={() => onNavigate('carbon-footprint')}
              className="btn btn-primary btn-sm"
              style={{ gap: 6 }}
            >
              <Leaf size={13} /> Carbon Scope 2
            </button>
          </div>
        </div>
      </div>

      {/* 3. Primary Telemetry Matrix: 6 High-Density Structured Cards */}
      <div className="grid-6">
        {/* 1. Measured Physical Temperature */}
        <MetricCard
          title="Transducer Temp"
          value={sensorValidation.temperatureStatus === 'OK' ? currentPacket.measuredTemperature.toFixed(1) : '--'}
          unit={sensorValidation.temperatureStatus === 'OK' ? '°C' : undefined}
          icon={<Thermometer size={15} />}
          subtitle="Dallas DS18B20 (1-Wire GPIO 4)"
          sparklineData={tempSeries}
          sparklineColor="#10B981"
          accentColor="emerald"
          isSimulated={isSimulated}
          isError={sensorValidation.temperatureStatus !== 'OK'}
          errorMessage={`DS18B20: ${sensorValidation.temperatureStatus}`}
          badge={{ text: 'PHYSICAL', variant: 'emerald' }}
        />

        {/* 2. Measured Voltage */}
        <MetricCard
          title="Bus Voltage"
          value={sensorValidation.voltageStatus === 'OK' ? currentPacket.voltage.toFixed(2) : '--'}
          unit={sensorValidation.voltageStatus === 'OK' ? 'V' : undefined}
          icon={<Zap size={15} />}
          subtitle="ADS1115 AIN0 (5:1 Divider)"
          sparklineData={voltageSeries}
          sparklineColor="#0EA5E9"
          accentColor="cyan"
          isSimulated={isSimulated}
          isError={sensorValidation.voltageStatus !== 'OK'}
          errorMessage={`VOLTAGE: ${sensorValidation.voltageStatus}`}
          badge={{ text: '12V NOMINAL', variant: 'muted' }}
        />

        {/* 3. Measured Current */}
        <MetricCard
          title="Current Draw"
          value={sensorValidation.currentStatus === 'OK' ? currentPacket.current.toFixed(3) : '--'}
          unit={sensorValidation.currentStatus === 'OK' ? 'A' : undefined}
          icon={<Activity size={15} />}
          subtitle="ACS712-05B (185 mV/A)"
          sparklineData={currentSeries}
          sparklineColor={currentPacket.current > 1.5 ? '#F59E0B' : '#10B981'}
          accentColor={currentPacket.current > 1.5 ? 'amber' : 'emerald'}
          isSimulated={isSimulated}
          isError={sensorValidation.currentStatus !== 'OK'}
          errorMessage={`CURRENT: ${sensorValidation.currentStatus}`}
          badge={{ text: '0-5A RANGE', variant: 'muted' }}
        />

        {/* 4. Active Power */}
        <MetricCard
          title="Active Power"
          value={currentPacket.power.toFixed(1)}
          unit="W"
          icon={<Gauge size={15} />}
          subtitle="Instantaneous P = V × I"
          sparklineData={powerSeries}
          sparklineColor="#0EA5E9"
          accentColor="cyan"
          isSimulated={isSimulated}
          badge={{ text: 'P = V × I', variant: 'cyan' }}
        />

        {/* 5. Cumulative Energy */}
        <MetricCard
          title="Energy Metered"
          value={currentPacket.cumulativeEnergyKWh.toFixed(3)}
          unit="kWh"
          icon={<Server size={15} />}
          subtitle={`${(currentPacket.cumulativeEnergyKWh * 1000).toFixed(0)} Wh edge integrated`}
          accentColor="emerald"
          isSimulated={isSimulated}
          badge={{ text: 'TODAY', variant: 'emerald' }}
        />

        {/* 6. Estimated Carbon Footprint */}
        <MetricCard
          title="Carbon Scope 2"
          value={currentPacket.carbonKgCO2e.toFixed(3)}
          unit="kg CO₂e"
          icon={<Leaf size={15} />}
          subtitle={`Grid Factor: ${settings.gridEmissionFactor.toFixed(3)} kg/kWh`}
          accentColor="cyan"
          isSimulated={isSimulated}
          badge={{ text: 'SCOPE 2', variant: 'cyan' }}
          onClick={() => onNavigate('carbon-footprint')}
        />
      </div>

      {/* 4. Machine State Temporal Ribbon */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div className="card-header" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} color="var(--cyan-primary)" />
            <span className="card-title">Temporal State Classification</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Sampling Ring: <span className="mono" style={{ color: 'var(--text-secondary)' }}>{history.length} frames</span>
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('machine-intelligence')}
              style={{ fontSize: 10, padding: '2px 8px' }}
            >
              Classifier Rules
            </button>
          </div>
        </div>

        <StateTimeline segments={stateSegments} height={28} />
      </div>

      {/* 5. Dual Energy & Carbon Diagnostic Ledger */}
      <div className="grid-2" style={{ gap: 16 }}>
        {/* Panel A: Energy Allocation Ledger */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={15} color="var(--amber-primary)" />
              <span className="card-title">Energy Allocation & Parasitic Loss</span>
            </div>
            <span className="badge badge-amber">STANDBY AUDIT</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                backgroundColor: 'var(--bg-surface)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Productive Load
                </div>
                <div className="mono-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--emerald-primary)', marginTop: 2 }}>
                  {summary.todayActiveEnergyKWh.toFixed(3)} <span style={{ fontSize: 11, fontWeight: 400 }}>kWh</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {activePercent}% of total intake
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Parasitic Idle Loss
                </div>
                <div className="mono-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber-primary)', marginTop: 2 }}>
                  {summary.todayIdleEnergyKWh.toFixed(3)} <span style={{ fontSize: 11, fontWeight: 400 }}>kWh</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {idlePercent}% standby loss
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Avoidable Cost
                </div>
                <div className="mono-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {settings.currencySymbol}{summary.todayIdleCost.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  @{settings.currencySymbol}{settings.electricityRatePerKWh.toFixed(2)}/kWh
                </div>
              </div>
            </div>

            {/* Ratio Bar */}
            <div style={{ marginTop: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--emerald-primary)', fontWeight: 600 }}>Productive: {activePercent}%</span>
                <span style={{ color: 'var(--amber-primary)', fontWeight: 600 }}>Standby Leak: {idlePercent}%</span>
              </div>
              <div style={{ height: 6, width: '100%', backgroundColor: 'var(--bg-inset)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${activePercent}%`, backgroundColor: 'var(--emerald-primary)' }} />
                <div style={{ width: `${idlePercent}%`, backgroundColor: 'var(--amber-primary)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Panel B: Carbon Scope 2 Ledger */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Leaf size={15} color="var(--emerald-primary)" />
              <span className="card-title">Scope 2 Carbon & Emission Intensity</span>
            </div>
            <span className="badge badge-emerald">GEF: {settings.gridRegion}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                backgroundColor: 'var(--bg-surface)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Emissions
                </div>
                <div className="mono-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--cyan-primary)', marginTop: 2 }}>
                  {summary.todayCarbonKgCO2e.toFixed(3)} <span style={{ fontSize: 11, fontWeight: 400 }}>kg</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Total metered footprint
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Avoidable Idle Carbon
                </div>
                <div className="mono-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber-primary)', marginTop: 2 }}>
                  {summary.todayIdleCarbonKgCO2e.toFixed(3)} <span style={{ fontSize: 11, fontWeight: 400 }}>kg</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Pure standby emissions
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Grid Factor
                </div>
                <div className="mono-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {settings.gridEmissionFactor.toFixed(3)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  kg CO₂e per kWh
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Methodology: Direct kWh integration × Regional Grid Emission Factor</span>
              <span className="mono" style={{ color: 'var(--cyan-primary)' }}>GHG Protocol Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Dual-Stream Temperature Ledger */}
      <DualTemperatureCard
        measuredTempC={currentPacket.measuredTemperature}
        simulatedProcessTempC={currentPacket.simulatedProcessTemperature}
        measuredHistory={tempSeries}
        simulatedHistory={simTempSeries}
        temperatureStatus={sensorValidation.temperatureStatus}
      />

      {/* 7. Empirical Machine Diagnostics (No AI Clichés/Sparkles) */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={15} color="var(--indigo-primary)" />
            <span className="card-title">Empirical Diagnostic Ledger</span>
          </div>
          <span className="badge badge-muted">EDGE DETERMINISTIC RULES</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insights.map(ins => {
            const isWarning = ins.severity === 'WARNING';
            const isOpportunity = ins.severity === 'OPPORTUNITY';
            return (
              <div
                key={ins.id}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${
                    isWarning
                      ? 'var(--red-border)'
                      : isOpportunity
                      ? 'var(--amber-border)'
                      : 'var(--border-subtle)'
                  }`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12
                }}
              >
                <div style={{ marginTop: 2 }}>
                  {isWarning ? (
                    <AlertTriangle size={15} color="var(--red-primary)" />
                  ) : isOpportunity ? (
                    <Zap size={15} color="var(--amber-primary)" />
                  ) : (
                    <Info size={15} color="var(--cyan-primary)" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ins.title}
                    </span>
                    {ins.metricValue && (
                      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--cyan-primary)' }}>
                        {ins.metricValue}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                    {ins.text}
                  </p>
                  {ins.actionableRecommendation && (
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--emerald-primary)', fontWeight: 600 }}>
                      Actionable Mitigation: {ins.actionableRecommendation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. Industrial Scale-Up Architecture Table */}
      <FutureIndustrialRoadmap />
    </div>
  );
};
