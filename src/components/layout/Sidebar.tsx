import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Zap,
  Leaf,
  BrainCircuit,
  QrCode,
  FileSpreadsheet,
  Settings,
  HardDrive,
  Cpu,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export type NavView =
  | 'dashboard'
  | 'live-monitoring'
  | 'energy-analytics'
  | 'carbon-footprint'
  | 'machine-intelligence'
  | 'dpp'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onSelectView }) => {
  const { machineInfo, alerts } = useTelemetry();
  const unresolvedAlertCount = alerts.filter(a => !a.resolved).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-monitoring', label: 'Live Monitoring', icon: Activity, badge: 'Realtime' },
    { id: 'energy-analytics', label: 'Energy Analytics', icon: Zap },
    { id: 'carbon-footprint', label: 'Carbon Footprint', icon: Leaf },
    {
      id: 'machine-intelligence',
      label: 'Machine Intelligence',
      icon: BrainCircuit,
      alertCount: unresolvedAlertCount
    },
    { id: 'dpp', label: 'Digital Product Passport', icon: QrCode, badge: 'DPP' },
    { id: 'reports', label: 'Reports & Compliance', icon: FileSpreadsheet },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  return (
    <aside
      style={{
        width: 260,
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0
      }}
    >
      {/* Navigation List */}
      <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            padding: '4px 12px 8px 12px',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}
        >
          Primary Modules
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id as NavView)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                color: isActive ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '3px solid var(--cyan-primary)' : '3px solid transparent'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={17} color={isActive ? 'var(--cyan-primary)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </div>

              {item.alertCount ? (
                <span
                  style={{
                    backgroundColor: 'var(--red-dark)',
                    color: '#FCA5A5',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    border: '1px solid rgba(239, 68, 68, 0.4)'
                  }}
                >
                  {item.alertCount}
                </span>
              ) : item.badge ? (
                <span
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--cyan-primary)',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 4,
                    border: '1px solid rgba(6, 182, 212, 0.2)'
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Bottom Edge Hardware Info Card */}
      <div style={{ padding: '16px 12px' }}>
        <div
          style={{
            padding: 12,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={14} color="var(--emerald-primary)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                {machineInfo.controller}
              </span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {machineInfo.firmwareVersion}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--text-muted)' }}>Offline Buffer:</span>
            <span className="mono-num" style={{ color: 'var(--cyan-primary)', fontWeight: 600 }}>
              {machineInfo.offlineBufferCount} packets
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--text-muted)' }}>Core Temp:</span>
            <span className="mono-num" style={{ color: 'var(--text-secondary)' }}>
              {machineInfo.coreTempC || 41.2}°C
            </span>
          </div>

          {/* Honest Prototype Notice */}
          <div
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 4,
              border: '1px solid var(--border-subtle)',
              fontSize: 10,
              color: 'var(--text-muted)',
              lineHeight: 1.3
            }}
          >
            <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>
              Demonstration MVP
            </div>
            Hardware: 12V DC Motor Test Bench with L298N & ACS712.
          </div>
        </div>
      </div>
    </aside>
  );
};
