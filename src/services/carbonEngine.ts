import { GridRegion } from '../types/telemetry';

export interface GridEmissionPreset {
  id: GridRegion;
  name: string;
  factor: number; // kg CO2e / kWh
  description: string;
  source: string;
}

export const GRID_EMISSION_PRESETS: Record<GridRegion, GridEmissionPreset> = {
  IN_CEA: {
    id: 'IN_CEA',
    name: 'India (CEA Grid Average)',
    factor: 0.716,
    description: 'Central Electricity Authority (CEA) User Guide v19 - Combined Margin',
    source: 'CEA Baseline Carbon Database 2024'
  },
  US_EGRID: {
    id: 'US_EGRID',
    name: 'United States (eGRID US Avg)',
    factor: 0.386,
    description: 'EPA eGRID Subregion US weighted average',
    source: 'US EPA eGRID 2023'
  },
  EU_EEA: {
    id: 'EU_EEA',
    name: 'European Union (EEA Avg)',
    factor: 0.231,
    description: 'EU-27 electricity consumption greenhouse gas emission intensity',
    source: 'European Environment Agency 2023'
  },
  UK_DESNZ: {
    id: 'UK_DESNZ',
    name: 'United Kingdom (DESNZ)',
    factor: 0.207,
    description: 'UK Government GHG Conversion Factors for Company Reporting',
    source: 'DESNZ 2023'
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom Emission Factor',
    factor: 0.500,
    description: 'User-specified emission factor for localized grid / solar captive',
    source: 'User Configured'
  }
};

/**
 * Calculates Estimated Scope 2 Carbon emissions from measured electrical energy consumption.
 * NOTE: Carbon is ESTIMATED from energy consumption using an emission factor, NOT directly measured from the motor.
 *
 * Formula: Carbon (kg CO2e) = Energy (kWh) * Emission Factor (kg CO2e / kWh)
 *
 * @param energyKWh Measured electrical energy in Kilowatt-hours (kWh)
 * @param emissionFactor Configured grid emission factor in kg CO2e / kWh
 * @returns Estimated carbon footprint in kg CO2e
 */
export function calculateCarbonEmissions(energyKWh: number, emissionFactor: number): number {
  return Number((Math.max(0, energyKWh) * emissionFactor).toFixed(5));
}

/**
 * Calculates Productive vs Idle Carbon breakdown from segregated electrical energies
 */
export function calculateProductiveAndIdleCarbon(
  totalEnergyKWh: number,
  activeEnergyKWh: number,
  idleEnergyKWh: number,
  emissionFactor: number
) {
  const totalCarbonKgCO2e = calculateCarbonEmissions(totalEnergyKWh, emissionFactor);
  const productiveCarbonKgCO2e = calculateCarbonEmissions(activeEnergyKWh, emissionFactor);
  const idleCarbonKgCO2e = calculateCarbonEmissions(idleEnergyKWh, emissionFactor);

  return {
    totalCarbonKgCO2e,
    productiveCarbonKgCO2e,
    idleCarbonKgCO2e,
    emissionFactorUsed: emissionFactor,
    disclaimer: 'Energy-based Carbon Estimate (Scope 2 Indirect)'
  };
}

/**
 * Converts kg CO2e into intuitive real-world sustainability equivalents
 */
export function getCarbonEquivalents(kgCO2e: number) {
  return {
    kmDriven: Number((kgCO2e * 4.12).toFixed(1)), // Avg passenger gasoline vehicle ~0.24 kg CO2/km
    treeDaysAbsorbed: Number((kgCO2e * 16.5).toFixed(1)), // 1 mature tree absorbs ~22kg/year = ~0.06 kg/day
    ledBulbHours: Number((kgCO2e * 115).toFixed(0)), // 9W commercial LED bulb
    smartphonesCharged: Number((kgCO2e * 121).toFixed(0)) // 15Wh smartphone battery recharge
  };
}
