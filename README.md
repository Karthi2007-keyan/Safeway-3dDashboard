# 🚛 SAFEWAY - 3D Heavy Mining Vehicle Cyber Cockpit & Telemetry Engine

[![Live Web Dashboard](https://img.shields.io/badge/Live%20Dashboard-Firebase%20Hosting-06b6d4?style=for-the-badge&logo=firebase)](https://safeway-d3e9c.web.app)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20WebGL-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![React](https://img.shields.io/badge/Frontend-React%20v19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Firebase Firestore](https://img.shields.io/badge/Database-Firestore-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

---

## 🌟 Overview

**SafeWay Cyber Cockpit** is a high-performance 3D telemetry dashboard built using **JavaScript (React, Three.js WebGL, Tailwind CSS, Firebase SDK v11)** and **Python 3**. 

It provides real-time 3D vehicle dynamics, obstacle radar, and microclimate telemetry streaming for heavy mining trucks operating in hazardous off-road environments.

---

## 🔌 Hardware Sensor Matrix

| Hardware Sensor | Functional Role | Telemetry & 3D Dashboard Mapping |
| :--- | :--- | :--- |
| **ESP32 DevKit V1** | Master Gateway MCU | System Vitals, Battery Voltage (12.6V), RSSI, Drive Mode State |
| **GP2Y1010AU0F** | Optical Dust & Smoke Sensor | Dust Concentration ($mg/m^3$), AQI Rating, Volumetric Fog Density |
| **BH1750** | Ambient Light Lux Sensor | Day/Night Sunlight Mode, Dual LED Headlight Spotlights |
| **ADXL345** | 3-Axis Accelerometer | 3D Chassis Roll & Pitch Rotation, G-Force Vector Plot |
| **HC-SR04 Ultrasonic** | Proximity Distance Sensor | Dynamic 3D Obstacle Positioning & Pulsing Sonar Rings |
| **DHT11** | Temperature & Humidity Sensor | Ambient Microclimate Display ($^\circ C$, Relative Humidity $\%$) |
| **NRF24L01+** | 2.4GHz V2V Mesh Transceiver | Connected Peer Vehicles Radar (Channel 76) |
| **ESP32-CAM (OV2640)** | Vision AI Driver Fatigue Monitor | Driver Eye Aspect Ratio (EAR), Drowsiness Alarms, Live Feed |

---

## ⚡ Data Flow Pipeline

```
                 Firebase Firestore
                        │
                        ▼ (onSnapshot real-time listener)
                sensor_data/ESP32_01
   ┌────────────────────┼────────────────────┐
   │                    │                    │
   ▼                    ▼                    ▼
distance_cm        accelerometer          dust_raw / lux
   │ (HC-SR04)          │ (ADXL345)          │ (GP2Y / BH1750)
   ▼                    ▼                    ▼
3D Obstacle &      Truck Pitch & Roll    Dust Cloud Haze &
Sonar Ring Z-Pos    Chassis Tilt         LED Headlight Spotlights
   └────────────────────┬────────────────────┘
                        ▼
                 Three.js Scene
        (GLTF Mining Truck + Road Terrain)
```

---

## 🚀 Quick Start Guide

### 1. Web Application Development
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

### 2. Live Hardware Telemetry Simulator
```bash
# Run Python hardware simulator streaming live sensor packets to Firestore
python telemetry_simulator.py
```

### 3. Deploy to Firebase
```bash
# Deploy to Firebase Hosting & Firestore Security Rules
npx firebase-tools deploy
```

---

## 🌐 Live Production Deployment

- **Live Web App**: [https://safeway-d3e9c.web.app](https://safeway-d3e9c.web.app)
- **GitHub Repository**: [https://github.com/Karthi2007-keyan/Safeway-3dDashboard.git](https://github.com/Karthi2007-keyan/Safeway-3dDashboard.git)
