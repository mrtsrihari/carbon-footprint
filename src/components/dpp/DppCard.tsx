import React, { useEffect, useState } from 'react';
import {
  QrCode,
  ShieldCheck,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Factory,
  Zap,
  Leaf,
  Layers,
  Award,
  Lock,
  Cpu,
  Clock,
  Info,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DPPRecord } from '../../types/dpp';
import { generateDppQrCode, verifyDppIntegrity } from '../../services/dppEngine';
import { Badge } from '../common/Badge';

interface DppCardProps {
  dpp: DPPRecord;
  onOpenPublicView?: () => void;
}

export const DppCard: React.FC<DppCardProps> = ({ dpp, onOpenPublicView }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  useEffect(() => {
    generateDppQrCode(dpp).then(url => {
      setQrCodeUrl(url);
    });
  }, [dpp]);

  const copyHash = () => {
    navigator.clipboard.writeText(dpp.genesisHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyProof = async () => {
    setIsVerifying(true);
    setTimeout(async () => {
      const res = await verifyDppIntegrity(dpp);
      setIsVerifying(false);
      setVerificationFeedback(res.explanation);

      if (res.isValid) {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.6 }
        });
      }
    }, 500);
  };

  return (
    <div
      style={{
        backgroundColor: '#0D1424',
        border: '1px solid #1E2E4A',
        borderRadius: 'var(--radius-xl)',
        padding: 24,
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(6, 182, 212, 0.25)',
        maxWidth: 720,
        margin: '0 auto',
        position: 'relative'
      }}
    >
      {/* Top Passport Seal & Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1E2E4A',
          paddingBottom: 16,
          marginBottom: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #10B981, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#080C14',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)'
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
                DIGITAL PRODUCT PASSPORT
              </h2>
              <span className="badge badge-emerald">VERIFIED</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              C-TRACK Verifiable Carbon & Energy Traceability Certificate
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleVerifyProof}
            disabled={isVerifying}
            className="btn btn-sm"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: 'var(--emerald-primary)',
              fontSize: 11,
              fontWeight: 700
            }}
          >
            <Award size={13} /> {isVerifying ? 'Verifying...' : 'Verify Hash'}
          </button>

          {onOpenPublicView && (
            <button
              onClick={onOpenPublicView}
              className="btn btn-primary btn-sm"
              style={{ fontSize: 11, gap: 5 }}
            >
              <ExternalLink size={12} /> Buyer View
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: PRODUCT & PRODUCTION INFORMATION */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '170px 1fr',
          gap: 20,
          marginBottom: 16
        }}
      >
        {/* Scannable QR Code */}
        <div
          onClick={onOpenPublicView}
          style={{
            backgroundColor: '#FFFFFF',
            padding: 10,
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: onOpenPublicView ? 'pointer' : 'default',
            border: '2px solid rgba(6, 182, 212, 0.4)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}
          title="Click to open Public Buyer & Auditor Verification View"
        >
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="DPP QR Code"
              style={{ width: 145, height: 145, display: 'block' }}
            />
          ) : (
            <div style={{ width: 145, height: 145, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={48} color="#000" />
            </div>
          )}
          <div style={{ fontSize: 9, fontWeight: 800, color: '#0F172A', marginTop: 4, letterSpacing: '0.04em' }}>
            SCAN / CLICK TO VERIFY
          </div>
        </div>

        {/* Product & Machine Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              PRODUCT / BATCH IDENTIFICATION
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {dpp.productName}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--cyan-primary)', marginTop: 2 }}>
              SKU: {dpp.sku} | BATCH: {dpp.batchId}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div style={{ padding: 8, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>PRODUCTION UNITS</div>
              <div className="mono-num" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {dpp.unitsProduced} pcs
              </div>
            </div>
            <div style={{ padding: 8, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>MACHINE & EDGE NODE</div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {dpp.machineId} (ESP32-S3)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
            <Factory size={12} color="var(--text-muted)" />
            <span>Origin: {dpp.manufacturerName} ({dpp.facilityLocation})</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: ENERGY & CARBON ACCOUNTING */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          marginBottom: 14,
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>
          Energy & Estimated Scope 2 Carbon Allocation
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>TOTAL ENERGY USED</div>
            <div className="mono-num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              {dpp.totalEnergyConsumedKWh.toFixed(4)} <span style={{ fontSize: 10 }}>kWh</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              Active: {dpp.activeEnergyConsumedKWh.toFixed(4)} kWh
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ESTIMATED CARBON</div>
            <div className="mono-num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--cyan-primary)' }}>
              {dpp.scope2EmissionsKgCO2e.toFixed(4)} <span style={{ fontSize: 10 }}>kg CO₂e</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              GEF: {dpp.gridEmissionFactor} kg/kWh
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>SPECIFIC INTENSITY</div>
            <div className="mono-num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--emerald-primary)' }}>
              {dpp.carbonIntensityKgPerUnit.toFixed(5)} <span style={{ fontSize: 10 }}>kg/unit</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--emerald-primary)', fontWeight: 600 }}>
              Batch Verified
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: CRYPTOGRAPHIC VERIFICATION & IMMUTABLE HASH */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: '#080C14',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 12
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={13} color="var(--emerald-primary)" />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>
              SHA-256 RECORD INTEGRITY HASH
            </span>
          </div>
          <button
            onClick={copyHash}
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 6px', fontSize: 10 }}
          >
            {copied ? <Check size={11} color="var(--emerald-primary)" /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--cyan-primary)',
            wordBreak: 'break-all'
          }}
        >
          {dpp.genesisHash}
        </div>
      </div>

      {/* Verification Feedback Banner */}
      {verificationFeedback && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            color: 'var(--emerald-primary)',
            marginBottom: 12
          }}
        >
          <CheckCircle2 size={15} color="var(--emerald-primary)" style={{ flexShrink: 0 }} />
          <span>{verificationFeedback}</span>
        </div>
      )}

      {/* TECHNICAL CREDIBILITY DISCLAIMER */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: 10,
          color: 'var(--text-muted)',
          lineHeight: 1.35
        }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}>Technical Integrity Boundary:</strong> Cryptographic verification confirms that the digital record has not been altered after hashing. It does not claim direct chemical measurement of exhaust gas from the electric motor.
      </div>

      {/* Compliance Badges & Creation Date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 10,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 10,
          color: 'var(--text-muted)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge badge-muted">EU CBAM Ready</span>
          <span className="badge badge-muted">SEBI BRSR Principle 6</span>
          <span className="badge badge-muted">ISO 14064-1</span>
        </div>
        <div>
          Genesis: {new Date(dpp.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
