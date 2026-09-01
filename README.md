# 🚗 Multi-Vehicle 3D Three.js Studio & Configurator

An interactive 3D WebGL vehicle showroom and configurator built with **Three.js**, featuring high-fidelity PBR shaders, dynamic studio lighting, multi-view camera presets, physical illuminated lamps, and an interactive **Exploded Assembly View**.

---

## ✨ Featured Vehicles

1. 🚙 **Jeep Wrangler Rubicon**
   * High-accuracy CAD geometry converted from B-Rep STEP (`jeep.step`).
   * Removable soft-top canopy (open-air convertible toggle).
   * Circular 3D illuminated headlight lenses with projector beam cones.
   * 8 authentic Jeep paint colors (Sarge Green, Firecracker Red, Hydro Blue, etc.).
   * Orthographic blueprint and specs drawer.

2. ⚡ **Rivian R1T Adventure Truck (2022)**
   * Full-width front LED light bar + vertical stadium headlights.
   * Full-width rear red LED brake light bar with ground spill.
   * Signature yellow brake calipers and tinted panoramic glass roof.
   * 8 Rivian official colors (Rivian Blue, Compass Yellow, Red Canyon, etc.).

3. 🔋 **Rivian R1S 7-Passenger SUV (2023)**
   * Enclosed 3-row electric SUV body shell with clearcoat reflections.
   * Xenon stadium headlights + signature Amber DRL halo rings.
   * Continuous rear LED light bar.

---

## 💥 Interactive Features

* **360° Studio Controls**: Smooth orbit, pan, and zoom with damping.
* **Exploded Assembly View**: Drag the slider from `0%` to `100%` or click the toggle button to smoothly float components apart (wheels, body shell, roof, interior, chassis, bumpers).
* **Multi-View Camera Transitions**: Quick animated camera alignments (Hero 3/4, Front, Side, Rear, Top).
* **Illuminated Lighting System**: Working physical 3D lamp lenses and spotlight projectors.
* **Studio Floor Podium**: Contact ground shadow, CAD grid overlay, and studio ring.
* **Screenshot Capture**: Export high-resolution PNG snapshots directly from the WebGL canvas.

---

## 🚀 Quick Start

### 1. Run the Studio Locally
```bash
# Using Node.js
npm start

# Or directly:
node server.js
```

Then open the URL shown in your terminal:
👉 **`http://localhost:3000/`** (or `http://localhost:3001/`)

### 2. Alternative Local Servers
```bash
# Using Python
python3 -m http.server 3000
```
Or open in VS Code with the **Live Server** extension.

---

## 📁 Project Structure

```
├── index.html            # Main HTML layout, Three.js import map, HUD & modal
├── style.css             # Dark showroom UI, glassmorphism, slider styles
├── main.js               # Three.js scene controller, loop, lighting & HUD events
├── jeep-loader.js        # Jeep Wrangler loader, PBR shaders, exploded offsets
├── rivian-loader.js      # Rivian R1T truck loader, light bars, exploded offsets
├── rivian-r1s-loader.js  # Rivian R1S SUV loader, stadium lights, exploded offsets
├── server.js             # Lightweight Node.js server with GLB MIME support
├── package.json          # NPM configuration & scripts
├── jeep.step.glb         # Converted Jeep CAD binary mesh
├── rivian_r1t_2022_free.glb # Rivian R1T 3D mesh
├── rivian_r1s.glb        # Rivian R1S 3D mesh
└── drawings.jpg          # Orthographic technical drawings reference
```

---

## 🛠️ Built With

* [Three.js](https://threejs.org/) (r162) — WebGL 3D Engine
* Physically Based Rendering (PBR) & `MeshPhysicalMaterial`
* Modern ES Modules & Import Maps
