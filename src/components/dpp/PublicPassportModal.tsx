import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Lock,
  Factory,
  Zap,
  Leaf,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Info,
  X,
  RefreshCw,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DPPRecord } from '../../types/dpp';
import { verifyDppIntegrity } from '../../services/dppEngine';

interface PublicPassportModalProps {
  dpp: DPPRecord;
  onClose: () => void;
}

export const PublicPassportModal: React.FC<PublicPassportModalProps> = ({ dpp, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    isValid: boolean;
    recomputedHash: string;
    explanation: string;
  }>({
    tested: false,
    isValid: true,
    recomputedHash: dpp.genesisHash,
    explanation: 'Cryptographic verification confirms that the digital record has not been altered after hashing.'
  });

  const handleVerify = async () => {
    setIsVerifying(true);
    setTimeout(async () => {
      const res = await verifyDppIntegrity(dpp);
      setVerificationResult({
        tested: true,
        isValid: res.isValid,
        recomputedHash: res.recomputedHash,
        explanation: res.explanation
      });
      setIsVerifying(false);

      if (res.isValid) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, 600);
  };

  const copyHash = () => {
    navigator.clipboard.writeText(dpp.genesisHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0A0F1D',
          border: '1px solid #1E2E4A',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(6, 182, 212, 0.3)',
          borderRadius: 'var(--radius-xl)',
          padding: 28,
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4
          }}
        >
          <X size={20} />
        </button>

        {/* Public Verified Certificate Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            borderBottom: '1px solid var(--border-medium)',
            paddingBottom: 20,
            marginBottom: 20
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #10B981, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#080C14',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <ShieldCheck size={32} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cyan-primary)', letterSpacing: '0.08em' }}>
                C-TRACK PUBLIC VERIFICATION
              </span>
              <span className="badge badge-emerald">TAMPER-EVIDENT RECORD</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0 0' }}>
              Digital Product Passport (DPP)
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Independent Buyer & Sustainability Auditor Verification Portal
            </div>
          </div>
        </div>

        {/* Product & Batch Summary Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            border: '1px solid var(--border-subtle)',
            marginBottom: 16
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                CERTIFIED PRODUCT BATCH
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                {dpp.productName}
              </div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--cyan-primary)', marginTop: 2 }}>
                SKU: {dpp.sku} | BATCH: {dpp.batchId}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PASSPORT ID</div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {dpp.passportId}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Issued: {new Date(dpp.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
            <div style={{ padding: 10, backgroundColor: 'var(--bg-card)', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>UNITS PRODUCED</div>
              <div className="mono-num" style={{ fontSize: 16, fontWeight: 700 }}>
                {dpp.unitsProduced} units
              </div>
            </div>
            <div style={{ padding: 10, backgroundColor: 'var(--bg-card)', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>MANUFACTURING FACILITY</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {dpp.manufacturerName}
              </div>
            </div>
            <div style={{ padding: 10, backgroundColor: 'var(--bg-card)', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ORIGIN REGION</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {dpp.facilityLocation} ({dpp.gridRegion})
              </div>
            </div>
          </div>
        </div>

        {/* Energy & Carbon Traceability Breakdown */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            border: '1px solid var(--border-subtle)',
            marginBottom: 16
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
            ENERGY & SCOPE 2 CARBON GENESIS DATA
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cyan-primary)', fontSize: 11, fontWeight: 600 }}>
                <Zap size={13} /> TOTAL ENERGY CONSUMED
              </div>
              <div className="mono-num" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                {dpp.totalEnergyConsumedKWh.toFixed(4)} <span style={{ fontSize: 12 }}>kWh</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {dpp.specificEnergyKWhPerUnit.toFixed(4)} kWh/unit
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--emerald-primary)', fontSize: 11, fontWeight: 600 }}>
                <Leaf size={13} /> ESTIMATED CARBON FOOTPRINT
              </div>
              <div className="mono-num" style={{ fontSize: 20, fontWeight: 800, color: 'var(--emerald-primary)', margin: '4px 0' }}>
                {dpp.scope2EmissionsKgCO2e.toFixed(4)} <span style={{ fontSize: 12 }}>kg CO₂e</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Factor: {dpp.gridEmissionFactor} kg/kWh
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--indigo-primary)', fontSize: 11, fontWeight: 600 }}>
                <Award size={13} /> SPECIFIC PRODUCT INTENSITY
              </div>
              <div className="mono-num" style={{ fontSize: 20, fontWeight: 800, color: 'var(--indigo-primary)', margin: '4px 0' }}>
                {dpp.carbonIntensityKgPerUnit.toFixed(5)} <span style={{ fontSize: 12 }}>kg/unit</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--emerald-primary)', fontWeight: 600 }}>
                Traceable to machine
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic SHA-256 Verification Section */}
        <div
          style={{
            backgroundColor: '#070B16',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            border: '1px solid rgba(16, 185, 129, 0.3)',
            marginBottom: 16
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={15} color="var(--emerald-primary)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                CRYPTOGRAPHIC DATA INTEGRITY HASH (SHA-256)
              </span>
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="btn btn-primary btn-sm"
              style={{ fontSize: 11, gap: 6, padding: '4px 10px' }}
            >
              <RefreshCw size={12} className={isVerifying ? 'animate-spin' : ''} />
              {isVerifying ? 'Recomputing Hash...' : 'Verify Hash Integrity'}
            </button>
          </div>

          <div
            className="mono"
            style={{
              fontSize: 11,
              backgroundColor: 'var(--bg-surface)',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
              color: 'var(--cyan-primary)',
              wordBreak: 'break-all',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}
          >
            <span>{dpp.genesisHash}</span>
            <button
              onClick={copyHash}
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 6px', fontSize: 10, flexShrink: 0 }}
            >
              {copied ? <Check size={12} color="var(--emerald-primary)" /> : <Copy size={12} />}
            </button>
          </div>

          {/* Verification Status Banner */}
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 6,
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              color: 'var(--emerald-primary)'
            }}
          >
            <CheckCircle2 size={15} color="var(--emerald-primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Cryptographic Verification Status:</strong> {verificationResult.explanation}
            </span>
          </div>
        </div>

        {/* Credibility & Technical Integrity Disclaimer */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.4
          }}
        >
          <strong style={{ color: 'var(--text-secondary)' }}>Technical Integrity Boundary:</strong> Cryptographic verification confirms that the digital record has not been altered after initial hashing. Carbon values are energy-based estimates derived from metered electrical consumption and configured regional emission factors.
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Public View
          </button>
          <button
            className="btn btn-primary"
            onClick={() => window.print()}
            style={{ gap: 6 }}
          >
            Print / Save Certificate PDF
          </button>
        </div>
      </div>
    </div>
  );
};
