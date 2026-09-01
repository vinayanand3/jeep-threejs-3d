import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class RivianR1SModel {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'RivianR1SRoot';
    this.root.visible = false;
    this.scene.add(this.root);

    this.loader = new GLTFLoader();
    this.meshes = [];
    this.bodyMeshes = [];
    this.frontLightMeshes = [];
    this.rearLightMeshes = [];
    this.originalMaterials = new Map();

    // Rivian Signature PBR Automotive Paint Material (Red Canyon default for R1S)
    this.carPaintMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#8C2524'), // Red Canyon default
      metalness: 0.65,
      roughness: 0.28,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.95,
    });

    // Front Light Bar & Stadium Headlights (White Xenon)
    this.headlightMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#333842'),
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0.0,
      roughness: 0.15,
      metalness: 0.2,
    });

    // Front DRL Halo / Turn Indicator (Warm Amber)
    this.amberLightMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#443010'),
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0.0,
      roughness: 0.2,
      metalness: 0.2,
    });

    // Rear Full-Width LED Light Bar (Ruby Red)
    this.taillightMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3a0808'),
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0.0,
      roughness: 0.2,
      metalness: 0.1,
    });

    this.isWireframe = false;
    this.headlightsActive = false;
    this.isLoaded = false;
  }

  load(url, onProgress, onComplete, onError) {
    this.loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            this.meshes.push(child);

            if (child.geometry && !child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }

            this.originalMaterials.set(child, child.material);
          }
        });

        // Compute Bounding Box
        model.updateMatrixWorld(true);
        const bbox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        // Normalize scale: Target length ~5.10 meters (Real Rivian R1S SUV length is 5.10m)
        const targetLength = 5.10;
        const scaleFactor = targetLength / (size.z > 0 ? size.z : size.x);
        model.scale.setScalar(scaleFactor);

        // Re-compute bounding box with scale applied
        model.updateMatrixWorld(true);
        bbox.setFromObject(model);
        bbox.getCenter(center);

        // Center on X and Z, and place tires flush with floor Y = 0
        model.position.x = -center.x;
        model.position.y = -bbox.min.y;
        model.position.z = -center.z;

        // Apply PBR Materials
        this.applyPBRMaterials();

        this.root.add(model);
        this.model = model;
        this.isLoaded = true;

        // Front wheels for interactive steering with dedicated vertical axis pivots
        const w1 = model.getObjectByName('Cylinder.001');
        const w2 = model.getObjectByName('Cylinder.005');
        this.frontRightPivot = this.setupSteeringPivot(w1);
        this.frontLeftPivot = this.setupSteeringPivot(w2);
        this.steeringAngle = 0;

        // Configure exploded assembly offsets
        this.setupExplodedOffsets();

        if (onComplete) {
          onComplete({
            root: this.root,
            dimensions: {
              width: (size.x * scaleFactor).toFixed(2),
              height: (size.y * scaleFactor).toFixed(2),
              length: (size.z * scaleFactor).toFixed(2),
            },
            meshCount: this.meshes.length,
          });
        }
      },
      (xhr) => {
        if (xhr.lengthComputable && onProgress) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          onProgress(percent);
        }
      },
      (err) => {
        console.error('Error loading Rivian R1S model:', err);
        if (onError) onError(err);
      }
    );
  }

  applyPBRMaterials() {
    this.meshes.forEach((mesh) => {
      const mat = mesh.material;
      if (!mat) return;

      const matName = (mat.name || '').toLowerCase();

      // SUV Body Paint
      if (matName.includes('body')) {
        mesh.material = this.carPaintMaterial;
        this.bodyMeshes.push(mesh);
      }
      // Front White Stadium Headlights & Light Bar
      else if (matName.includes('whitelight')) {
        mesh.material = this.headlightMaterial;
        this.frontLightMeshes.push(mesh);
      }
      // Front Amber DRL Halo
      else if (matName.includes('yellolight')) {
        mesh.material = this.amberLightMaterial;
        this.frontLightMeshes.push(mesh);
      }
      // Rear Red Taillight Bar
      else if (matName.includes('redlight')) {
        mesh.material = this.taillightMaterial;
        this.rearLightMeshes.push(mesh);
      }
      // Glass Windows & Panoramic Roof
      else if (matName.includes('glass')) {
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(0x151b22),
          metalness: 0.1,
          roughness: 0.05,
          transmission: 0.9,
          ior: 1.52,
          transparent: true,
          opacity: 0.9,
        });
      }
      // Bumper & Trim
      else if (matName.includes('bumper')) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x181a1e),
          roughness: 0.78,
          metalness: 0.18,
        });
      }
    });
  }

  setHeadlights(enabled) {
    this.headlightsActive = enabled;

    if (enabled) {
      // Front White Stadium Lights & Light Bar: Intense Xenon Glow
      this.headlightMaterial.color.set('#ffffff');
      this.headlightMaterial.emissive.set('#eaf4ff');
      this.headlightMaterial.emissiveIntensity = 4.5;

      // Front Amber DRL Halo
      this.amberLightMaterial.color.set('#ffbb00');
      this.amberLightMaterial.emissive.set('#ffa600');
      this.amberLightMaterial.emissiveIntensity = 3.8;

      // Rear Red LED Bar
      this.taillightMaterial.color.set('#ff2222');
      this.taillightMaterial.emissive.set('#ff0000');
      this.taillightMaterial.emissiveIntensity = 3.5;
    } else {
      this.headlightMaterial.color.set('#333842');
      this.headlightMaterial.emissive.set('#000000');
      this.headlightMaterial.emissiveIntensity = 0.0;

      this.amberLightMaterial.color.set('#443010');
      this.amberLightMaterial.emissive.set('#000000');
      this.amberLightMaterial.emissiveIntensity = 0.0;

      this.taillightMaterial.color.set('#3a0808');
      this.taillightMaterial.emissive.set('#000000');
      this.taillightMaterial.emissiveIntensity = 0.0;
    }
  }

  setBodyColor(hexColor) {
    this.carPaintMaterial.color.set(hexColor);
  }

  toggleWireframe() {
    this.isWireframe = !this.isWireframe;
    this.meshes.forEach((mesh) => {
      if (mesh.material) {
        mesh.material.wireframe = this.isWireframe;
      }
    });
    return this.isWireframe;
  }

  show() {
    this.root.visible = true;
  }

  hide() {
    this.root.visible = false;
  }

  setupExplodedOffsets() {
    if (!this.model) return;
    this.model.updateMatrixWorld(true);
    const modelBox = new THREE.Box3().setFromObject(this.model);
    const modelCenter = new THREE.Vector3();
    modelBox.getCenter(modelCenter);

    this.meshes.forEach((mesh) => {
      mesh.userData.initialPosition = mesh.position.clone();

      mesh.geometry.computeBoundingBox();
      const meshBox = mesh.geometry.boundingBox.clone();
      meshBox.applyMatrix4(mesh.matrixWorld);
      const meshCenter = new THREE.Vector3();
      meshBox.getCenter(meshCenter);

      const relX = meshCenter.x - modelCenter.x;
      const relY = meshCenter.y - modelCenter.y;
      const relZ = meshCenter.z - modelCenter.z;

      const delta = new THREE.Vector3();
      const matName = (mesh.material?.name || '').toLowerCase();
      const name = (mesh.name || '').toLowerCase();

      // Wheels / Tires
      if (matName.includes('tyre') || name.includes('wheel') || Math.abs(relX) > 0.65) {
        delta.x = relX < 0 ? -1.35 : 1.35;
        delta.y = 0;
      }
      // Roof / Glass / Sunroof
      else if (matName.includes('glass') || relY > 0.5) {
        delta.y = 1.7;
        delta.z = relZ * 0.15;
      }
      // Front lights / Grille / Front Bumper
      else if (relZ > 0.7 || matName.includes('white') || matName.includes('yello')) {
        delta.z = 1.25;
        delta.y = 0.2;
      }
      // Rear lights / Tailgate
      else if (relZ < -0.7 || matName.includes('red')) {
        delta.z = -1.25;
        delta.y = 0.2;
      }
      // Seats / Interior
      else if (matName.includes('seat')) {
        delta.y = 0.45;
      }
      // Body panels
      else if (matName.includes('body')) {
        delta.y = 0.85;
      }
      // Bumper / Underbody
      else {
        delta.y = -0.4;
      }

      mesh.userData.explodeDelta = delta;
    });
  }

  setExplodeFactor(factor) {
    const f = THREE.MathUtils.clamp(factor, 0, 1);
    this.meshes.forEach((mesh) => {
      if (mesh.userData.initialPosition && mesh.userData.explodeDelta) {
        mesh.position.copy(mesh.userData.initialPosition).addScaledVector(mesh.userData.explodeDelta, f);
      }
    });
  }

  setupSteeringPivot(wheelNode) {
    if (!wheelNode || !wheelNode.parent) return null;
    this.model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(wheelNode);
    const worldCenter = new THREE.Vector3();
    box.getCenter(worldCenter);

    const parent = wheelNode.parent;
    const localCenter = parent.worldToLocal(worldCenter.clone());

    const pivot = new THREE.Group();
    pivot.name = `${wheelNode.name}_SteeringPivot`;
    pivot.position.copy(localCenter);
    parent.add(pivot);

    pivot.attach(wheelNode);
    return pivot;
  }

  setSteeringAngle(angleRad) {
    this.steeringAngle = angleRad;
    if (this.frontRightPivot) {
      this.frontRightPivot.rotation.y = angleRad;
    }
    if (this.frontLeftPivot) {
      this.frontLeftPivot.rotation.y = angleRad;
    }
  }
}
