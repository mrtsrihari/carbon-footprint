import React from 'react';
import { MiniSparkline } from './MiniSparkline';
import { Badge } from './Badge';
import { AlertCircle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  subtitle?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  badge?: {
    text: string;
    variant: 'cyan' | 'emerald' | 'amber' | 'red' | 'indigo' | 'muted' | 'simulated';
  };
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'red' | 'indigo';
  isSimulated?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  subtitle,
  sparklineData,
  sparklineColor = '#06B6D4',
  badge,
  accentColor = 'cyan',
  isSimulated = false,
  isError = false,
  errorMessage,
  onClick
}) => {
  return (
    <div
      className={`card ${onClick ? 'cursor-pointer hover:border-highlight' : ''}`}
      onClick={onClick}
      style={{
        borderLeft: isError
          ? '3px solid var(--red-primary)'
          : `3px solid var(--${accentColor}-primary)`,
        position: 'relative'
      }}
    >
      <div className="card-header" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: isError ? 'var(--red-primary)' : `var(--${accentColor}-primary)`, display: 'flex' }}>
            {icon}
          </div>
          <span className="card-title" style={{ margin: 0, fontSize: 12 }}>
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isSimulated && (
            <span
              className="badge"
              style={{
                fontSize: 9,
                fontWeight: 700,
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--amber-primary)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '1px 5px'
              }}
            >
              SIMULATED
            </span>
          )}

          {badge && !isSimulated && (
            <Badge variant={badge.variant}>
              {badge.text}
            </Badge>
          )}
        </div>
      </div>

      {isError ? (
        <div style={{ padding: '6px 0', minHeight: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red-primary)', fontSize: 13, fontWeight: 700 }}>
            <AlertCircle size={15} />
            <span>{errorMessage || 'SENSOR ERROR'}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Verify physical wiring on ESP32-S3 test bench
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                className="mono-num"
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.1
                }}
              >
                {value}
              </span>
              {unit && (
                <span
                  className="mono"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-muted)'
                  }}
                >
                  {unit}
                </span>
              )}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  marginTop: 6
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {sparklineData && sparklineData.length > 1 && (
            <div style={{ paddingBottom: 4 }}>
              <MiniSparkline data={sparklineData} color={sparklineColor} width={90} height={32} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
