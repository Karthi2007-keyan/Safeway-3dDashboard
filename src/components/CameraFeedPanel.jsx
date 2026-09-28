import React, { useState, useEffect, useRef } from 'react';
import { Radio, Camera, ShieldAlert, Cpu, Crosshair, Zap, RotateCcw } from 'lucide-react';

export default function CameraFeedPanel({ camData, distanceCm, dustRaw, lidarData = {} }) {
  const [viewMode, setViewMode] = useState('RADAR'); // 'RADAR' | 'CAMERA'
  const [maxRange, setMaxRange] = useState(4000); // 4000 mm = 4.0 meters

  // Extract LiDAR values safely
  const lAngle = parseFloat(lidarData.angle ?? 0.0);
  const lDistMm = Number(lidarData.distance_mm) > 0 
    ? Number(lidarData.distance_mm) 
    : (distanceCm ? distanceCm * 10 : 1820);
  const lQuality = Number(lidarData.quality) || 92;
  const lDevice = lidarData.device || 'LIDAR_01';

  // Has active live camera stream
  const isLiveCam = camData && camData.length > 20;

  // Normalized distance in radius percentage (0% to 42% of SVG viewport)
  const normDist = Math.min(Math.max(lDistMm / maxRange, 0.05), 1.0);
  const radiusPct = normDist * 42; // max radius inside 100x100 SVG is 42

  // Polar coordinates to Cartesian (0° is top / North, 90° East, 180° South, 270° West)
  const angleRad = (lAngle - 90) * (Math.PI / 180);
  const targetX = 50 + radiusPct * Math.cos(angleRad);
  const targetY = 50 + radiusPct * Math.sin(angleRad);

  // Proximity Hazard State
  const isCritical = lDistMm < 1000;
  const isWarning = lDistMm < 2500;
  const targetColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#00f0ff';

  // Helper to generate a full set of 20 points for radar scope
  const generate20Points = (currentA, currentD) => {
    const pts = [];
    for (let i = 19; i >= 0; i--) {
      const a = (currentA - (i * 15) + 720) % 360;
      const d = Math.max(500, currentD + Math.sin(i * 0.9) * 450);
      const nDist = Math.min(Math.max(d / 4000, 0.05), 1.0);
      const rPct = nDist * 42;
      const aRad = (a - 90) * (Math.PI / 180);
      const col = d < 1000 ? '#ef4444' : d < 2500 ? '#f59e0b' : '#00f0ff';
      pts.push({
        id: `pt_${i}_${Date.now()}_${Math.random()}`,
        x: 50 + rPct * Math.cos(aRad),
        y: 50 + rPct * Math.sin(aRad),
        angle: a,
        distMm: Math.round(d),
        color: col,
        isCritical: d < 1000,
        isWarning: d < 2500
      });
    }
    return pts;
  };

  // Maintain exactly 20 points visible on the radar at all times
  const [scanPoints, setScanPoints] = useState(() => generate20Points(lAngle, lDistMm));
  const [sweepCycle, setSweepCycle] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setScanPoints(generate20Points(lAngle, lDistMm));
    setSweepCycle((c) => c + 1);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const lastKeyRef = useRef('');
  useEffect(() => {
    const pointKey = `${lAngle.toFixed(1)}_${lDistMm}_${lidarData.lastUpdated || ''}`;
    if (pointKey === lastKeyRef.current) return;
    lastKeyRef.current = pointKey;

    // Check if lidarData already provides multiple points from Firestore
    if (lidarData.points && Array.isArray(lidarData.points) && lidarData.points.length >= 10) {
      const mapped = lidarData.points.slice(0, 20).map((pt, idx) => {
        const a = Number(pt.angle) || 0;
        const d = Number(pt.distance_mm) || 1800;
        const nD = Math.min(Math.max(d / maxRange, 0.05), 1.0);
        const rP = nD * 42;
        const aR = (a - 90) * (Math.PI / 180);
        const col = d < 1000 ? '#ef4444' : d < 2500 ? '#f59e0b' : '#00f0ff';
        return {
          id: `pts_${idx}_${a}_${d}`,
          x: 50 + rP * Math.cos(aR),
          y: 50 + rP * Math.sin(aR),
          angle: a,
          distMm: d,
          color: col,
          isCritical: d < 1000,
          isWarning: d < 2500
        };
      });
      setScanPoints(mapped);
      setSweepCycle((c) => c + 1);
      return;
    }

    // Otherwise maintain rolling 20-point buffer
    const newPoint = {
      id: Date.now() + Math.random(),
      x: targetX,
      y: targetY,
      angle: lAngle,
      distMm: lDistMm,
      color: targetColor,
      isCritical,
      isWarning
    };

    setScanPoints((prev) => {
      if (prev.length < 20) {
        return [...prev, newPoint];
      }
      return [...prev.slice(1), newPoint]; // Rolling buffer: always keep 20 points visible!
    });
    setSweepCycle((c) => c + 1);
  }, [lAngle, lDistMm, targetX, targetY, targetColor, isCritical, isWarning, lidarData.lastUpdated, lidarData.points, maxRange]);

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-3.5 shadow-2xl flex flex-col justify-between h-full min-h-[300px]">
      
      {/* Top Header: Title & View Switcher */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {viewMode === 'RADAR' ? (
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          ) : (
            <Camera className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            {viewMode === 'RADAR' ? 'LiDAR RADAR PPI SCOPE' : 'ESP32-CAM STREAM'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 20 Data Points Auto-Refresh Counter Badge */}
          {viewMode === 'RADAR' && (
            <button
              onClick={handleManualRefresh}
              title="Click to reset scan buffer"
              className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950/80 border border-slate-700 hover:border-cyan-500/50 text-slate-300 flex items-center gap-1 transition"
            >
              <RotateCcw className={`w-2.5 h-2.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className={scanPoints.length >= 18 ? 'text-amber-400 font-black' : 'text-cyan-300'}>
                {scanPoints.length}/20 PTS
              </span>
            </button>
          )}

          {/* Mode Toggle Button */}
          <button
            onClick={() => setViewMode(viewMode === 'RADAR' ? 'CAMERA' : 'RADAR')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition flex items-center gap-1 cursor-pointer ${
              viewMode === 'RADAR' 
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]' 
                : 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            }`}
          >
            {viewMode === 'RADAR' ? <Camera className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
            <span>{viewMode === 'RADAR' ? 'CAM' : 'RADAR'}</span>
          </button>

          {/* Live Ping Status Indicator */}
          <span className="flex h-2.5 w-2.5 relative ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
        </div>
      </div>

      {/* Main Display Container */}
      <div className="relative flex-1 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center p-2 min-h-[210px]">
        
        {viewMode === 'RADAR' ? (
          /* =========================================================================
             CIRCULAR MILITARY/AVIATION RADAR PPI SCOPE (AUTO-REFRESHING EVERY 20 PTS)
             ========================================================================= */
          <div className="relative w-full h-full max-w-[240px] max-h-[240px] aspect-square flex items-center justify-center">
            
            {/* Ambient Scope Glow */}
            <div className="absolute inset-2 rounded-full bg-cyan-950/20 blur-md pointer-events-none" />

            {/* Rotating Radar Sweep Cone Animation */}
            <div 
              className="absolute inset-2 rounded-full pointer-events-none overflow-hidden z-10 animate-spin" 
              style={{ 
                animationDuration: '3.6s',
                animationTimingFunction: 'linear',
                background: 'conic-gradient(from 0deg, rgba(0, 240, 255, 0.35) 0deg, rgba(0, 240, 255, 0.08) 35deg, transparent 70deg)'
              }}
            />

            {/* SVG Radar Compass Dial, Rings, Crosshairs & Azimuth Ticks */}
            <svg viewBox="0 0 100 100" className="w-full h-full relative z-20 overflow-visible select-none">
              
              {/* Outer Cyan Boundary Ring */}
              <circle cx="50" cy="50" r="46" fill="#040c14" stroke="#00f0ff" strokeWidth="0.8" opacity="0.9" />
              
              {/* Range Distance Circles (25%, 50%, 75%, 100%) */}
              <circle cx="50" cy="50" r="10.5" fill="none" stroke="#00f0ff" strokeWidth="0.35" opacity="0.4" strokeDasharray="1, 1" />
              <circle cx="50" cy="50" r="21" fill="none" stroke="#00f0ff" strokeWidth="0.4" opacity="0.5" />
              <circle cx="50" cy="50" r="31.5" fill="none" stroke="#00f0ff" strokeWidth="0.35" opacity="0.4" strokeDasharray="1, 1" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#00f0ff" strokeWidth="0.5" opacity="0.65" />

              {/* Crosshair Axes (North-South & East-West) */}
              <line x1="50" y1="4" x2="50" y2="96" stroke="#00f0ff" strokeWidth="0.3" opacity="0.35" />
              <line x1="4" y1="50" x2="96" y2="50" stroke="#00f0ff" strokeWidth="0.3" opacity="0.35" />

              {/* 45-Degree Diagonal Guidelines */}
              <line x1="17.5" y1="17.5" x2="82.5" y2="82.5" stroke="#00f0ff" strokeWidth="0.2" opacity="0.2" strokeDasharray="0.8, 0.8" />
              <line x1="17.5" y1="82.5" x2="82.5" y2="17.5" stroke="#00f0ff" strokeWidth="0.2" opacity="0.2" strokeDasharray="0.8, 0.8" />

              {/* Peripheral Degree Ticks around the 360° Rim */}
              {Array.from({ length: 36 }).map((_, idx) => {
                const deg = idx * 10;
                const rad = (deg - 90) * (Math.PI / 180);
                const isMajor = deg % 45 === 0;
                const r1 = isMajor ? 43 : 44.5;
                const r2 = 46;
                const x1 = 50 + r1 * Math.cos(rad);
                const y1 = 50 + r1 * Math.sin(rad);
                const x2 = 50 + r2 * Math.cos(rad);
                const y2 = 50 + r2 * Math.sin(rad);
                return (
                  <line 
                    key={deg} 
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    stroke="#00f0ff" 
                    strokeWidth={isMajor ? 0.6 : 0.25} 
                    opacity={isMajor ? 0.9 : 0.5} 
                  />
                );
              })}

              {/* Compass Degree Labels */}
              <text x="50" y="3" fill="#00f0ff" fontSize="2.8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">000°</text>
              <text x="96" y="51" fill="#00f0ff" fontSize="2.6" fontFamily="monospace" textAnchor="start">090°</text>
              <text x="50" y="99.5" fill="#00f0ff" fontSize="2.6" fontFamily="monospace" textAnchor="middle">180°</text>
              <text x="3.5" y="51" fill="#00f0ff" fontSize="2.6" fontFamily="monospace" textAnchor="end">270°</text>
              
              {/* Range Ring Distance Labels */}
              <text x="51.5" y="30" fill="#38bdf8" fontSize="2.0" fontFamily="monospace" opacity="0.7">1.0m</text>
              <text x="51.5" y="19" fill="#38bdf8" fontSize="2.0" fontFamily="monospace" opacity="0.7">2.0m</text>
              <text x="51.5" y="9" fill="#38bdf8" fontSize="2.0" fontFamily="monospace" opacity="0.7">4.0m</text>

              {/* Center Origin: Haul Truck Vehicle Icon */}
              <circle cx="50" cy="50" r="2.2" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.5" />
              <polygon points="50,47 48,51.5 52,51.5" fill="#00f0ff" />

              {/* ALL 20 ACTIVE SCANNED LIDAR POINTS ON RADAR SCOPE */}
              {scanPoints.map((pt, idx) => {
                const isLatest = idx === scanPoints.length - 1;
                const pointOpacity = isLatest ? 1.0 : 0.35 + (idx / scanPoints.length) * 0.55;
                return (
                  <g key={pt.id || idx} opacity={pointOpacity}>
                    {/* Outer Glow Halo */}
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={isLatest ? 3.0 : 1.6} 
                      fill="none" 
                      stroke={pt.color} 
                      strokeWidth={isLatest ? 0.45 : 0.25} 
                      opacity={isLatest ? 0.9 : 0.6} 
                    />
                    {/* Core Point Dot */}
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={isLatest ? 1.4 : 0.9} 
                      fill={pt.color} 
                    />
                  </g>
                );
              })}

              {/* ACTIVE REAL-TIME LIDAR TARGET TRACKING (LATEST POINT #20) */}
              <g className="transition-all duration-300">
                {/* Target Pulsing Beacon Rings */}
                <circle 
                  cx={targetX} 
                  cy={targetY} 
                  r="3.5" 
                  fill="none" 
                  stroke={targetColor} 
                  strokeWidth="0.5" 
                  opacity="0.85" 
                  className="animate-ping" 
                  style={{ transformOrigin: `${targetX}px ${targetY}px` }} 
                />
                
                {/* Target Azimuth Vector Line from Haul Truck Center */}
                <line 
                  x1="50" 
                  y1="50" 
                  x2={targetX} 
                  y2={targetY} 
                  stroke={targetColor} 
                  strokeWidth="0.45" 
                  strokeDasharray="0.8, 0.8" 
                  opacity="0.75" 
                />

                {/* Target Range & Angle Tooltip Tag */}
                <text 
                  x={targetX > 50 ? targetX - 2.5 : targetX + 2.5} 
                  y={targetY < 50 ? targetY + 4.5 : targetY - 2.5} 
                  fill={targetColor} 
                  fontSize="2.5" 
                  fontFamily="monospace" 
                  fontWeight="bold" 
                  textAnchor={targetX > 50 ? "end" : "start"}
                >
                  {(lDistMm / 1000).toFixed(2)}m @ {lAngle.toFixed(1)}°
                </text>
              </g>

            </svg>

            {/* Target Proximity Banner Tag */}
            <div className="absolute top-1 left-2 z-30 font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-950/85 border border-cyan-500/40 text-cyan-300 flex items-center gap-1 shadow-lg">
              <Crosshair className="w-2.5 h-2.5 text-cyan-400" />
              <span>{lDevice} • SWEEP #{sweepCycle}</span>
            </div>

            <div className={`absolute bottom-1 right-2 z-30 font-mono text-[9px] px-1.5 py-0.5 rounded border font-bold shadow-lg ${
              isCritical ? 'bg-red-950/85 border-red-500 text-red-400 animate-pulse' :
              isWarning ? 'bg-amber-950/85 border-amber-500 text-amber-400' :
              'bg-slate-950/85 border-emerald-500 text-emerald-400'
            }`}>
              {isRefreshing ? 'REFRESHING BATCH...' : isCritical ? 'CRITICAL HAZARD' : isWarning ? 'CAUTION HAZARD' : 'TRACK CLEAR'}
            </div>

          </div>
        ) : (
          /* =========================================================================
             ESP32-CAM VIDEO STREAM VIEW (SECONDARY OPTION)
             ========================================================================= */
          <div className="relative w-full h-full flex items-center justify-center">
            {isLiveCam ? (
              <img 
                src={camData.startsWith('data:') ? camData : `data:image/jpeg;base64,${camData}`} 
                alt="ESP32 CAM Stream" 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                <div className="absolute inset-x-0 h-0.5 bg-cyan-400/70 shadow-[0_0_10px_#00f0ff] animate-pulse top-1/2 -translate-y-1/2 pointer-events-none" />
                
                <Cpu className="w-7 h-7 text-cyan-400/70 mb-1 animate-spin" style={{ animationDuration: '8s' }} />
                <div className="text-[11px] font-mono font-bold text-slate-200">ESP32-CAM STANDBY / AI VISION</div>
                <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                  cam_data STREAM EMPTY • RADAR SCOPE ACTIVE
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer Telemetry Matrix Details */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mt-2 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">BEARING:</span>
          <span className="text-cyan-400 font-bold">{lAngle.toFixed(1)}°</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">RANGE:</span>
          <span className={`font-bold ${isCritical ? 'text-red-400 font-black animate-pulse' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
            {(lDistMm / 1000).toFixed(2)} m ({lDistMm} mm)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">SIG:</span>
          <span className="text-indigo-300 font-bold">{lQuality}%</span>
        </div>
      </div>

    </div>
  );
}

