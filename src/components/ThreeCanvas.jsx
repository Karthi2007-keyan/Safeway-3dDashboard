import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Maximize2, 
  Minimize2, 
  Activity, 
  Radar, 
  Compass, 
  ShieldAlert, 
  Zap, 
  Eye, 
  Truck, 
  Navigation,
  Layers,
  RotateCcw
} from 'lucide-react';

/**
 * SafeWay Heavy-Duty Mining Truck & Quarry Road 3D Telemetry Canvas
 * Powered by Three.js & GLTFLoader
 * 
 * Hardware Sensor Integration:
 * - 3D GLTF Heavy Mining Truck (/models/truck/scene.gltf)
 * - 3D GLTF Road Terrain (/models/road_terrain/scene.gltf)
 * - ADXL345 3-Axis Accelerometer (Chassis Pitch, Roll & Vibration)
 * - HC-SR04 Ultrasonic Distance Sensor (Dynamic 3D Obstacle & Sonar Rangefinder)
 * - GP2Y1010AU0F Optical Dust Sensor (Volumetric Quarry Dust Storm & Fog Density)
 * - BH1750 Ambient Light Sensor (Sunlight Exposure & Adaptive Headlights)
 * - LiDAR_01 Spatial Distance & Angle Scanner (Holographic Point Cloud)
 */
export default function ThreeCanvas({ sensorData, lidarData, cameraMode = 'HUD', showLidar = true }) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  
  // Three.js Core Refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  // 3D Object Refs
  const truckGroupRef = useRef(null);
  const truckModelRef = useRef(null);
  const wheelsRef = useRef([]);
  const roadTerrainGroupRef = useRef(null);
  const roadTerrainTilesRef = useRef([]);
  const holographicPathRef = useRef(null);
  const chevronArrowsRef = useRef([]);
  const obstacleRef = useRef(null);
  const reticleRef = useRef(null);
  const floorDecalRef = useRef(null);
  const laserBeamRef = useRef(null);
  const sonarRipplesRef = useRef([]);
  const plumeParticlesRef = useRef(null);
  const hazeParticlesRef = useRef(null);
  const headlightConesRef = useRef([]);
  const lidarPointsRef = useRef(null);
  const headlightsRef = useRef([]);
  const dirLightRef = useRef(null);
  const ambientLightRef = useRef(null);
  const handleResizeRef = useRef(null);

  // Component UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ truck: 0, road: 0, ready: false });
  const [modelStatus, setModelStatus] = useState({ truckLoaded: false, roadLoaded: false });

  // Smooth lerp target buffer for real-time sensor streams
  const targetDataRef = useRef({
    distance_cm: sensorData.distance_cm ?? 182,
    dust_raw: sensorData.dust_raw ?? 4095,
    light_lux: sensorData.light_lux ?? -2,
    accelX: sensorData.accelerometer?.x ?? 785,
    accelY: sensorData.accelerometer?.y ?? 247,
    accelZ: sensorData.accelerometer?.z ?? 0,
    lidar_dist: lidarData?.distance_mm ?? 1532,
    lidar_angle: lidarData?.angle ?? 25.4,
    lidar_quality: lidarData?.quality ?? 45,
  });

  useEffect(() => {
    targetDataRef.current = {
      distance_cm: sensorData.distance_cm ?? 182,
      dust_raw: sensorData.dust_raw ?? 4095,
      light_lux: sensorData.light_lux ?? -2,
      accelX: sensorData.accelerometer?.x ?? 785,
      accelY: sensorData.accelerometer?.y ?? 247,
      accelZ: sensorData.accelerometer?.z ?? 0,
      lidar_dist: lidarData?.distance_mm ?? 1532,
      lidar_angle: lidarData?.angle ?? 25.4,
      lidar_quality: lidarData?.quality ?? 45,
    };
  }, [sensorData, lidarData]);

  // Fullscreen Handler
  useEffect(() => {
    const handleFsChange = () => {
      const fsActive = !!document.fullscreenElement;
      setIsFullscreen(fsActive);
      setTimeout(() => {
        if (handleResizeRef.current) handleResizeRef.current();
      }, 100);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement && !isFullscreen) {
      if (wrapperRef.current.requestFullscreen) {
        wrapperRef.current.requestFullscreen().catch(() => setIsFullscreen(true));
      } else if (wrapperRef.current.webkitRequestFullscreen) {
        wrapperRef.current.webkitRequestFullscreen();
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => setIsFullscreen(false));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else {
        setIsFullscreen(false);
      }
    }
  };

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. SCENE CREATION & FOG
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const baseSkyColor = 0x070c18;
    scene.background = new THREE.Color(baseSkyColor);
    // Dynamic Exponential Fog (will react to optical dust sensor)
    scene.fog = new THREE.FogExp2(baseSkyColor, 0.015);

    // 2. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 800);
    camera.position.set(0, 4.2, 9.5);
    camera.lookAt(0, 1.2, -12);
    cameraRef.current = camera;

    // 3. WEBGL RENDERER
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. ORBIT CONTROLS (for Interactive 360 Inspection)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Don't clip beneath ground
    controls.minDistance = 2.5;
    controls.maxDistance = 120;
    controls.target.set(0, 1.2, -3);
    controls.enabled = (cameraMode === 'ORBIT');
    controlsRef.current = controls;

    // 5. LIGHTING SYSTEM
    const ambientLight = new THREE.AmbientLight(0xddeeff, 0.65);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    dirLight.position.set(25, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Secondary Cyan/Blue Horizon Fill Light for Sci-Fi Mining Contrast
    const fillLight = new THREE.DirectionalLight(0x00f0ff, 0.7);
    fillLight.position.set(-20, 15, -25);
    scene.add(fillLight);

    // 6. ROAD TERRAIN CONTAINER & PROCEDURAL HIGHWAY BACKING
    const roadGroup = new THREE.Group();
    scene.add(roadGroup);
    roadTerrainGroupRef.current = roadGroup;

    // Sub-base Ground Plane for infinity quarry bedrock
    const bedrockGeo = new THREE.PlaneGeometry(350, 400);
    const bedrockMat = new THREE.MeshStandardMaterial({
      color: 0x080c14,
      roughness: 0.95,
      metalness: 0.1
    });
    const bedrock = new THREE.Mesh(bedrockGeo, bedrockMat);
    bedrock.rotation.x = -Math.PI / 2;
    bedrock.position.set(0, -0.15, -50);
    bedrock.receiveShadow = true;
    roadGroup.add(bedrock);

    // High-Tech Autonomous Mining Grid
    const miningGrid = new THREE.GridHelper(300, 75, 0x00f0ff, 0x1e293b);
    miningGrid.position.set(0, -0.1, -50);
    roadGroup.add(miningGrid);

    // Solid Highway Asphalt Surface directly beneath the truck tires
    const roadAsphaltGeo = new THREE.PlaneGeometry(8.2, 280);
    const roadAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep asphalt dark slate
      roughness: 0.88,
      metalness: 0.12
    });
    const roadAsphalt = new THREE.Mesh(roadAsphaltGeo, roadAsphaltMat);
    roadAsphalt.rotation.x = -Math.PI / 2;
    roadAsphalt.position.set(0, 0.0, -60);
    roadAsphalt.receiveShadow = true;
    roadGroup.add(roadAsphalt);

    // Dashed road center markings
    const centerDashesGroup = new THREE.Group();
    for (let dz = 40; dz > -180; dz -= 7) {
      const dashGeo = new THREE.PlaneGeometry(0.22, 3.8);
      const dashMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.7 });
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.02, dz);
      centerDashesGroup.add(dash);
    }
    roadGroup.add(centerDashesGroup);

    // 7. HOLOGRAPHIC SAFEWAY AUTONOMOUS CORRIDOR (Tesla FSD-inspired ribbon on Road)
    const fsdRibbonGeo = new THREE.PlaneGeometry(4.2, 180, 1, 60);
    const fsdRibbonMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide
    });
    const fsdRibbon = new THREE.Mesh(fsdRibbonGeo, fsdRibbonMat);
    fsdRibbon.rotation.x = -Math.PI / 2;
    fsdRibbon.position.set(0, 0.04, -55);
    roadGroup.add(fsdRibbon);
    holographicPathRef.current = fsdRibbon;

    // Outer Neon Highway Boundary Strips
    const boundaryGeo = new THREE.PlaneGeometry(0.18, 180);
    const boundaryMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8
    });
    const leftBoundary = new THREE.Mesh(boundaryGeo, boundaryMat);
    leftBoundary.rotation.x = -Math.PI / 2;
    leftBoundary.position.set(-2.2, 0.05, -55);
    roadGroup.add(leftBoundary);

    const rightBoundary = new THREE.Mesh(boundaryGeo, boundaryMat);
    rightBoundary.rotation.x = -Math.PI / 2;
    rightBoundary.position.set(2.2, 0.05, -55);
    roadGroup.add(rightBoundary);

    // Flowing Neon Directional Chevrons
    const chevrons = [];
    for (let i = 0; i < 18; i++) {
      const chevronGeo = new THREE.RingGeometry(0.3, 0.55, 3, 1, 0, Math.PI);
      const chevronMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const chevron = new THREE.Mesh(chevronGeo, chevronMat);
      chevron.rotation.x = -Math.PI / 2;
      chevron.rotation.z = Math.PI; // point forward
      chevron.position.set(0, 0.06, - (i * 9) + 10);
      roadGroup.add(chevron);
      chevrons.push(chevron);
    }
    chevronArrowsRef.current = chevrons;

    // 8. MINING TRUCK VEHICLE GROUP
    const truckGroup = new THREE.Group();
    truckGroup.position.set(0, 0, 0);
    scene.add(truckGroup);
    truckGroupRef.current = truckGroup;

    // Headlight Spotlights on Truck Front Bumper (Front bumper is at z = -2.6)
    const spotL = new THREE.SpotLight(0xfffbeb, 6.0, 50, Math.PI / 5, 0.35, 1.2);
    spotL.position.set(-1.0, 1.4, -2.6);
    spotL.target.position.set(-1.0, 0.2, -35);
    spotL.castShadow = true;
    truckGroup.add(spotL);
    truckGroup.add(spotL.target);

    const spotR = new THREE.SpotLight(0xfffbeb, 6.0, 50, Math.PI / 5, 0.35, 1.2);
    spotR.position.set(1.0, 1.4, -2.6);
    spotR.target.position.set(1.0, 0.2, -35);
    spotR.castShadow = true;
    truckGroup.add(spotR);
    truckGroup.add(spotR.target);

    // Roof LED Mining Light Bar
    const roofLight = new THREE.SpotLight(0x38bdf8, 3.5, 40, Math.PI / 4, 0.5);
    roofLight.position.set(0, 3.2, -1.8);
    roofLight.target.position.set(0, 0.2, -30);
    truckGroup.add(roofLight);
    truckGroup.add(roofLight.target);

    headlightsRef.current = [spotL, spotR, roofLight];

    // Volumetric Headlight Dust Scattering Cones
    const coneGeo = new THREE.CylinderGeometry(0.12, 1.8, 22, 20, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, -11); // Extends forward along -Z from bumper
    const coneMatL = new THREE.MeshBasicMaterial({
      color: 0xfff6dd,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const coneMeshL = new THREE.Mesh(coneGeo, coneMatL);
    coneMeshL.position.set(-1.0, 1.4, -2.6);
    truckGroup.add(coneMeshL);

    const coneMatR = coneMatL.clone();
    const coneMeshR = new THREE.Mesh(coneGeo, coneMatR);
    coneMeshR.position.set(1.0, 1.4, -2.6);
    truckGroup.add(coneMeshR);

    headlightConesRef.current = [coneMeshL, coneMeshR];

    // Rear Red Safety Beacon / Tail Light Glow (Rear bed is at z = +2.7)
    const tailGlow = new THREE.PointLight(0xef4444, 2.0, 10);
    tailGlow.position.set(0, 1.8, 2.7);
    truckGroup.add(tailGlow);

    // 9. PROCEDURAL BACKUP TRUCK (Displayed while GLTF is streaming - Cab at -Z, Bed at +Z)
    const backupGroup = new THREE.Group();
    const cabGeo = new THREE.BoxGeometry(2.3, 1.6, 2.2);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.7 });
    const cabMesh = new THREE.Mesh(cabGeo, cabMat);
    cabMesh.position.set(0, 1.5, -1.2);
    cabMesh.castShadow = true;
    backupGroup.add(cabMesh);

    const bedGeo = new THREE.BoxGeometry(2.5, 1.5, 3.0);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.8 });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.set(0, 1.6, 1.4);
    bedMesh.castShadow = true;
    backupGroup.add(bedMesh);
    truckGroup.add(backupGroup);

    // 10. GLTF MODEL LOADERS (Truck & Road Terrain)
    const gltfLoader = new GLTFLoader();

    // A. Load Road Terrain Model
    gltfLoader.load(
      '/models/road_terrain/scene.gltf',
      (gltf) => {
        const roadScene = gltf.scene;
        roadScene.traverse((child) => {
          if (child.isMesh) {
            child.receiveShadow = true;
            child.castShadow = false;
            if (child.material) {
              child.material.roughness = 0.92;
              child.material.metalness = 0.05;
            }
          }
        });

        // Compute Bounding Box & Scale Terrain
        const bbox = new THREE.Box3().setFromObject(roadScene);
        const size = bbox.getSize(new THREE.Vector3());
        const center = bbox.getCenter(new THREE.Vector3());
        console.log('Road Scene Raw BBox Size:', size, 'Center:', center);

        // Scale terrain so it flanks the road as open-pit quarry walls
        const targetWidth = 180;
        const scale = targetWidth / Math.max(size.x, size.z);
        roadScene.scale.set(scale, scale, scale);

        // Lower terrain elevation so that the road centerline sits at y = -0.15 beneath the highway
        roadScene.position.set(
          -center.x * scale,
          -340 * scale - 0.25,
          -center.z * scale - 25
        );

        // Clone tile 2 for continuous quarry track
        const roadTile2 = roadScene.clone();
        roadTile2.position.z = roadScene.position.z - (size.z * scale);

        roadGroup.add(roadScene);
        roadGroup.add(roadTile2);
        roadTerrainTilesRef.current = [roadScene, roadTile2];

        setModelStatus((prev) => ({ ...prev, roadLoaded: true }));
        setLoadingProgress((prev) => ({ ...prev, road: 100 }));
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadingProgress((prev) => ({ ...prev, road: pct }));
        }
      },
      (err) => {
        console.warn('Road terrain GLTF model load notice (using bedrock terrain):', err);
      }
    );

    // B. Load Authentic Heavy-Duty Mine Operation Dump Truck (free_old_mine_dump_truck)
    gltfLoader.load(
      '/models/free_old_mine_dump_truck/scene.gltf',
      (gltf) => {
        const truckScene = gltf.scene;
        console.log('--- FREE OLD MINE DUMP TRUCK LOADED ---');

        // Wheel meshes collection
        const wheels = [];

        // Enhance materials with authentic PBR textures
        truckScene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            console.log('Mesh found:', child.name, 'Material:', child.material?.name, 'Has map:', !!child.material?.map);
            if (child.material) {
              if (child.material.map) {
                child.material.map.colorSpace = THREE.SRGBColorSpace;
              }
              child.material.roughness = child.material.roughness ?? 0.6;
              child.material.metalness = child.material.metalness ?? 0.3;
              child.material.needsUpdate = true;
            }
          }

          // Identify wheels
          const nodeName = (child.name || '').toLowerCase();
          if (nodeName.includes('wheel') || nodeName.includes('tyre') || nodeName.includes('tire') || nodeName.includes('circle')) {
            wheels.push(child);
          }
        });

        wheelsRef.current = wheels;

        // Compute Bounding Box & Scale to ~5.6 units in length
        const rawBbox = new THREE.Box3().setFromObject(truckScene);
        const rawSize = rawBbox.getSize(new THREE.Vector3());
        const rawCenter = rawBbox.getCenter(new THREE.Vector3());
        console.log('Raw Dump Truck BBox Size:', rawSize, 'Center:', rawCenter);

        const targetLength = 5.8;
        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
        const scale = targetLength / maxDim;
        truckScene.scale.set(scale, scale, scale);

        // Rotation: Test orientation
        // Notice in standard coordinate conversion, let's see which dimension is longest: rawSize.x, rawSize.y, or rawSize.z
        console.log('Dump truck longest axis is:', rawSize.x > rawSize.z ? 'X' : 'Z', 'Size X:', rawSize.x, 'Y:', rawSize.y, 'Z:', rawSize.z);

        // Crucial: Rotate truck so cab & headlights face forward toward negative Z
        truckScene.rotation.y = Math.PI;

        // Recompute bounding box after rotation & scale to calculate exact bottom of tires
        const finalBbox = new THREE.Box3().setFromObject(truckScene);
        const finalCenter = finalBbox.getCenter(new THREE.Vector3());
        console.log('Final Dump Truck BBox:', finalBbox, 'Center:', finalCenter);

        // Position truck so that bottom of tires rests firmly at y = 0.04 directly on the road surface
        truckScene.position.set(
          -finalCenter.x,
          -finalBbox.min.y + 0.04,
          -finalCenter.z
        );

        // Replace procedural backup with authentic GLTF Mining Truck!
        truckGroup.remove(backupGroup);
        truckGroup.add(truckScene);
        truckModelRef.current = truckScene;

        setModelStatus((prev) => ({ ...prev, truckLoaded: true }));
        setLoadingProgress((prev) => ({ ...prev, truck: 100, ready: true }));
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadingProgress((prev) => ({ ...prev, truck: pct }));
        }
      },
      (err) => {
        console.warn('Truck GLTF model load notice (using procedural rig):', err);
      }
    );

    // 11. DYNAMIC 3D OBSTACLE (Little Mining Utility Truck Ahead in Path)
    const obstacleGroup = new THREE.Group();
    scene.add(obstacleGroup);
    obstacleRef.current = obstacleGroup;

    // Detailed Little Mining Utility Truck
    const littleTruckGroup = new THREE.Group();

    // Steel Chassis Frame
    const ltChassisGeo = new THREE.BoxGeometry(1.9, 0.38, 3.4);
    const ltChassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.8 });
    const ltChassis = new THREE.Mesh(ltChassisGeo, ltChassisMat);
    ltChassis.position.y = 0.5;
    ltChassis.castShadow = true;
    littleTruckGroup.add(ltChassis);

    // High-Vis Safety Yellow/Amber Cabin
    const ltCabGeo = new THREE.BoxGeometry(1.65, 1.15, 1.45);
    const ltCabMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.5 });
    const ltCab = new THREE.Mesh(ltCabGeo, ltCabMat);
    ltCab.position.set(0, 1.2, -0.5);
    ltCab.castShadow = true;
    littleTruckGroup.add(ltCab);

    // Dark Tinted Windshield Glass
    const ltWindGeo = new THREE.BoxGeometry(1.5, 0.58, 0.1);
    const ltWindMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 });
    const ltWind = new THREE.Mesh(ltWindGeo, ltWindMat);
    ltWind.position.set(0, 1.3, -1.25);
    littleTruckGroup.add(ltWind);

    // Rear Cargo / Utility Dump Bed
    const ltBedGeo = new THREE.BoxGeometry(1.75, 0.8, 1.55);
    const ltBedMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.6 });
    const ltBed = new THREE.Mesh(ltBedGeo, ltBedMat);
    ltBed.position.set(0, 1.0, 0.85);
    ltBed.castShadow = true;
    littleTruckGroup.add(ltBed);

    // 4 Heavy-Duty Off-Road Mining Tires
    const ltTireGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.32, 16);
    ltTireGeo.rotateZ(Math.PI / 2);
    const ltTireMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95, metalness: 0.05 });
    [
      [-0.98, 0.44, -1.0],
      [0.98, 0.44, -1.0],
      [-0.98, 0.44, 1.0],
      [0.98, 0.44, 1.0]
    ].forEach(([tx, ty, tz]) => {
      const tMesh = new THREE.Mesh(ltTireGeo, ltTireMat);
      tMesh.position.set(tx, ty, tz);
      tMesh.castShadow = true;
      littleTruckGroup.add(tMesh);
    });

    // Glowing Red/Amber Hazard Flashers on Rear Bumper
    const ltHazMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const ltHazL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), ltHazMat);
    ltHazL.position.set(-0.7, 0.9, 1.65);
    littleTruckGroup.add(ltHazL);
    const ltHazR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), ltHazMat);
    ltHazR.position.set(0.7, 0.9, 1.65);
    littleTruckGroup.add(ltHazR);

    // Front White Headlights
    const ltHlMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const ltHlL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), ltHlMat);
    ltHlL.position.set(-0.65, 0.8, -1.75);
    littleTruckGroup.add(ltHlL);
    const ltHlR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), ltHlMat);
    ltHlR.position.set(0.65, 0.8, -1.75);
    littleTruckGroup.add(ltHlR);

    obstacleGroup.add(littleTruckGroup);

    // Tesla-Inspired Holographic Targeting Reticle Box around little truck
    const reticleGeo = new THREE.BoxGeometry(2.4, 2.2, 3.8);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
    reticleMesh.position.y = 1.0;
    obstacleGroup.add(reticleMesh);
    reticleRef.current = reticleMesh;

    // Hazard Distance Floor Decal
    const ringGeo = new THREE.RingGeometry(1.3, 1.6, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.04;
    obstacleGroup.add(ringMesh);
    floorDecalRef.current = ringMesh;

    // Initial Obstacle Placement (1.82m)
    obstacleGroup.position.set(0, 0, - (3.5 + 1.82 * 3.5));

    // 12. 3D LASER DISTANCE MEASUREMENT BEAM
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });
    const laserPoints = [
      new THREE.Vector3(0, 0.85, -2.6),
      new THREE.Vector3(0, 0.95, -10.0)
    ];
    const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
    const laserBeam = new THREE.Line(laserGeo, laserMat);
    scene.add(laserBeam);
    laserBeamRef.current = laserBeam;

    // Expanding Sonar Radar Wave Rings from Front Bumper
    const ripples = [];
    for (let r = 0; r < 3; r++) {
      const rippleGeo = new THREE.RingGeometry(0.8, 1.05, 32);
      rippleGeo.rotateX(-Math.PI / 2);
      const rippleMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const ripple = new THREE.Mesh(rippleGeo, rippleMat);
      ripple.position.set(0, 0.1, -2.6);
      scene.add(ripple);
      ripples.push({ mesh: ripple, offset: r * 0.33 });
    }
    sonarRipplesRef.current = ripples;

    // 13. REALISTIC VOLUMETRIC DUST & QUARRY MINERAL SILT SYSTEM
    // A. Soft-feathered radial alpha gradient texture for authentic atmospheric particles
    const dustCanvas = document.createElement('canvas');
    dustCanvas.width = 64;
    dustCanvas.height = 64;
    const dustCtx = dustCanvas.getContext('2d');
    const dustGrad = dustCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    dustGrad.addColorStop(0, 'rgba(220, 205, 185, 0.95)');
    dustGrad.addColorStop(0.2, 'rgba(200, 185, 165, 0.65)');
    dustGrad.addColorStop(0.5, 'rgba(170, 155, 135, 0.25)');
    dustGrad.addColorStop(0.8, 'rgba(140, 125, 110, 0.08)');
    dustGrad.addColorStop(1, 'rgba(120, 110, 100, 0)');
    dustCtx.fillStyle = dustGrad;
    dustCtx.fillRect(0, 0, 64, 64);
    const dustTexture = new THREE.CanvasTexture(dustCanvas);

    // B. Low-Lying Billowing Road Dust Plume (Tire Wake behind the truck)
    const plumeCount = 420;
    const plumeGeo = new THREE.BufferGeometry();
    const plumePositions = new Float32Array(plumeCount * 3);
    for (let i = 0; i < plumeCount; i++) {
      plumePositions[i * 3] = (Math.random() - 0.5) * 5.2; // Width around road & tires
      plumePositions[i * 3 + 1] = 0.15 + Math.random() * 2.2; // Rolling close to ground
      plumePositions[i * 3 + 2] = 2.0 + Math.random() * 35; // Billowing behind the truck
    }
    plumeGeo.setAttribute('position', new THREE.BufferAttribute(plumePositions, 3));

    const plumeMat = new THREE.PointsMaterial({
      color: 0xc8b8a2, // Natural crushed limestone/mineral earth tone
      size: 2.2,       // Soft volumetric puff
      map: dustTexture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    const plumeParticles = new THREE.Points(plumeGeo, plumeMat);
    scene.add(plumeParticles);
    plumeParticlesRef.current = plumeParticles;

    // C. Suspended Micro-Silt Mineral Haze (Ambient Quarry Valley)
    const hazeCount = 550;
    const hazeGeo = new THREE.BufferGeometry();
    const hazePositions = new Float32Array(hazeCount * 3);
    for (let i = 0; i < hazeCount; i++) {
      hazePositions[i * 3] = (Math.random() - 0.5) * 60;
      hazePositions[i * 3 + 1] = 0.5 + Math.random() * 15;
      hazePositions[i * 3 + 2] = (Math.random() - 0.5) * 110 - 20;
    }
    hazeGeo.setAttribute('position', new THREE.BufferAttribute(hazePositions, 3));

    const hazeMat = new THREE.PointsMaterial({
      color: 0x9e8f7a, // Subtle warm atmospheric silt
      size: 0.9,
      map: dustTexture,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    const hazeParticles = new THREE.Points(hazeGeo, hazeMat);
    scene.add(hazeParticles);
    hazeParticlesRef.current = hazeParticles;

    // 14. 3D SPATIAL LIDAR POINT CLOUD
    const lidarCount = 1400;
    const lidarGeo = new THREE.BufferGeometry();
    const lidarPos = new Float32Array(lidarCount * 3);
    const lidarColors = new Float32Array(lidarCount * 3);
    const colorCyan = new THREE.Color(0x00f0ff);
    const colorViolet = new THREE.Color(0xa855f7);

    for (let i = 0; i < lidarCount; i++) {
      const angleRad = (Math.random() - 0.5) * (Math.PI * 1.6);
      const rad = 2.5 + Math.random() * 22;
      lidarPos[i * 3] = Math.sin(angleRad) * rad;
      lidarPos[i * 3 + 1] = 0.15 + Math.random() * 3.5;
      lidarPos[i * 3 + 2] = -Math.cos(angleRad) * rad - 1.5;

      const mix = Math.random();
      const col = colorCyan.clone().lerp(colorViolet, mix);
      lidarColors[i * 3] = col.r;
      lidarColors[i * 3 + 1] = col.g;
      lidarColors[i * 3 + 2] = col.b;
    }
    lidarGeo.setAttribute('position', new THREE.BufferAttribute(lidarPos, 3));
    lidarGeo.setAttribute('color', new THREE.BufferAttribute(lidarColors, 3));

    const lidarMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.28,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const lidarPoints = new THREE.Points(lidarGeo, lidarMat);
    lidarPoints.visible = showLidar;
    scene.add(lidarPoints);
    lidarPointsRef.current = lidarPoints;

    // 15. COMPREHENSIVE ANIMATION & TELEMETRY SYNC LOOP
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      const target = targetDataRef.current || {};
      const distCm = target.distance_cm ?? 182;
      const dustRaw = target.dust_raw ?? 4095;
      const lux = target.light_lux ?? -2;
      const accelX = target.accelX ?? 0;
      const accelY = target.accelY ?? 0;
      const speedFactor = distCm < 100 ? 0 : 16.0;
      const isNight = lux < 25;

      // A. Track Simulation: Animate Highway Chevrons & Road Flow
      chevrons.forEach((ch, idx) => {
        ch.position.z += delta * speedFactor;
        if (ch.position.z > 15) {
          ch.position.z -= 160;
        }
        // Pulse chevron brightness
        ch.material.opacity = 0.4 + 0.4 * Math.sin(time * 6 + idx * 0.4);
      });

      // B. Rotate Truck Wheels during drive simulation
      if (wheelsRef.current.length > 0) {
        wheelsRef.current.forEach((w) => {
          w.rotation.x += delta * (speedFactor * 0.6);
        });
      }

      // C. Mining Haul Truck Chassis Alignment:
      // Truck stays strictly straight in the center lane at all times during realtime data updates.
      // Accelerometer readings are reflected in the HUD inclinometer gauge, while 3D chassis stays locked in line.
      if (truckGroupRef.current) {
        truckGroupRef.current.rotation.x = 0.0;
        truckGroupRef.current.rotation.y = 0.0;
        truckGroupRef.current.rotation.z = 0.0;
        truckGroupRef.current.position.x = 0.0;
        const engineRumble = Math.sin(time * 26) * 0.002 * (speedFactor > 0 ? 1 : 0.2);
        truckGroupRef.current.position.y = engineRumble;
        truckGroupRef.current.position.z = 0.0;
      }

      // D. Dynamic 3D Little Truck Obstacle Positioning & Proximity Alert
      const targetObstacleZ = - (3.4 + Math.min(Math.max(distCm / 100, 0.4), 10.0) * 3.2);
      if (obstacleRef.current) {
        obstacleRef.current.position.z = THREE.MathUtils.lerp(
          obstacleRef.current.position.z,
          targetObstacleZ,
          0.14
        );
        obstacleRef.current.position.x = 0.0;
        obstacleRef.current.position.y = 0.0;

        // Flash rear hazard lamps on little truck
        const hazFlash = Math.sin(time * 12) > 0;
        if (ltHazMat) {
          ltHazMat.color.setHex(distCm < 100 ? (hazFlash ? 0xff0000 : 0x550000) : 0xf59e0b);
        }

        // Color reticle & floor decal based on proximity danger safely via dedicated refs
        const hazardColor = distCm < 100 ? 0xff2222 : distCm < 250 ? 0xf59e0b : 0x00f0ff;
        if (reticleRef.current && reticleRef.current.material) {
          reticleRef.current.material.color.setHex(hazardColor);
        }
        if (floorDecalRef.current && floorDecalRef.current.material) {
          floorDecalRef.current.material.color.setHex(hazardColor);
        }

        if (holographicPathRef.current) {
          if (distCm < 100) {
            holographicPathRef.current.material.color.setHex(0xef4444);
            holographicPathRef.current.material.opacity = 0.45;
          } else if (distCm < 250) {
            holographicPathRef.current.material.color.setHex(0xf59e0b);
            holographicPathRef.current.material.opacity = 0.32;
          } else {
            holographicPathRef.current.material.color.setHex(0x00f0ff);
            holographicPathRef.current.material.opacity = 0.28;
          }
        }
      }

      // E. Update 3D Laser Beam Vector
      if (laserBeamRef.current && obstacleRef.current) {
        const obsZ = obstacleRef.current.position.z;
        const positions = laserBeamRef.current.geometry.attributes.position.array;
        positions[5] = obsZ;
        laserBeamRef.current.geometry.attributes.position.needsUpdate = true;
        laserBeamRef.current.material.color.setHex(distCm < 100 ? 0xff2222 : 0x00f0ff);
      }

      // F. Expand Sonar Ripples
      ripples.forEach((rip) => {
        rip.offset = (rip.offset + delta * 0.9) % 1.0;
        const scaleVal = 1.0 + rip.offset * 7.0;
        rip.mesh.scale.set(scaleVal, scaleVal, scaleVal);
        rip.mesh.material.opacity = (1.0 - rip.offset) * 0.85;
      });

      // G. GP2Y1010AU0F Optical Dust Sensor Atmosphere & Realistic Volumetric Fog
      const dustRatio = Math.min(Math.max((dustRaw - 400) / 3695, 0), 1);
      if (sceneRef.current && sceneRef.current.fog) {
        // Natural atmospheric depth fog: 0.007 for clear air up to 0.032 for heavy dust storm
        sceneRef.current.fog.density = THREE.MathUtils.lerp(0.007, 0.032, dustRatio);
        // Realistic color transition: clear deep horizon navy (0x0b111e) -> atmospheric quarry silt (0x282017)
        const clearHorizon = new THREE.Color(0x0b111e);
        const dustyHorizon = new THREE.Color(0x282017);
        sceneRef.current.fog.color.copy(clearHorizon).lerp(dustyHorizon, dustRatio);
        sceneRef.current.background.copy(sceneRef.current.fog.color);
      }

      // Animate low-lying road dust plume billowing behind the truck tires
      if (plumeParticlesRef.current) {
        const pArray = plumeParticlesRef.current.geometry.attributes.position.array;
        const pLen = pArray.length / 3;
        for (let i = 0; i < pLen; i++) {
          pArray[i * 3 + 2] += delta * speedFactor * 0.85; // billows backward
          pArray[i * 3] += (pArray[i * 3] >= 0 ? 1 : -1) * delta * 0.45; // expands laterally
          pArray[i * 3 + 1] += delta * 0.3; // rises as it rolls
          if (pArray[i * 3 + 2] > 38) {
            pArray[i * 3] = (Math.random() - 0.5) * 4.8;
            pArray[i * 3 + 1] = 0.15 + Math.random() * 0.8;
            pArray[i * 3 + 2] = 2.0 + Math.random() * 3.5;
          }
        }
        plumeParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        plumeParticlesRef.current.material.opacity = THREE.MathUtils.lerp(0.12, 0.65, dustRatio);
      }

      // Animate suspended ambient micro-silt haze
      if (hazeParticlesRef.current) {
        const hArray = hazeParticlesRef.current.geometry.attributes.position.array;
        const hLen = hArray.length / 3;
        for (let i = 0; i < hLen; i++) {
          hArray[i * 3 + 2] += delta * (speedFactor * 0.5);
          if (hArray[i * 3 + 2] > 30) hArray[i * 3 + 2] -= 110;
        }
        hazeParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        hazeParticlesRef.current.material.opacity = THREE.MathUtils.lerp(0.08, 0.48, dustRatio);
      }

      // Adjust headlight volumetric beam scattering in dust
      if (headlightConesRef.current.length > 0) {
        headlightConesRef.current.forEach((cone) => {
          cone.material.opacity = THREE.MathUtils.lerp(0.02, 0.15, dustRatio) * (isNight ? 1.0 : 0.4);
        });
      }

      // H. BH1750 Ambient Light Sensor Headlight & Sunlight Sync
      headlightsRef.current.forEach((hl) => {
        hl.intensity = THREE.MathUtils.lerp(
          hl.intensity,
          isNight ? 8.5 : 2.0,
          0.05
        );
      });
      if (dirLightRef.current && ambientLightRef.current) {
        const sunIntensity = isNight ? 0.6 : 2.4;
        dirLightRef.current.intensity = THREE.MathUtils.lerp(dirLightRef.current.intensity, sunIntensity, 0.05);
        ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, isNight ? 0.35 : 0.8, 0.05);
      }

      // I. LiDAR_01 Spatial Scan Update
      if (lidarPointsRef.current && lidarPointsRef.current.visible) {
        lidarPointsRef.current.rotation.y += delta * 1.8;
      }

      // J. Camera Perspective Modes
      if (cameraMode === 'DRIVER') {
        // First-Person Inside the High Mining Truck Cab looking forward through windshield
        camera.position.set(0, 2.75, -1.2);
        camera.lookAt(0, 1.5, -35);
        if (controlsRef.current) controlsRef.current.enabled = false;
      } else if (cameraMode === 'TOP_RADAR') {
        // Orthographic/Tactical Top-Down Radar Satellite View focused on front corridor
        const radarFocusZ = targetObstacleZ / 2;
        camera.position.set(0, 32, radarFocusZ);
        camera.lookAt(0, 0, radarFocusZ);
        if (controlsRef.current) controlsRef.current.enabled = false;
      } else if (cameraMode === 'ORBIT') {
        // Free 360 Inspection Orbit
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        }
      } else {
        // Default Tesla HUD Dynamic 3rd-Person Chase View
        camera.position.set(0, 4.6, 11.2);
        camera.lookAt(0, 1.3, -15);
        if (controlsRef.current) controlsRef.current.enabled = false;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    handleResizeRef.current = handleResize;
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (controlsRef.current) controlsRef.current.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cameraMode]);

  // Toggle LiDAR visibility smoothly
  useEffect(() => {
    if (lidarPointsRef.current) {
      lidarPointsRef.current.visible = !!showLidar;
    }
  }, [showLidar]);

  const distCm = sensorData.distance_cm ?? 182;
  const lidarMm = lidarData?.distance_mm ?? 1532;
  const lidarAngle = lidarData?.angle ?? 25.4;
  const lidarQuality = lidarData?.quality ?? 45;
  const dustRaw = sensorData.dust_raw ?? 4095;
  const lux = sensorData.light_lux ?? -2;
  const accelX = sensorData.accelerometer?.x ?? 785;
  const accelY = sensorData.accelerometer?.y ?? 247;
  const isEmergencyBrake = distCm < 100;

  return (
    <div 
      ref={wrapperRef}
      className={`relative w-full h-full transition-all select-none ${
        isFullscreen 
          ? 'fixed inset-0 top-0 left-0 w-screen h-screen z-50 bg-slate-950 p-0 m-0 rounded-none border-none' 
          : 'min-h-[460px] md:min-h-[540px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl'
      }`}
      style={isFullscreen ? { width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 99999 } : {}}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Model Loading Status Bar */}
      {(!modelStatus.truckLoaded || !modelStatus.roadLoaded) && (
        <div className="absolute top-4 left-4 z-20 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/40 font-mono text-[11px] text-cyan-300 flex items-center gap-2 shadow-xl animate-pulse">
          <Truck className="w-3.5 h-3.5 text-amber-400" />
          <span>
            LOADING 3D ASSETS: TRUCK {modelStatus.truckLoaded ? '✅' : `${loadingProgress.truck}%`} • ROAD {modelStatus.roadLoaded ? '✅' : `${loadingProgress.road}%`}
          </span>
        </div>
      )}

      {/* TESLA & MINING FUSED HUD OVERLAY */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5 md:p-5">
        
        {/* TOP HUD BAR: Speedometer, Gear, Inclinometer & Fullscreen Button */}
        <div className="flex justify-between items-start pointer-events-auto gap-2">
          
          {/* Pitch & Roll Inclinometer */}
          <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2 shadow-xl">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>PITCH: {(accelX / 100).toFixed(1)}°</span>
            <span className="text-slate-600">|</span>
            <span>ROLL: {(accelY / 100).toFixed(1)}°</span>
          </div>

          {/* CENTER INSTRUMENT CLUSTER: GEAR + SPEEDOMETER */}
          <div className="flex flex-col items-center bg-slate-950/85 backdrop-blur-md border border-slate-800/90 px-6 py-2 rounded-2xl text-center shadow-2xl">
            {/* PRND Gear Selector */}
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-500 mb-0.5">
              <span className={isEmergencyBrake ? 'text-slate-600' : 'text-slate-500'}>P</span>
              <span className={isEmergencyBrake ? 'text-slate-600' : 'text-slate-500'}>R</span>
              <span className={isEmergencyBrake ? 'text-slate-600' : 'text-slate-500'}>N</span>
              <span className={isEmergencyBrake 
                ? 'text-red-400 font-extrabold px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 animate-pulse'
                : 'text-cyan-400 font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40'}>
                {isEmergencyBrake ? 'BRAKE' : 'D'}
              </span>
            </div>

            {/* Speedometer Digital Readout */}
            <div className="flex items-baseline gap-1 font-mono">
              <span className={`text-3xl font-black tracking-tight ${isEmergencyBrake ? 'text-red-400' : 'text-slate-100'}`}>
                {isEmergencyBrake ? '0' : '48'}
              </span>
              <span className="text-xs text-slate-400 font-bold uppercase">KM/H</span>
            </div>

            {/* Emergency Braking Alert Badge (Only shown during active emergency hazard) */}
            {isEmergencyBrake && (
              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border bg-red-950/80 text-red-400 border-red-500/50">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>EMERGENCY BRAKE ENGAGED</span>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-300 font-bold transition shadow-xl flex items-center gap-1.5 font-mono text-xs cursor-pointer active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-950" /> : <Maximize2 className="w-4 h-4 text-slate-950" />}
            <span className="hidden sm:inline">{isFullscreen ? 'EXIT' : 'FULLSCREEN'}</span>
          </button>

        </div>

        {/* CENTER PROXIMITY VECTOR BADGE */}
        <div className="self-center bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 px-5 py-2 rounded-xl text-center shadow-2xl pointer-events-none mt-auto mb-2">
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center justify-center gap-1.5">
            <Zap className="w-3 h-3 text-cyan-400" /> HC-SR04 SONAR VECTOR • ROAD TRACK TARGET
          </div>
          <div className={`text-2xl md:text-3xl font-black font-mono tracking-tight ${
            distCm < 100 ? 'text-red-500 animate-pulse' : 
            distCm < 250 ? 'text-amber-400' : 'text-cyan-400'
          }`}>
            {distCm} cm <span className="text-base text-slate-400 font-normal">({(distCm / 100).toFixed(2)} m)</span>
          </div>
        </div>

        {/* BOTTOM HUD STATUS MATRIX */}
        <div className="flex justify-between items-end text-[11px] font-mono text-slate-400 pointer-events-none bg-slate-950/70 backdrop-blur-sm p-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <span>VIEW: <span className="text-cyan-300 font-bold">{cameraMode}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300">DUST: {dustRaw}</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-300">LUX: {lux}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>LIDAR: <span className="text-indigo-300 font-bold">{lidarMm} mm @ {lidarAngle}°</span></span>
            <span className="text-slate-600">|</span>
            <span className={showLidar ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {showLidar ? 'CLOUD ON' : 'OFF'}
            </span>
          </div>
        </div>

      </div>

      {/* FULLSCREEN SENSOR MATRIX DOCK */}
      {isFullscreen && (
        <div className="absolute bottom-6 right-6 z-[100000] w-84 bg-slate-900/95 backdrop-blur-md border-2 border-cyan-400 rounded-2xl p-4 shadow-2xl text-slate-100 font-mono text-xs space-y-2.5 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-cyan-300 font-bold">
            <span className="flex items-center gap-1.5 text-sm">
              <Activity className="w-4 h-4 text-cyan-400" /> SAFEWAY FULLSCREEN TELEMETRY
            </span>
            <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/40">3D HUD</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold">OBSTACLE DISTANCE</div>
              <div className={`text-base font-black ${distCm < 100 ? 'text-red-400 animate-pulse' : distCm < 250 ? 'text-amber-400' : 'text-cyan-400'}`}>
                {distCm} cm ({(distCm / 100).toFixed(2)}m)
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-indigo-900/60">
              <div className="text-[10px] text-indigo-300 font-semibold flex items-center gap-1">
                <Radar className="w-3 h-3 text-indigo-400" /> LIDAR_01 DIST
              </div>
              <div className="text-base font-black text-indigo-300">
                {lidarMm} mm
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold">DUST PARTICLES</div>
              <div className="text-base font-black text-amber-400">
                {dustRaw} raw
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-indigo-900/60">
              <div className="text-[10px] text-indigo-300 font-semibold">LIGHT INTENSITY</div>
              <div className="text-base font-black text-sky-300">
                {lux} lx
              </div>
            </div>
          </div>

          <div className="text-[10px] text-center text-slate-400 border-t border-slate-800/80 pt-1.5 flex justify-between">
            <span>PITCH: <b className="text-amber-300">{(accelX / 100).toFixed(1)}°</b></span>
            <span>ROLL: <b className="text-cyan-300">{(accelY / 100).toFixed(1)}°</b></span>
            <span>QUALITY: <b className="text-indigo-300">{lidarQuality}%</b></span>
          </div>
        </div>
      )}

    </div>
  );
}
