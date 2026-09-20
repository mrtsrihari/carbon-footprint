import React, { useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { DashboardView } from './views/DashboardView';
import { LiveMonitoringView } from './views/LiveMonitoringView';
import { EnergyAnalyticsView } from './views/EnergyAnalyticsView';
import { CarbonFootprintView } from './views/CarbonFootprintView';
import { MachineIntelligenceView } from './views/MachineIntelligenceView';
import { DppView } from './views/DppView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { BatchModal } from './components/dpp/BatchModal';
import { DemoScenarioRunner } from './components/common/DemoScenarioRunner';
import { DPPRecord } from './types/dpp';

const MainShell: React.FC = () => {
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isDemoScenarioOpen, setIsDemoScenarioOpen] = useState(false);

  const handlePassportCreated = (dpp: DPPRecord) => {
    setActiveView('dpp');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={setActiveView}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
          />
        );
      case 'live-monitoring':
        return <LiveMonitoringView />;
      case 'energy-analytics':
        return <EnergyAnalyticsView />;
      case 'carbon-footprint':
        return <CarbonFootprintView />;
      case 'machine-intelligence':
        return <MachineIntelligenceView />;
      case 'dpp':
        return <DppView onOpenBatchModal={() => setIsBatchModalOpen(true)} />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigate={setActiveView}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeView={activeView} onSelectView={setActiveView} />

      {/* Main Right Content Body */}
      <div className="main-content">
        <Header
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onOpenDemoScenario={() => setIsDemoScenarioOpen(true)}
        />
        <main>{renderActiveView()}</main>
      </div>

      {/* Production Batch & DPP Generation Modal */}
      <BatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onPassportCreated={handlePassportCreated}
      />

      {/* Automated Judge Demo Scenario Runner */}
      <DemoScenarioRunner
        isOpen={isDemoScenarioOpen}
        onClose={() => setIsDemoScenarioOpen(false)}
        onNavigate={setActiveView}
      />
    </div>
  );
};

export default function App() {
  return (
    <TelemetryProvider>
      <MainShell />
    </TelemetryProvider>
  );
}
