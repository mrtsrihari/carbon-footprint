import React, { useState } from 'react';
import { TelemetryPacket } from '../../types/telemetry';

interface AnalyticsChartsProps {
  history: TelemetryPacket[];
  timeRange: 'SESSION' | '1HOUR' | 'TODAY';
  onTimeRangeChange: (range: 'SESSION' | '1HOUR' | 'TODAY') => void;
}

type ChartMetric = 'POWER' | 'CURRENT' | 'VOLTAGE' | 'TEMPERATURE' | 'ENERGY' | 'CARBON';

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  history,
  timeRange,
  onTimeRangeChange
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('POWER');

  // Multi-series rendering parameters
  const getMetricConfig = () => {
    switch (selectedMetric) {
      case 'POWER':
        return {
          title: 'Instantaneous Active Power vs Time',
          unit: 'W',
          data: history.map(p => p.power),
          color: '#06B6D4',
          min: 0,
          max: Math.max(25, ...history.map(p => p.power * 1.2)),
          baselineLabel: 'Idle Leak Threshold: 4.5W'
        };
      case 'CURRENT':
        return {
          title: 'Current Draw vs Time (ACS712)',
          unit: 'A',
          data: history.map(p => p.current),
          color: '#10B981',
          min: 0,
          max: Math.max(2.5, ...history.map(p => p.current * 1.2)),
          baselineLabel: 'Overload Stall Limit: 1.8A'
        };
      case 'VOLTAGE':
        return {
          title: 'Bus Voltage vs Time (0-25V Sensor)',
          unit: 'V',
          data: history.map(p => p.voltage),
          color: '#38BDF8',
          min: 0,
          max: 16.0,
          baselineLabel: 'Nominal 12V DC Supply'
        };
      case 'TEMPERATURE':
        return {
          title: 'Measured Temp vs Simulated Process Temp',
          unit: '°C',
          data: history.map(p => p.measuredTemperature),
          secondaryData: history.map(p => p.simulatedProcessTemperature),
          color: '#10B981',
          secondaryColor: '#F59E0B',
          min: 20,
          max: 500,
          baselineLabel: 'DS18B20 (Green) vs Simulated Furnace (Amber)'
        };
      case 'ENERGY':
        return {
          title: 'Integrated Cumulative Energy Accumulation',
          unit: 'kWh',
          data: history.map(p => p.cumulativeEnergyKWh),
          color: '#6366F1',
          min: 0,
          max: Math.max(0.5, ...history.map(p => p.cumulativeEnergyKWh * 1.1)),
          baselineLabel: 'Total Active + Idle Energy'
        };
      case 'CARBON':
        return {
          title: 'Energy-Based Scope 2 Carbon Estimation Curve',
          unit: 'kg CO₂e',
          data: history.map(p => p.carbonKgCO2e),
          color: '#06B6D4',
          min: 0,
          max: Math.max(0.4, ...history.map(p => p.carbonKgCO2e * 1.1)),
          baselineLabel: 'Carbon = Energy (kWh) × Emission Factor'
        };
    }
  };

  const config = getMetricConfig();
  const data = config.data;
  const secondaryData = (config as any).secondaryData;

  const width = 760;
  const height = 220;
  const padding = 30;

  // Build SVG Path
  const buildPath = (values: number[], minVal: number, maxVal: number) => {
    if (values.length < 2) return '';
    const span = maxVal - minVal || 1;
    const stepX = (width - padding * 2) / (values.length - 1);

    return values
      .map((val, idx) => {
        const x = padding + idx * stepX;
        const normalizedY = Math.max(0, Math.min(1, (val - minVal) / span));
        const y = height - padding - normalizedY * (height - padding * 2);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const primaryPath = buildPath(data, config.min, config.max);
  const secondaryPath = secondaryData ? buildPath(secondaryData, config.min, config.max) : '';

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <span className="card-title">{config.title}</span>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {config.baselineLabel}
          </div>
        </div>

        {/* Time Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--bg-surface)', padding: 3, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {(['SESSION', '1HOUR', 'TODAY'] as const).map(range => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className="btn btn-sm"
              style={{
                backgroundColor: timeRange === range ? 'var(--cyan-primary)' : 'transparent',
                color: timeRange === range ? '#080C14' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: 10,
                padding: '2px 8px',
                border: 'none'
              }}
            >
              {range === 'SESSION' ? 'Session (Live)' : range === '1HOUR' ? 'Last 1 Hour' : 'Today'}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Switcher Tab Bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {[
          { id: 'POWER', label: 'Power (W)' },
          { id: 'CURRENT', label: 'Current (A)' },
          { id: 'VOLTAGE', label: 'Voltage (V)' },
          { id: 'TEMPERATURE', label: 'Temperature (°C)' },
          { id: 'ENERGY', label: 'Energy (kWh)' },
          { id: 'CARBON', label: 'Carbon (kg CO₂e)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedMetric(tab.id as ChartMetric)}
            className="btn btn-sm"
            style={{
              backgroundColor: selectedMetric === tab.id ? 'var(--bg-elevated)' : 'var(--bg-surface)',
              color: selectedMetric === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              border: selectedMetric === tab.id ? '1px solid var(--cyan-primary)' : '1px solid var(--border-subtle)',
              fontSize: 11,
              fontWeight: selectedMetric === tab.id ? 700 : 500
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SVG Multi-Series Chart Container */}
      <div style={{ width: '100%', overflowX: 'auto', backgroundColor: '#070C18', borderRadius: 'var(--radius-md)', padding: '10px 0' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - padding - pct * (height - padding * 2);
            const val = config.min + pct * (config.max - config.min);
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding - 6}
                  y={y + 4}
                  fill="var(--text-muted)"
                  fontSize={9}
                  fontFamily="var(--font-mono)"
                  textAnchor="end"
                >
                  {val.toFixed(val < 1 ? 3 : 1)}
                </text>
              </g>
            );
          })}

          {/* Secondary Series (e.g. Simulated Process Temperature) */}
          {secondaryPath && (
            <path
              d={secondaryPath}
              fill="none"
              stroke={(config as any).secondaryColor || '#F59E0B'}
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          )}

          {/* Primary Data Line */}
          {primaryPath && (
            <path
              d={primaryPath}
              fill="none"
              stroke={config.color}
              strokeWidth={2.5}
            />
          )}

          {/* Current Latest Point Marker */}
          {data.length > 0 && (
            <circle
              cx={width - padding}
              cy={height - padding - Math.max(0, Math.min(1, (data[data.length - 1] - config.min) / (config.max - config.min || 1))) * (height - padding * 2)}
              r={4}
              fill={config.color}
              stroke="#080C14"
              strokeWidth={2}
            />
          )}
        </svg>
      </div>
    </div>
  );
};
