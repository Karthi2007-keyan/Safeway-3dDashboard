import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

img_dir = r"d:\Projects\SafeWay\doc_images"

# Create a composite UI output screenshot mockup
fig, ax = plt.subplots(figsize=(16, 9), dpi=300)
fig.patch.set_facecolor('#030712')
ax.set_facecolor('#030712')
ax.set_xlim(0, 160)
ax.set_ylim(0, 90)
ax.axis('off')

# 1. Top Navbar
nav_bg = patches.Rectangle((0, 82), 160, 8, facecolor='#0f172a', edgecolor='#1e293b', linewidth=1.5)
ax.add_patch(nav_bg)

# Logo
logo_box = patches.FancyBboxPatch((4, 83.5), 5, 5, boxstyle="round,pad=0.2", facecolor='#10b981', edgecolor='#34d399', lw=1.5)
ax.add_patch(logo_box)
ax.text(6.5, 86, "🛡️", fontsize=14, ha='center', va='center')

ax.text(12, 86.5, "SafeWay", color='#00f0ff', fontsize=16, fontweight='black', fontfamily='sans-serif')
ax.text(12, 83.8, "SYSTEM ONLINE • SIH-26 MINING TELEMETRY", color='#34d399', fontsize=8, fontfamily='monospace', fontweight='bold')

# Nav buttons
modes = ["HUD 3D", "CAB VIEW", "RADAR", "360° ORBIT"]
for i, m in enumerate(modes):
    is_act = (i == 0)
    btn = patches.FancyBboxPatch((70 + i*13, 84), 12, 4, boxstyle="round,pad=0.2", 
                                facecolor='#00f0ff' if is_act else '#1e293b', 
                                edgecolor='#38bdf8' if is_act else '#334155', lw=1)
    ax.add_patch(btn)
    ax.text(76 + i*13, 86, m, color='#020617' if is_act else '#94a3b8', fontsize=8, fontweight='bold', ha='center', fontfamily='monospace')

lidar_btn = patches.FancyBboxPatch((125, 84), 18, 4, boxstyle="round,pad=0.2", facecolor='#312e81', edgecolor='#6366f1', lw=1.2)
ax.add_patch(lidar_btn)
ax.text(134, 86, "LIDAR CLOUD: ON", color='#c7d2fe', fontsize=8, fontweight='bold', ha='center', fontfamily='monospace')

# 2. Safety Toast Banner (Top Right Floating)
toast_bg = patches.FancyBboxPatch((105, 66), 50, 14, boxstyle="round,pad=0.5", facecolor='#450a0a', edgecolor='#ef4444', lw=1.8, alpha=0.95)
ax.add_patch(toast_bg)
ax.text(108, 77, "⚠️ ENVIRONMENTAL SAFETY HUD • VISIBILITY ADVISORY", color='#fca5a5', fontsize=8, fontfamily='monospace', fontweight='bold')
ax.text(108, 72.5, "VISIBILITY: LOW  (SCORE: 28%)", color='#ef4444', fontsize=12, fontweight='black', fontfamily='monospace')
ax.text(108, 68.5, "CRITICAL LOW VISIBILITY AHEAD! DUST: 4095 RAW • LUX: -2 lx", color='#fecaca', fontsize=8, fontfamily='monospace')

# 3. Main 3D Viewport (Left Area)
view_3d = patches.FancyBboxPatch((4, 26), 100, 54, boxstyle="round,pad=0.4", facecolor='#070c18', edgecolor='#1e293b', lw=2)
ax.add_patch(view_3d)

# Draw 3D road perspective
ax.plot([4, 40, 68, 104], [26, 44, 44, 26], color='#1e293b', lw=1.5)
ax.plot([25, 48, 60, 83], [26, 44, 44, 26], color='#0284c7', lw=1.2, linestyle=':')
# Neon pathway chevrons
for cy in [29, 33, 37, 41]:
    ax.plot([54 - (cy-26)*0.8, 54, 54 + (cy-26)*0.8], [cy-1, cy+1, cy-1], color='#00f0ff', lw=2.5, alpha=0.8)

# 3D Mining Truck Silhouette
truck_body = patches.FancyBboxPatch((46, 38), 16, 12, boxstyle="round,pad=0.3", facecolor='#eab308', edgecolor='#ca8a04', lw=2)
ax.add_patch(truck_body)
truck_dump = patches.Polygon([[44, 43], [42, 53], [58, 53], [56, 43]], facecolor='#ca8a04', edgecolor='#a16207', lw=1.5)
ax.add_patch(truck_dump)
# Wheels
for wx in [45, 60]:
    wheel = patches.Circle((wx, 38), 3.2, facecolor='#1e293b', edgecolor='#475569', lw=2)
    ax.add_patch(wheel)

# Headlight Cones
cone_left = patches.Polygon([[47, 40], [20, 68], [35, 72]], facecolor='#fef08a', alpha=0.15)
cone_right = patches.Polygon([[58, 40], [70, 72], [85, 68]], facecolor='#fef08a', alpha=0.15)
ax.add_patch(cone_left)
ax.add_patch(cone_right)

# 3D Forward Obstacle Hologram
ax.plot([54, 54], [40, 58], color='#ef4444', lw=2, linestyle='--')
obs_box = patches.FancyBboxPatch((50, 58), 8, 8, boxstyle="round,pad=0.2", facecolor='#7f1d1d', edgecolor='#ef4444', lw=2)
ax.add_patch(obs_box)
ax.text(54, 62, "HAZARD\n1.82m", color='#ffffff', fontsize=7, fontweight='bold', ha='center', fontfamily='monospace')

# 3D HUD Tags
ax.text(8, 76, "CAT 797F HEAVY HAULER • AUTONOMOUS TELEMETRY", color='#38bdf8', fontsize=9, fontfamily='monospace', fontweight='bold')
ax.text(8, 73, "PITCH: +3.2° | ROLL: -1.1° | SPEED: 42 km/h", color='#94a3b8', fontsize=8, fontfamily='monospace')

# 4. Right Top Panel: LiDAR PPI Radar Scope
radar_panel = patches.FancyBboxPatch((108, 44), 48, 20, boxstyle="round,pad=0.4", facecolor='#0b1120', edgecolor='#1e293b', lw=1.5)
ax.add_patch(radar_panel)
ax.text(110, 61, "RADAR PPI SCOPE (LIDAR_01)", color='#00f0ff', fontsize=9, fontfamily='monospace', fontweight='bold')

# Mini Radar Circle
r_center = (122, 52)
for rad_val in [2.5, 5.0, 7.5]:
    c = patches.Circle(r_center, rad_val, color='#00f0ff', fill=False, lw=0.8, alpha=0.5, linestyle='--' if rad_val<7.5 else '-')
    ax.add_patch(c)
ax.plot([122, 128], [52, 56], color='#ef4444', lw=1.5) # target beam
ax.scatter([128], [56], color='#ef4444', s=40, zorder=5)

ax.text(132, 55, "BEARING: 25.4°\nDIST: 1.53 m\nPOINTS: 20 PTS\nQUALITY: 94%", color='#f8fafc', fontsize=8, fontfamily='monospace')

# 5. Right Bottom Panel: Telemetry Chart
chart_panel = patches.FancyBboxPatch((108, 26), 48, 16, boxstyle="round,pad=0.4", facecolor='#0b1120', edgecolor='#1e293b', lw=1.5)
ax.add_patch(chart_panel)
ax.text(110, 39.5, "REALTIME TELEMETRY HISTORY", color='#38bdf8', fontsize=9, fontfamily='monospace', fontweight='bold')

# Chart mini wave
cx = np.linspace(112, 152, 20)
cy1 = 31 + 3 * np.sin(np.linspace(0, 6, 20))
cy2 = 33 + 2.5 * np.cos(np.linspace(0, 5, 20))
ax.plot(cx, cy1, color='#00f0ff', lw=2)
ax.plot(cx, cy2, color='#f59e0b', lw=1.5, linestyle='--')
ax.text(112, 28, "— DIST (cm)    -- DUST (raw)", color='#94a3b8', fontsize=7.5, fontfamily='monospace')

# 6. Bottom Sensor Matrix (8 Telemetry Cards)
card_data = [
    ("OBSTACLE DIST", "182 cm", "CAUTION", "#f59e0b", "#451a03"),
    ("LIDAR_01 RANGE", "1532 mm", "92% SIG", "#6366f1", "#1e1b4b"),
    ("DUST DENSITY", "4095 raw", "MAX DUST", "#ef4444", "#450a0a"),
    ("AMBIENT LIGHT", "-2 lux", "NIGHT", "#eab308", "#422006"),
    ("CAB TEMP", "28.9 °C", "OPTIMAL", "#10b981", "#064e3b"),
    ("HUMIDITY", "58 %", "DRY", "#38bdf8", "#082f49"),
    ("MPU6050 PITCH", "+785 X", "TILT OK", "#a855f7", "#3b0764"),
    ("MPU6050 ROLL", "+247 Y", "STABLE", "#a855f7", "#3b0764"),
]

for idx, (title, val, badge, border_col, bg_col) in enumerate(card_data):
    x_pos = 4 + idx * 19.3
    c_box = patches.FancyBboxPatch((x_pos, 4), 18.5, 18, boxstyle="round,pad=0.3", facecolor=bg_col, edgecolor=border_col, lw=1.5)
    ax.add_patch(c_box)
    
    ax.text(x_pos + 1.5, 19, title, color='#94a3b8', fontsize=7.5, fontfamily='monospace', fontweight='bold')
    ax.text(x_pos + 17, 19, badge, color=border_col, fontsize=6.5, fontfamily='monospace', fontweight='bold', ha='right')
    ax.text(x_pos + 1.5, 12, val, color='#f8fafc', fontsize=12, fontfamily='monospace', fontweight='black')
    
    # mini bar
    p_bar_bg = patches.Rectangle((x_pos + 1.5, 6.5), 15.5, 1.8, facecolor='#0f172a')
    p_bar_fill = patches.Rectangle((x_pos + 1.5, 6.5), 10.5, 1.8, facecolor=border_col)
    ax.add_patch(p_bar_bg)
    ax.add_patch(p_bar_fill)

ui_mockup_path = os.path.join(img_dir, "dashboard_ui_mockup.png")
plt.tight_layout()
plt.savefig(ui_mockup_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
plt.close()
print("Saved UI Mockup:", ui_mockup_path)
