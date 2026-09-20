import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Building,
  Calendar,
  FileCheck2,
  Layers,
  Sparkles,
  Award,
  Info,
  CheckCircle2,
  FolderGit2,
  Globe
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { generateComplianceReport, exportTelemetryCsv, GeneratedReport } from '../services/reportEngine';
import { ReportConfig } from '../types/dpp';
import { GRID_EMISSION_PRESETS } from '../services/carbonEngine';

export const ReportsView: React.FC = () => {
  const { summary, batchList, dppList, settings, machineInfo } = useTelemetry();

  const [config, setConfig] = useState<ReportConfig>({
    reportType: 'CBAM_EMISSIONS',
    title: 'EU CBAM / Sustainability Reporting Support Package',
    period: 'TODAY',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    includeIdleBreakdown: true,
    includeDppList: true,
    generatedBy: 'Operations & Sustainability Engineering Team',
    companyName: 'Apex Precision Engineering MSME Ltd.',
    facility: 'Unit 4B, Industrial Micro-Cluster',
    reportingStandard: 'CBAM / Sustainability Reporting Support'
  });

  const [activeReport, setActiveReport] = useState<GeneratedReport | null>(null);

  // Generate initial report
  React.useEffect(() => {
    generateComplianceReport(
      config,
      summary,
      batchList,
      dppList,
      machineInfo.id,
      GRID_EMISSION_PRESETS[settings.gridRegion].name,
      settings.gridEmissionFactor
    ).then(rep => setActiveReport(rep));
  }, [summary, batchList, dppList, settings]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const report = await generateComplianceReport(
      config,
      summary,
      batchList,
      dppList,
      machineInfo.id,
      GRID_EMISSION_PRESETS[settings.gridRegion].name,
      settings.gridEmissionFactor
    );
    setActiveReport(report);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    exportTelemetryCsv(batchList, dppList);
  };

  return (
    <div className="view-content animate-fade-in">
      {/* Top Controls Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #161B2E 0%, #1F2847 100%)',
          border: '1px solid var(--border-medium)',
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
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileSpreadsheet size={26} color="var(--cyan-primary)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Sustainability Reporting & Traceability Support
                </h1>
                <span className="badge badge-cyan">CBAM / Sustainability Reporting Support</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Designed to support carbon data collection, machine traceability and audit preparation workflows for global supply chains.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCsv} style={{ gap: 6 }}>
              <Download size={14} /> Export CSV
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint} style={{ gap: 6 }}>
              <Printer size={14} /> Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Configuration Builder + Printable Report Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
        {/* Left: Report Configuration Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <span className="card-title">Report Parameters</span>
            <span className="badge badge-muted">Config</span>
          </div>

          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Compliance & Reporting Template
              </label>
              <select
                className="input-field"
                value={config.reportType}
                onChange={e => {
                  const val = e.target.value as any;
                  let title = 'EU CBAM / Sustainability Reporting Support Package';
                  let standard = 'EU CBAM Transitional Methodology';
                  if (val === 'BRSR_SCOPE2') {
                    title = 'SEBI BRSR Principle 6 Energy & Scope 2 Emissions Statement';
                    standard = 'SEBI BRSR Principle 6';
                  } else if (val === 'ISO_14064_ENERGY') {
                    title = 'ISO 14067 / ISO 14064-1 Pre-Audit Carbon Verification Dossier';
                    standard = 'ISO 14067 / ISO 14064-1';
                  } else if (val === 'EXECUTIVE_SUMMARY') {
                    title = 'Executive Factory Energy & Idle Loss Optimization Summary';
                    standard = 'Internal Operations Optimization';
                  }
                  setConfig({ ...config, reportType: val, title, reportingStandard: standard });
                }}
              >
                <option value="CBAM_EMISSIONS">CBAM / Sustainability Reporting Support</option>
                <option value="BRSR_SCOPE2">SEBI BRSR (Principle 6 - Energy & Scope 2)</option>
                <option value="ISO_14064_ENERGY">ISO 14067 / ISO 14064-1 Pre-Audit Support</option>
                <option value="EXECUTIVE_SUMMARY">Executive Energy & Idle Carbon ROI</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Organization / Facility Name
              </label>
              <input
                type="text"
                className="input-field"
                value={config.companyName}
                onChange={e => setConfig({ ...config, companyName: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Facility Location
              </label>
              <input
                type="text"
                className="input-field"
                value={config.facility}
                onChange={e => setConfig({ ...config, facility: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Reporting Period
              </label>
              <select
                className="input-field"
                value={config.period}
                onChange={e => setConfig({ ...config, period: e.target.value as any })}
              >
                <option value="TODAY">Today (Real-time Continuous Shift)</option>
                <option value="THIS_WEEK">This Week (Aggregated)</option>
                <option value="THIS_MONTH">This Month (Monthly Close)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.includeIdleBreakdown}
                  onChange={e => setConfig({ ...config, includeIdleBreakdown: e.target.checked })}
                  style={{ accentColor: 'var(--cyan-primary)' }}
                />
                <span>Include Segregated Idle Waste Leakage</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.includeDppList}
                  onChange={e => setConfig({ ...config, includeDppList: e.target.checked })}
                  style={{ accentColor: 'var(--cyan-primary)' }}
                />
                <span>Attach Batch Digital Product Passports (DPP)</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8, gap: 6 }}>
              <Sparkles size={14} /> Update Formatted Report
            </button>
          </form>

          {/* Future-Ready Architecture Box */}
          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: 11,
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--cyan-primary)', marginBottom: 4 }}>
              FUTURE-READY EXTENSIBILITY:
            </div>
            <ul style={{ margin: '0 0 0 14px', padding: 0, lineHeight: 1.4 }}>
              <li>ISO 14067 product carbon footprint exports</li>
              <li>Buyer ESG & customer sustainability documentation</li>
              <li>Statutory pre-audit evidentiary packet builder</li>
            </ul>
          </div>
        </div>

        {/* Right: Formatted Report Document */}
        {activeReport && (
          <div
            className="card"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: 32,
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-elevated)'
            }}
          >
            {/* Printable Document Header */}
            <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        backgroundColor: '#0F172A',
                        color: '#FFFFFF',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}
                    >
                      C-TRACK
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                      CARBON & ENERGY TRACEABILITY DOSSIER
                    </span>
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 8, color: '#0F172A' }}>
                    {activeReport.config.title}
                  </h2>
                </div>

                <div style={{ textAlign: 'right', fontSize: 11, color: '#64748B' }}>
                  <div><strong>Report ID:</strong> {activeReport.reportId}</div>
                  <div><strong>Date:</strong> {activeReport.generatedAt}</div>
                  <div><strong>Framework:</strong> {activeReport.reportingStandard}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14, fontSize: 12, color: '#334155' }}>
                <div><strong>Reporting Entity:</strong> {activeReport.config.companyName}</div>
                <div><strong>Facility:</strong> {activeReport.config.facility}</div>
                <div><strong>Machine Boundary:</strong> {activeReport.machineId} (12V DC Motor / ESP32-S3)</div>
                <div><strong>Emission Standard:</strong> {settings.gridRegion} ({settings.gridEmissionFactor} kg CO₂e/kWh)</div>
              </div>
            </div>

            {/* Scope 2 Energy & Carbon Table */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: 8 }}>
                1. Measured Electrical Energy & Scope 2 GHG Estimation
              </h4>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                    <th style={{ padding: '8px 12px' }}>Parameter</th>
                    <th style={{ padding: '8px 12px' }}>Metered Value</th>
                    <th style={{ padding: '8px 12px' }}>Unit</th>
                    <th style={{ padding: '8px 12px' }}>Classification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px' }}>Total Energy Consumed</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>{activeReport.summary.todayTotalEnergyKWh.toFixed(4)}</td>
                    <td style={{ padding: '8px 12px' }}>kWh</td>
                    <td style={{ padding: '8px 12px' }}>Gross Machine Demand</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px' }}>Productive Mechanical Energy</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{activeReport.summary.todayActiveEnergyKWh.toFixed(4)}</td>
                    <td style={{ padding: '8px 12px' }}>kWh</td>
                    <td style={{ padding: '8px 12px' }}>Active Manufacturing Work</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px' }}>Segregated Idle Standby Energy</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#D97706' }}>{activeReport.summary.todayIdleEnergyKWh.toFixed(4)}</td>
                    <td style={{ padding: '8px 12px' }}>kWh</td>
                    <td style={{ padding: '8px 12px' }}>Parasitic Standby Loss</td>
                  </tr>
                  <tr style={{ borderBottom: '2px solid #0F172A', backgroundColor: '#F8FAFC' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800 }}>Estimated Scope 2 GHG Emissions</td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0284C7' }}>{activeReport.summary.todayCarbonKgCO2e.toFixed(4)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 800 }}>kg CO₂e</td>
                    <td style={{ padding: '10px 12px', fontWeight: 800 }}>Energy-Based Estimate</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Attached Production Batches */}
            {config.includeDppList && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: 8 }}>
                  2. Production Batch Traceability & Embedded Carbon Passports
                </h4>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                      <th style={{ padding: '6px 10px' }}>Batch ID</th>
                      <th style={{ padding: '6px 10px' }}>Product & SKU</th>
                      <th style={{ padding: '6px 10px' }}>Units</th>
                      <th style={{ padding: '6px 10px' }}>Batch Energy (kWh)</th>
                      <th style={{ padding: '6px 10px' }}>Carbon (kg CO₂e)</th>
                      <th style={{ padding: '6px 10px' }}>Carbon/Unit</th>
                      <th style={{ padding: '6px 10px' }}>Verification Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReport.batches.map(b => {
                      const dpp = dppList.find(d => d.batchId === b.batchId);
                      return (
                        <tr key={b.batchId} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 700 }}>{b.batchId}</td>
                          <td style={{ padding: '6px 10px' }}>{b.productName} ({b.sku})</td>
                          <td style={{ padding: '6px 10px' }}>{b.unitsCompleted}</td>
                          <td style={{ padding: '6px 10px' }}>{b.totalEnergyKWh.toFixed(4)}</td>
                          <td style={{ padding: '6px 10px', color: '#0284C7', fontWeight: 600 }}>{b.totalCarbonKgCO2e.toFixed(4)}</td>
                          <td style={{ padding: '6px 10px', color: '#059669', fontWeight: 700 }}>{b.carbonPerUnit.toFixed(5)} kg</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 9 }}>
                            {dpp ? `${dpp.genesisHash.slice(0, 14)}...` : 'PENDING'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Compliance Statements */}
            <div style={{ marginBottom: 20, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 6, border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                Traceability & Compliance Support Context
              </h4>
              <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
                {activeReport.complianceNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>

            {/* Mandatory Disclaimer Box */}
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 4,
                fontSize: 10,
                color: '#92400E',
                marginBottom: 16,
                lineHeight: 1.4
              }}
            >
              <strong>Disclaimer & Legal Scope:</strong> {activeReport.disclaimer}
            </div>

            {/* Digital Signature & Genesis Hash Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTop: '1px solid #CBD5E1', fontSize: 11, color: '#64748B' }}>
              <div>
                <div><strong>Cryptographic Audit Signature (SHA-256):</strong></div>
                <div style={{ fontFamily: 'monospace', color: '#0F172A', marginTop: 2, fontSize: 10 }}>
                  {activeReport.auditHash}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ height: 28, borderBottom: '1px solid #94A3B8', width: 140, marginBottom: 4 }} />
                <div>Authorized Auditor / Lead</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
