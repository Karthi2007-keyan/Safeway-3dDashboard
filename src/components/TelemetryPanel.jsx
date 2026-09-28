import React from 'react';
import { 
  Ruler, 
  Wind, 
  Sun, 
  Thermometer, 
  Droplets, 
  Activity, 
  Compass,
  Radio,
  Radar
} from 'lucide-react';

export default function TelemetryPanel({ sensorData, lidarData }) {
  const {
    distance_cm = 182,
    dust_raw = 4095,
    light_lux = -2,
    humidity = 58,
    temperature_c = 28.9,
    accelerometer = { x: 785, y: 247, z: 0 }
  } = sensorData;

  const {
    device = "LIDAR_01",
    distance_mm = 1532,
    angle = 25.4,
    quality = 42
  } = lidarData || {};

  // Percentage conversions for gauges
  const distMeters = (distance_cm / 100).toFixed(2);
  const distPct = Math.min(100, Math.max(0, (distance_cm / 400) * 100));
  const dustPct = Math.min(100, (dust_raw / 4095) * 100);
  const lidarMeters = (distance_mm / 1000).toFixed(2);
  const lidarCm = (distance_mm / 10).toFixed(1);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      
      {/* 1. Distance Hazard Card */}
      <div className={`relative p-3.5 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
        distance_cm < 100 ? 'bg-red-950/40 border-red-500/70 text-red-100 ring-1 ring-red-500/50' :
        distance_cm < 250 ? 'bg-amber-950/30 border-amber-500/50 text-amber-100' :
        'bg-slate-900/70 border-slate-800 text-slate-100'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-semibold uppercase text-slate-400">OBSTACLE DISTANCE</span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
            distance_cm < 100 ? 'bg-red-500 text-white animate-pulse' :
            distance_cm < 250 ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
          }`}>
            {distance_cm < 100 ? 'STOP WARN' : distance_cm < 250 ? 'CAUTION' : 'CLEAR'}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black font-mono tracking-tight">{distance_cm}</span>
          <span className="text-sm font-mono text-slate-400">cm ({distMeters} m)</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              distance_cm < 100 ? 'bg-red-500' : distance_cm < 250 ? 'bg-amber-500' : 'bg-cyan-400'
            }`}
            style={{ width: `${distPct}%` }}
          />
        </div>
      </div>

      {/* 2. NEW REAL LIDAR HARDWARE CARD (LIDAR_01) */}
      <div className="relative p-3.5 rounded-xl border border-indigo-500/50 bg-indigo-950/40 backdrop-blur-md text-slate-100 shadow-lg shadow-indigo-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-xs font-mono font-semibold uppercase text-indigo-300">LIDAR SENSOR ({device})</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-500/50 font-bold">
            SIGNAL: {quality}%
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black font-mono tracking-tight text-indigo-300">{distance_mm}</span>
          <span className="text-sm font-mono text-slate-400">mm ({lidarCm} cm / {lidarMeters} m)</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 border-t border-indigo-900/60 pt-1.5">
          <div>ANGLE: <span className="text-cyan-300 font-bold">{angle}°</span></div>
          <div>QUALITY: <span className="text-emerald-400 font-bold">{quality}%</span></div>
        </div>
      </div>

      {/* 3. Dust Level Card */}
      <div className={`relative p-3.5 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
        dust_raw > 3000 ? 'bg-red-950/40 border-red-500/70 text-red-100' :
        dust_raw > 1500 ? 'bg-amber-950/30 border-amber-500/50 text-amber-100' :
        'bg-slate-900/70 border-slate-800 text-slate-100'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-semibold uppercase text-slate-400">DUST DENSITY</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
            {dust_raw > 3000 ? 'MAX DUST' : dust_raw > 1500 ? 'MODERATE' : 'CLEAN'}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black font-mono tracking-tight">{dust_raw}</span>
          <span className="text-sm font-mono text-slate-400">raw ({dustPct.toFixed(0)}%)</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${dustPct}%` }}
          />
        </div>
      </div>

      {/* 4. Ambient Light Lux Card */}
      <div className="relative p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md text-slate-100 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-mono font-semibold uppercase text-slate-400">AMBIENT LIGHT</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
            {light_lux <= 0 ? 'NIGHT VISION' : 'DAYLIGHT'}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black font-mono tracking-tight">{light_lux}</span>
          <span className="text-sm font-mono text-slate-400">lux</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-2">
          MODE: {light_lux <= 0 ? 'HEADLIGHT ENHANCED' : 'NATURAL AMBIENT'}
        </div>
      </div>

      {/* 5. Temperature Card */}
      <div className="relative p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md text-slate-100 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-mono font-semibold uppercase text-slate-400">CAB TEMPERATURE</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
            NORMAL
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black font-mono tracking-tight">{temperature_c}</span>
          <span className="text-sm font-mono text-slate-400">°C</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-2">
          HVAC CLIMATE CONTROL ACTIVE
        </div>
      </div>

      {/* 6. Humidity Card */}
      <div className="relative p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md text-slate-100 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-semibold uppercase text-slate-400">RELATIVE HUMIDITY</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
            {humidity}%
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black font-mono tracking-tight">{humidity}</span>
          <span className="text-sm font-mono text-slate-400">% RH</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-2">
          {humidity > 70 ? 'MIST RISK' : 'OPTIMAL DRY'}
        </div>
      </div>

      {/* 7. Accelerometer Vector Card */}
      <div className="relative p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md text-slate-100 shadow-lg col-span-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-mono font-semibold uppercase text-slate-400">3-AXIS ACCELEROMETER (MPU6050)</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
            PITCH & ROLL TILT
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center font-mono mt-1">
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400">X-PITCH</div>
            <div className="text-sm font-bold text-cyan-300">{accelerometer?.x ?? 785}</div>
          </div>
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400">Y-ROLL</div>
            <div className="text-sm font-bold text-amber-300">{accelerometer?.y ?? 247}</div>
          </div>
          <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
            <div className="text-[10px] text-slate-400">Z-GRAV</div>
            <div className="text-sm font-bold text-purple-300">{accelerometer?.z ?? 0}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
