import React from 'react';
import { Layers, ArrowRight, CheckCircle2, Sparkles, Cpu, Flame, ShieldCheck, Factory } from 'lucide-react';

export const FutureIndustrialRoadmap: React.FC = () => {
  const comparisonItems = [
    {
      subsystem: 'Physical Machine / Load',
      current: '12V DC Motor Test Bench with L298N H-Bridge driver',
      future: 'Industrial high-temperature furnace, kiln, injection molding machine or CNC spindle',
      currentBadge: 'MVP Hardware',
      futureBadge: 'Factory Scale-Up'
    },
    {
      subsystem: 'Current Sensing',
      current: 'ACS712-05B Hall-Effect sensor module (0–5A range)',
      future: 'Split-core industrial CT clamps (50A–500A) with Rogowski coils',
      currentBadge: 'MVP Transducer',
      futureBadge: 'Industrial Grade'
    },
    {
      subsystem: 'Voltage & ADC Sensing',
      current: '0–25V analog divider with ADS1115 16-Bit I2C ADC',
      future: 'True-RMS 3-Phase (415V AC) isolated transducer module (Class 0.5 accuracy)',
      currentBadge: 'MVP Sensing',
      futureBadge: 'Utility Grade'
    },
    {
      subsystem: 'Temperature Sensing',
      current: 'Dallas DS18B20 digital thermometer on motor chassis (-55°C to +125°C)',
      future: 'Type-K/N Thermocouple with MAX31855 amplifier for furnace core (up to 1200°C)',
      currentBadge: 'Physical Surface',
      futureBadge: 'Process Core'
    },
    {
      subsystem: 'Machine State Engine',
      current: 'Edge Rule Engine (Active / Idle / Off / Abnormal thresholds)',
      future: 'On-Device TinyML (TensorFlow Lite Micro) spectral anomaly & wear classification',
      currentBadge: 'Deterministic Rules',
      futureBadge: 'Edge AI (Planned)'
    },
    {
      subsystem: 'Hardware Enclosure',
      current: 'Open dev bench with ESP32-S3 DevKit',
      future: 'DIN-rail mounted IP67 industrial enclosure with RS485 / Modbus RTU interface',
      currentBadge: 'Prototype Bench',
      futureBadge: 'Factory Ruggedized'
    },
    {
      subsystem: 'Traceability & Compliance',
      current: 'SHA-256 canonical hash + Digital Product Passport (DPP) MVP',
      future: 'Enterprise ERP connector, automated CBAM XML filings & ISO 14067 ledger',
      currentBadge: 'Tamper-Evident Hash',
      futureBadge: 'Automated Audit'
    }
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Factory size={18} color="var(--cyan-primary)" />
          <div>
            <span className="card-title">Prototype Truthfulness & Future Industrial Scale-Up Roadmap</span>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Transparent distinction between current MVP bench capabilities and factory-grade industrial deployment
            </div>
          </div>
        </div>
        <span className="badge badge-cyan">HONEST ARCHITECTURE</span>
      </div>

      <div className="table-container">
        <table className="table-industrial">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>System Layer</th>
              <th style={{ width: '39%' }}>Current MVP Test Bench (Prototype)</th>
              <th style={{ width: '39%' }}>Future Industrial Deployment (Scale-Up)</th>
            </tr>
          </thead>
          <tbody>
            {comparisonItems.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.subsystem}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span className="badge badge-muted" style={{ fontSize: 9 }}>{item.currentBadge}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {item.current}
                  </div>
                </td>
                <td style={{ backgroundColor: 'rgba(6, 182, 212, 0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span className="badge badge-cyan" style={{ fontSize: 9 }}>{item.futureBadge}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cyan-primary)', fontWeight: 500 }}>
                    {item.future}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Honest Boundary Callout */}
      <div
        style={{
          marginTop: 14,
          padding: '10px 14px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: 11,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <ShieldCheck size={16} color="var(--emerald-primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-secondary)' }}>Product Integrity Statement:</strong> C-TRACK measures physical electrical parameters on the prototype and estimates indirect Scope 2 carbon emissions via regional grid factors. It does not claim direct chemical measurement of exhaust gas from the electric motor or automatic legal certification.
        </div>
      </div>
    </div>
  );
};
