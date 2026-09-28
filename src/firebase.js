import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query,
  where,
  serverTimestamp 
} from "firebase/firestore";

// SafeWay Firebase App Configuration (sih26-f340c)
export const firebaseConfig = {
  apiKey: "AIzaSyAngPFxOGCMS2txlLE7HXvHyeNseWAoQFA",
  authDomain: "sih26-f340c.firebaseapp.com",
  projectId: "sih26-f340c",
  storageBucket: "sih26-f340c.firebasestorage.app",
  messagingSenderId: "630153355353",
  appId: "1:630153355353:web:b37ef24f003001ca87d148",
  measurementId: "G-58X45V0KXK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initial Default State matching Firestore sensor_data/ESP32_01
export const DEFAULT_SENSOR_DATA = {
  accelerometer: { x: 785, y: 247, z: 0 },
  cam_data: "",
  distance_cm: 182,
  dust_raw: 4095,
  humidity: 58,
  light_lux: -2,
  temperature_c: 28.9,
  lastUpdated: new Date().toISOString()
};

// Initial Default State matching Firestore lidar_data collection
export const DEFAULT_LIDAR_DATA = {
  device: "LIDAR_01",
  angle: 241.64,
  distance_mm: 0,
  quality: 0,
  points: [],
  lastUpdated: new Date().toISOString()
};

/**
 * Subscribe to real-time sensor updates from Firestore at sensor_data/ESP32_01
 */
export function subscribeToSensorData(callback, onError) {
  const sensorDocRef = doc(db, "sensor_data", "ESP32_01");

  return onSnapshot(
    sensorDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          ...DEFAULT_SENSOR_DATA,
          ...data,
          lastUpdated: new Date().toISOString(),
          isLive: true
        });
      } else {
        setDoc(sensorDocRef, DEFAULT_SENSOR_DATA, { merge: true }).catch(err => {
          console.error("Auto-seed error:", err);
        });
        callback({ ...DEFAULT_SENSOR_DATA, isLive: false });
      }
    },
    (error) => {
      console.error("Firestore subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to real-time LiDAR updates across NEW collection `lidar_data`.
 * Automatically fetches the LATEST / LAST document inserted by LIDAR_01 hardware.
 */
export function subscribeToLidarData(callback, onError) {
  const lidarCollection = collection(db, "lidar_data");

  return onSnapshot(
    lidarCollection,
    (snapshot) => {
      if (!snapshot.empty) {
        // Map all documents from lidar_data collection
        const lidarDocs = snapshot.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
          .filter(data => data.device === "LIDAR_01" || data.distance_mm !== undefined || data.angle !== undefined);

        if (lidarDocs.length > 0) {
          // Sort by timestamp or updatedAt descending to get the newest reading
          lidarDocs.sort((a, b) => {
            const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp || a.updatedAt || 0).getTime();
            const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp || b.updatedAt || 0).getTime();
            return timeB - timeA;
          });

          // Most recent document outputted in lidar_data
          const latestLidarDoc = lidarDocs[0];

          // Accumulate point history for 3D point cloud mapping (taking recent points)
          const pointsList = lidarDocs.slice(0, 80).map(d => ({
            angle: Number(d.angle) || 0,
            distance_mm: Number(d.distance_mm) || 0,
            quality: Number(d.quality) || 0
          }));

          callback({
            ...DEFAULT_LIDAR_DATA,
            ...latestLidarDoc,
            points: pointsList,
            totalPointsScanned: lidarDocs.length,
            lastUpdated: new Date().toISOString(),
            isLive: true
          });
          return;
        }
      }

      // Fallback: check sensor_data collection if lidar_data is empty
      const sensorDataColl = collection(db, "sensor_data");
      onSnapshot(sensorDataColl, (sSnap) => {
        if (!sSnap.empty) {
          const lDocs = sSnap.docs
            .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
            .filter(data => data.device === "LIDAR_01" || data.distance_mm !== undefined);

          if (lDocs.length > 0) {
            const latest = lDocs[lDocs.length - 1];
            callback({
              ...DEFAULT_LIDAR_DATA,
              ...latest,
              lastUpdated: new Date().toISOString(),
              isLive: true
            });
            return;
          }
        }
        callback({ ...DEFAULT_LIDAR_DATA, isLive: false, points: [] });
      }, onError);
    },
    (error) => {
      console.error("Firestore lidar_data collection subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Send simulated or manual sensor updates to Firestore (sensor_data/ESP32_01)
 */
export async function updateFirestoreSensorData(partialData) {
  try {
    const sensorDocRef = doc(db, "sensor_data", "ESP32_01");
    await setDoc(sensorDocRef, {
      ...partialData,
      updatedAt: serverTimestamp()
    }, { merge: true });

    try {
      await addDoc(collection(db, "sensor_history"), {
        ...partialData,
        timestamp: serverTimestamp()
      });
    } catch (histErr) {}

    return true;
  } catch (err) {
    console.error("Failed to update Firestore sensor_data:", err);
    throw err;
  }
}

/**
 * Push new LiDAR hardware point document to NEW `lidar_data` collection
 */
export async function updateFirestoreLidarData(partialData) {
  try {
    // Add a new document to lidar_data collection (matching new Firestore structure)
    await addDoc(collection(db, "lidar_data"), {
      device: "LIDAR_01",
      ...partialData,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("Failed to add new document to lidar_data collection:", err);
    throw err;
  }
}
