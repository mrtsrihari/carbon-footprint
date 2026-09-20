import React from 'react';
import { StateTimeSegment, MachineState } from '../../types/telemetry';

interface StateTimelineProps {
  segments: StateTimeSegment[];
  height?: number;
}

export const StateTimeline: React.FC<StateTimelineProps> = ({ segments, height = 36 }) => {
  const totalDuration = segments.reduce((sum, s) => sum + s.durationSeconds, 0) || 1;

  const getStateColor = (state: MachineState) => {
    switch (state) {
      case 'ACTIVE':
        return { bg: 'var(--emerald-primary)', text: '#080C14', label: 'ACTIVE' };
      case 'IDLE':
        return { bg: 'var(--amber-primary)', text: '#080C14', label: 'IDLE' };
      case 'ABNORMAL':
        return { bg: 'var(--red-primary)', text: '#FFFFFF', label: 'ABNORMAL' };
      case 'WARMUP':
        return { bg: 'var(--cyan-primary)', text: '#080C14', label: 'WARMUP' };
      default:
        return { bg: '#334155', text: '#94A3B8', label: 'OFF' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Visual Ribbon */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          height,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          border: '1px solid var(--border-medium)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        {segments.map((seg, idx) => {
          const widthPercent = Math.max(3, (seg.durationSeconds / totalDuration) * 100);
          const colorInfo = getStateColor(seg.state);

          return (
            <div
              key={seg.id || idx}
              style={{
                width: `${widthPercent}%`,
                height: '100%',
                backgroundColor: colorInfo.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid rgba(0,0,0,0.3)',
                position: 'relative',
                transition: 'width 0.3s ease',
                cursor: 'pointer'
              }}
              title={`${colorInfo.label}: ${seg.durationSeconds}s (${seg.averagePowerW}W avg)`}
            >
              {widthPercent > 8 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: colorInfo.text,
                    letterSpacing: '0.04em'
                  }}
                >
                  {colorInfo.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend & Summary Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--emerald-primary)' }} />
            ACTIVE (Productive)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--amber-primary)' }} />
            IDLE (Waste Leak)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--red-primary)' }} />
            ABNORMAL (Excursion)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#334155' }} />
            OFF (Unpowered)
          </span>
        </div>

        <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Timeline Span: {Math.round(totalDuration)}s ({segments.length} transitions)
        </div>
      </div>
    </div>
  );
};
