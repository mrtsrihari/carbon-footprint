import React, { useEffect, useRef } from 'react';
import { TelemetryPacket } from '../../types/telemetry';

interface OscilloscopeProps {
  history: TelemetryPacket[];
  showVoltage?: boolean;
  showCurrent?: boolean;
  height?: number;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  history,
  showVoltage = true,
  showCurrent = true,
  height = 200
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const h = rect.height;

    // 1. Clear background
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, width, h);

    // 2. Draw CRT / Industrial Grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Vertical grid lines (time division)
    const vDivisions = 10;
    for (let i = 0; i <= vDivisions; i++) {
      const x = (i / vDivisions) * width;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }

    // Horizontal grid lines (voltage/current divisions)
    const hDivisions = 6;
    for (let j = 0; j <= hDivisions; j++) {
      const y = (j / hDivisions) * h;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Center baseline
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(width, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (history.length < 2) return;

    const pointsCount = Math.min(history.length, 80);
    const slice = history.slice(-pointsCount);

    // Scale mappings
    // Max Voltage scale: 20V (or 25V)
    const maxV = 20.0;
    // Max Current scale: 3.0A
    const maxI = 2.5;

    // 3. Draw Channel 1: Voltage (Cyan)
    if (showVoltage) {
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      slice.forEach((p, idx) => {
        const x = (idx / (slice.length - 1)) * width;
        const y = h - (Math.min(maxV, p.voltage) / maxV) * (h - 24) - 12;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 4. Draw Channel 2: Current (Emerald / Amber on overload)
    if (showCurrent) {
      const isHighCurrent = slice[slice.length - 1]?.current > 1.5;
      const currentStroke = isHighCurrent ? '#F59E0B' : '#10B981';
      
      ctx.strokeStyle = currentStroke;
      ctx.lineWidth = 2;
      ctx.shadowColor = isHighCurrent ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      slice.forEach((p, idx) => {
        const x = (idx / (slice.length - 1)) * width;
        const y = h - (Math.min(maxI, p.current) / maxI) * (h - 24) - 12;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 5. Draw Trigger & Scale Indicators
    ctx.fillStyle = '#64748B';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('SCALE CH1: 5V/div | CH2: 0.5A/div | TIME: 500ms/div', 12, 18);

    const latest = slice[slice.length - 1];
    if (latest) {
      if (showVoltage) {
        ctx.fillStyle = '#06B6D4';
        ctx.fillText(`CH1 V: ${latest.voltage.toFixed(2)}V`, width - 210, 18);
      }
      if (showCurrent) {
        ctx.fillStyle = '#10B981';
        ctx.fillText(`CH2 I: ${latest.current.toFixed(3)}A`, width - 100, 18);
      }
    }
  }, [history, showVoltage, showCurrent]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        className="oscilloscope-canvas"
        style={{ height }}
      />
    </div>
  );
};
