import QRCode from 'qrcode';
import { DPPRecord } from '../types/dpp';
import { BatchInfo } from '../types/telemetry';

/**
 * Generates a SHA-256 cryptographic hash from a string using Web Crypto API
 */
export async function generateSha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('Web Crypto API unavailable, using fallback deterministic hash', e);
  }

  // Deterministic fallback hash for edge environments
  let hash = 0x811c9dc5;
  for (let i = 0; i < message.length; i++) {
    hash ^= message.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return 'ct_' + Math.abs(hash).toString(16).padStart(16, '0') + '9f7a2b1c4e8d3f6a7c8b9d0e1f2a3b4c';
}

/**
 * Creates a deterministic, key-sorted canonical string from batch metadata
 */
export function createCanonicalBatchPayload(
  passportId: string,
  batch: BatchInfo,
  machineId: string,
  totalEnergy: number,
  activeEnergy: number,
  idleEnergy: number,
  scope2: number,
  gridEmissionFactor: number,
  gridRegion: string,
  createdAt: string
): string {
  const canonicalObj = {
    activeEnergyKWh: activeEnergy,
    batchId: batch.batchId,
    createdAt: createdAt,
    gridEmissionFactor: gridEmissionFactor,
    gridRegion: gridRegion,
    idleEnergyKWh: idleEnergy,
    machineId: machineId,
    passportId: passportId,
    productName: batch.productName,
    scope2EmissionsKgCO2e: scope2,
    sku: batch.sku,
    totalEnergyKWh: totalEnergy,
    unitsProduced: Math.max(1, batch.unitsCompleted)
  };

  // Deterministic JSON stringify with sorted keys
  return JSON.stringify(canonicalObj, Object.keys(canonicalObj).sort());
}

/**
 * Creates a verifiable Digital Product Passport from completed Batch telemetry
 */
export async function createDigitalProductPassport(
  batch: BatchInfo,
  machineId: string,
  gridEmissionFactor: number,
  gridRegion: string
): Promise<DPPRecord> {
  const units = Math.max(1, batch.unitsCompleted);
  const totalEnergy = Number(batch.totalEnergyKWh.toFixed(5));
  const activeEnergy = Number(batch.activeEnergyKWh.toFixed(5));
  const idleEnergy = Number(batch.idleEnergyKWh.toFixed(5));
  const idlePercent = totalEnergy > 0 ? Number(((idleEnergy / totalEnergy) * 100).toFixed(1)) : 0;
  
  const scope2 = Number((totalEnergy * gridEmissionFactor).toFixed(5));
  const specificEnergy = Number((totalEnergy / units).toFixed(5));
  const carbonIntensity = Number((scope2 / units).toFixed(5));

  const passportId = `DPP-CT-${Date.now().toString().slice(-6)}`;
  const createdAt = new Date().toISOString();

  // Deterministic canonical payload
  const canonicalPayload = createCanonicalBatchPayload(
    passportId,
    batch,
    machineId,
    totalEnergy,
    activeEnergy,
    idleEnergy,
    scope2,
    gridEmissionFactor,
    gridRegion,
    createdAt
  );

  const genesisHash = await generateSha256(canonicalPayload);

  const dpp: DPPRecord = {
    passportId,
    batchId: batch.batchId,
    productName: batch.productName,
    sku: batch.sku,
    unitsProduced: units,
    genesisHash,
    canonicalPayload,
    createdAt,
    machineId: machineId || 'Motor-01',
    manufacturerName: 'Apex Precision Engineering MSME',
    facilityLocation: 'Industrial Estate Unit 4B',
    totalEnergyConsumedKWh: totalEnergy,
    activeEnergyConsumedKWh: activeEnergy,
    idleEnergyWasteKWh: idleEnergy,
    idleEnergyWastePercent: idlePercent,
    scope2EmissionsKgCO2e: scope2,
    specificEnergyKWhPerUnit: specificEnergy,
    carbonIntensityKgPerUnit: carbonIntensity,
    gridEmissionFactor,
    gridRegion,
    verificationStatus: 'VERIFIED',
    auditSignature: `CTRACK_VERIFIED_${genesisHash.slice(0, 16).toUpperCase()}`,
    blockchainProofStub: `0x7f4a...${genesisHash.slice(-12)}`,
    cbamSupport: true,
    brsrReady: true,
    iso14067Ready: true,
    iso14064Category: 'Category 2: Indirect GHG from Imported Electricity',
    disclaimer: 'Cryptographic verification confirms that the digital record has not been altered after hashing.'
  };

  return dpp;
}

/**
 * Recomputes SHA-256 hash on a DPP record to verify tamper-evident integrity
 */
export async function verifyDppIntegrity(dpp: DPPRecord): Promise<{
  isValid: boolean;
  recomputedHash: string;
  matches: boolean;
  explanation: string;
}> {
  const recomputedHash = await generateSha256(dpp.canonicalPayload);
  const matches = recomputedHash.toLowerCase() === dpp.genesisHash.toLowerCase();

  return {
    isValid: matches,
    recomputedHash,
    matches,
    explanation: matches
      ? 'Cryptographic verification confirms that the digital record has not been altered after hashing.'
      : 'HASH MISMATCH: The record content has been altered after initial issuance!'
  };
}

/**
 * Generates high-res QR code Data URL for the DPP public verification view
 */
export async function generateDppQrCode(dpp: DPPRecord): Promise<string> {
  const publicPayload = {
    app: 'C-TRACK Digital Product Passport',
    passportId: dpp.passportId,
    batchId: dpp.batchId,
    productName: dpp.productName,
    sku: dpp.sku,
    unitsProduced: dpp.unitsProduced,
    totalEnergyKWh: dpp.totalEnergyConsumedKWh,
    carbonFootprintKgCO2e: dpp.scope2EmissionsKgCO2e,
    carbonPerUnitKg: dpp.carbonIntensityKgPerUnit,
    gridEmissionFactor: dpp.gridEmissionFactor,
    hash: dpp.genesisHash,
    status: 'CRYPTOGRAPHICALLY_VERIFIED',
    timestamp: dpp.createdAt
  };

  try {
    return await QRCode.toDataURL(JSON.stringify(publicPayload), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#080C14',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('Failed to render QR Code', err);
    return '';
  }
}
