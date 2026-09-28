import React, { useEffect, useRef } from 'react';
import { LineChart, Activity } from 'lucide-react';

export default function TelemetryChart({ sensorData }) {
  const canvasRef = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    historyRef.current.push({
      time: timestamp,
      distance: sensorData.distance_cm ?? 182,
      dust: sensorData.dust_raw ?? 4095,
      temp: sensorData.temperature_c ?? 28.9
    });

    if (historyRef.current.length > 30) {
      historyRef.current.shift();
    }
  }, [sensorData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    let animId;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const history = historyRef.current;
      if (history.length < 2) return;

      const step = width / (Math.max(30, history.length) - 1);

      // 1. Draw Distance line (Cyan)
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      history.forEach((pt, i) => {
        const x = i * step;
        // map distance 0-400 to canvas height
        const y = height - (pt.distance / 400) * (height - 20) - 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 2. Draw Dust line (Amber)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      history.forEach((pt, i) => {
        const x = i * step;
        // map dust 0-4095 to canvas height
        const y = height - (pt.dust / 4095) * (height - 20) - 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };

    render();
  }, [sensorData]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-3.5 shadow-xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold uppercase text-slate-300">REALTIME TELEMETRY HISTORY</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> DISTANCE (cm)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-0.5 bg-amber-400 border-dashed inline-block" /> DUST (raw)
          </span>
        </div>
      </div>

      <div className="relative w-full h-[140px] bg-slate-950 rounded-lg border border-slate-800 p-1">
        <canvas 
          ref={canvasRef} 
          width={450} 
          height={130} 
          className="w-full h-full block"
        />
      </div>
    </div>
  );
}
