import { TelemetrySummary, BatchInfo } from '../types/telemetry';
import { DPPRecord, ReportConfig } from '../types/dpp';
import { generateSha256 } from './dppEngine';

export interface GeneratedReport {
  reportId: string;
  config: ReportConfig;
  generatedAt: string;
  machineId: string;
  summary: TelemetrySummary;
  batches: BatchInfo[];
  dpps: DPPRecord[];
  auditHash: string;
  reportingStandard: string;
  complianceNotes: string[];
  disclaimer: string;
}

/**
 * Generates an audit-ready, structured carbon and energy report
 * Strictly positioned as a Data Preparation and Traceability Support Tool (NOT certified / legal guarantee)
 */
export async function generateComplianceReport(
  config: ReportConfig,
  summary: TelemetrySummary,
  batches: BatchInfo[],
  dpps: DPPRecord[],
  machineId: string,
  gridRegion: string,
  gridFactor: number
): Promise<GeneratedReport> {
  const reportId = `REP-${config.reportType.slice(0, 4)}-${Date.now().toString().slice(-6)}`;
  const generatedAt = new Date().toLocaleString();

  const complianceNotes: string[] = [];

  if (config.reportType === 'CBAM_EMISSIONS') {
    complianceNotes.push(
      'CBAM / Sustainability Reporting Support: Designed to assist with data collection and traceability for EU CBAM transitional reporting.',
      `Scope 2 Indirect emissions allocated from direct electrical energy consumption (${summary.todayTotalEnergyKWh.toFixed(4)} kWh) using regional factor (${gridFactor} kg CO₂e/kWh).`,
      'Batch-level specific embedded emissions calculated and cryptographically hashed for buyer/auditor verification.'
    );
  } else if (config.reportType === 'BRSR_SCOPE2') {
    complianceNotes.push(
      'SEBI BRSR Principle 6 (Environment) Data Preparation Support: Key Performance Indicator 1 (Energy Consumption & Scope 2 GHG Emissions).',
      `Scope 2 emissions computed using official ${gridRegion} factor of ${gridFactor} kg CO₂e/kWh.`,
      `Segregated Idle Energy (${summary.todayIdleEnergyKWh.toFixed(4)} kWh) tracked for industrial energy-intensity reduction programs.`
    );
  } else if (config.reportType === 'ISO_14064_ENERGY') {
    complianceNotes.push(
      'ISO 14067 / ISO 14064-1 Pre-Audit Data Preparation: Quantification of machine-level indirect electrical carbon footprint.',
      'Category 2: Indirect GHG emissions from imported electricity.',
      'Cryptographic record hashes provide tamper-evident data integrity for audit trail inspection.'
    );
  } else {
    complianceNotes.push(
      'Executive ESG & Machine Energy Optimization Summary.',
      `Potential annual financial savings by mitigating idle machine energy: ₹${(summary.potentialCostSaving * 300).toFixed(0)}.`,
      `Equivalent carbon reduction: ${(summary.potentialCarbonSavingKgCO2e * 300).toFixed(1)} kg CO₂e/year.`
    );
  }

  const rawAuditPayload = JSON.stringify({
    reportId,
    generatedAt,
    machineId,
    totalEnergyKWh: summary.todayTotalEnergyKWh,
    carbonKgCO2e: summary.todayCarbonKgCO2e,
    gridFactor,
    dppCount: dpps.length
  });

  const auditHash = await generateSha256(rawAuditPayload);

  return {
    reportId,
    config,
    generatedAt,
    machineId,
    summary,
    batches,
    dpps,
    auditHash,
    reportingStandard: config.reportingStandard || 'CBAM / Sustainability Reporting Support',
    complianceNotes,
    disclaimer: 'Designed to support carbon data collection, traceability and reporting workflows. Does NOT constitute legal certification or automated regulatory sign-off.'
  };
}

/**
 * Exports telemetry and batch records as a CSV download
 */
export function exportTelemetryCsv(batches: BatchInfo[], dpps: DPPRecord[]) {
  let csv = 'C-TRACK TELEMETRY & DIGITAL PRODUCT PASSPORT EXPORT\n';
  csv += `Export Date,${new Date().toISOString()}\n`;
  csv += 'Notice,Designed to support carbon data collection traceability and reporting workflows.\n\n';
  
  csv += 'BATCH SUMMARY\n';
  csv += 'Batch ID,Machine ID,Product Name,SKU,Units Planned,Units Completed,Total Energy (kWh),Active Energy (kWh),Idle Energy (kWh),Carbon Emissions (kg CO2e),Carbon Per Unit (kg/unit),Status,Verification Status\n';
  
  batches.forEach(b => {
    csv += `"${b.batchId}","${b.machineId || 'Motor-01'}","${b.productName}","${b.sku}",${b.unitsPlanned},${b.unitsCompleted},${b.totalEnergyKWh.toFixed(4)},${b.activeEnergyKWh.toFixed(4)},${b.idleEnergyKWh.toFixed(4)},${b.totalCarbonKgCO2e.toFixed(4)},${b.carbonPerUnit.toFixed(5)},"${b.status}","${b.verificationStatus || 'VERIFIED'}"\n`;
  });

  csv += '\nDIGITAL PRODUCT PASSPORTS (DPP)\n';
  csv += 'Passport ID,Batch ID,Machine ID,Product Name,Units,Scope 2 (kg CO2e),Specific Energy (kWh/unit),Carbon Intensity (kg/unit),Idle Waste %,Genesis Hash,Verification Status\n';
  
  dpps.forEach(d => {
    csv += `"${d.passportId}","${d.batchId}","${d.machineId || 'Motor-01'}","${d.productName}",${d.unitsProduced},${d.scope2EmissionsKgCO2e.toFixed(4)},${d.specificEnergyKWhPerUnit.toFixed(4)},${d.carbonIntensityKgPerUnit.toFixed(5)},${d.idleEnergyWastePercent}%,${d.genesisHash},"${d.verificationStatus}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `C-TRACK_Audit_Export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
