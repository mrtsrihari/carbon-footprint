import React from 'react';

interface GaugeDialProps {
  value: number; // Current value (e.g. 10.5W)
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  idleThreshold?: number; // e.g. 4.5W
  overloadThreshold?: number; // e.g. 20.0W
  size?: number;
}

export const GaugeDial: React.FC<GaugeDialProps> = ({
  value,
  min = 0,
  max = 25,
  unit = 'W',
  label = 'Real-time Power',
  idleThreshold = 4.5,
  overloadThreshold = 20,
  size = 180
}) => {
  const clamped = Math.max(min, Math.min(max, value));
  const percent = (clamped - min) / (max - min);

  // Angle from -120 to +120 deg (240 deg total arc)
  const startAngle = -120;
  const endAngle = 120;
  const currentAngle = startAngle + percent * (endAngle - startAngle);

  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Arc path generator
  const getArcPoint = (angleDeg: number, r: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };

  const createArc = (startDeg: number, endDeg: number, r: number) => {
    const p1 = getArcPoint(startDeg, r);
    const p2 = getArcPoint(endDeg, r);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
  };

  const trackPath = createArc(startAngle, endAngle, radius);
  const activePath = percent > 0 ? createArc(startAngle, currentAngle, radius) : '';

  // Needle tip
  const needlePoint = getArcPoint(currentAngle, radius - 10);

  // Color logic
  let dialColor = '#10B981'; // Green for normal running
  if (value < 0.5) dialColor = '#64748B'; // Off
  else if (value < idleThreshold) dialColor = '#F59E0B'; // Idle
  else if (value > overloadThreshold) dialColor = '#EF4444'; // Overload

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`}>
        <defs>
          <filter id="glow-needle" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={dialColor} floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Background Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#1E293B"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Zone Markers: Idle zone (Amber), Active zone (Emerald), Overload zone (Red) */}
        {/* Active Value Arc */}
        {activePath && (
          <path
            d={activePath}
            fill="none"
            stroke={dialColor}
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#glow-needle)"
          />
        )}

        {/* Needle Line */}
        <line
          x1={cx}
          y1={cy}
          x2={needlePoint.x}
          y2={needlePoint.y}
          stroke={dialColor}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Center Hub */}
        <circle cx={cx} cy={cy} r="6" fill="#0D131F" stroke={dialColor} strokeWidth="2.5" />
      </svg>

      {/* Numerical readout in center bottom */}
      <div style={{ marginTop: -32, textAlign: 'center' }}>
        <div className="mono-num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          {value.toFixed(1)} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unit}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </div>
  );
};
