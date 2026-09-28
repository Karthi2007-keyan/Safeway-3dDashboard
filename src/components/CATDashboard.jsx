import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Wifi, 
  Layers, 
  Database, 
  Clock, 
  Radio,
  SlidersHorizontal,
  Shield
} from 'lucide-react';
import ThreeCanvas from './ThreeCanvas';
import VisibilityToast from './VisibilityToast';
import TelemetryPanel from './TelemetryPanel';
import CameraFeedPanel from './CameraFeedPanel';
import TelemetryChart from './TelemetryChart';
import FirestoreControlModal from './FirestoreControlModal';
import { 
  subscribeToSensorData, 
  subscribeToLidarData, 
  DEFAULT_SENSOR_DATA, 
  DEFAULT_LIDAR_DATA, 
  updateFirestoreSensorData,
  updateFirestoreLidarData
} from '../firebase';

export default function CATDashboard() {
  const [sensorData, setSensorData] = useState(DEFAULT_SENSOR_DATA);
  const [lidarData, setLidarData] = useState(DEFAULT_LIDAR_DATA);
  const [isLive, setIsLive] = useState(false);
  const [cameraMode, setCameraMode] = useState('HUD'); // 'HUD' | 'DRIVER' | 'TOP_RADAR'
  const [showLidar, setShowLidar] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Realtime clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Subscribe to real-time Firestore sensor updates (sensor_data/ESP32_01)
  useEffect(() => {
    const unsubscribeSensor = subscribeToSensorData(
      (data) => {
        setSensorData(data);
        setIsLive(true);
      },
      (error) => {
        console.warn("Firestore sensor listener fallback:", error);
        setIsLive(false);
      }
    );

    const unsubscribeLidar = subscribeToLidarData(
      (lData) => {
        setLidarData(lData);
      },
      (lError) => {
        console.warn("Firestore LiDAR listener fallback:", lError);
      }
    );

    return () => {
      unsubscribeSensor();
      unsubscribeLidar();
    };
  }, []);

  // 2. Automated Simulation Loop for ESP32 and LiDAR
  useEffect(() => {
    if (!isSimulating) return;

    let dist = 320;
    let direction = -10;

    const interval = setInterval(() => {
      dist += direction;
      if (dist <= 60) direction = 15;
      if (dist >= 350) direction = -15;

      const simState = {
        distance_cm: dist,
        dust_raw: Math.round(3000 + Math.sin(Date.now() / 1000) * 1000),
        light_lux: -2,
        humidity: 62,
        temperature_c: 28.5,
        accelerometer: {
          x: Math.round(Math.sin(Date.now() / 800) * 800),
          y: Math.round(Math.cos(Date.now() / 900) * 400),
          z: 0
        }
      };

      const simLidarState = {
        device: "LIDAR_01",
        angle: parseFloat((25.4 + Math.sin(Date.now() / 700) * 15).toFixed(1)),
        distance_mm: Math.round(dist * 10),
        quality: Math.round(40 + Math.random() * 50)
      };

      setSensorData(simState);
      setLidarData(simLidarState);

      updateFirestoreSensorData(simState).catch(() => {});
      updateFirestoreLidarData(simLidarState).catch(() => {});
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* TOP HUD NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo Header */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.4)] ring-2 ring-emerald-300">
                <Shield className="w-6 h-6 text-slate-950 fill-current" />
              </div>
              <span className="text-2xl font-black font-mono tracking-wider bg-gradient-to-r from-emerald-300 via-cyan-300 to-white bg-clip-text text-transparent">
                SafeWay
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>SYSTEM ONLINE</span>
              </div>
            </div>
          </div>

          {/* Controls & Mode Toggles */}
          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end w-full md:w-auto font-mono text-xs">
            
            {/* Camera View Selector */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setCameraMode('HUD')}
                className={`px-3 py-1 rounded transition ${cameraMode === 'HUD' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                HUD 3D
              </button>
              <button
                onClick={() => setCameraMode('DRIVER')}
                className={`px-3 py-1 rounded transition ${cameraMode === 'DRIVER' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                CAB VIEW
              </button>
              <button
                onClick={() => setCameraMode('TOP_RADAR')}
                className={`px-3 py-1 rounded transition ${cameraMode === 'TOP_RADAR' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                RADAR
              </button>
              <button
                onClick={() => setCameraMode('ORBIT')}
                className={`px-3 py-1 rounded transition ${cameraMode === 'ORBIT' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                360° ORBIT
              </button>
            </div>

            {/* LiDAR Cloud Toggle */}
            <button
              onClick={() => setShowLidar(!showLidar)}
              className={`px-3.5 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition ${
                showLidar ? 'bg-indigo-900/60 border-indigo-500/60 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              LIDAR CLOUD: {showLidar ? 'ON' : 'OFF'}
            </button>

            {/* Input / Calibration Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <SlidersHorizontal className="w-4 h-4" />
              OVERRIDE / INPUT
            </button>

            {/* Realtime Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTime}</span>
            </div>

          </div>

        </div>
      </header>

      {/* FLOATING SAFETY TOAST MESSAGE WITH AUDIO ALERT */}
      <VisibilityToast sensorData={sensorData} />

      {/* MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-5 space-y-4">
        
        {/* EMERGENCY BRAKING CRITICAL OVERLAY WARNING */}
        {(sensorData.distance_cm || 182) < 100 && (
          <div className="bg-red-600 text-white font-mono font-black text-center py-2 px-4 rounded-xl shadow-2xl animate-bounce flex items-center justify-center gap-2 tracking-wider text-sm md:text-base border-2 border-white">
            <ShieldAlert className="w-6 h-6 animate-spin" />
            ⚠️ CRITICAL DANGER: OBSTACLE WITHIN 1.0 METER! AUTOMATIC BRAKING ENGAGED!
          </div>
        )}

        {/* 3D SCENE + SIDE PANELS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Main 3D Three.js Viewport (8 Columns) */}
          <div className="lg:col-span-8 h-[460px] md:h-[540px]">
            <ThreeCanvas 
              sensorData={sensorData} 
              lidarData={lidarData}
              cameraMode={cameraMode}
              showLidar={showLidar}
            />
          </div>

          {/* Right Column (4 Columns) - Camera Feed & Telemetry Chart */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex-1">
              <CameraFeedPanel 
                camData={sensorData.cam_data} 
                distanceCm={sensorData.distance_cm}
                dustRaw={sensorData.dust_raw}
                lidarData={lidarData}
              />
            </div>
            <div className="h-[200px]">
              <TelemetryChart sensorData={sensorData} />
            </div>
          </div>

        </div>

        {/* BOTTOM SENSOR TELEMETRY PANEL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" /> LIVE SENSOR DATA MATRIX • ESP32_01 & LIDAR_01 (HD7fm20GNhmoCVglEYzd)
            </h2>
            <span className="text-[10px] font-mono text-indigo-400 font-bold">LIDAR: {lidarData.device || 'LIDAR_01'} ({lidarData.distance_mm || 1532} mm @ {lidarData.angle || 25.4}°)</span>
          </div>
          <TelemetryPanel sensorData={sensorData} lidarData={lidarData} />
        </div>

      </main>

      {/* CLEAN MINIMALIST FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-4 text-center font-mono text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto w-full gap-2">
        <div>SafeWay 3D Dashboard</div>
        <div className="text-cyan-400 font-bold">Realtime ESP32 & LiDAR Hardware Feed</div>
      </footer>

      {/* INPUT MODAL */}
      <FirestoreControlModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentSensorData={sensorData}
        currentLidarData={lidarData}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
      />

    </div>
  );
}
