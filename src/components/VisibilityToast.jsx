import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, ShieldAlert, Eye, Volume2, VolumeX, CheckCircle2, X } from 'lucide-react';

export function calculateVisibility(dustRaw = 4095, lightLux = -2, humidity = 58) {
  const dustPenalty = Math.min(100, (dustRaw / 4095) * 85);
  
  let lightPenalty = 0;
  if (lightLux <= 0) lightPenalty = 30;
  else if (lightLux < 50) lightPenalty = 15;

  let humidityPenalty = humidity > 80 ? 15 : 0;

  const visibilityScore = Math.max(0, Math.min(100, Math.round(100 - dustPenalty - lightPenalty - humidityPenalty)));

  let status = 'HIGH';
  let color = 'emerald';
  let message = 'CLEAR DRIVING CONDITIONS. OPTIMAL VISIBILITY.';

  if (visibilityScore < 35 || dustRaw > 3000) {
    status = 'LOW';
    color = 'red';
    message = `CRITICAL LOW VISIBILITY AHEAD! REDUCE VEHICLE SPEED IMMEDIATELY (DUST: ${dustRaw}, LUX: ${lightLux})`;
  } else if (visibilityScore < 70 || dustRaw > 1500) {
    status = 'MODERATE';
    color = 'amber';
    message = `MODERATE VISIBILITY REDUCTION. EXERCISE CAUTION (DUST: ${dustRaw}, LUX: ${lightLux})`;
  }

  return { visibilityScore, status, color, message };
}

export default function VisibilityToast({ sensorData }) {
  const [audioMuted, setAudioMuted] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const audioCtxRef = useRef(null);

  const { dust_raw = 4095, light_lux = -2, humidity = 58, distance_cm = 182 } = sensorData;

  const { visibilityScore, status, message } = calculateVisibility(dust_raw, light_lux, humidity);

  // ORIGINAL AUDIO ALERT SOUND GENERATOR
  useEffect(() => {
    if (audioMuted || isDismissed) return;

    // Trigger siren tone on LOW/MODERATE visibility or Critical distance (<100cm)
    if (status === 'LOW' || status === 'MODERATE' || distance_cm < 100) {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Dual-tone siren frequency logic
        const startFreq = status === 'LOW' || distance_cm < 100 ? 660 : 440;
        const endFreq = status === 'LOW' || distance_cm < 100 ? 880 : 550;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (err) {
        // Audio policy handle
      }
    }
  }, [status, dust_raw, distance_cm, audioMuted, isDismissed]);

  if (isDismissed) {
    return (
      <button 
        onClick={() => setIsDismissed(false)}
        className="fixed top-20 right-4 z-40 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-xl flex items-center gap-1.5"
      >
        <Eye className="w-3.5 h-3.5 text-cyan-400" /> REOPEN SAFETY TOAST
      </button>
    );
  }

  return (
    <div className={`fixed top-20 right-4 z-40 w-full max-w-md rounded-xl border p-4 shadow-2xl backdrop-blur-md font-mono transition-all duration-300 ${
      status === 'LOW' ? 'bg-red-950/90 border-red-500 text-red-100 shadow-red-950/60 animate-pulse' :
      status === 'MODERATE' ? 'bg-amber-950/90 border-amber-500/80 text-amber-100 shadow-amber-950/50' :
      'bg-slate-900/90 border-emerald-500/60 text-emerald-100 shadow-slate-950/50'
    }`}>
      
      {/* Toast Top Line */}
      <div className="flex items-start justify-between border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-2">
          {status === 'LOW' ? <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" /> :
           status === 'MODERATE' ? <AlertTriangle className="w-5 h-5 text-amber-400" /> :
           <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
            ENVIRONMENTAL SAFETY HUD • VISIBILITY ADVISORY
          </span>
        </div>
        <button 
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-slate-100 p-0.5 rounded"
          title="Dismiss Toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Status & Score */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-black tracking-tight flex items-center gap-2">
          VISIBILITY: <span className={
            status === 'LOW' ? 'text-red-400' :
            status === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
          }>{status}</span>
        </div>
        <div className="text-xs font-bold px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-slate-200">
          SCORE: {visibilityScore}%
        </div>
      </div>

      {/* Message Text */}
      <div className="text-xs font-semibold leading-snug mb-2 text-slate-100">
        {message}
      </div>

      {/* Dust, Lux, Humidity Detail */}
      <div className="text-[11px] text-slate-300 border-t border-slate-800/60 pt-2 flex items-center justify-between flex-wrap gap-1">
        <div>
          DUST RAW: <span className="text-cyan-300 font-bold">{dust_raw}</span> • 
          LUX: <span className="text-amber-300 font-bold">{light_lux} lx</span> • 
          HUMIDITY: <span className="text-blue-300 font-bold">{humidity}%</span>
        </div>

        {/* Audio Mute/Unmute toggle */}
        <button
          onClick={() => setAudioMuted(!audioMuted)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition border mt-1 ${
            audioMuted ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' :
            'bg-cyan-500 text-slate-950 border-cyan-400 hover:bg-cyan-400 font-bold'
          }`}
        >
          {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
          <span>{audioMuted ? 'AUDIO MUTE' : 'AUDIO ALERT ON'}</span>
        </button>
      </div>

    </div>
  );
}
