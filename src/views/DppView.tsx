import React, { useState } from 'react';
import {
  QrCode,
  ShieldCheck,
  Plus,
  Search,
  Eye,
  Award,
  Download,
  Share2,
  FileCheck,
  Layers,
  ArrowRight,
  FolderGit2,
  Clock,
  Zap,
  Leaf,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { DppCard } from '../components/dpp/DppCard';
import { PublicPassportModal } from '../components/dpp/PublicPassportModal';
import { Badge } from '../components/common/Badge';
import { DPPRecord } from '../types/dpp';
import { BatchInfo } from '../types/telemetry';

interface DppViewProps {
  onOpenBatchModal: () => void;
}

export const DppView: React.FC<DppViewProps> = ({ onOpenBatchModal }) => {
  const { dppList, batchList, createDppFromBatch, settings } = useTelemetry();
  const [activeTab, setActiveTab] = useState<'PASSPORTS' | 'BATCHES'>('PASSPORTS');
  const [selectedDpp, setSelectedDpp] = useState<DPPRecord | null>(dppList[0] || null);
  const [publicModalDpp, setPublicModalDpp] = useState<DPPRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const completedBatchesWithoutDpp = batchList.filter(
    b => b.status === 'COMPLETED' && !dppList.some(d => d.batchId === b.batchId)
  );

  const filteredDpps = dppList.filter(
    d =>
      d.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.passportId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateFromBatch = async (batchId: string) => {
    const dpp = await createDppFromBatch(batchId);
    if (dpp) {
      setSelectedDpp(dpp);
      setActiveTab('PASSPORTS');
    }
  };

  const handleInspectBatchDpp = (batchId: string) => {
    const matchingDpp = dppList.find(d => d.batchId === batchId);
    if (matchingDpp) {
      setSelectedDpp(matchingDpp);
      setActiveTab('PASSPORTS');
    }
  };

  return (
    <div className="view-content animate-fade-in">
      {/* Top Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1A184D 0%, #2A246B 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '20px 24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <QrCode size={26} color="var(--indigo-primary)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Digital Product Passport (DPP) & Traceability
                </h1>
                <span className="badge badge-indigo">Tamper-Evident Hash</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Transforms machine telemetry into verifiable, batch-level carbon certificates with SHA-256 genesis hashes and scannable buyer/auditor QR codes.
              </p>
            </div>
          </div>

          <button className="btn btn-primary" onClick={onOpenBatchModal} style={{ gap: 6 }}>
            <Plus size={15} /> Start Production Batch
          </button>
        </div>
      </div>

      {/* Module Sub-Navigation Bar */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('PASSPORTS')}
          className="btn btn-sm"
          style={{
            backgroundColor: activeTab === 'PASSPORTS' ? 'var(--indigo-primary)' : 'var(--bg-surface)',
            color: activeTab === 'PASSPORTS' ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: 12,
            border: 'none',
            gap: 6
          }}
        >
          <QrCode size={14} /> Digital Product Passports ({dppList.length})
        </button>

        <button
          onClick={() => setActiveTab('BATCHES')}
          className="btn btn-sm"
          style={{
            backgroundColor: activeTab === 'BATCHES' ? 'var(--indigo-primary)' : 'var(--bg-surface)',
            color: activeTab === 'BATCHES' ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: 12,
            border: 'none',
            gap: 6
          }}
        >
          <FolderGit2 size={14} /> Production Batch Registry ({batchList.length})
        </button>
      </div>

      {/* TAB 1: DIGITAL PRODUCT PASSPORTS */}
      {activeTab === 'PASSPORTS' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
          {/* Left: Passport Search & Explorer List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search by Product, SKU, or Batch ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Pending Batches Alert */}
              {completedBatchesWithoutDpp.length > 0 && (
                <div
                  style={{
                    padding: 10,
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px dashed var(--amber-primary)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 12,
                    fontSize: 11
                  }}
                >
                  <div style={{ color: 'var(--amber-primary)', fontWeight: 600, marginBottom: 4 }}>
                    Completed Batches Ready for DPP Issue:
                  </div>
                  {completedBatchesWithoutDpp.map(b => (
                    <div key={b.batchId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span className="mono" style={{ color: 'var(--text-primary)' }}>{b.batchId} ({b.productName})</span>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleGenerateFromBatch(b.batchId)}
                        style={{ padding: '2px 6px', fontSize: 10, backgroundColor: 'var(--amber-primary)', color: '#080C14' }}
                      >
                        Issue Passport
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Passports List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
                {filteredDpps.length > 0 ? (
                  filteredDpps.map(dpp => {
                    const isSelected = selectedDpp?.passportId === dpp.passportId;
                    return (
                      <div
                        key={dpp.passportId}
                        onClick={() => setSelectedDpp(dpp)}
                        style={{
                          padding: 14,
                          backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '1px solid var(--indigo-primary)' : '1px solid var(--border-subtle)',
                          boxShadow: isSelected ? '0 0 12px var(--indigo-glow)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan-primary)' }}>
                            {dpp.passportId}
                          </span>
                          <Badge variant="emerald">VERIFIED</Badge>
                        </div>

                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                          {dpp.productName}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11 }}>
                          <span className="mono" style={{ color: 'var(--text-muted)' }}>
                            Batch: {dpp.batchId} ({dpp.unitsProduced} pcs)
                          </span>
                          <span className="mono-num" style={{ color: 'var(--emerald-primary)', fontWeight: 700 }}>
                            {dpp.carbonIntensityKgPerUnit.toFixed(5)} kg/unit
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                    <QrCode size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    No Digital Product Passports issued yet.<br />
                    Complete an active batch to issue your first DPP.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Selected Passport Card Viewer */}
          <div>
            {selectedDpp ? (
              <DppCard
                dpp={selectedDpp}
                onOpenPublicView={() => setPublicModalDpp(selectedDpp)}
              />
            ) : (
              <div
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 400,
                  color: 'var(--text-muted)'
                }}
              >
                <FileCheck size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>Select a Digital Product Passport to inspect genesis metadata and QR verification code.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTION BATCH INVENTORY */}
      {activeTab === 'BATCHES' && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderGit2 size={16} color="var(--indigo-primary)" />
              <span className="card-title">Production Batch Traceability & Carbon Ledger</span>
            </div>
            <span className="badge badge-muted">{batchList.length} Total Batches</span>
          </div>

          <div className="table-container">
            <table className="table-industrial">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Machine ID</th>
                  <th>Product & SKU</th>
                  <th>Units</th>
                  <th>Operating / Idle Time</th>
                  <th>Total Energy (kWh)</th>
                  <th>Idle Energy (kWh)</th>
                  <th>Estimated CO₂e</th>
                  <th>Emission Factor</th>
                  <th>Status</th>
                  <th>Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batchList.map(b => {
                  const hasDpp = dppList.some(d => d.batchId === b.batchId);
                  const operatingHours = (b.activeDurationSec / 3600).toFixed(1);
                  const idleHours = (b.idleDurationSec / 3600).toFixed(1);

                  return (
                    <tr key={b.batchId}>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>
                        {b.batchId}
                      </td>
                      <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                        {b.machineId || 'Motor-01'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.productName}</div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.sku}</div>
                      </td>
                      <td className="mono-num">{b.unitsCompleted} / {b.unitsPlanned}</td>
                      <td style={{ fontSize: 11 }}>
                        <span style={{ color: 'var(--emerald-primary)' }}>{operatingHours}h act</span> / <span style={{ color: 'var(--amber-primary)' }}>{idleHours}h idle</span>
                      </td>
                      <td className="mono-num">{b.totalEnergyKWh.toFixed(4)}</td>
                      <td className="mono-num" style={{ color: 'var(--amber-primary)' }}>{b.idleEnergyKWh.toFixed(4)}</td>
                      <td className="mono-num" style={{ color: 'var(--cyan-primary)', fontWeight: 700 }}>
                        {b.totalCarbonKgCO2e.toFixed(4)} kg
                      </td>
                      <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {settings.gridEmissionFactor} kg/kWh
                      </td>
                      <td>
                        <Badge variant={b.status === 'ACTIVE' ? 'indigo' : b.status === 'COMPLETED' ? 'emerald' : 'muted'}>
                          {b.status}
                        </Badge>
                      </td>
                      <td>
                        {hasDpp ? (
                          <span className="badge badge-emerald">VERIFIED</span>
                        ) : (
                          <span className="badge badge-muted">PENDING</span>
                        )}
                      </td>
                      <td>
                        {hasDpp ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleInspectBatchDpp(b.batchId)}
                            style={{ fontSize: 11, padding: '3px 8px', gap: 4 }}
                          >
                            <Eye size={12} /> Inspect DPP
                          </button>
                        ) : b.status === 'COMPLETED' ? (
                          <button
                            className="btn btn-emerald btn-sm"
                            onClick={() => handleGenerateFromBatch(b.batchId)}
                            style={{ fontSize: 11, padding: '3px 8px', gap: 4 }}
                          >
                            <Sparkles size={12} /> Issue DPP
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>In Production</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Public Buyer / Auditor Modal */}
      {publicModalDpp && (
        <PublicPassportModal
          dpp={publicModalDpp}
          onClose={() => setPublicModalDpp(null)}
        />
      )}
    </div>
  );
};
