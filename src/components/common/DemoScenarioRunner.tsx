import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Leaf,
  AlertTriangle,
  QrCode,
  FileSpreadsheet,
  Cpu,
  Sparkles,
  X
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { NavView } from '../layout/Sidebar';

interface DemoScenarioRunnerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: NavView) => void;
}

export const DemoScenarioRunner: React.FC<DemoScenarioRunnerProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const {
    setMode,
    setMotorLoadPreset,
    setFaultInjection,
    startNewBatch,
    completeActiveBatch,
    activeBatch,
    dppList
  } = useTelemetry();

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [stepTimer, setStepTimer] = useState(0);

  const scenarioSteps = [
    {
      id: 0,
      title: '1. Machine Startup & Inrush Suppression',
      subtitle: 'Cold start of 12V DC motor test bench',
      narrative: 'The ESP32-S3 detects an initial startup current transient (~1.6A). The Edge Rule Engine filters the inductive surge as WARMUP, preventing false overload alarms.',
      viewTarget: 'live-monitoring' as NavView,
      action: () => {
        setMode('DEMO');
        setFaultInjection('NONE');
        setMotorLoadPreset('NORMAL');
      },
      durationSec: 6
    },
    {
      id: 1,
      title: '2. Productive Active Manufacturing Run',
      subtitle: 'Torque under load: 12.1V × 0.85A = 10.3W',
      narrative: 'Motor operates in normal manufacturing regime (Power >= 4.5W). Telemetry engine classifies state as ACTIVE. Productive kWh accumulates into batch ledger.',
      viewTarget: 'dashboard' as NavView,
      action: () => {
        setMotorLoadPreset('NORMAL');
        if (!activeBatch) {
          startNewBatch('M12 High-Tensile Steel Fastener', 'SKU-HTF-M12', 250);
        }
      },
      durationSec: 8
    },
    {
      id: 2,
      title: '3. Operator Break: Idle Waste Standby Leak',
      subtitle: 'Zero mechanical load: 12.0V × 0.24A = 2.8W',
      narrative: 'Workpiece finished, but motor left spinning with zero mechanical load (Power < 4.5W). C-TRACK immediately flags "Hidden Idle Energy Leak Detected" and quantifies financial loss.',
      viewTarget: 'energy-analytics' as NavView,
      action: () => {
        setMotorLoadPreset('IDLE');
      },
      durationSec: 8
    },
    {
      id: 3,
      title: '4. Transparent Carbon Estimation',
      subtitle: 'Carbon (kg CO₂e) = Energy (kWh) × Emission Factor',
      narrative: 'System estimates Scope 2 emissions without claiming chemical exhaust measurement. Idle carbon penalty is segregated from productive work for ESG optimization.',
      viewTarget: 'carbon-footprint' as NavView,
      action: () => {
        setMotorLoadPreset('NORMAL');
      },
      durationSec: 8
    },
    {
      id: 4,
      title: '5. Batch Completion & SHA-256 Hashing',
      subtitle: 'Deterministic canonical serialization',
      narrative: 'Production batch completes. The edge gateway creates a deterministic key-sorted JSON payload and digests it into an immutable SHA-256 genesis hash for tamper-evidence.',
      viewTarget: 'dpp' as NavView,
      action: async () => {
        if (activeBatch) {
          await completeActiveBatch();
        }
      },
      durationSec: 7
    },
    {
      id: 5,
      title: '6. Digital Product Passport & QR Issuance',
      subtitle: 'Verifiable export certificate for global buyers',
      narrative: 'Digital Product Passport is generated with an interactive QR code. Scanning or clicking opens the public buyer/auditor verification view.',
      viewTarget: 'dpp' as NavView,
      action: () => {},
      durationSec: 8
    },
    {
      id: 6,
      title: '7. CBAM & Sustainability Reporting Dossier',
      subtitle: 'Data collection & audit preparation support',
      narrative: 'C-TRACK compiles an audit-ready compliance statement with Scope 2 breakdown, batch certificates, and cryptographic signatures (ready to print or export as CSV).',
      viewTarget: 'reports' as NavView,
      action: () => {},
      durationSec: 8
    }
  ];

  const currentStepData = scenarioSteps[currentStep];

  // Step Timer effect
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setStepTimer(prev => {
        if (prev >= currentStepData.durationSec) {
          // Advance to next step
          if (currentStep < scenarioSteps.length - 1) {
            goToStep(currentStep + 1);
          } else {
            setIsPlaying(false);
          }
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, currentStep, currentStepData.durationSec]);

  const goToStep = (stepIdx: number) => {
    setCurrentStep(stepIdx);
    setStepTimer(0);
    const target = scenarioSteps[stepIdx];
    target.action();
    onNavigate(target.viewTarget);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 460,
        backgroundColor: 'rgba(10, 15, 29, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(6, 182, 212, 0.4)',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(6, 182, 212, 0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: 20,
        zIndex: 1000,
        color: 'var(--text-primary)'
      }}
      className="animate-fade-in"
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="var(--cyan-primary)" />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            HACKATHON DEMO SCENARIO TOUR
          </span>
          <span className="badge badge-cyan" style={{ fontSize: 10 }}>
            STEP {currentStep + 1} OF {scenarioSteps.length}
          </span>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${scenarioSteps.length}, 1fr)`,
          gap: 4,
          marginBottom: 14
        }}
      >
        {scenarioSteps.map((step, idx) => (
          <div
            key={step.id}
            onClick={() => goToStep(idx)}
            style={{
              height: 4,
              backgroundColor: idx < currentStep
                ? 'var(--emerald-primary)'
                : idx === currentStep
                ? 'var(--cyan-primary)'
                : 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Step Content */}
      <div style={{ backgroundColor: 'var(--bg-surface)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cyan-primary)' }}>
          {currentStepData.title}
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {currentStepData.subtitle}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '8px 0 0 0', lineHeight: 1.45 }}>
          {currentStepData.narrative}
        </p>
      </div>

      {/* Controller Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, gap: 4 }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            {isPlaying ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => goToStep(0)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, gap: 4 }}
          >
            <RotateCcw size={12} /> Restart
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            disabled={currentStep === 0}
            onClick={() => goToStep(currentStep - 1)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11 }}
          >
            Previous
          </button>
          <button
            onClick={() => {
              if (currentStep < scenarioSteps.length - 1) {
                goToStep(currentStep + 1);
              } else {
                onClose();
              }
            }}
            className="btn btn-primary btn-sm"
            style={{ fontSize: 11, gap: 4 }}
          >
            {currentStep < scenarioSteps.length - 1 ? 'Next Step' : 'Finish Tour'}
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
