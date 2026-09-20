import React from 'react';

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  color = '#06B6D4',
  height = 36,
  width = 120
}) => {
  if (!data || data.length < 2) {
    return <div style={{ height, width }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 4;
  const h = height - padding * 2;
  const w = width - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * w;
    const y = height - padding - ((val - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${padding + w},${height} L ${padding},${height} Z`;

  const gradientId = `spark-grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
