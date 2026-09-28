import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, ShieldAlert, CheckCircle2, Volume2, VolumeX } from 'lucide-react';

export function calculateVisibility(dustRaw = 4095, lightLux = -2, humidity = 58) {
  // Dust penalty (0 to 100)
  const dustPenalty = Math.min(100, (dustRaw / 4095) * 85);
  
  // Light factor: low lux reduces visibility
  let lightPenalty = 0;
  if (lightLux <= 0) lightPenalty = 30; // Dark night
  else if (lightLux < 50) lightPenalty = 15;

  // Humidity penalty (>80% adds fog penalty)
  let humidityPenalty = humidity > 80 ? 15 : 0;

  const visibilityScore = Math.max(0, Math.min(100, Math.round(100 - dustPenalty - lightPenalty - humidityPenalty)));

  let status = 'HIGH';
  let color = 'green';
  let message = 'CLEAR DRIVING CONDITIONS. OPTIMAL VISIBILITY.';
  let icon = CheckCircle2;

  if (visibilityScore < 35 || dustRaw > 3000) {
    status = 'LOW';
    color = 'red';
    message = `⚠️ CRITICAL: LOW VISIBILITY AHEAD! DUST LEVEL CRITICAL (${dustRaw}) • NIGHT LIGHT (${lightLux} lx)`;
    icon = ShieldAlert;
  } else if (visibilityScore < 70 || dustRaw > 1500) {
    status = 'MODERATE';
    color = 'amber';
    message = `MODERATE VISIBILITY REDUCTION. EXERCISE CAUTION (DUST: ${dustRaw}, LUX: ${lightLux})`;
    icon = AlertTriangle;
  }

  return { visibilityScore, status, color, message, icon };
}

export default function VisibilityAlertBanner({ sensorData }) {
  const [audioMuted, setAudioMuted] = useState(true);
  const { dust_raw, light_lux, humidity } = sensorData;

  const { visibilityScore, status, color, message } = calculateVisibility(
    dust_raw,
    light_lux,
    humidity
  );

  // Play warning audio tone if visibility is LOW and audio is unmuted
  useEffect(() => {
    if (!audioMuted && status === 'LOW') {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz warning pitch
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (err) {
        // Web audio restriction
      }
    }
  }, [status, dust_raw, audioMuted]);

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 shadow-xl ${
      status === 'LOW' ? 'bg-red-950/70 border-red-500/80 text-red-200 shadow-red-950/50 animate-pulse' :
      status === 'MODERATE' ? 'bg-amber-950/60 border-amber-500/60 text-amber-200' :
      'bg-slate-900/80 border-emerald-500/40 text-emerald-200'
    }`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Status & Gauge */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`p-3 rounded-xl flex items-center justify-center font-bold text-2xl shadow-inner ${
            status === 'LOW' ? 'bg-red-900/90 text-red-300 ring-2 ring-red-500' :
            status === 'MODERATE' ? 'bg-amber-900/90 text-amber-300' :
            'bg-emerald-900/90 text-emerald-300'
          }`}>
            {status === 'LOW' ? <ShieldAlert className="w-8 h-8 text-red-400 animate-bounce" /> :
             status === 'MODERATE' ? <AlertTriangle className="w-8 h-8 text-amber-400" /> :
             <Eye className="w-8 h-8 text-emerald-400" />}
          </div>

          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-slate-400">
              ENVIRONMENTAL SAFETY HUD • VISIBILITY ADVISORY
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-mono tracking-tight">
                VISIBILITY: <span className={
                  status === 'LOW' ? 'text-red-400' :
                  status === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
                }>{status}</span>
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                SCORE: {visibilityScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Driver Message Banner */}
        <div className="flex-1 text-center md:text-left px-2 font-mono text-sm leading-tight">
          <div className="font-semibold text-slate-100">{message}</div>
          <div className="text-xs text-slate-400 mt-1">
            DUST RAW: <span className="text-cyan-400 font-bold">{dust_raw ?? 4095}</span> • 
            LUX: <span className="text-amber-400 font-bold">{light_lux ?? -2} lx</span> • 
            HUMIDITY: <span className="text-blue-400 font-bold">{humidity ?? 58}%</span>
          </div>
        </div>

        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={() => setAudioMuted(!audioMuted)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-semibold transition border ${
            audioMuted ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' :
            'bg-cyan-900/60 border-cyan-500/60 text-cyan-300 hover:bg-cyan-800/80'
          }`}
          title="Toggle Hazard Audio Alert Beep"
        >
          {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />}
          <span>{audioMuted ? 'AUDIO MUTE' : 'AUDIO ALERT ON'}</span>
        </button>

      </div>
    </div>
  );
}
