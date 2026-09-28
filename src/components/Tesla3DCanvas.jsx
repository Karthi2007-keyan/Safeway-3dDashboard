import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * SafeWay Heavy Duty Mining Truck & Road Terrain 3D Telemetry Canvas
 * Powered by Three.js GLTFLoader.
 * 
 * Synchronized with:
 * - 3D GLTF Truck Model (/models/truck/scene.gltf)
 * - 3D GLTF Road Terrain Model (/models/road_terrain/scene.gltf)
 * - ADXL345 Accelerometer (Chassis Roll & Pitch Tilt)
 * - Ultrasonic HC-SR04 (Dynamic 3D Obstacle & Sonar Range Rings)
 * - BH1750 Light Sensor (Ambient Sunlight & LED Spotlights)
 * - GP2Y1010AU0F Dust Sensor (Dynamic Dust Cloud & Visibility Haze)
 */
export const Tesla3DCanvas = ({ telemetry }) => {
  const mountRef = useRef(null);
  const [cameraView, setCameraView] = useState("ISO"); // ISO, FRONT, CHASE, TOP
  const [loadingState, setLoadingState] = useState({ truckLoaded: false, terrainLoaded: false, error: null });

  // Extract sensor telemetry values safely
  const speedKmh = telemetry?.system?.speedKmh ?? 65;
  const pitchDeg = telemetry?.adxl345?.pitchDeg ?? 0;
  const rollDeg = telemetry?.adxl345?.rollDeg ?? 0;
  const accelX = telemetry?.adxl345?.accelX ?? 0.08;
  const accelY = telemetry?.adxl345?.accelY ?? -0.02;
  const accelZ = telemetry?.adxl345?.accelZ ?? 0.98;
  const distanceCm = telemetry?.ultrasonic?.distanceCm ?? 185;
  const lux = telemetry?.bh1750?.lux ?? 480;
  const dustMgM3 = telemetry?.gp2y1010au0f?.dustDensityMgM3 ?? 0.045;
  const autobrakeActive = telemetry?.system?.autobrakeActive ?? false;

  const sceneRef = useRef(null);
  const truckGroupRef = useRef(null);
  const terrainGroupRef = useRef(null);
  const obstacleMeshRef = useRef(null);
  const sonarRingRef = useRef(null);
  const spotlightsRef = useRef([]);
  const dirLightRef = useRef(null);
  const dustParticlesRef = useRef(null);
  const cameraRef = useRef(null);
  const targetCameraPos = useRef({ x: 9, y: 5.5, z: 12 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x070a12);
    const fog = new THREE.FogExp2(0x070a12, 0.02);
    scene.fog = fog;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    camera.position.set(9, 5.5, 12);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfde047, 2.8);
    dirLight.position.set(20, 35, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-20, 20, -15);
    scene.add(fillLight);

    // 5. Container Groups for Models
    const truckGroup = new THREE.Group();
    truckGroupRef.current = truckGroup;
    scene.add(truckGroup);

    const terrainGroup = new THREE.Group();
    terrainGroupRef.current = terrainGroup;
    scene.add(terrainGroup);

    // Fallback Grid Floor (if terrain is loading)
    const gridHelper = new THREE.GridHelper(100, 50, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // 6. GLTF Loader Setup
    const loader = new GLTFLoader();

    // Load Road Terrain Model
    loader.load(
      "/models/road_terrain/scene.gltf",
      (gltf) => {
        const terrainScene = gltf.scene;
        terrainScene.traverse((child) => {
          if (child.isMesh) {
            child.receiveShadow = true;
            child.castShadow = true;
            if (child.material) {
              child.material.roughness = 0.85;
            }
          }
        });

        // Bounding Box Scaling for Terrain
        const bbox = new THREE.Box3().setFromObject(terrainScene);
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.z);
        const scaleFactor = 45 / maxDim;
        terrainScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Center Terrain
        const center = bbox.getCenter(new THREE.Vector3());
        terrainScene.position.set(-center.x * scaleFactor, -bbox.min.y * scaleFactor - 0.2, -center.z * scaleFactor);

        terrainGroup.add(terrainScene);
        setLoadingState((prev) => ({ ...prev, terrainLoaded: true }));
      },
      undefined,
      (err) => {
        console.warn("Road terrain GLTF model load error, using high-tech grid floor:", err);
      }
    );

    // Load Mining Truck Model
    loader.load(
      "/models/truck/scene.gltf",
      (gltf) => {
        const truckScene = gltf.scene;
        truckScene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Bounding Box Scaling for Truck
        const bbox = new THREE.Box3().setFromObject(truckScene);
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 4.2 / maxDim; // Normalize truck length to ~4.2 units
        truckScene.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Center Pivot at Bottom Base of Truck
        const center = bbox.getCenter(new THREE.Vector3());
        truckScene.position.set(
          -center.x * scaleFactor,
          -bbox.min.y * scaleFactor,
          -center.z * scaleFactor
        );

        truckGroup.add(truckScene);

        // Add Headlight Spotlights to Truck Bumper
        const spot1 = new THREE.SpotLight(0xfef08a, 10, 25, Math.PI / 6, 0.4);
        spot1.position.set(0.9, 1.2, 2.5);
        spot1.target.position.set(0.9, 0.2, 12);
        truckGroup.add(spot1);
        truckGroup.add(spot1.target);

        const spot2 = new THREE.SpotLight(0xfef08a, 10, 25, Math.PI / 6, 0.4);
        spot2.position.set(-0.9, 1.2, 2.5);
        spot2.target.position.set(-0.9, 0.2, 12);
        truckGroup.add(spot2);
        truckGroup.add(spot2.target);

        spotlightsRef.current = [spot1, spot2];

        setLoadingState((prev) => ({ ...prev, truckLoaded: true }));
      },
      undefined,
      (err) => {
        console.warn("Truck GLTF model load fallback:", err);
        // Create procedural heavy truck geometry if fallback needed
        const fallbackGeo = new THREE.BoxGeometry(2.4, 1.8, 4.5);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.3 });
        const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        fallbackMesh.position.y = 1.0;
        truckGroup.add(fallbackMesh);
      }
    );

    // 7. Dynamic 3D Obstacle & Sonar Range Visualizer (HC-SR04 Ultrasonic Sensor)
    const obstacleGroup = new THREE.Group();
    const obstacleGeo = new THREE.DodecahedronGeometry(0.75, 1);
    const obstacleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.3, roughness: 0.7, wireframe: false });
    const obstacleMesh = new THREE.Mesh(obstacleGeo, obstacleMat);
    obstacleMesh.castShadow = true;
    obstacleGroup.add(obstacleMesh);

    // Hazard Marker Ring around Obstacle
    const obsRingGeo = new THREE.RingGeometry(0.85, 1.05, 32);
    obsRingGeo.rotateX(-Math.PI / 2);
    const obsRingMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const obsRingMesh = new THREE.Mesh(obsRingGeo, obsRingMat);
    obsRingMesh.position.y = -0.7;
    obstacleGroup.add(obsRingMesh);

    obstacleGroup.position.set(0, 0.75, 4.5);
    scene.add(obstacleGroup);
    obstacleMeshRef.current = obstacleGroup;

    // Sonar Proximity Ring attached to Truck Front
    const sonarGeo = new THREE.RingGeometry(1.8, 2.1, 48);
    sonarGeo.rotateX(-Math.PI / 2);
    const sonarMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const sonarMesh = new THREE.Mesh(sonarGeo, sonarMat);
    sonarMesh.position.set(0, 0.1, 1.5);
    truckGroup.add(sonarMesh);
    sonarRingRef.current = sonarMesh;

    // 8. Dust Particle Cloud System (GP2Y1010AU0F Dust Sensor)
    const pCount = 350;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 35;
      pPos[i + 1] = Math.random() * 8;
      pPos[i + 2] = (Math.random() - 0.5) * 35;
    }

    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xf59e0b, size: 0.12, transparent: true, opacity: 0.4 });
    const pSystem = new THREE.Points(pGeo, pMat);
    scene.add(pSystem);
    dustParticlesRef.current = pSystem;

    // 9. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Terrain / Grid Motion based on vehicle speed
      if (terrainGroupRef.current) {
        terrainGroupRef.current.position.z = (elapsedTime * (speedKmh / 15)) % 10;
      }
      gridHelper.position.z = (elapsedTime * (speedKmh / 15)) % 2;

      // Pulse Obstacle Ring & Sonar Radar
      if (obstacleMeshRef.current) {
        const pulse = 1 + Math.sin(elapsedTime * 6) * 0.15;
        obstacleMeshRef.current.scale.set(pulse, pulse, pulse);
        obstacleMeshRef.current.rotation.y += delta * 0.5;
      }

      if (sonarRingRef.current) {
        const sPulse = 1 + Math.sin(elapsedTime * 4) * 0.1;
        sonarRingRef.current.scale.set(sPulse, sPulse, sPulse);
      }

      // Smooth Camera Transition
      if (cameraRef.current) {
        cameraRef.current.position.x += (targetCameraPos.current.x - cameraRef.current.position.x) * 0.05;
        cameraRef.current.position.y += (targetCameraPos.current.y - cameraRef.current.position.y) * 0.05;
        cameraRef.current.position.z += (targetCameraPos.current.z - cameraRef.current.position.z) * 0.05;
        cameraRef.current.lookAt(0, 1.2, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  // Real-time Telemetry Updates
  useEffect(() => {
    if (!truckGroupRef.current) return;

    // 1. ADXL345 Accelerometer Chassis Roll & Pitch Rotation
    const targetPitch = (pitchDeg * Math.PI) / 180;
    const targetRoll = (rollDeg * Math.PI) / 180;
    truckGroupRef.current.rotation.x = targetPitch;
    truckGroupRef.current.rotation.z = -targetRoll;

    // 2. Ultrasonic HC-SR04 Obstacle Position & Proximity Radar
    if (obstacleMeshRef.current) {
      // Map distanceCm (e.g. 30cm to 300cm) to 3D Z-coordinate (2.5m to 12m)
      const mappedZ = Math.max(2.2, Math.min(14, (distanceCm / 100) * 3.5));
      obstacleMeshRef.current.position.z = mappedZ;
    }

    if (sonarRingRef.current) {
      const ringMat = sonarRingRef.current.material;
      if (distanceCm < 50 || autobrakeActive) {
        ringMat.color.setHex(0xef4444); // Red Alarm
      } else if (distanceCm < 120) {
        ringMat.color.setHex(0xf59e0b); // Amber Warning
      } else {
        ringMat.color.setHex(0x06b6d4); // Cyan Safe
      }
    }

    // 3. BH1750 Ambient Light Sensor Daylight / Night Lighting
    spotlightsRef.current.forEach((spot) => {
      spot.intensity = lux < 350 ? 14 : 2;
    });

    if (dirLightRef.current) {
      dirLightRef.current.intensity = Math.max(0.4, Math.min(3.5, lux / 180));
    }

    // 4. GP2Y1010AU0F Dust Sensor Cloud Density Haze
    if (dustParticlesRef.current) {
      dustParticlesRef.current.material.opacity = Math.min(0.95, dustMgM3 * 10);
    }

    if (sceneRef.current?.fog) {
      sceneRef.current.fog.density = 0.015 + Math.min(0.06, dustMgM3 * 0.2);
    }
  }, [pitchDeg, rollDeg, distanceCm, lux, dustMgM3, autobrakeActive]);

  // View Presets
  const setPresetView = (view) => {
    setCameraView(view);
    if (view === "ISO") targetCameraPos.current = { x: 9, y: 5.5, z: 12 };
    if (view === "FRONT") targetCameraPos.current = { x: 0, y: 2.2, z: 10 };
    if (view === "CHASE") targetCameraPos.current = { x: 0, y: 4.5, z: -10 };
    if (view === "TOP") targetCameraPos.current = { x: 0, y: 16, z: 0.1 };
  };

  return (
    <div className="relative w-full h-[480px] lg:h-[540px] rounded-2xl overflow-hidden glass-panel border border-cyan-500/30 shadow-2xl">
      
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: SAFEWAY LIVE Telemetry Cockpit Header */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/40 pointer-events-auto">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-sm font-mono tracking-wider text-cyan-300 font-bold">
            SAFEWAY LIVE ● ESP32_01
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/70 px-3 py-1 rounded-lg backdrop-blur">
          <span>GLTF HEAVY TRUCK & ROAD TERRAIN READY</span>
        </div>
      </div>

      {/* Top Right: Camera View Selector Presets */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 pointer-events-auto">
        {["ISO", "FRONT", "CHASE", "TOP"].map((mode) => (
          <button
            key={mode}
            onClick={() => setPresetView(mode)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg font-semibold transition-all ${
              cameraView === mode
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-extrabold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Bottom Overlay: Real-Time Hardware Sensor Strip */}
      <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-xl p-4 rounded-xl border border-cyan-500/30 shadow-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center font-mono">
          
          <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">Distance (HC-SR04)</span>
            <span className={`text-base font-extrabold ${distanceCm < 50 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>
              {distanceCm} <span className="text-[10px] text-slate-400 font-normal">CM</span>
            </span>
          </div>

          <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">Dust Density (GP2Y)</span>
            <span className="text-base font-extrabold text-amber-400">
              {dustMgM3} <span className="text-[10px] text-slate-400 font-normal">mg/m³</span>
            </span>
          </div>

          <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">Illuminance (BH1750)</span>
            <span className="text-base font-extrabold text-yellow-400">
              {lux} <span className="text-[10px] text-slate-400 font-normal">LX</span>
            </span>
          </div>

          <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">Temperature (DHT11)</span>
            <span className="text-base font-extrabold text-emerald-400">
              {telemetry?.dht11?.tempC ?? 28.9} <span className="text-[10px] text-slate-400 font-normal">°C</span>
            </span>
          </div>

          <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">Humidity (DHT11)</span>
            <span className="text-base font-extrabold text-sky-400">
              {telemetry?.dht11?.humidityPct ?? 58} <span className="text-[10px] text-slate-400 font-normal">%</span>
            </span>
          </div>

          <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">Acceleration (ADXL345)</span>
            <span className="text-xs font-bold text-slate-200">
              X:{accelX} Y:{accelY} Z:{accelZ}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};
