import { TelemetrySummary, SystemSettings, MachineInfo, HumanInsight } from '../types/telemetry';

/**
 * Generates human-readable, grounded engineering insights from measured electrical & carbon telemetry.
 * Strictly adheres to realistic, non-exaggerated claims based on empirical data.
 */
export function generateMachineInsights(
  summary: TelemetrySummary,
  machineInfo: MachineInfo,
  settings: SystemSettings
): HumanInsight[] {
  const insights: HumanInsight[] = [];
  const totalMonitoredSeconds = summary.todayActiveTimeSeconds + summary.todayIdleTimeSeconds + summary.todayOffTimeSeconds;
  
  if (totalMonitoredSeconds < 10) {
    return [
      {
        id: 'INS-001',
        category: 'ENERGY_PROFILE',
        title: 'Telemetry Stream Initializing',
        text: `${machineInfo.id} is currently synchronizing telemetry. Live insights will populate after initial operational cycles.`,
        severity: 'INFO'
      }
    ];
  }

  // 1. Idle Time & Energy Waste Ratio Analysis
  const runningSeconds = summary.todayActiveTimeSeconds + summary.todayIdleTimeSeconds;
  const idlePercentage = runningSeconds > 0
    ? Math.round((summary.todayIdleTimeSeconds / runningSeconds) * 100)
    : 0;

  if (idlePercentage >= 15) {
    const monthlySavingEst = Number((summary.todayIdleCost * 26).toFixed(2)); // ~26 working days/month
    const monthlyCarbonSavingEst = Number((summary.todayIdleCarbonKgCO2e * 26).toFixed(2));

    insights.push({
      id: 'INS-IDLE-01',
      category: 'IDLE_EFFICIENCY',
      title: 'High Idle Standby Ratio Detected',
      text: `${machineInfo.id} has spent ${idlePercentage}% of its operating period in an idle state without mechanical load.`,
      metricValue: `${summary.todayIdleEnergyKWh.toFixed(3)} kWh idle loss`,
      actionableRecommendation: `Automating motor power cut-off during operator changeovers could save an estimated ${settings.currencySymbol}${monthlySavingEst}/mo and reduce ~${monthlyCarbonSavingEst} kg CO₂e/mo in Scope 2 emissions.`,
      severity: idlePercentage > 30 ? 'WARNING' : 'OPPORTUNITY'
    });
  } else {
    insights.push({
      id: 'INS-IDLE-02',
      category: 'IDLE_EFFICIENCY',
      title: 'Optimal Mechanical Utilization',
      text: `${machineInfo.id} is operating with high productivity: only ${idlePercentage}% of energized time was spent in standby.`,
      metricValue: `${((100 - idlePercentage)).toFixed(0)}% productive duty cycle`,
      severity: 'INFO'
    });
  }

  // 2. Electrical Demand & Load Factor Insight
  if (summary.peakPowerTodayW > 0) {
    const avgPower = summary.todayTotalEnergyKWh > 0 && runningSeconds > 0
      ? (summary.todayTotalEnergyKWh * 1000) / (runningSeconds / 3600)
      : summary.currentPowerW;
    const loadFactor = Math.min(100, Math.round((avgPower / summary.peakPowerTodayW) * 100));

    insights.push({
      id: 'INS-LOAD-01',
      category: 'ENERGY_PROFILE',
      title: 'Electrical Load Factor & Peak Demand',
      text: `Peak active power observed today reached ${summary.peakPowerTodayW.toFixed(1)} W, with an average operating load of ${avgPower.toFixed(1)} W (Load factor: ${loadFactor}%).`,
      metricValue: `${loadFactor}% Load Factor`,
      actionableRecommendation: loadFactor < 50
        ? 'Consider reviewing motor sizing or load matching to avoid low-efficiency operating regimes.'
        : undefined,
      severity: 'INFO'
    });
  }

  // 3. Carbon Intensity Insight
  if (summary.todayTotalEnergyKWh > 0) {
    const productiveShare = summary.todayTotalEnergyKWh > 0
      ? ((summary.todayActiveEnergyKWh / summary.todayTotalEnergyKWh) * 100).toFixed(1)
      : '100';

    insights.push({
      id: 'INS-CARBON-01',
      category: 'CARBON_INTENSITY',
      title: 'Energy-Based Scope 2 Carbon Allocation',
      text: `Today's estimated carbon footprint is ${summary.todayCarbonKgCO2e.toFixed(3)} kg CO₂e (${productiveShare}% from productive work, remainder from standby leakage) based on ${settings.gridRegion} factor (${settings.gridEmissionFactor} kg/kWh).`,
      metricValue: `${summary.todayCarbonKgCO2e.toFixed(3)} kg CO₂e`,
      severity: 'INFO'
    });
  }

  return insights;
}
