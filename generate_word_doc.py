import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def create_styled_table(doc, headers, data, col_widths=None):
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header Row
    hdr_row = table.rows[0]
    hdr_row._tr.get_or_add_trPr().append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    for idx, header_text in enumerate(headers):
        cell = hdr_row.cells[idx]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(header_text)
        run.font.name = "Arial"
        run.font.size = Pt(9.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0, 240, 255) # Cyan

    # Data Rows
    for r_idx, row_data in enumerate(data):
        row = table.rows[r_idx + 1]
        bg_color = "1E293B" if r_idx % 2 == 1 else "0B1120"
        for c_idx, cell_value in enumerate(row_data):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(str(cell_value))
            run.font.name = "Arial"
            run.font.size = Pt(9.0)
            run.font.color.rgb = RGBColor(241, 245, 249)

    # Set Widths if specified
    if col_widths:
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)

    doc.add_paragraph() # Spacing
    return table

def add_callout_box(doc, title, text, border_color="00F0FF", bg_color="0F172A"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    # Border
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:top w:val="none"/>
            <w:right w:val="none"/>
            <w:bottom w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_t = p.add_run(f"📌 {title}\n")
    run_t.font.name = "Arial"
    run_t.font.size = Pt(10)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(0, 240, 255) if border_color == "00F0FF" else RGBColor(245, 158, 11)
    
    run_body = p.add_run(text)
    run_body.font.name = "Arial"
    run_body.font.size = Pt(9)
    run_body.font.color.rgb = RGBColor(226, 232, 240)
    doc.add_paragraph()

def build_safeway_document():
    img_dir = r"d:\Projects\SafeWay\doc_images"
    doc = docx.Document()
    
    # Page Margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)
        
        # Header & Footer
        header = section.header
        p_hdr = header.paragraphs[0]
        p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r_hdr = p_hdr.add_run("SafeWay — Autonomous Mining Heavy Vehicle Safety System")
        r_hdr.font.name = "Arial"
        r_hdr.font.size = Pt(8.5)
        r_hdr.font.color.rgb = RGBColor(100, 116, 139)
        
        footer = section.footer
        p_ftr = footer.paragraphs[0]
        p_ftr.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_ftr = p_ftr.add_run("CONFIDENTIAL & PROPRIETARY • SIH-2026 TECHNICAL REPORT")
        r_ftr.font.name = "Arial"
        r_ftr.font.size = Pt(8)
        r_ftr.font.color.rgb = RGBColor(148, 163, 184)

    # ---------------------------------------------------------
    # COVER / TITLE PAGE
    # ---------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(30)
    title_p.paragraph_format.space_after = Pt(6)
    r_badge = title_p.add_run("TECHNICAL SYSTEM SPECIFICATION & ARCHITECTURAL REPORT")
    r_badge.font.name = "Arial"
    r_badge.font.size = Pt(10)
    r_badge.font.bold = True
    r_badge.font.color.rgb = RGBColor(16, 185, 129) # Emerald

    t_head = doc.add_paragraph()
    t_head.paragraph_format.space_before = Pt(0)
    t_head.paragraph_format.space_after = Pt(12)
    r_main_t = t_head.add_run("SafeWay: Real-Time 3D Heavy Vehicle Safety & Environmental Telemetry System")
    r_main_t.font.name = "Arial"
    r_main_t.font.size = Pt(24)
    r_main_t.font.bold = True
    r_main_t.font.color.rgb = RGBColor(15, 23, 42) # Slate Dark

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(24)
    r_sub = sub_p.add_run("Comprehensive Research Document on System Working Mechanics, Complete Technology Stack, IoT Hardware Schematics, 3D WebGL Digital Twin Simulation, Mathematical Visibility Algorithms, and Production Deployment.")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Metadata Grid Table
    meta_headers = ["Attribute", "Specification Details"]
    meta_data = [
        ["Project Title", "SafeWay (Smart Open-Cast Mining Haulage Safety)"],
        ["Target Problem", "Quarry Dust Blindness, Haul Road Obstacles, Night Invisibility & Collision Risks"],
        ["Hardware Hub", "ESP-WROOM-32 / ESP32-CAM (Dual Core 240MHz, 2.4GHz Wi-Fi)"],
        ["Primary Sensors", "LiDAR_01 (360° Ranging), HC-SR04 Ultrasonic, GP2Y1010AU0F Dust, BH1750 Lux, MPU6050 Accelerometer"],
        ["Cloud Backend", "Google Firebase / Cloud Firestore (Reactive WebSocket sub-100ms sync)"],
        ["Frontend & 3D Twin", "React 19, Vite 6, Three.js (r174), Tailwind CSS 4, Chart.js 4, Web Audio API"],
        ["System Status", "Fully Operational & Production Simulated (SIH-26 Edition)"]
    ]
    create_styled_table(doc, meta_headers, meta_data, [2.0, 4.5])

    doc.add_page_break()

    # ---------------------------------------------------------
    # 1. EXECUTIVE SUMMARY & PROBLEM STATEMENT
    # ---------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r1 = h1.add_run("1. Executive Summary & Problem Statement")
    r1.font.name = "Arial"
    r1.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run(
        "Open-cast mining and heavy quarry haulage represent some of the most perilous industrial environments globally. "
        "Massive mining haul trucks (such as the Caterpillar 797F series weighing up to 600 tonnes loaded) operate under "
        "extreme ambient hazards, including thick airborne dust plumes generated during crushing and transport, zero-lux night operations, "
        "slippery terrain gradients, and massive blind spots extending tens of meters around the chassis. Operator visual impairment is a "
        "primary root cause of severe vehicular collisions, haul road run-offs, and critical equipment damage."
    )

    p2 = doc.add_paragraph()
    p2.add_run(
        "SafeWay solves this existential safety bottleneck through an end-to-end cyber-physical IoT telemetry and 3D digital twin platform. "
        "By fusing multi-modal environmental and spatial sensors (LiDAR, ultrasonic rangefinders, optical dust photometers, ambient lux meters, "
        "and 3-axis inertial measurement units) onto an ESP32 edge microcontroller, SafeWay streams live quarry conditions directly to Google Cloud "
        "Firestore. The SafeWay web client renders an immersive, real-time 3D tactical HUD in Three.js, visualizes polar LiDAR PPI radar sweeps, "
        "computes a mathematical Environmental Visibility Score, and executes automated emergency braking warnings with synthesized auditory sirens."
    )

    add_callout_box(
        doc,
        "Core Project Objective",
        "To eliminate heavy mining haul truck accidents by delivering instantaneous 3D spatial awareness, real-time visibility advisory, and sub-second collision prevention alerts to operators and mine dispatch controllers."
    )

    # ---------------------------------------------------------
    # 2. COMPLETE SOFTWARE & TECHNOLOGY STACK (DETAILED)
    # ---------------------------------------------------------
    h2 = doc.add_heading(level=1)
    r2 = h2.add_run("2. Complete Software & Technology Stack")
    r2.font.name = "Arial"
    r2.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run(
        "The SafeWay platform is architected using a modern, reactive, and high-performance technology stack designed for sub-millisecond local rendering "
        "and real-time distributed telemetry streaming. The table below details every software library, framework, and tool utilized across the project:"
    )

    stack_headers = ["Category / Layer", "Software / Technology", "Version", "Functional Role in SafeWay"]
    stack_data = [
        ["Core Framework", "React", "v19.0.0", "Component architecture, declarative UI state management, hooks-driven reactive telemetry"],
        ["Build & Dev Server", "Vite", "v6.2.0", "Next-gen lightning-fast HMR bundler and development build environment"],
        ["3D Graphics Engine", "Three.js", "v0.174.0", "WebGL-powered 3D digital twin, GLTF vehicle/terrain loader, dynamic lights, dust storm particle systems"],
        ["3D Helpers & Controls", "GLTFLoader, OrbitControls", "Built-in Three.js", "Asynchronous 3D mesh ingestion and tactical multi-camera navigation"],
        ["Cloud Database", "Google Firebase / Firestore", "v11.4.0", "Global real-time NoSQL database with WebSocket onSnapshot() push listeners"],
        ["Styling & Design System", "Tailwind CSS", "v4.3.3", "Modern glassmorphism, responsive grid layouts, cyber-hud neon aesthetics"],
        ["Vite Tailwind Plugin", "@tailwindcss/vite", "v4.3.3", "Zero-config compilation of Tailwind CSS 4 directly inside Vite pipeline"],
        ["Realtime Charting", "Chart.js & React-Chartjs-2", "v4.4.8 / v5.3.0", "High-performance time-series telemetry line graphs and historical charts"],
        ["Iconography Suite", "Lucide-React", "v0.477.0", "Clean vector icons for radar, distance gauges, alerts, headlights, and hardware badges"],
        ["Sound Synthesizer", "HTML5 Web Audio API", "Native Browser API", "Hardware-accelerated sound generation (sawtooth waveform sirens and warning beeps)"],
        ["Embedded Microcontroller", "ESP32 Arduino C++ / MicroPython", "ESP-IDF v4.x+", "Hardware sensor sampling, ADC filtering, I2C/UART bus polling, and Firestore REST pushing"]
    ]
    create_styled_table(doc, stack_headers, stack_data, [1.4, 1.6, 0.9, 2.6])

    # ---------------------------------------------------------
    # 3. HOW THE ENTIRE SYSTEM WORKS (STEP-BY-STEP)
    # ---------------------------------------------------------
    h3 = doc.add_heading(level=1)
    r3 = h3.add_run("3. End-to-End System Working Mechanics")
    r3.font.name = "Arial"
    r3.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run(
        "The operation of SafeWay follows a closed-loop cyber-physical pipeline comprising seven distinct synchronized phases:"
    )

    steps = [
        ("Phase 1: Edge Sensing & Telemetry Ingestion",
         "The physical haul truck is equipped with an array of industrial sensors connected to an onboard ESP32 controller. "
         "The ultrasonic HC-SR04 measures forward physical obstacle distances in centimeters. The LiDAR_01 scanner executes a continuous 360° rotational scan "
         "measuring millimetric ranges and azimuth angles. The GP2Y1010AU0F optical dust sensor pulses an internal infrared emitter to detect light scattering from "
         "ambient particulate matter (dust_raw 0 to 4095). The BH1750 ambient light sensor measures illuminance in lux. The MPU6050/ADXL345 3-axis accelerometer "
         "calculates vehicle chassis pitch (X-axis) and roll (Y-axis) tilt."),
        
        ("Phase 2: Cloud Firestore Push & Synchronization",
         "The ESP32 structures sampled readings into JSON payloads and transmits them via Wi-Fi (or 4G/5G industrial gateway) to Google Cloud Firestore. "
         "The primary document is maintained at 'sensor_data/ESP32_01' for low-latency state replacement, while individual LiDAR scan pulses are appended into "
         "the 'lidar_data' collection and time-series historical logs into 'sensor_history'."),
        
        ("Phase 3: Client Subscription & Reactive State Hydration",
         "Inside the SafeWay React 19 application (CATDashboard.jsx and firebase.js), active 'onSnapshot()' subscriptions listen to Firestore document changes. "
         "Whenever a sensor pulse arrives in the cloud, the listener fires within milliseconds, updating the React state without requiring page refreshes or polling."),
        
        ("Phase 4: Three.js 3D Digital Twin Simulation Loop",
         "The ThreeCanvas.jsx engine executes a 60 FPS requestAnimationFrame render loop. It continuously updates the 3D Mining Truck position, rotates its wheels, "
         "applies accelerometer pitch/roll tilt to the truck body, adjusts headlights based on ambient lux, alters the volumetric exponential fog and particle storm density "
         "in response to dust_raw, and projects dynamic 3D obstacle bounding boxes and sonar laser rings according to obstacle distance."),
        
        ("Phase 5: LiDAR Radar PPI Scope Visualizer",
         "The CameraFeedPanel.jsx component renders a circular military-grade Plan Position Indicator (PPI) radar scope. It accumulates a rolling buffer of the 20 most recent "
         "scanned points, converts polar coordinates (angle, distance) into Cartesian SVG coordinates, displays a 360° rotating radar sweep beam, and dynamically color-codes "
         "hazard points (Red for <1.0m critical hazard, Amber for <2.5m caution, Cyan for clear)."),
        
        ("Phase 6: Environmental Visibility Index Calculation",
         "The VisibilityToast.jsx and VisibilityAlertBanner.jsx components process live dust, lux, and humidity metrics through a dedicated scoring algorithm. "
         "Dust levels above 3000 raw or night-time lux (<0) trigger a 'LOW VISIBILITY' critical advisory, prompting operators to reduce vehicle speed."),
        
        ("Phase 7: Emergency Braking & Auditory Alarm Dispatch",
         "If obstacle distance drops below 100 cm (1.0 meter), the system immediately displays a high-contrast bouncing red emergency warning banner: "
         "'⚠️ CRITICAL DANGER: OBSTACLE WITHIN 1.0 METER! AUTOMATIC BRAKING ENGAGED!'. Simultaneously, the HTML5 Web Audio API synthesizes a 660Hz-880Hz dual-tone "
         "sawtooth emergency siren to alert the vehicle operator instantly.")
    ]

    for title, desc in steps:
        p_step = doc.add_paragraph()
        p_step.paragraph_format.space_before = Pt(6)
        p_step.paragraph_format.space_after = Pt(2)
        r_st = p_step.add_run(f"▶ {title}\n")
        r_st.font.name = "Arial"
        r_st.font.size = Pt(10.5)
        r_st.font.bold = True
        r_st.font.color.rgb = RGBColor(14, 116, 144) # Cyan Dark
        
        r_sd = p_step.add_run(desc)
        r_sd.font.name = "Arial"
        r_sd.font.size = Pt(9.5)
        r_sd.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_page_break()

    # ---------------------------------------------------------
    # 4. SYSTEM ARCHITECTURE & TELEMETRY FLOW DIAGRAM
    # ---------------------------------------------------------
    h4 = doc.add_heading(level=1)
    r4 = h4.add_run("4. System Architecture & Telemetry Pipeline")
    r4.font.name = "Arial"
    r4.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run("Figure 1 illustrates the end-to-end data pipeline from physical quarry sensors to Google Cloud Firestore and the React 19 / Three.js 3D client:")

    flow_path = os.path.join(img_dir, "architecture_flow.png")
    if os.path.exists(flow_path):
        doc.add_picture(flow_path, width=Inches(6.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 1: SafeWay Complete End-to-End System Architecture & Telemetry Pipeline")
        r_cap.font.name = "Arial"
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph()

    # ---------------------------------------------------------
    # 5. HARDWARE ARCHITECTURE & SENSOR PINOUT INTERFACING
    # ---------------------------------------------------------
    h5 = doc.add_heading(level=1)
    r5 = h5.add_run("5. Hardware Architecture & Sensor Pinout Interfacing")
    r5.font.name = "Arial"
    r5.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run(
        "The SafeWay onboard computing node is powered by an ESP-WROOM-32 microcontroller interfacing six industrial-grade sensor modules. "
        "Figure 2 illustrates the pin connections, communication buses, and electrical protocols utilized in the hardware design:"
    )

    hw_path = os.path.join(img_dir, "hardware_iot_schema.png")
    if os.path.exists(hw_path):
        doc.add_picture(hw_path, width=Inches(6.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 2: SafeWay Hardware Interfacing, Bus Topology & ESP32 Pinout Schema")
        r_cap.font.name = "Arial"
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph()

    pin_headers = ["Sensor Module", "Communication Bus", "ESP32 Pins Connected", "Measured Physical Parameter", "Operating Range"]
    pin_data = [
        ["LiDAR_01 (RPLiDAR / TFmini)", "Hardware UART (Serial2)", "GPIO 16 (RX2), GPIO 17 (TX2)", "360° Azimuth Angle & Spatial Distance", "0.1m – 12.0m (±10mm)"],
        ["HC-SR04 Ultrasonic", "Digital GPIO (Pulse Timing)", "GPIO 5 (Trigger), GPIO 18 (Echo)", "Forward Obstacle Line-of-Sight Distance", "2cm – 400cm (±3mm)"],
        ["GP2Y1010AU0F Dust Sensor", "Analog ADC + Digital LED Trigger", "GPIO 34 (ADC Input), GPIO 23 (LED Pulse)", "Optical Particulate / Dust Scattering Density", "0 – 0.5 mg/m³ (0-4095 raw)"],
        ["BH1750 Ambient Light", "I2C Bus (Address 0x23)", "GPIO 21 (SDA), GPIO 22 (SCL)", "Illuminance Exposure / Night Detection", "1 – 65,535 Lux (16-bit)"],
        ["MPU-6050 Accelerometer", "I2C Bus (Address 0x68)", "GPIO 21 (SDA), GPIO 22 (SCL)", "Chassis Pitch (X), Roll (Y), Vibration (Z)", "±2g / ±250°/sec (16-bit ADC)"],
        ["Emergency Buzzer / Siren", "PWM Output / DAC", "GPIO 25 (PWM Tone)", "Auditory Cabin Collision Alert", "440Hz – 880Hz Dual Tone"]
    ]
    create_styled_table(doc, pin_headers, pin_data, [1.4, 1.3, 1.5, 1.4, 0.9])

    doc.add_page_break()

    # ---------------------------------------------------------
    # 6. DASHBOARD UI & 3D DIGITAL TWIN VISUALIZATION
    # ---------------------------------------------------------
    h6 = doc.add_heading(level=1)
    r6 = h6.add_run("6. Dashboard UI & Output Visualizations")
    r6.font.name = "Arial"
    r6.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run(
        "The SafeWay dashboard is an interactive, multi-panel tactical cockpit providing real-time visual telemetry, 3D spatial positioning, "
        "radar sweeps, and sensor diagnostics. Figure 3 presents a complete output render of the user interface:"
    )

    ui_path = os.path.join(img_dir, "dashboard_ui_mockup.png")
    if os.path.exists(ui_path):
        doc.add_picture(ui_path, width=Inches(6.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 3: SafeWay 3D Tactical Haulage Dashboard & Multi-Panel HUD Output")
        r_cap.font.name = "Arial"
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph()

    # ---------------------------------------------------------
    # 7. LIDAR RADAR PPI SCOPE & ANALYTICS OUTPUTS
    # ---------------------------------------------------------
    h7 = doc.add_heading(level=1)
    r7 = h7.add_run("7. LiDAR Radar PPI Scope & Telemetry Analytics")
    r7.font.name = "Arial"
    r7.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run(
        "Figure 4 demonstrates the high-precision circular Plan Position Indicator (PPI) radar scope, which renders a 20-point rolling scan "
        "of active LiDAR target tracking alongside the real-time time-series telemetry curve and environmental visibility index breakdown:"
    )

    radar_path = os.path.join(img_dir, "radar_ppi_scope.png")
    if os.path.exists(radar_path):
        doc.add_picture(radar_path, width=Inches(4.2))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 4: SafeWay LiDAR Radar PPI Scope Visualizer (20-Point Rolling Azimuth Buffer)")
        r_cap.font.name = "Arial"
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph()

    telemetry_path = os.path.join(img_dir, "telemetry_analytics.png")
    if os.path.exists(telemetry_path):
        doc.add_picture(telemetry_path, width=Inches(6.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 5: Time-Series Telemetry Analysis (Distance vs Dust) & Safety Index Degradation Matrix")
        r_cap.font.name = "Arial"
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_page_break()

    # ---------------------------------------------------------
    # 8. MATHEMATICAL MODELS & CORE ALGORITHMS
    # ---------------------------------------------------------
    h8 = doc.add_heading(level=1)
    r8 = h8.add_run("8. Mathematical Models & Core Algorithms")
    r8.font.name = "Arial"
    r8.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run(
        "SafeWay utilizes rigorous mathematical formulas to translate raw physical sensor inputs into actionable safety scores and 3D visual coordinates."
    )

    algo_1 = doc.add_paragraph()
    algo_1.add_run("8.1 Environmental Visibility Score Algorithm\n").bold = True
    algo_1.add_run(
        "The visibility index V is computed dynamically from optical dust raw readings D, ambient light lux L, and relative humidity H:\n\n"
        "   1. Dust Penalty:      P_dust = min(100, (D / 4095) * 85)\n"
        "   2. Lux Penalty:       P_lux = 30 if L <= 0, else (15 if L < 50 else 0)\n"
        "   3. Humidity Penalty:  P_humidity = 15 if H > 80% else 0\n"
        "   4. Final Score:       V = max(0, min(100, round(100 - P_dust - P_lux - P_humidity)))\n\n"
        "Classification Thresholds:\n"
        "   • V >= 70% and D <= 1500:  HIGH VISIBILITY (Optimal Clear Driving Conditions, Green)\n"
        "   • 35% <= V < 70%:          MODERATE VISIBILITY (Exercise Caution, Amber)\n"
        "   • V < 35% or D > 3000:     CRITICAL LOW VISIBILITY (Immediate Speed Reduction Required, Red Alert)"
    )

    algo_2 = doc.add_paragraph()
    algo_2.add_run("\n8.2 Polar to Cartesian Radar Transformation\n").bold = True
    algo_2.add_run(
        "Given target angle θ (in degrees, where 0° is North) and range distance d (in millimeters), normalized radius r on the SVG scope (where max radius is 42%) is computed as:\n\n"
        "   r_norm = min(max(d / 4000, 0.05), 1.0) * 42\n"
        "   θ_rad = (θ - 90°) * (π / 180)\n"
        "   X_pos = 50 + r_norm * cos(θ_rad)\n"
        "   Y_pos = 50 + r_norm * sin(θ_rad)"
    )

    algo_3 = doc.add_paragraph()
    algo_3.add_run("\n8.3 Linear Interpolation (LERP) Smoothing for 3D Digital Twin\n").bold = True
    algo_3.add_run(
        "To prevent jarring jumps in the 3D WebGL viewport during fluctuating sensor packet arrivals, all 3D vehicle transforms apply linear interpolation:\n\n"
        "   Position_current = Position_current + (Position_target - Position_current) * α\n"
        "   (where α = 0.08 smoothing factor evaluated at 60 FPS)"
    )

    # ---------------------------------------------------------
    # 9. CLOUD FIRESTORE SCHEMA & PRODUCTION SECURITY RULES
    # ---------------------------------------------------------
    h9 = doc.add_heading(level=1)
    r9 = h9.add_run("9. Cloud Firestore Database Schema & Security Architecture")
    r9.font.name = "Arial"
    r9.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run(
        "SafeWay utilizes Google Cloud Firestore (Project ID: sih26-f340c) with strict document schemas and granular security rules:"
    )

    schema_headers = ["Collection / Path", "Document ID", "Key Fields & Data Types", "Update Frequency", "Purpose"]
    schema_data = [
        ["sensor_data", "ESP32_01", "distance_cm (num), dust_raw (num), light_lux (num), humidity (num), temperature_c (num), accelerometer {x,y,z}", "Real-time (2-5 Hz)", "Primary live telemetry document subscribed by dashboard"],
        ["lidar_data", "Auto-ID ({docId})", "device (str), distance_mm (num), angle (num), quality (num), timestamp (serverTimestamp)", "Stream (10-20 Hz)", "Discrete LiDAR laser pulses and spatial point cloud mapping"],
        ["sensor_history", "Auto-ID ({readingId})", "distance_cm, dust_raw, light_lux, temperature_c, timestamp (serverTimestamp)", "Append-Only (1 Hz)", "Historical analytics, incident investigation & safety audit logging"]
    ]
    create_styled_table(doc, schema_headers, schema_data, [1.1, 1.0, 2.0, 1.0, 1.4])

    p_rules = doc.add_paragraph()
    p_rules.add_run("Production Firestore Security Rules Code:\n").bold = True
    p_rules.add_run(
        "rules_version = '2';\n"
        "service cloud.firestore {\n"
        "  match /databases/{database}/documents {\n"
        "    match /sensor_data/{deviceId} {\n"
        "      allow read: if true;\n"
        "      allow create, update: if true;\n"
        "      allow delete: if false;\n"
        "    }\n"
        "    match /lidar_data/{docId} {\n"
        "      allow read: if true;\n"
        "      allow create, update: if true;\n"
        "      allow delete: if false;\n"
        "    }\n"
        "    match /sensor_history/{readingId} {\n"
        "      allow read, create: if true;\n"
        "      allow update, delete: if false;\n"
        "    }\n"
        "    match /{document=**} {\n"
        "      allow read, write: if false;\n"
        "    }\n"
        "  }\n"
        "}"
    )

    doc.add_page_break()

    # ---------------------------------------------------------
    # 10. COMPONENT INVENTORY & CODEBASE ARCHITECTURE
    # ---------------------------------------------------------
    h10 = doc.add_heading(level=1)
    r10 = h10.add_run("10. Component Inventory & Codebase Architecture")
    r10.font.name = "Arial"
    r10.font.color.rgb = RGBColor(15, 23, 42)

    comp_headers = ["File Path", "Primary Responsibility", "Exported Entities & Interfaces"]
    comp_data = [
        ["src/firebase.js", "Firebase SDK initialization, Firestore connection, real-time subscription helpers, and write methods", "firebaseConfig, db, subscribeToSensorData(), subscribeToLidarData(), updateFirestoreSensorData(), updateFirestoreLidarData()"],
        ["src/components/CATDashboard.jsx", "Main application layout, top navigation bar, camera mode selector, real-time clock, emergency braking banners, and state coordinator", "default export CATDashboard()"],
        ["src/components/ThreeCanvas.jsx", "Three.js WebGL canvas, 3D GLTF mining truck model, road terrain scrolling, particle dust storm, dynamic lighting, and camera orbit controls", "default export ThreeCanvas({ sensorData, lidarData, cameraMode, showLidar })"],
        ["src/components/CameraFeedPanel.jsx", "Plan Position Indicator (PPI) circular radar scope, 20-point rolling LiDAR scan buffer, azimuth vector beam, and optional ESP32-CAM video stream", "default export CameraFeedPanel({ camData, distanceCm, dustRaw, lidarData })"],
        ["src/components/TelemetryPanel.jsx", "Grid of 8 high-density sensor telemetry cards (Distance, LiDAR, Dust, Light, Temperature, Humidity, 3-Axis Accel)", "default export TelemetryPanel({ sensorData, lidarData })"],
        ["src/components/TelemetryChart.jsx", "Real-time HTML5 Canvas 2D line graph rendering rolling 30-sample historical curves of distance and dust density", "default export TelemetryChart({ sensorData })"],
        ["src/components/VisibilityToast.jsx", "Floating environmental safety toast notification, mathematical visibility score engine, and Web Audio API alarm synthesizer", "calculateVisibility(), default export VisibilityToast({ sensorData })"],
        ["src/components/VisibilityAlertBanner.jsx", "Wide-screen alternative environmental banner for operator cab display with embedded audio alert toggles", "calculateVisibility(), default export VisibilityAlertBanner({ sensorData })"],
        ["src/components/FirestoreControlModal.jsx", "Interactive calibration modal, manual hardware slider overrides, automated sine-wave test simulator, and security rules copy tool", "FIRESTORE_SECURITY_RULES, default export FirestoreControlModal(...)"],
        ["src/components/Tesla3DCanvas.jsx", "Alternative 3D vehicle viewport with multiple perspective angles (ISO, FRONT, CHASE, TOP) for customizable telemetry views", "export Tesla3DCanvas({ telemetry })"]
    ]
    create_styled_table(doc, comp_headers, comp_data, [1.8, 2.5, 2.2])

    # ---------------------------------------------------------
    # 11. FUTURE ENHANCEMENTS & INDUSTRIAL ROADMAP
    # ---------------------------------------------------------
    h11 = doc.add_heading(level=1)
    r11 = h11.add_run("11. Future Enhancements & Industrial Roadmap")
    r11.font.name = "Arial"
    r11.font.color.rgb = RGBColor(15, 23, 42)

    enhancements = [
        ("1. CAN Bus (J1939) Heavy Vehicle Integration", "Direct integration with the vehicle's onboard Controller Area Network (CAN) to extract engine RPM, transmission status, retarder braking telemetry, and payload weight."),
        ("2. Edge AI YOLOv8 Optical Obstacle Classification", "Deploying an onboard Hailo-8 or Jetson Orin edge AI accelerator on the ESP32-CAM video feed to classify detected obstacles into 'Light Personnel Vehicle', 'Mine Worker', 'Bolder / Berm', and 'Haul Truck'."),
        ("3. RTK-GPS Autonomous Geofencing & Berm Proximity", "Centimeter-accurate Real-Time Kinematic (RTK) satellite positioning to warn drivers when approaching dangerous quarry haul road cliff edges and dumping berms."),
        ("4. Vehicle-to-Vehicle (V2V) Mesh Network", "Implementing ESP-NOW / 802.11p mesh communications allowing haul trucks to broadcast their positions to nearby equipment even in deep pits with zero cellular coverage.")
    ]

    for title, desc in enhancements:
        p_enh = doc.add_paragraph()
        p_enh.add_run(f"• {title}: ").bold = True
        p_enh.add_run(desc)

    # ---------------------------------------------------------
    # 12. CONCLUSION
    # ---------------------------------------------------------
    h12 = doc.add_heading(level=1)
    r12 = h12.add_run("12. Conclusion")
    r12.font.name = "Arial"
    r12.font.color.rgb = RGBColor(15, 23, 42)

    p_conc = doc.add_paragraph()
    p_conc.add_run(
        "The SafeWay platform represents a breakthrough in open-cast mining vehicle safety, successfully uniting low-cost multi-modal IoT hardware "
        "with cutting-edge WebGL 3D digital twins and real-time cloud data streams. By eliminating driver blind spots, providing continuous environmental "
        "visibility scoring, and enforcing automated collision alerts, SafeWay establishes a new benchmark for heavy industrial haulage safety."
    )

    # Save Document
    doc_path = r"d:\Projects\SafeWay\SafeWay_Complete_Technical_Report.docx"
    doc.save(doc_path)
    print("SUCCESS: Document generated at:", doc_path)
    return doc_path

if __name__ == "__main__":
    build_safeway_document()
