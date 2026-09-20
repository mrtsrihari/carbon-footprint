export interface DPPRecord {
  passportId: string; // e.g. "DPP-CT-2026-9041"
  batchId: string;
  productName: string;
  sku: string;
  unitsProduced: number;
  genesisHash: string; // SHA-256 string
  canonicalPayload: string; // Deterministic canonical JSON payload
  createdAt: string; // ISO String
  machineId: string;
  manufacturerName: string;
  facilityLocation: string;
  
  // Carbon & Energy Genesis
  totalEnergyConsumedKWh: number;
  activeEnergyConsumedKWh: number;
  idleEnergyWasteKWh: number;
  idleEnergyWastePercent: number;
  scope2EmissionsKgCO2e: number;
  specificEnergyKWhPerUnit: number;
  carbonIntensityKgPerUnit: number;
  
  // Grid & Audit Context
  gridEmissionFactor: number; // kg CO2/kWh
  gridRegion: string;
  verificationStatus: 'VERIFIED' | 'PENDING_AUDIT' | 'REJECTED';
  auditSignature: string;
  blockchainProofStub?: string;
  
  // Sustainability Standards Readiness & Reporting Support
  cbamSupport: boolean;
  brsrReady: boolean;
  iso14067Ready: boolean;
  iso14064Category: string;
  disclaimer: string;
}

export interface ReportConfig {
  reportType: 'BRSR_SCOPE2' | 'CBAM_EMISSIONS' | 'ISO_14064_ENERGY' | 'EXECUTIVE_SUMMARY';
  title: string;
  period: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';
  startDate: string;
  endDate: string;
  includeIdleBreakdown: boolean;
  includeDppList: boolean;
  generatedBy: string;
  companyName: string;
  facility: string;
  reportingStandard: string;
}
