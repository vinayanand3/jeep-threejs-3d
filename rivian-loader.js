import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class RivianModel {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'RivianRoot';
    this.root.visible = false;
    this.scene.add(this.root);

    this.loader = new GLTFLoader();
    this.meshes = [];
    this.bodyMeshes = [];
    this.frontLightMeshes = [];
    this.rearLightMeshes = [];
    this.lightMaterials = [];
    this.originalMaterials = new Map();

    // Rivian Signature PBR Automotive Paint Material
    this.carPaintMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#1B4D72'), // Rivian Blue default
      metalness: 0.65,
      roughness: 0.28,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.95,
    });

    // Front Light Bar & Stadium Headlights Material
    this.headlightMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#333842'),
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0.0,
      roughness: 0.15,
      metalness: 0.2,
    });

    // Rear Full-Width Light Bar Material
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

        // Traverse and prepare meshes
        const meshesToKeep = [];
        model.traverse((child) => {
          if (child.isMesh) {
            // Filter out baked sketchfab ground plane / shadow
            if (
              child.name.toLowerCase().includes('plane') ||
              child.name.includes('Object_49') ||
              child.parent?.name?.toLowerCase().includes('plane')
            ) {
              child.visible = false;
              return;
            }

            child.castShadow = true;
            child.receiveShadow = true;
            this.meshes.push(child);
            meshesToKeep.push(child);

            if (child.geometry && !child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }

            this.originalMaterials.set(child, child.material);
          }
        });

        // Compute Bounding Box of vehicle only (excluding ground plane)
        model.updateMatrixWorld(true);
        const bbox = new THREE.Box3();
        meshesToKeep.forEach((mesh) => {
          mesh.geometry.computeBoundingBox();
          const meshBox = mesh.geometry.boundingBox.clone();
          meshBox.applyMatrix4(mesh.matrixWorld);
          bbox.union(meshBox);
        });

        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        // Normalize scale: Target length ~5.51 meters (Real Rivian R1T is 5.51m)
        const targetLength = 5.51;
        const scaleFactor = targetLength / (size.z > 0 ? size.z : size.x);
        model.scale.setScalar(scaleFactor);

        // Re-compute bounding box with scale applied
        model.updateMatrixWorld(true);
        bbox.makeEmpty();
        meshesToKeep.forEach((mesh) => {
          mesh.geometry.computeBoundingBox();
          const meshBox = mesh.geometry.boundingBox.clone();
          meshBox.applyMatrix4(mesh.matrixWorld);
          bbox.union(meshBox);
        });
        bbox.getCenter(center);

        // Center on X and Z, and place tires flush with floor Y = 0
        model.position.x = -center.x;
        model.position.y = -bbox.min.y;
        model.position.z = -center.z;

        // Apply PBR Materials & Identify Light Assemblies
        this.applyPBRMaterials();

        this.root.add(model);
        this.model = model;
        this.isLoaded = true;

        // Identify front wheels for interactive steering
        this.frontLeftWheel = model.getObjectByName('Circle.001_20') || null;
        this.frontRightWheel = model.getObjectByName('Circle_18') || null;
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
        console.error('Error loading Rivian GLB model:', err);
        if (onError) onError(err);
      }
    );
  }

  applyPBRMaterials() {
    this.meshes.forEach((mesh) => {
      const mat = mesh.material;
      if (!mat) return;

      const matName = (mat.name || '').toLowerCase();

      // Body Paint: Material.008
      if (matName.includes('material.008') || matName.includes('body')) {
        mesh.material = this.carPaintMaterial;
        this.bodyMeshes.push(mesh);
      }
      // Front Stadium Headlights & Full-Width Light Bar
      else if (
        matName.includes('material.002') ||
        matName.includes('material.004') ||
        matName.includes('material.005') ||
        matName.includes('material.016') ||
        matName.includes('light') ||
        matName.includes('headlight')
      ) {
        mesh.material = this.headlightMaterial;
        this.frontLightMeshes.push(mesh);
      }
      // Rear Full-Width LED Tail Light Bar
      else if (
        matName.includes('material.032') ||
        matName.includes('material.034') ||
        matName.includes('tail') ||
        matName.includes('brake')
      ) {
        mesh.material = this.taillightMaterial;
        this.rearLightMeshes.push(mesh);
      }
      // Glass / Panoramic Roof / Windows
      else if (matName.includes('glass')) {
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(0x1a2129),
          metalness: 0.1,
          roughness: 0.05,
          transmission: 0.85,
          ior: 1.5,
          transparent: true,
          opacity: 0.9,
        });
      }
      // Yellow Brake Calipers
      else if (matName.includes('material.024')) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0xffaa00),
          roughness: 0.3,
          metalness: 0.6,
        });
      }
    });
  }

  setHeadlights(enabled) {
    this.headlightsActive = enabled;

    if (enabled) {
      // Front Light Bar & Stadium Lights: Bright Xenon LED Glow
      this.headlightMaterial.color.set('#ffffff');
      this.headlightMaterial.emissive.set('#e8f4ff');
      this.headlightMaterial.emissiveIntensity = 4.5;

      // Rear Light Bar: Bright Ruby Red LED Glow
      this.taillightMaterial.color.set('#ff2222');
      this.taillightMaterial.emissive.set('#ff0000');
      this.taillightMaterial.emissiveIntensity = 3.5;
    } else {
      // Off state
      this.headlightMaterial.color.set('#333842');
      this.headlightMaterial.emissive.set('#000000');
      this.headlightMaterial.emissiveIntensity = 0.0;

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
      const name = (mesh.name || '').toLowerCase();
      const parentName = (mesh.parent?.name || '').toLowerCase();
      const matName = (mesh.material?.name || '').toLowerCase();

      // Wheels / Tires
      if (
        name.includes('circle') ||
        parentName.includes('circle') ||
        name.includes('rear') ||
        parentName.includes('rear') ||
        name.includes('orange') ||
        Math.abs(relX) > 0.8
      ) {
        delta.x = relX < 0 ? -1.35 : 1.35;
        delta.y = 0;
      }
      // Roof / Glass (Top)
      else if (matName.includes('glass') || relY > 0.45) {
        delta.y = 1.6;
        delta.z = relZ * 0.15;
      }
      // Front stadium lights / Light bar
      else if (
        relZ > 0.8 ||
        matName.includes('light') ||
        matName.includes('002') ||
        matName.includes('004') ||
        matName.includes('005') ||
        matName.includes('016')
      ) {
        delta.z = 1.3;
        delta.y = 0.2;
      }
      // Rear light bar / Tailgate
      else if (
        relZ < -0.8 ||
        matName.includes('tail') ||
        matName.includes('032') ||
        matName.includes('034')
      ) {
        delta.z = -1.3;
        delta.y = 0.2;
      }
      // Body panels
      else if (matName.includes('008') || matName.includes('body')) {
        delta.y = 0.75;
      }
      // Chassis / Frame
      else {
        delta.y = -0.38;
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

  setSteeringAngle(angleRad) {
    this.steeringAngle = angleRad;
    if (this.frontLeftWheel) {
      this.frontLeftWheel.rotation.y = angleRad;
    }
    if (this.frontRightWheel) {
      this.frontRightWheel.rotation.y = angleRad;
    }
  }
}
