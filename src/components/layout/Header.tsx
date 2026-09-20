import React, { useState } from 'react';
import {
  Cpu,
  Usb,
  Radio,
  Wifi,
  Globe,
  RefreshCw,
  FolderGit2,
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { IngestionMethod } from '../../types/telemetry';

interface HeaderProps {
  onOpenBatchModal: () => void;
  onOpenDemoScenario?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBatchModal, onOpenDemoScenario }) => {
  const {
    machineInfo,
    currentPacket,
    connectionStatus,
    connectionError,
    sensorValidation,
    settings,
    activeBatch,
    setMode,
    setIngestionMethod,
    connectWebSerial,
    connectWebSocket
  } = useTelemetry();

  const isLive = settings.mode === 'LIVE';

  // Determine connection status text & color
  const getStatusDisplay = () => {
    if (!isLive) {
      return {
        label: 'DEMO MODE ACTIVE',
        color: 'amber',
        desc: 'Realistic hardware model (values clearly tagged [DEMO])'
      };
    }

    if (sensorValidation.isStale) {
      return {
        label: `ESP32 OFFLINE (${sensorValidation.lastPacketAgeSeconds}s AGO)`,
        color: 'red',
        desc: connectionError || 'No telemetry packet received recently'
      };
    }

    if (connectionStatus === 'CONNECTED') {
      return {
        label: `ESP32-S3 ONLINE (${settings.ingestionMethod})`,
        color: 'green',
        desc: 'Streaming real sensor telemetry'
      };
    }

    if (connectionStatus === 'CONNECTING') {
      return {
        label: 'CONNECTING...',
        color: 'amber',
        desc: 'Negotiating connection with ESP32-S3'
      };
    }

    return {
      label: 'ESP32 OFFLINE',
      color: 'red',
      desc: connectionError || 'Hardware link inactive'
    };
  };

  const statusInfo = getStatusDisplay();

  return (
    <header
      style={{
        height: 64,
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      {/* Left: Product Name & Active Machine Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #06B6D4, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
              color: '#080C14',
              letterSpacing: '-0.05em'
            }}
          >
            CT
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: 'var(--text-primary)'
                }}
              >
                C-TRACK
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--cyan-primary)'
                }}
              >
                Machine Carbon Intelligence
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Edge IoT & Scope 2 Energy Traceability
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)' }} />

        {/* Machine Node Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--bg-surface)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <Cpu size={14} color="var(--cyan-primary)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {machineInfo.id}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ({machineInfo.controller})
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Mode Toggle, Channel Selector, Connection Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Judge Demo Scenario Button */}
        {onOpenDemoScenario && (
          <button
            onClick={onOpenDemoScenario}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: 'var(--cyan-border)',
              color: 'var(--cyan-primary)',
              fontWeight: 600,
              fontSize: 11,
              padding: '4px 10px',
              gap: 5
            }}
          >
            <SlidersHorizontal size={13} color="var(--cyan-primary)" />
            Run Simulation Scenarios
          </button>
        )}

        {/* Active Batch Quick Status */}
        {activeBatch ? (
          <div
            onClick={onOpenBatchModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
            title="Click to view active production batch details"
          >
            <FolderGit2 size={13} color="var(--indigo-primary)" />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--indigo-primary)' }}>
              BATCH: {activeBatch.batchId}
            </span>
            <span className="mono-num" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              ({activeBatch.unitsCompleted}/{activeBatch.unitsPlanned})
            </span>
          </div>
        ) : (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenBatchModal}
            style={{ gap: 4 }}
          >
            <Plus size={13} />
            New Batch
          </button>
        )}

        {/* PRIMARY TOGGLE: LIVE SENSOR vs DEMO MODE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: 2
          }}
        >
          <button
            onClick={() => setMode('LIVE')}
            className="btn btn-sm"
            style={{
              backgroundColor: isLive ? 'var(--emerald-primary)' : 'transparent',
              color: isLive ? '#080C14' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              gap: 4
            }}
          >
            <span className={`status-dot ${isLive ? 'green' : 'off'}`} style={{ width: 6, height: 6 }} />
            LIVE SENSOR
          </button>

          <button
            onClick={() => setMode('DEMO')}
            className="btn btn-sm"
            style={{
              backgroundColor: !isLive ? 'var(--amber-primary)' : 'transparent',
              color: !isLive ? '#080C14' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              gap: 4
            }}
          >
            <span className={`status-dot ${!isLive ? 'amber' : 'off'}`} style={{ width: 6, height: 6 }} />
            DEMO MODE
          </button>
        </div>

        {/* Live Channel Selector (when in LIVE mode) */}
        {isLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              className="input-field"
              value={settings.ingestionMethod}
              onChange={e => setIngestionMethod(e.target.value as IngestionMethod)}
              style={{
                width: 'auto',
                fontSize: 11,
                padding: '4px 8px',
                borderColor: 'var(--border-medium)',
                height: 30
              }}
            >
              <option value="WEB_SERIAL">Web Serial (USB)</option>
              <option value="WEBSOCKET">WebSocket (ws://)</option>
              <option value="HTTP_REST">HTTP REST (POST)</option>
            </select>

            {settings.ingestionMethod === 'WEB_SERIAL' && connectionStatus !== 'CONNECTED' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={connectWebSerial}
                style={{ fontSize: 11, padding: '3px 8px', gap: 4 }}
              >
                <Usb size={12} /> Connect USB
              </button>
            )}

            {settings.ingestionMethod === 'WEBSOCKET' && connectionStatus !== 'CONNECTED' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={connectWebSocket}
                style={{ fontSize: 11, padding: '3px 8px', gap: 4 }}
              >
                <Wifi size={12} /> Connect WS
              </button>
            )}
          </div>
        )}

        {/* Hardware Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'var(--bg-surface)',
            border: `1px solid ${statusInfo.color === 'green' ? 'rgba(16, 185, 129, 0.3)' : statusInfo.color === 'red' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            padding: '4px 12px',
            borderRadius: 'var(--radius-md)'
          }}
          title={statusInfo.desc}
        >
          <span className={`status-dot ${statusInfo.color}`} />
          <span
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: statusInfo.color === 'green' ? 'var(--emerald-primary)' : statusInfo.color === 'red' ? 'var(--red-primary)' : 'var(--amber-primary)'
            }}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>
    </header>
  );
};
