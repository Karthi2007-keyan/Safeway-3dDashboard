import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

img_dir = r"d:\Projects\SafeWay\doc_images"

fig, ax = plt.subplots(figsize=(14, 7), dpi=300)
fig.patch.set_facecolor('#070e1c')
ax.set_facecolor('#070e1c')
ax.set_xlim(0, 140)
ax.set_ylim(0, 70)
ax.axis('off')

# Title
ax.text(70, 66, "SafeWay — Hardware Architecture & Sensor Pinout Interfacing", 
        fontsize=15, fontweight='bold', color='#00f0ff', ha='center', fontfamily='sans-serif')

# Center: ESP32 Microcontroller Hub
esp_box = patches.FancyBboxPatch((52, 18), 36, 38, boxstyle="round,pad=0.5", facecolor='#1e293b', edgecolor='#38bdf8', lw=2.5)
ax.add_patch(esp_box)
ax.text(70, 52, "ESP-WROOM-32 / ESP32-CAM", color='#38bdf8', fontsize=12, fontweight='black', ha='center', fontfamily='monospace')
ax.text(70, 48, "Dual-Core 240MHz • 2.4GHz Wi-Fi + BLE", color='#94a3b8', fontsize=8, ha='center', fontfamily='monospace')
ax.text(70, 44, "MicroPython / Arduino C++ Core", color='#a5b4fc', fontsize=8, ha='center', fontfamily='monospace')

# Internal Modules in ESP32
int_features = ["WiFi (IEEE 802.11 b/g/n)", "12-Bit ADC (GPIO 32-39)", "Hardware I2C (SDA 21 / SCL 22)", "Hardware UART (TX2 17 / RX2 16)"]
for i, feat in enumerate(int_features):
    f_box = patches.FancyBboxPatch((55, 36 - i*5.2), 30, 4.0, boxstyle="round,pad=0.1", facecolor='#0f172a', edgecolor='#475569', lw=1)
    ax.add_patch(f_box)
    ax.text(70, 38 - i*5.2, feat, color='#f8fafc', fontsize=7.5, ha='center', fontfamily='monospace', fontweight='bold')

# Left Side Sensors
left_sensors = [
    ("LiDAR_01 (RPLiDAR / TFmini)", "UART Serial (RX2/TX2)\n360° Laser Ranging (mm)", 60, "#6366f1", "#1e1b4b"),
    ("HC-SR04 Ultrasonic", "GPIO 5 (Trig) / GPIO 18 (Echo)\nEcho Pulse Timing (cm)", 40, "#0284c7", "#082f49"),
    ("GP2Y1010AU0F Dust Sensor", "GPIO 34 (ADC) + GPIO 23 (LED)\nAnalog Optical Scattering", 20, "#d97706", "#451a03")
]

for name, pins, y_pos, stroke_col, fill_col in left_sensors:
    s_box = patches.FancyBboxPatch((4, y_pos - 7), 36, 13, boxstyle="round,pad=0.4", facecolor=fill_col, edgecolor=stroke_col, lw=2)
    ax.add_patch(s_box)
    ax.text(6, y_pos + 3.5, name, color='#ffffff', fontsize=9.5, fontweight='bold', fontfamily='monospace')
    ax.text(6, y_pos - 3, pins, color='#cbd5e1', fontsize=7.5, fontfamily='monospace')
    
    # Arrow to ESP32
    ax.annotate("", xy=(52, y_pos), xytext=(40, y_pos),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=stroke_col, lw=2))

# Right Side Sensors & Actuators
right_modules = [
    ("MPU-6050 / ADXL345", "I2C (SDA 21 / SCL 22)\n3-Axis Gyro & Accelerometer", 60, "#a855f7", "#3b0764"),
    ("BH1750 Ambient Light", "I2C (Address 0x23)\nDigital Illuminance (Lux)", 40, "#eab308", "#422006"),
    ("Auditory Siren & Auto-Brake", "GPIO 25 (PWM DAC) + Relays\nEmergency Active Safety", 20, "#ef4444", "#450a0a")
]

for name, pins, y_pos, stroke_col, fill_col in right_modules:
    s_box = patches.FancyBboxPatch((100, y_pos - 7), 36, 13, boxstyle="round,pad=0.4", facecolor=fill_col, edgecolor=stroke_col, lw=2)
    ax.add_patch(s_box)
    ax.text(102, y_pos + 3.5, name, color='#ffffff', fontsize=9.5, fontweight='bold', fontfamily='monospace')
    ax.text(102, y_pos - 3, pins, color='#cbd5e1', fontsize=7.5, fontfamily='monospace')
    
    # Arrow from/to ESP32
    if "Siren" in name:
        ax.annotate("", xy=(100, y_pos), xytext=(88, y_pos),
                    arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=stroke_col, lw=2))
    else:
        ax.annotate("", xy=(88, y_pos), xytext=(100, y_pos),
                    arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=stroke_col, lw=2))

# Bottom Cloud Push
ax.annotate("", xy=(70, 3), xytext=(70, 18),
            arrowprops=dict(arrowstyle="->,head_width=0.5,head_length=0.8", color="#10b981", lw=3))
ax.text(70, 0.5, "PUSH TO FIRESTORE VIA HTTPS REST / WEBSOCKET (WIFI 2.4GHz)", 
        color="#34d399", fontsize=9, fontweight='black', ha='center', fontfamily='monospace')

hw_img_path = os.path.join(img_dir, "hardware_iot_schema.png")
plt.tight_layout()
plt.savefig(hw_img_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
plt.close()
print("Saved Hardware Schema:", hw_img_path)
