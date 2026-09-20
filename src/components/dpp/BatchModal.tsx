import React, { useState } from 'react';
import { Play, CheckCircle, FolderPlus, AlertCircle, Sparkles } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Modal } from '../common/Modal';
import { DPPRecord } from '../../types/dpp';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPassportCreated?: (dpp: DPPRecord) => void;
}

export const BatchModal: React.FC<BatchModalProps> = ({
  isOpen,
  onClose,
  onPassportCreated
}) => {
  const { activeBatch, startNewBatch, completeActiveBatch, settings } = useTelemetry();

  const [productName, setProductName] = useState('M12 High-Tensile Steel Bolts');
  const [sku, setSku] = useState('SKU-HTB-12');
  const [units, setUnits] = useState(250);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    startNewBatch(productName, sku, Number(units));
    onClose();
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const dpp = await completeActiveBatch();
      if (dpp && onPassportCreated) {
        onPassportCreated(dpp);
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeBatch ? 'Active Production Batch' : 'Start New Production Batch'}
      subtitle={
        activeBatch
          ? 'Monitor machine telemetry allocated to this batch or finalize to generate DPP'
          : 'Link real-time machine telemetry to production units for carbon footprinting'
      }
    >
      {activeBatch ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Batch Summary Card */}
          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="badge badge-indigo">IN PROGRESS</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {activeBatch.batchId}
              </span>
            </div>

            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeBatch.productName}
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--cyan-primary)', marginTop: 2 }}>
              SKU: {activeBatch.sku}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>UNITS PLANNED</div>
                <div className="mono-num" style={{ fontSize: 16, fontWeight: 700 }}>
                  {activeBatch.unitsPlanned} pcs
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ENERGY ACCUMULATED</div>
                <div className="mono-num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan-primary)' }}>
                  {activeBatch.totalEnergyKWh.toFixed(4)} kWh
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CARBON EMITTED (SCOPE 2)</div>
                <div className="mono-num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--emerald-primary)' }}>
                  {activeBatch.totalCarbonKgCO2e.toFixed(4)} kg
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>IDLE ENERGY LEAK</div>
                <div className="mono-num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber-primary)' }}>
                  {activeBatch.idleEnergyKWh.toFixed(4)} kWh
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn-emerald"
              onClick={handleComplete}
              disabled={isCompleting}
              style={{ gap: 6 }}
            >
              <Sparkles size={15} />
              {isCompleting ? 'Generating DPP...' : 'Complete Batch & Issue DPP'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Product / Part Name
            </label>
            <input
              type="text"
              className="input-field"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="e.g. M12 High-Tensile Fastener"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Product SKU / Part No.
              </label>
              <input
                type="text"
                className="input-field"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="SKU-HTB-12"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Planned Units (pcs)
              </label>
              <input
                type="number"
                className="input-field"
                value={units}
                onChange={e => setUnits(Number(e.target.value))}
                min={1}
                required
              />
            </div>
          </div>

          <div
            style={{
              padding: 12,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: 11,
              color: 'var(--text-secondary)'
            }}
          >
            Machine telemetry from <strong>Motor-01</strong> will be bound to this batch. Energy will be integrated continuously, and idle leaks will be segregated for audit accuracy.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ gap: 6 }}>
              <Play size={14} /> Start Batch Tracking
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
