import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { JeepModel } from './jeep-loader.js';
import { RivianModel } from './rivian-loader.js';
import { RivianR1SModel } from './rivian-r1s-loader.js';

// Vehicles Metadata
const VEHICLES = {
  jeep: {
    id: 'jeep',
    name: 'Jeep Wrangler Rubicon',
    badgeIcon: '4x4',
    badgeTitle: 'JEEP WRANGLER',
    badgeSub: 'RUBICON OFF-ROAD EDITION',
    hasRoof: true,
    file: 'jeep.step.glb',
    defaultColor: '#2C5E3B',
    colors: [
      { name: 'Sarge Green', hex: '#2C5E3B' },
      { name: 'Firecracker Red', hex: '#C4121A' },
      { name: 'Hydro Blue', hex: '#0051BA' },
      { name: 'Granite Crystal', hex: '#4A4E53' },
      { name: 'Bright White', hex: '#F0F3F4' },
      { name: 'Jet Black', hex: '#111315' },
      { name: 'Cyber Yellow', hex: '#EAB308' },
      { name: 'Punk\'n Orange', hex: '#E65100' }
    ],
    lights: {
      left: new THREE.Vector3(-0.526, 1.318, 1.95),
      right: new THREE.Vector3(0.526, 1.318, 1.95),
      spill: new THREE.Vector3(0, 1.32, 2.15),
      targetZ: 8.5,
    },
    specs: [
      { label: 'Vehicle Model', val: 'Jeep Wrangler Rubicon' },
      { label: 'Powertrain', val: '3.6L Pentastar V6 (285 hp)' },
      { label: '4WD System', val: 'Rock-Trac® Heavy Duty 4x4' },
      { label: 'CAD Source', val: 'jeep.step (50.1 MB)' },
      { label: 'Tessellated Mesh', val: '11 Parts / 105k Polygons' },
      { label: 'Axles & Clearance', val: 'Dana 44 Heavy-Duty / 10.8"' }
    ]
  },
  rivian: {
    id: 'rivian',
    name: 'Rivian R1T Truck (2022)',
    badgeIcon: '⚡ EV',
    badgeTitle: 'RIVIAN R1T',
    badgeSub: 'ADVENTURE QUAD-MOTOR AWD',
    hasRoof: false,
    file: 'rivian_r1t_2022_free.glb',
    defaultColor: '#1B4D72',
    colors: [
      { name: 'Rivian Blue', hex: '#1B4D72' },
      { name: 'Compass Yellow', hex: '#F3BA2F' },
      { name: 'Forest Green', hex: '#1E3A2F' },
      { name: 'Red Canyon', hex: '#8C2524' },
      { name: 'Glacier White', hex: '#EEF0F2' },
      { name: 'Midnight Black', hex: '#111316' },
      { name: 'LA Silver', hex: '#8A9199' },
      { name: 'Limestone', hex: '#5C676E' }
    ],
    lights: {
      left: new THREE.Vector3(-0.82, 1.05, 2.72),
      right: new THREE.Vector3(0.82, 1.05, 2.72),
      spill: new THREE.Vector3(0, 1.08, 2.85),
      targetZ: 9.5,
    },
    specs: [
      { label: 'Vehicle Model', val: 'Rivian R1T All-Electric Truck' },
      { label: 'Drivetrain', val: 'Quad-Motor AWD (835 hp / 908 lb-ft)' },
      { label: 'Acceleration', val: '0-60 mph in 3.0 seconds' },
      { label: 'Battery / Range', val: '135 kWh / 314 miles EPA' },
      { label: 'Suspension', val: 'Independent Air (14.9" max ground)' },
      { label: 'Dimensions', val: 'Length 5,514 mm / Width 2,078 mm' }
    ]
  },
  rivian_r1s: {
    id: 'rivian_r1s',
    name: 'Rivian R1S SUV (2023)',
    badgeIcon: '🔋 SUV',
    badgeTitle: 'RIVIAN R1S',
    badgeSub: 'ALL-ELECTRIC 7-PASSENGER SUV',
    hasRoof: false,
    file: 'rivian_r1s.glb',
    defaultColor: '#8C2524',
    colors: [
      { name: 'Red Canyon', hex: '#8C2524' },
      { name: 'Rivian Blue', hex: '#1B4D72' },
      { name: 'Compass Yellow', hex: '#F3BA2F' },
      { name: 'Forest Green', hex: '#1E3A2F' },
      { name: 'Glacier White', hex: '#EEF0F2' },
      { name: 'Midnight Black', hex: '#111316' },
      { name: 'LA Silver', hex: '#8A9199' },
      { name: 'Limestone', hex: '#5C676E' }
    ],
    lights: {
      left: new THREE.Vector3(-0.78, 1.05, 2.55),
      right: new THREE.Vector3(0.78, 1.05, 2.55),
      spill: new THREE.Vector3(0, 1.08, 2.68),
      targetZ: 9.0,
    },
    specs: [
      { label: 'Vehicle Model', val: 'Rivian R1S Adventure SUV' },
      { label: 'Seating / Layout', val: '3 Rows / 7 Passengers' },
      { label: 'Drivetrain', val: 'Quad-Motor AWD (835 hp / 908 lb-ft)' },
      { label: 'Acceleration', val: '0-60 mph in 3.0 seconds' },
      { label: 'Battery / Range', val: 'Large Pack (321 miles EPA)' },
      { label: 'Dimensions', val: 'Length 5,100 mm / Height 1,815 mm' }
    ]
  }
};

// App State
const state = {
  currentVehicle: 'jeep',
  activeColor: VEHICLES.jeep.defaultColor,
  turntable: false,
  headlights: false,
  wireframe: false,
  roofVisible: true,
  explodeFactor: 0,
  steeringAngle: 0, // degrees from -35 to +35
  currentView: 'hero',
};

// Camera View Presets
const CAMERA_PRESETS = {
  hero:  { pos: new THREE.Vector3(4.8, 2.2, 5.2), target: new THREE.Vector3(0, 0.9, 0) },
  front: { pos: new THREE.Vector3(0.0, 1.2, 6.8), target: new THREE.Vector3(0, 0.9, 0) },
  side:  { pos: new THREE.Vector3(7.2, 1.2, 0.0), target: new THREE.Vector3(0, 0.9, 0) },
  rear:  { pos: new THREE.Vector3(0.0, 1.4, -7.0), target: new THREE.Vector3(0, 0.9, 0) },
  top:   { pos: new THREE.Vector3(0.0, 8.5, 0.01), target: new THREE.Vector3(0, 0.9, 0) },
};

// Animation state for smooth camera transitions
let cameraAnim = {
  isAnimating: false,
  startPos: new THREE.Vector3(),
  endPos: new THREE.Vector3(),
  startTarget: new THREE.Vector3(),
  endTarget: new THREE.Vector3(),
  progress: 0,
  duration: 1.0,
};

// Animation state for smooth assembly explosion
let explodeAnim = {
  isAnimating: false,
  startVal: 0,
  endVal: 0,
  progress: 0,
  duration: 0.65,
};

// Animation state for smooth steering centering
let steerAnim = {
  isAnimating: false,
  startAngle: 0,
  endAngle: 0,
  progress: 0,
  duration: 0.35,
};

// DOM Elements
const container = document.getElementById('canvas-container');
const loadingOverlay = document.getElementById('loading-overlay');
const progressBar = document.getElementById('progress-bar');
const loadingStatus = document.getElementById('loading-status');
const colorSwatchesContainer = document.getElementById('color-swatches');
const colorNameLabel = document.getElementById('color-name-label');
const viewButtons = document.querySelectorAll('.view-btn');
const toggleHeadlightsBtn = document.getElementById('toggle-headlights');
const toggleTurntableBtn = document.getElementById('toggle-turntable');
const toggleWireframeBtn = document.getElementById('toggle-wireframe');
const toggleExplodeBtn = document.getElementById('toggle-explode');
const toggleRoofBtn = document.getElementById('toggle-roof');
const explodeRange = document.getElementById('explode-range');
const explodeValue = document.getElementById('explode-value');
const steeringWheelDisc = document.getElementById('steering-wheel-disc');
const steeringRange = document.getElementById('steering-range');
const steeringAngleBadge = document.getElementById('steering-angle-badge');
const btnCenterSteer = document.getElementById('btn-center-steer');
const btnBlueprint = document.getElementById('btn-blueprint');
const btnScreenshot = document.getElementById('btn-screenshot');
const btnReset = document.getElementById('btn-reset');
const blueprintModal = document.getElementById('blueprint-modal');
const closeBlueprintBtn = document.getElementById('close-blueprint-btn');
const toastEl = document.getElementById('toast');

// Badge Elements
const badgeIcon = document.getElementById('badge-icon');
const badgeTitle = document.getElementById('badge-title');
const badgeSub = document.getElementById('badge-sub');
const vehicleTabs = document.querySelectorAll('.vehicle-tab');

// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0e12);
scene.fog = new THREE.FogExp2(0x0c0e12, 0.025);

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.copy(CAMERA_PRESETS.hero.pos);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 2.5;
controls.maxDistance = 18.0;
controls.target.copy(CAMERA_PRESETS.hero.target);

// Environment Lighting
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
const roomEnv = new RoomEnvironment();
scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;

// Studio Lights Rig
const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientLight);

// Key Light (Directional with soft shadows)
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(6, 10, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 25;
keyLight.shadow.camera.left = -6;
keyLight.shadow.camera.right = 6;
keyLight.shadow.camera.top = 6;
keyLight.shadow.camera.bottom = -6;
keyLight.shadow.bias = -0.0001;
keyLight.shadow.radius = 3;
scene.add(keyLight);

// Fill Light
const fillLight = new THREE.DirectionalLight(0x90b0ff, 1.2);
fillLight.position.set(-6, 6, -6);
scene.add(fillLight);

// Rim Light
const rimLight = new THREE.DirectionalLight(0xffeedd, 1.5);
rimLight.position.set(0, 8, -8);
scene.add(rimLight);

// Dynamic Headlight Projectors
const headlightLeft = new THREE.SpotLight(0xfff8e7, 0, 22, Math.PI / 5.5, 0.45, 1.2);
scene.add(headlightLeft);
scene.add(headlightLeft.target);

const headlightRight = new THREE.SpotLight(0xfff8e7, 0, 22, Math.PI / 5.5, 0.45, 1.2);
scene.add(headlightRight);
scene.add(headlightRight.target);

const headlightSpill = new THREE.PointLight(0xfff5db, 0, 4.0, 2);
scene.add(headlightSpill);

// Taillight Floor Illumination (for Rivian & Jeep brake glow)
const rearTailLight = new THREE.PointLight(0xff2222, 0, 3.5, 2);
rearTailLight.position.set(0, 1.1, -2.7);
scene.add(rearTailLight);

// Showroom Ground Plane
const floorGeo = new THREE.PlaneGeometry(50, 50);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x0f131a,
  roughness: 0.8,
  metalness: 0.2,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// CAD Ground Grid
const gridHelper = new THREE.GridHelper(24, 24, 0xca8a04, 0x242a35);
gridHelper.position.y = 0.001;
gridHelper.material.opacity = 0.25;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// Circular Studio Podium Ring
const ringGeo = new THREE.RingGeometry(3.6, 3.65, 64);
const ringMat = new THREE.MeshBasicMaterial({
  color: 0xca8a04,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.4,
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.002;
scene.add(ring);

// Instantiate Vehicle Loaders
const jeep = new JeepModel(scene);
const rivian = new RivianModel(scene);
const rivianR1S = new RivianR1SModel(scene);

// Helper to get currently active vehicle instance
function getActiveVehicle() {
  if (state.currentVehicle === 'jeep') return jeep;
  if (state.currentVehicle === 'rivian') return rivian;
  if (state.currentVehicle === 'rivian_r1s') return rivianR1S;
  return jeep;
}

// Update Lighting Positions for Active Vehicle
function updateLightingPositions() {
  const meta = VEHICLES[state.currentVehicle];
  const l = meta.lights;

  headlightLeft.position.copy(l.left);
  headlightLeft.target.position.set(l.left.x, 0.2, l.targetZ);

  headlightRight.position.copy(l.right);
  headlightRight.target.position.set(l.right.x, 0.2, l.targetZ);

  headlightSpill.position.copy(l.spill);

  if (state.currentVehicle === 'rivian') {
    rearTailLight.position.set(0, 1.15, -2.75);
  } else if (state.currentVehicle === 'rivian_r1s') {
    rearTailLight.position.set(0, 1.18, -2.55);
  } else {
    rearTailLight.position.set(0, 1.15, -2.2);
  }

  // Update light intensities
  const intensity = state.headlights ? 22 : 0;
  headlightLeft.intensity = intensity;
  headlightRight.intensity = intensity;
  headlightSpill.intensity = state.headlights ? 3.0 : 0;
  const hasTailGlow = state.headlights && (state.currentVehicle === 'rivian' || state.currentVehicle === 'rivian_r1s');
  rearTailLight.intensity = hasTailGlow ? 2.5 : 0;
}

// Initial Load: Jeep Wrangler
loadingOverlay.classList.remove('fade-out');
progressBar.style.width = '10%';
loadingStatus.textContent = 'Loading Jeep Wrangler (jeep.step.glb)...';

jeep.load(
  VEHICLES.jeep.file,
  (percent) => {
    progressBar.style.width = `${percent}%`;
    loadingStatus.textContent = `Loading CAD Geometry (${percent}%)...`;
  },
  () => {
    progressBar.style.width = '100%';
    loadingStatus.textContent = 'Preparing Showroom Shaders...';
    updateLightingPositions();
    initColorSwatches();
    updateSpecsModal();

    setTimeout(() => {
      loadingOverlay.classList.add('fade-out');
      showToast('Jeep Wrangler Rubicon Loaded');
    }, 400);
  },
  (error) => {
    loadingStatus.textContent = 'Error loading Jeep model.';
  }
);

// Switch Active Vehicle
function selectVehicle(vehicleId) {
  if (state.currentVehicle === vehicleId) return;

  state.currentVehicle = vehicleId;
  const meta = VEHICLES[vehicleId];

  // Update tab buttons
  vehicleTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.vehicle === vehicleId);
  });

  // Update Header Badges
  badgeIcon.textContent = meta.badgeIcon;
  badgeTitle.textContent = meta.badgeTitle;
  badgeSub.textContent = meta.badgeSub;

  // Toggle soft-top button availability
  toggleRoofBtn.style.display = meta.hasRoof ? 'inline-flex' : 'none';

  // Hide all vehicles first
  jeep.root.visible = false;
  rivian.hide();
  rivianR1S.hide();

  const activeModel = getActiveVehicle();

  if (vehicleId === 'jeep') {
    jeep.root.visible = true;
    updateLightingPositions();
    initColorSwatches();
    updateSpecsModal();
    jeep.setHeadlights(state.headlights);
    jeep.setExplodeFactor(state.explodeFactor);
    jeep.setSteeringAngle(THREE.MathUtils.degToRad(-state.steeringAngle));
    if (state.wireframe !== jeep.isWireframe) jeep.toggleWireframe();
    showToast('Switched to Jeep Wrangler Rubicon');
  } else {
    // Check if model is loaded, else load it dynamically
    if (!activeModel.isLoaded) {
      loadingOverlay.classList.remove('fade-out');
      progressBar.style.width = '15%';
      loadingStatus.textContent = `Loading ${meta.name}...`;

      activeModel.load(
        meta.file,
        (percent) => {
          progressBar.style.width = `${percent}%`;
          loadingStatus.textContent = `Loading ${meta.name} (${percent}%)...`;
        },
        () => {
          progressBar.style.width = '100%';
          activeModel.show();
          updateLightingPositions();
          initColorSwatches();
          updateSpecsModal();
          activeModel.setHeadlights(state.headlights);
          activeModel.setExplodeFactor(state.explodeFactor);
          activeModel.setSteeringAngle(THREE.MathUtils.degToRad(-state.steeringAngle));
          if (state.wireframe) activeModel.toggleWireframe();

          setTimeout(() => {
            loadingOverlay.classList.add('fade-out');
            showToast(`${meta.name} Loaded`);
          }, 350);
        },
        () => {
          loadingStatus.textContent = `Error loading ${meta.name}.`;
        }
      );
    } else {
      activeModel.show();
      updateLightingPositions();
      initColorSwatches();
      updateSpecsModal();
      activeModel.setHeadlights(state.headlights);
      activeModel.setExplodeFactor(state.explodeFactor);
      activeModel.setSteeringAngle(THREE.MathUtils.degToRad(-state.steeringAngle));
      if (state.wireframe !== activeModel.isWireframe) activeModel.toggleWireframe();
      showToast(`Switched to ${meta.name}`);
    }
  }
}

// Vehicle Switcher Event Listeners
vehicleTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    selectVehicle(tab.dataset.vehicle);
  });
});

// Color Swatches Builder
function initColorSwatches() {
  colorSwatchesContainer.innerHTML = '';
  const meta = VEHICLES[state.currentVehicle];
  const colors = meta.colors;
  state.activeColor = colors[0].hex;
  colorNameLabel.textContent = colors[0].name;

  colors.forEach((preset, idx) => {
    const swatch = document.createElement('button');
    swatch.className = `swatch ${idx === 0 ? 'active' : ''}`;
    swatch.style.backgroundColor = preset.hex;
    swatch.title = preset.name;
    swatch.setAttribute('aria-label', preset.name);

    swatch.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
      state.activeColor = preset.hex;
      colorNameLabel.textContent = preset.name;
      getActiveVehicle().setBodyColor(preset.hex);
      showToast(`Paint: ${preset.name}`);
    });

    colorSwatchesContainer.appendChild(swatch);
  });

  getActiveVehicle().setBodyColor(state.activeColor);
}

// Update Specs Modal
function updateSpecsModal() {
  const meta = VEHICLES[state.currentVehicle];
  const specsContainer = document.querySelector('.specs-grid');
  if (!specsContainer) return;

  specsContainer.innerHTML = '';
  meta.specs.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'spec-card';
    card.innerHTML = `
      <span class="spec-label">${item.label}</span>
      <span class="spec-val">${item.val}</span>
    `;
    specsContainer.appendChild(card);
  });
}

// Camera Smooth Transition Function
function transitionCamera(presetKey) {
  const preset = CAMERA_PRESETS[presetKey];
  if (!preset) return;

  cameraAnim.startPos.copy(camera.position);
  cameraAnim.endPos.copy(preset.pos);
  cameraAnim.startTarget.copy(controls.target);
  cameraAnim.endTarget.copy(preset.target);
  cameraAnim.progress = 0;
  cameraAnim.isAnimating = true;

  viewButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === presetKey);
  });
  state.currentView = presetKey;
}

// Camera Presets Click Handlers
viewButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    transitionCamera(btn.dataset.view);
  });
});

// Interactive Toggles
toggleHeadlightsBtn.addEventListener('click', () => {
  state.headlights = !state.headlights;
  toggleHeadlightsBtn.classList.toggle('active', state.headlights);

  // Trigger physical headlight illumination on active vehicle
  getActiveVehicle().setHeadlights(state.headlights);

  updateLightingPositions();

  showToast(state.headlights ? 'Headlights ON' : 'Headlights OFF');
});

toggleTurntableBtn.addEventListener('click', () => {
  state.turntable = !state.turntable;
  toggleTurntableBtn.classList.toggle('active', state.turntable);
  controls.autoRotate = state.turntable;
  controls.autoRotateSpeed = 1.5;
  showToast(state.turntable ? 'Turntable Active' : 'Turntable Paused');
});

toggleWireframeBtn.addEventListener('click', () => {
  state.wireframe = !state.wireframe;
  const isWire = getActiveVehicle().toggleWireframe();
  toggleWireframeBtn.classList.toggle('active', isWire);
  showToast(isWire ? 'CAD Wireframe Mode' : 'Solid PBR Shading');
});

// Exploded View Controller
function setExplodedView(factor, syncSlider = true) {
  state.explodeFactor = THREE.MathUtils.clamp(factor, 0, 1);
  getActiveVehicle().setExplodeFactor(state.explodeFactor);
  if (explodeValue) {
    explodeValue.textContent = `${Math.round(state.explodeFactor * 100)}%`;
  }
  if (syncSlider && explodeRange) {
    explodeRange.value = Math.round(state.explodeFactor * 100);
  }
  if (toggleExplodeBtn) {
    toggleExplodeBtn.classList.toggle('active', state.explodeFactor > 0.05);
  }
}

// Steering Wheel Controller
function setSteering(angleDeg, syncSlider = true) {
  state.steeringAngle = THREE.MathUtils.clamp(angleDeg, -35, 35);
  const angleRad = THREE.MathUtils.degToRad(-state.steeringAngle); // Negative because +deg is right turn, Three.js Y-up right is negative rotation

  // Apply to physical 3D vehicle front wheels
  getActiveVehicle().setSteeringAngle(angleRad);

  // Rotate SVG Cockpit Steering Wheel Disc (visual multiplier 2.2x for realistic steering rotation)
  const wheelVisualAngle = state.steeringAngle * 2.2;
  if (steeringWheelDisc) {
    steeringWheelDisc.style.transform = `rotate(${wheelVisualAngle}deg)`;
  }

  if (syncSlider && steeringRange) {
    steeringRange.value = Math.round(state.steeringAngle);
  }

  if (steeringAngleBadge) {
    const rounded = Math.round(state.steeringAngle);
    if (rounded === 0) {
      steeringAngleBadge.textContent = '0° CENTER';
    } else if (rounded < 0) {
      steeringAngleBadge.textContent = `${Math.abs(rounded)}° LEFT ◀`;
    } else {
      steeringAngleBadge.textContent = `▶ ${rounded}° RIGHT`;
    }
  }
}

// Mouse / Touch Dragging on Steering Wheel Disc
let isDraggingSteer = false;
let startSteerX = 0;
let startSteerAngle = 0;

if (steeringWheelDisc) {
  steeringWheelDisc.addEventListener('mousedown', (e) => {
    isDraggingSteer = true;
    steerAnim.isAnimating = false;
    startSteerX = e.clientX;
    startSteerAngle = state.steeringAngle;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingSteer) return;
    const dx = e.clientX - startSteerX;
    const newAngle = startSteerAngle + dx / 1.5;
    setSteering(newAngle, true);
  });

  window.addEventListener('mouseup', () => {
    isDraggingSteer = false;
  });

  // Touch device support
  steeringWheelDisc.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      isDraggingSteer = true;
      steerAnim.isAnimating = false;
      startSteerX = e.touches[0].clientX;
      startSteerAngle = state.steeringAngle;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDraggingSteer || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - startSteerX;
    const newAngle = startSteerAngle + dx / 1.5;
    setSteering(newAngle, true);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDraggingSteer = false;
  });
}

if (steeringRange) {
  steeringRange.addEventListener('input', (e) => {
    steerAnim.isAnimating = false;
    setSteering(parseFloat(e.target.value), false);
  });
}

if (btnCenterSteer) {
  btnCenterSteer.addEventListener('click', () => {
    steerAnim.startAngle = state.steeringAngle;
    steerAnim.endAngle = 0;
    steerAnim.progress = 0;
    steerAnim.isAnimating = true;
    showToast('Steering Centered (0°)');
  });
}

// Keyboard controls [A] / [D] / Left / Right Arrow keys
const keyState = { left: false, right: false };
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
    keyState.left = true;
    steerAnim.isAnimating = false;
  } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
    keyState.right = true;
    steerAnim.isAnimating = false;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
    keyState.left = false;
  } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
    keyState.right = false;
  }
});

if (toggleExplodeBtn) {
  toggleExplodeBtn.addEventListener('click', () => {
    const target = state.explodeFactor > 0.5 ? 0 : 1;
    explodeAnim.startVal = state.explodeFactor;
    explodeAnim.endVal = target;
    explodeAnim.progress = 0;
    explodeAnim.isAnimating = true;
    showToast(target === 1 ? 'Exploded Assembly View' : 'Reassembled View');
  });
}

if (explodeRange) {
  explodeRange.addEventListener('input', (e) => {
    explodeAnim.isAnimating = false;
    const factor = parseFloat(e.target.value) / 100;
    setExplodedView(factor, false);
  });
}

toggleRoofBtn.addEventListener('click', () => {
  if (state.currentVehicle === 'jeep') {
    const isVisible = jeep.toggleRoof();
    toggleRoofBtn.classList.toggle('active', isVisible);
    showToast(isVisible ? 'Soft-Top Installed' : 'Open-Air Topless Mode');
  }
});

// Top Actions
btnBlueprint.addEventListener('click', () => {
  blueprintModal.classList.add('open');
});

closeBlueprintBtn.addEventListener('click', () => {
  blueprintModal.classList.remove('open');
});

blueprintModal.addEventListener('click', (e) => {
  if (e.target === blueprintModal) {
    blueprintModal.classList.remove('open');
  }
});

btnReset.addEventListener('click', () => {
  transitionCamera('hero');
  if (state.wireframe) toggleWireframeBtn.click();
  if (state.headlights) toggleHeadlightsBtn.click();
  if (!state.roofVisible && state.currentVehicle === 'jeep') toggleRoofBtn.click();
  setExplodedView(0, true);
  setSteering(0, true);
  showToast('Showroom View Reset');
});

btnScreenshot.addEventListener('click', () => {
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  const vName = state.currentVehicle.replace('_', '-');
  link.download = `${vName}-3d-studio.png`;
  link.href = dataURL;
  link.click();
  showToast('Screenshot Saved!');
});

// Toast Helper
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2200);
}

// Window Resize Handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation Clock & Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Smooth camera animation
  if (cameraAnim.isAnimating) {
    cameraAnim.progress += delta / cameraAnim.duration;
    if (cameraAnim.progress >= 1.0) {
      cameraAnim.progress = 1.0;
      cameraAnim.isAnimating = false;
    }
    const t = THREE.MathUtils.smoothstep(cameraAnim.progress, 0, 1);
    camera.position.lerpVectors(cameraAnim.startPos, cameraAnim.endPos, t);
    controls.target.lerpVectors(cameraAnim.startTarget, cameraAnim.endTarget, t);
  }

  // Smooth exploded view animation
  if (explodeAnim.isAnimating) {
    explodeAnim.progress += delta / explodeAnim.duration;
    if (explodeAnim.progress >= 1.0) {
      explodeAnim.progress = 1.0;
      explodeAnim.isAnimating = false;
    }
    const t = THREE.MathUtils.smoothstep(explodeAnim.progress, 0, 1);
    const currentFactor = THREE.MathUtils.lerp(explodeAnim.startVal, explodeAnim.endVal, t);
    setExplodedView(currentFactor, true);
  }

  // Steering smooth keyboard / centering animation
  if (keyState.left) {
    setSteering(state.steeringAngle - 70 * delta, true);
  } else if (keyState.right) {
    setSteering(state.steeringAngle + 70 * delta, true);
  } else if (!isDraggingSteer && steerAnim.isAnimating) {
    steerAnim.progress += delta / steerAnim.duration;
    if (steerAnim.progress >= 1.0) {
      steerAnim.progress = 1.0;
      steerAnim.isAnimating = false;
    }
    const t = THREE.MathUtils.smoothstep(steerAnim.progress, 0, 1);
    const cur = THREE.MathUtils.lerp(steerAnim.startAngle, steerAnim.endAngle, t);
    setSteering(cur, true);
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
