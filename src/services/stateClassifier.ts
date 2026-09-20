import { MachineState } from '../types/telemetry';

export interface StateClassifierThresholds {
  idlePowerThresholdW: number; // e.g. 4.5 W (motor spinning with zero mechanical load)
  overloadCurrentThresholdA: number; // e.g. 1.8 A (current spike / stall threshold)
  offCurrentThresholdA: number; // e.g. 0.08 A (quiescent cut-off)
  minOperatingVoltageV: number; // e.g. 8.0 V (minimum nominal DC bus)
}

export const DEFAULT_THRESHOLDS: StateClassifierThresholds = {
  idlePowerThresholdW: 4.5,
  overloadCurrentThresholdA: 1.8,
  offCurrentThresholdA: 0.08,
  minOperatingVoltageV: 8.0
};

export interface StateClassificationResult {
  state: MachineState;
  reason: string;
  isActiveWorkload: boolean;
  isIdleWaste: boolean;
  isAnomaly: boolean;
  loadPercentage: number; // 0 - 100%
  isEdgeAiReady: boolean; // Flag indicating modular architecture
}

/**
 * ==============================================================================
 * C-TRACK Edge Machine State Engine (Initial Rule-Based Model)
 * ==============================================================================
 * Initial rule-based machine state detector for edge microcontrollers (ESP32-S3).
 * Designed with a clean abstraction layer so a future TinyML / Edge AI model
 * (e.g. TensorFlow Lite Micro autoencoder / SVM classifier) can drop in seamlessly.
 *
 * State Mapping:
 * - OFF: No meaningful electrical activity (V < 8V or I < 0.08A or P < 0.5W)
 * - IDLE: Motor powered & rotating without mechanical work (P < idlePowerThresholdW)
 * - ACTIVE: Normal manufacturing workload under mechanical torque (P >= idlePowerThresholdW)
 * - ABNORMAL: Current or voltage outside safe operating limits (I >= overloadThreshold or Stall)
 * - WARMUP: Inductive inrush start transient suppression (<1.5s)
 * ==============================================================================
 */
export function classifyMachineState(
  voltage: number,
  current: number,
  power: number,
  previousState: MachineState = 'OFF',
  thresholds: StateClassifierThresholds = DEFAULT_THRESHOLDS
): StateClassificationResult {
  // 1. Check OFF State (Disconnected or switched off)
  if (voltage < thresholds.minOperatingVoltageV || current < thresholds.offCurrentThresholdA || power < 0.5) {
    return {
      state: 'OFF',
      reason: 'No meaningful electrical activity (Machine isolated from mains or driver unpowered)',
      isActiveWorkload: false,
      isIdleWaste: false,
      isAnomaly: false,
      loadPercentage: 0,
      isEdgeAiReady: true
    };
  }

  // 2. Check ABNORMAL Condition (Overload, Stall, Extreme Current / Voltage Outlier)
  if (current >= thresholds.overloadCurrentThresholdA || power > 24.0 || voltage > 24.5) {
    return {
      state: 'ABNORMAL',
      reason: `Electrical excursion: Current (${current.toFixed(2)}A >= ${thresholds.overloadCurrentThresholdA}A) or Voltage (${voltage.toFixed(1)}V) exceeds nominal threshold. Mechanical bind or stall suspected.`,
      isActiveWorkload: false,
      isIdleWaste: false,
      isAnomaly: true,
      loadPercentage: Math.min(150, Math.round((current / 1.2) * 100)),
      isEdgeAiReady: true
    };
  }

  // 3. Check Warmup / Inrush Transient (Inductive startup transient suppression)
  if (previousState === 'OFF' && current > 1.0 && current < thresholds.overloadCurrentThresholdA) {
    return {
      state: 'WARMUP',
      reason: 'Motor inrush / inductive transient detected during startup sequence',
      isActiveWorkload: false,
      isIdleWaste: false,
      isAnomaly: false,
      loadPercentage: 35,
      isEdgeAiReady: true
    };
  }

  // 4. Check IDLE State (Motor connected & powered, but current significantly lower than active)
  if (power < thresholds.idlePowerThresholdW) {
    return {
      state: 'IDLE',
      reason: `Standby parasitic load: Power (${power.toFixed(1)}W) is below productive threshold (${thresholds.idlePowerThresholdW}W). Zero mechanical load detected.`,
      isActiveWorkload: false,
      isIdleWaste: true,
      isAnomaly: false,
      loadPercentage: Math.round((power / thresholds.idlePowerThresholdW) * 25),
      isEdgeAiReady: true
    };
  }

  // 5. ACTIVE State (Normal operating manufacturing load)
  const nominalMaxPower = 18.0; // 12V * 1.5A
  const calculatedLoad = Math.min(
    100,
    Math.round(((power - thresholds.idlePowerThresholdW) / (nominalMaxPower - thresholds.idlePowerThresholdW)) * 75 + 25)
  );

  return {
    state: 'ACTIVE',
    reason: `Normal productive operation: Power (${power.toFixed(1)}W) reflects active mechanical processing`,
    isActiveWorkload: true,
    isIdleWaste: false,
    isAnomaly: false,
    loadPercentage: Math.max(25, calculatedLoad),
    isEdgeAiReady: true
  };
}
