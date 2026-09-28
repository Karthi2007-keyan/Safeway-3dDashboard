import React, { useState } from 'react';
import { Database, ShieldCheck, Play, Pause, RefreshCw, Copy, Check, X, Send, Radar } from 'lucide-react';
import { updateFirestoreSensorData, updateFirestoreLidarData } from '../firebase';

export const FIRESTORE_SECURITY_RULES = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // SafeWay ESP32 LIVE SENSOR DATA
    // Path: sensor_data/ESP32_01
    // ============================================
    match /sensor_data/{deviceId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if false;
    }

    // ============================================
    // SafeWay NEW LIDAR HARDWARE DATA COLLECTION
    // Path: lidar_data/{docId}
    // ============================================
    match /lidar_data/{docId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if false;
    }

    // ============================================
    // SafeWay SENSOR HISTORY LOGS
    // Path: sensor_history/{readingId}
    // ============================================
    match /sensor_history/{readingId} {
      allow read: if true;
      allow create: if true;
      allow update: if false;
      allow delete: if false;
    }

    // ============================================
    // BLOCK ALL OTHER UNGUARDED PATHS
    // ============================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

export default function FirestoreControlModal({ isOpen, onClose, currentSensorData, currentLidarData, isSimulating, setIsSimulating }) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [testForm, setTestForm] = useState({
    distance_cm: currentSensorData.distance_cm ?? 182,
    dust_raw: currentSensorData.dust_raw ?? 4095,
    light_lux: currentSensorData.light_lux ?? -2,
    temperature_c: currentSensorData.temperature_c ?? 28.9,
    humidity: currentSensorData.humidity ?? 58,
    accelX: currentSensorData.accelerometer?.x ?? 785,
    accelY: currentSensorData.accelerometer?.y ?? 247,
    // LiDAR fields
    lidar_distance_mm: currentLidarData?.distance_mm ?? 1210.5,
    lidar_angle: currentLidarData?.angle ?? 200.42,
    lidar_quality: currentLidarData?.quality ?? 12,
  });

  if (!isOpen) return null;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_SECURITY_RULES);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePushToFirestore = async () => {
    setIsUpdating(true);
    try {
      await updateFirestoreSensorData({
        distance_cm: Number(testForm.distance_cm),
        dust_raw: Number(testForm.dust_raw),
        light_lux: Number(testForm.light_lux),
        temperature_c: Number(testForm.temperature_c),
        humidity: Number(testForm.humidity),
        accelerometer: {
          x: Number(testForm.accelX),
          y: Number(testForm.accelY),
          z: 0
        }
      });

      await updateFirestoreLidarData({
        distance_mm: Number(testForm.lidar_distance_mm),
        angle: Number(testForm.lidar_angle),
        quality: Number(testForm.lidar_quality)
      });
    } catch (err) {
      alert("Error updating Firestore: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-cyan-500/40 bg-slate-900 text-slate-100 p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-xl font-bold font-mono text-cyan-300">FIRESTORE INPUT & HARDWARE SIMULATOR</h2>
              <p className="text-xs text-slate-400 font-mono">
                Target Collections: sensor_data/ESP32_01 • lidar_data/{'{docId}'} (LIDAR_01)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: ESP32 + LiDAR Test Controls */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold text-amber-400 flex items-center gap-2">
              <Send className="w-4 h-4" /> LIVE SENSOR INPUT CONTROLS (ESP32_01 & LIDAR_01)
            </h3>
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                isSimulating ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isSimulating ? 'SIMULATOR ACTIVE' : 'START AUTO SIMULATOR'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {/* ESP32 Controls */}
            <div>
              <label className="text-slate-400">ESP32 DISTANCE: {testForm.distance_cm} cm</label>
              <input 
                type="range" min="20" max="400" step="5"
                value={testForm.distance_cm}
                onChange={e => setTestForm({...testForm, distance_cm: e.target.value})}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-slate-400">DUST RAW: {testForm.dust_raw}</label>
              <input 
                type="range" min="100" max="4095" step="50"
                value={testForm.dust_raw}
                onChange={e => setTestForm({...testForm, dust_raw: e.target.value})}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-slate-400">LIGHT LUX: {testForm.light_lux} lx</label>
              <input 
                type="range" min="-10" max="500" step="10"
                value={testForm.light_lux}
                onChange={e => setTestForm({...testForm, light_lux: e.target.value})}
                className="w-full accent-yellow-400 cursor-pointer"
              />
            </div>

            {/* LiDAR_01 Controls */}
            <div className="border border-indigo-900/60 p-2.5 rounded-lg bg-indigo-950/30 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="font-bold text-indigo-300 md:col-span-3 flex items-center gap-1.5 text-xs">
                <Radar className="w-4 h-4 text-indigo-400" /> LIDAR_01 NEW COLLECTION INPUTS (lidar_data/{'{docId}'})
              </div>
              <div>
                <label className="text-indigo-300">LIDAR DISTANCE: {testForm.lidar_distance_mm} mm</label>
                <input 
                  type="range" min="0" max="5000" step="50"
                  value={testForm.lidar_distance_mm}
                  onChange={e => setTestForm({...testForm, lidar_distance_mm: e.target.value})}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-indigo-300">LIDAR ANGLE: {testForm.lidar_angle}°</label>
                <input 
                  type="range" min="0" max="360" step="0.5"
                  value={testForm.lidar_angle}
                  onChange={e => setTestForm({...testForm, lidar_angle: e.target.value})}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-indigo-300">SIGNAL QUALITY: {testForm.lidar_quality}%</label>
                <input 
                  type="range" min="0" max="100" step="1"
                  value={testForm.lidar_quality}
                  onChange={e => setTestForm({...testForm, lidar_quality: e.target.value})}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400">TEMP °C: {testForm.temperature_c}</label>
              <input 
                type="range" min="10" max="50" step="0.5"
                value={testForm.temperature_c}
                onChange={e => setTestForm({...testForm, temperature_c: e.target.value})}
                className="w-full accent-orange-400 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-slate-400">ACCEL X (Pitch): {testForm.accelX}</label>
              <input 
                type="range" min="-2000" max="2000" step="50"
                value={testForm.accelX}
                onChange={e => setTestForm({...testForm, accelX: e.target.value})}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-slate-400">ACCEL Y (Roll): {testForm.accelY}</label>
              <input 
                type="range" min="-2000" max="2000" step="50"
                value={testForm.accelY}
                onChange={e => setTestForm({...testForm, accelY: e.target.value})}
                className="w-full accent-blue-400 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handlePushToFirestore}
            disabled={isUpdating}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            PUSH ALL DATA TO FIRESTORE (sensor_data & lidar_data)
          </button>
        </div>

        {/* Section 2: Security Rules */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> FIRESTORE SECURITY RULES (UPDATED FOR lidar_data)
            </h3>
            <button
              onClick={handleCopyRules}
              className="px-3 py-1 rounded bg-slate-800 text-xs font-mono text-cyan-300 hover:bg-slate-700 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'COPIED TO CLIPBOARD' : 'COPY RULES'}
            </button>
          </div>
          
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[140px] leading-relaxed">
            {FIRESTORE_SECURITY_RULES}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-mono text-xs font-semibold"
          >
            CLOSE WINDOW
          </button>
        </div>

      </div>
    </div>
  );
}
