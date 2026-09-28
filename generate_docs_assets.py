import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Create output dir for images
img_dir = r"d:\Projects\SafeWay\doc_images"
os.makedirs(img_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. System Flow & Architecture Diagram
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(14, 8), dpi=300)
fig.patch.set_facecolor('#0b1120')
ax.set_facecolor('#0b1120')
ax.set_xlim(0, 14)
ax.set_ylim(0, 8)
ax.axis('off')

# Title
ax.text(7, 7.5, "SafeWay — End-to-End System Architecture & Telemetry Pipeline", 
        fontsize=16, fontweight='bold', color='#00f0ff', ha='center', fontfamily='sans-serif')

# Tier 1: Hardware Layer (Left)
hw_box = patches.FancyBboxPatch((0.5, 0.8), 3.4, 6.2, boxstyle="round,pad=0.2", 
                               edgecolor="#38bdf8", facecolor="#0f172a", linewidth=2)
ax.add_patch(hw_box)
ax.text(2.2, 6.6, "1. SENSOR & IOT LAYER", color="#38bdf8", fontsize=11, fontweight='bold', ha='center')

sensors = [
    ("ESP32 Microcontroller", "Core Wi-Fi & ADC Hub"),
    ("LiDAR_01 Scanner", "360° Azimuth & Distance (mm)"),
    ("HC-SR04 Ultrasonic", "Forward Distance (cm)"),
    ("GP2Y1010AU0F Dust Sensor", "Quarry Dust / Particulate Density"),
    ("BH1750 Ambient Light", "Illuminance Exposure (lux)"),
    ("MPU6050 / ADXL345", "3-Axis Tilt, Pitch & Roll"),
    ("ESP32-CAM Module", "Realtime Cab Video Stream")
]

for i, (name, desc) in enumerate(sensors):
    y_pos = 5.8 - i * 0.72
    s_box = patches.FancyBboxPatch((0.8, y_pos - 0.25), 2.8, 0.55, boxstyle="round,pad=0.1",
                                   edgecolor="#0284c7", facecolor="#1e293b", linewidth=1)
    ax.add_patch(s_box)
    ax.text(0.95, y_pos + 0.05, name, color="#f8fafc", fontsize=9, fontweight='bold')
    ax.text(0.95, y_pos - 0.15, desc, color="#94a3b8", fontsize=7.5)

# Tier 2: Cloud Database & Realtime Sync (Middle)
cloud_box = patches.FancyBboxPatch((5.0, 1.8), 3.8, 5.2, boxstyle="round,pad=0.2", 
                                 edgecolor="#f59e0b", facecolor="#0f172a", linewidth=2)
ax.add_patch(cloud_box)
ax.text(6.9, 6.6, "2. GOOGLE CLOUD FIRESTORE", color="#f59e0b", fontsize=11, fontweight='bold', ha='center')

db_nodes = [
    ("Project: sih26-f340c", "Global High-Availability NoSQL DB"),
    ("sensor_data/ESP32_01", "Live Telemetry: Accel, Dust, Lux, Dist"),
    ("lidar_data Collection", "Streaming 360° LiDAR Scans"),
    ("sensor_history Logs", "Time-series Historical Black Box"),
    ("onSnapshot() Listeners", "Sub-100ms WebSocket Reactive Pushes")
]

for i, (name, desc) in enumerate(db_nodes):
    y_pos = 5.6 - i * 0.82
    d_box = patches.FancyBboxPatch((5.3, y_pos - 0.3), 3.2, 0.65, boxstyle="round,pad=0.1",
                                   edgecolor="#d97706", facecolor="#1e293b", linewidth=1)
    ax.add_patch(d_box)
    ax.text(5.45, y_pos + 0.05, name, color="#fde68a", fontsize=9, fontweight='bold')
    ax.text(5.45, y_pos - 0.18, desc, color="#cbd5e1", fontsize=7.5)

# Tier 3: Client Application (Right)
client_box = patches.FancyBboxPatch((9.9, 0.8), 3.6, 6.2, boxstyle="round,pad=0.2", 
                                  edgecolor="#10b981", facecolor="#0f172a", linewidth=2)
ax.add_patch(client_box)
ax.text(11.7, 6.6, "3. 3D CAT DASHBOARD CLIENT", color="#10b981", fontsize=11, fontweight='bold', ha='center')

ui_nodes = [
    ("Three.js 3D WebGL Canvas", "Interactive Mining Truck & Terrain"),
    ("Radar PPI Scope", "20-Point Rolling LiDAR Polar Scan"),
    ("Visibility Advisory Engine", "Mathematical Dust & Light Penalty"),
    ("Emergency Braking Overlay", "< 1.0m Proximity Trigger & Audio Tone"),
    ("Live Telemetry History Chart", "Canvas Realtime Time-Series Curves"),
    ("Hardware Simulator / Override", "Direct Firestore Calibration Modal"),
    ("Multi-Camera Controller", "HUD, Cab, Radar & 360° Orbit Views")
]

for i, (name, desc) in enumerate(ui_nodes):
    y_pos = 5.8 - i * 0.72
    u_box = patches.FancyBboxPatch((10.1, y_pos - 0.25), 3.2, 0.55, boxstyle="round,pad=0.1",
                                   edgecolor="#059669", facecolor="#1e293b", linewidth=1)
    ax.add_patch(u_box)
    ax.text(10.25, y_pos + 0.05, name, color="#a7f3d0", fontsize=8.5, fontweight='bold')
    ax.text(10.25, y_pos - 0.15, desc, color="#cbd5e1", fontsize=7)

# Arrows
ax.annotate("", xy=(5.0, 4.4), xytext=(3.9, 4.4),
            arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color="#38bdf8", lw=3))
ax.text(4.45, 4.65, "HTTPS / JSON\nPush", color="#38bdf8", fontsize=8, ha='center', fontweight='bold')

ax.annotate("", xy=(9.9, 4.4), xytext=(8.8, 4.4),
            arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color="#10b981", lw=3))
ax.text(9.35, 4.65, "WebSocket\nSync", color="#10b981", fontsize=8, ha='center', fontweight='bold')

flow_img_path = os.path.join(img_dir, "architecture_flow.png")
plt.tight_layout()
plt.savefig(flow_img_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
plt.close()
print("Saved:", flow_img_path)

# -------------------------------------------------------------
# 2. Output Visualization: LiDAR Radar PPI Scope Mockup
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(8, 8), dpi=300)
fig.patch.set_facecolor('#040c14')
ax.set_facecolor('#040c14')
ax.set_xlim(-50, 50)
ax.set_ylim(-50, 50)
ax.axis('off')

# Radar rings
for r, label in [(10.5, "1.0m"), (21.0, "2.0m"), (31.5, "3.0m"), (42.0, "4.0m")]:
    circle = plt.Circle((0, 0), r, color='#00f0ff', fill=False, lw=1.2 if r==42 else 0.8, 
                        linestyle='-' if r in (21, 42) else '--', alpha=0.6)
    ax.add_patch(circle)
    ax.text(2, r - 2, label, color='#38bdf8', fontsize=9, fontfamily='monospace', alpha=0.8)

# Crosshairs & ticks
ax.plot([-46, 46], [0, 0], color='#00f0ff', lw=0.8, alpha=0.4)
ax.plot([0, 0], [-46, 46], color='#00f0ff', lw=0.8, alpha=0.4)

for deg in range(0, 360, 15):
    rad = np.radians(deg)
    r1 = 43 if deg % 45 == 0 else 44.5
    r2 = 46
    ax.plot([r1 * np.cos(rad), r2 * np.cos(rad)], [r1 * np.sin(rad), r2 * np.sin(rad)], color='#00f0ff', lw=1.2 if deg%45==0 else 0.5)

ax.text(0, 48, "000° (NORTH)", color='#00f0ff', fontsize=10, fontweight='bold', ha='center', fontfamily='monospace')
ax.text(48, 0, "090°", color='#00f0ff', fontsize=10, fontweight='bold', va='center', fontfamily='monospace')
ax.text(0, -49, "180°", color='#00f0ff', fontsize=10, fontweight='bold', ha='center', fontfamily='monospace')
ax.text(-49, 0, "270°", color='#00f0ff', fontsize=10, fontweight='bold', ha='right', va='center', fontfamily='monospace')

# Center Haul Truck Icon
truck_marker = plt.Polygon([[0, 2.5], [-2, -2], [2, -2]], color='#00f0ff', ec='#38bdf8', lw=1.5)
ax.add_patch(truck_marker)

# Simulated 20 scanned points
np.random.seed(42)
angles = np.linspace(20, 340, 20)
distances = np.random.uniform(8, 38, 20)
for idx, (ang, dist) in enumerate(zip(angles, distances)):
    rad = np.radians(ang - 90)
    x = dist * np.cos(rad)
    y = -dist * np.sin(rad)
    col = '#ef4444' if dist < 12 else '#f59e0b' if dist < 26 else '#00f0ff'
    is_latest = (idx == 19)
    
    halo = plt.Circle((x, y), 2.2 if is_latest else 1.2, color=col, fill=False, lw=1.5 if is_latest else 0.8, alpha=0.9 if is_latest else 0.5)
    ax.add_patch(halo)
    dot = plt.Circle((x, y), 1.0 if is_latest else 0.6, color=col, fill=True)
    ax.add_patch(dot)
    
    if is_latest:
        # Laser beam
        ax.plot([0, x], [0, y], color=col, lw=1.5, linestyle=':', alpha=0.8)
        ax.text(x + 2, y + 2, f"TARGET: {(dist/10):.2f}m @ {ang:.1f}°", color=col, 
                fontsize=9, fontweight='bold', fontfamily='monospace')

# Top Overlay Box
box1 = patches.FancyBboxPatch((-46, 38), 34, 8, boxstyle="round,pad=0.5", ec='#00f0ff', fc='#071728', alpha=0.9)
ax.add_patch(box1)
ax.text(-44, 42, "SafeWay LiDAR PPI SCOPE", color='#00f0ff', fontsize=10, fontweight='bold', fontfamily='monospace')
ax.text(-44, 39, "DEVICE: LIDAR_01 • 20-PTS BUFFER", color='#94a3b8', fontsize=8, fontfamily='monospace')

# Status Box
box2 = patches.FancyBboxPatch((12, -45), 34, 7, boxstyle="round,pad=0.5", ec='#10b981', fc='#06281e', alpha=0.9)
ax.add_patch(box2)
ax.text(29, -41, "STATUS: SECTOR MONITORED", color='#34d399', fontsize=8.5, fontweight='bold', ha='center', fontfamily='monospace')

radar_img_path = os.path.join(img_dir, "radar_ppi_scope.png")
plt.tight_layout()
plt.savefig(radar_img_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
plt.close()
print("Saved:", radar_img_path)

# -------------------------------------------------------------
# 3. Telemetry Curves & Visibility Safety Matrix
# -------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=300)
fig.patch.set_facecolor('#0f172a')

# Subplot 1: Realtime Telemetry Line Graph
ax1.set_facecolor('#020617')
time_steps = np.arange(0, 30)
distance_stream = 180 + 120 * np.sin(time_steps / 4.0) + np.random.normal(0, 10, 30)
dust_stream = 2800 + 1000 * np.cos(time_steps / 5.0) + np.random.normal(0, 80, 30)

line1, = ax1.plot(time_steps, distance_stream, color='#00f0ff', lw=2.5, label='Obstacle Distance (cm)')
ax1.set_ylabel('Distance (cm)', color='#00f0ff', fontsize=10, fontweight='bold')
ax1.tick_params(colors='#94a3b8')
ax1.grid(True, linestyle='--', color='#1e293b', alpha=0.7)
ax1.set_title("Real-Time Telemetry Stream (Distance vs Dust)", color='#f8fafc', fontsize=11, fontweight='bold')

ax1_twin = ax1.twinx()
line2, = ax1_twin.plot(time_steps, dust_stream, color='#f59e0b', lw=2.0, linestyle='--', label='Dust Density (raw)')
ax1_twin.set_ylabel('Dust Level (0-4095 raw)', color='#f59e0b', fontsize=10, fontweight='bold')
ax1_twin.tick_params(colors='#94a3b8')

lines = [line1, line2]
labels = [l.get_label() for l in lines]
ax1.legend(lines, labels, loc='upper left', facecolor='#0f172a', edgecolor='#334155', labelcolor='#f8fafc')

# Subplot 2: Visibility Score Breakdown Bar
ax2.set_facecolor('#020617')
categories = ['Optimal Clear\n(Dust < 1500)', 'Moderate Dust\n(Dust 1500-3000)', 'Critical Storm\n(Dust > 3000)', 'Night Darkness\n(Lux <= 0)']
scores = [92, 58, 22, 38]
colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

bars = ax2.bar(categories, scores, color=colors, width=0.55, edgecolor='#334155', linewidth=1.5)
for bar in bars:
    yval = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2.0, yval + 2, f"{yval}%", ha='center', va='bottom', 
             color='#f8fafc', fontweight='bold', fontsize=10)

ax2.set_ylim(0, 110)
ax2.set_ylabel('Computed Safety Visibility Score (%)', color='#f8fafc', fontsize=10, fontweight='bold')
ax2.set_title("Safety Index Degradation by Mining Conditions", color='#f8fafc', fontsize=11, fontweight='bold')
ax2.tick_params(colors='#94a3b8')
ax2.grid(axis='y', linestyle='--', color='#1e293b', alpha=0.7)

telemetry_img_path = os.path.join(img_dir, "telemetry_analytics.png")
plt.tight_layout()
plt.savefig(telemetry_img_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
plt.close()
print("Saved:", telemetry_img_path)
