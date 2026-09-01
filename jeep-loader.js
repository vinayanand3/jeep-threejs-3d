import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class JeepModel {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'JeepRoot';
    this.scene.add(this.root);

    this.loader = new GLTFLoader();
    this.meshes = [];
    this.bodyMeshes = [];
    this.roofMesh = null;
    this.wheelMeshes = [];
    this.headlightMeshes = [];
    this.headlightLenses = [];
    this.originalMaterials = new Map();

    // Material definitions
    this.carPaintMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#2C5E3B'), // Sarge Green default
      metalness: 0.6,
      roughness: 0.32,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
    });

    this.roofMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#14171a'),
      roughness: 0.85,
      metalness: 0.05,
    });

    this.tireMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a1d20'),
      roughness: 0.92,
      metalness: 0.05,
    });

    this.trimMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#202428'),
      roughness: 0.7,
      metalness: 0.25,
    });

    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e2e8f0'),
      roughness: 0.1,
      metalness: 0.95,
    });

    this.chassisMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#121417'),
      roughness: 0.8,
      metalness: 0.15,
    });

    // Dedicated Headlight Lens & Bulb Material
    this.headlightLensMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#222831'),
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0.0,
      roughness: 0.1,
      metalness: 0.3,
    });

    this.isWireframe = false;
    this.isRoofVisible = true;
    this.headlightsActive = false;
  }

  load(url, onProgress, onComplete, onError) {
    this.loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // Ensure vertex normals and smooth shading
        model.traverse((child) => {
          if (child.isMesh) {
            this.meshes.push(child);
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.geometry && !child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }

            // Save original material
            this.originalMaterials.set(child, child.material);
          }
        });

        // Compute Bounding Box
        const bbox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        // Normalize scale: Target length ~4.8 meters
        const targetLength = 4.8;
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = targetLength / (size.z > 0 ? size.z : maxDim);
        model.scale.setScalar(scaleFactor);

        // Re-compute bounding box with scale
        bbox.setFromObject(model);
        bbox.getCenter(center);

        // Center on X and Z, and position bottom of wheels flush with floor Y = 0
        model.position.x = -center.x;
        model.position.y = -bbox.min.y;
        model.position.z = -center.z;

        // Assign categorized PBR materials
        this.applyPBRMaterials();

        // Create dedicated illuminated headlight assemblies at exact socket coordinates
        this.createHeadlightAssemblies();

        this.root.add(model);
        this.model = model;

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
        console.error('Error loading Jeep GLB model:', err);
        if (onError) onError(err);
      }
    );
  }

  applyPBRMaterials() {
    this.meshes.forEach((mesh, index) => {
      // Mesh index 8 is the primary body shell
      if (index === 8) {
        mesh.material = this.carPaintMaterial;
        this.bodyMeshes.push(mesh);
      }
      // Mesh index 2 is the soft-top roof
      else if (index === 2) {
        mesh.material = this.roofMaterial;
        this.roofMesh = mesh;
      }
      // Mesh indices 0 and 4 are wheels / tires
      else if (index === 0 || index === 4) {
        mesh.material = this.tireMaterial;
        this.wheelMeshes.push(mesh);
      }
      // Mesh index 9 is right headlight lens / emblem
      else if (index === 9) {
        mesh.material = this.headlightLensMaterial;
        this.headlightMeshes.push(mesh);
      }
      // Mesh index 10 is left headlight lens / underbody
      else if (index === 10) {
        mesh.material = this.headlightLensMaterial;
        this.headlightMeshes.push(mesh);
      }
      // Bumpers, rock rails, fenders, frame
      else {
        mesh.material = this.trimMaterial;
      }
    });
  }

  createHeadlightAssemblies() {
    // Generate soft radial glow texture for lens corona
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 250, 220, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 235, 170, 0.7)');
    gradient.addColorStop(0.6, 'rgba(255, 210, 100, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 200, 50, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const glowTexture = new THREE.CanvasTexture(canvas);

    // Exact world coordinates for left and right headlight sockets
    const positions = [
      { x: -0.526, y: 1.318, z: 1.912 }, // Left
      { x: 0.526, y: 1.318, z: 1.912 },  // Right
    ];

    positions.forEach((pos) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(pos.x, pos.y, pos.z);

      // 1. Chrome Bezel Ring
      const bezelGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.02, 32);
      bezelGeo.rotateX(Math.PI / 2);
      const bezelMesh = new THREE.Mesh(bezelGeo, this.chromeMaterial);
      lampGroup.add(bezelMesh);

      // 2. Glass Lens (Emissive Lamp Face)
      const lensGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.025, 32);
      lensGeo.rotateX(Math.PI / 2);
      const lensMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x333b48),
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        roughness: 0.1,
        metalness: 0.2,
      });
      const lensMesh = new THREE.Mesh(lensGeo, lensMat);
      lensMesh.position.z = 0.005;
      lampGroup.add(lensMesh);

      // 3. Center LED Projector Bulb
      const bulbGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x222222),
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        roughness: 0.1,
      });
      const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
      bulbMesh.position.z = 0.015;
      lampGroup.add(bulbMesh);

      // 4. Glowing Lens Flare / Corona Sprite
      const spriteMat = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.65, 0.65, 1.0);
      sprite.position.z = 0.03;
      sprite.visible = false;
      lampGroup.add(sprite);

      this.root.add(lampGroup);

      this.headlightLenses.push({
        group: lampGroup,
        lensMat: lensMat,
        bulbMat: bulbMat,
        sprite: sprite,
        spriteMat: spriteMat,
      });
    });
  }

  setHeadlights(enabled) {
    this.headlightsActive = enabled;

    if (enabled) {
      // Model's native mesh headlight materials
      this.headlightLensMaterial.color.set('#ffffff');
      this.headlightLensMaterial.emissive.set('#fff8e7');
      this.headlightLensMaterial.emissiveIntensity = 4.0;

      // Custom high-detail headlight lens assemblies
      this.headlightLenses.forEach((item) => {
        item.lensMat.color.set('#fffdf5');
        item.lensMat.emissive.set('#fff5db');
        item.lensMat.emissiveIntensity = 4.5;

        item.bulbMat.color.set('#ffffff');
        item.bulbMat.emissive.set('#ffffff');
        item.bulbMat.emissiveIntensity = 6.0;

        item.sprite.visible = true;
        item.spriteMat.opacity = 0.85;
      });
    } else {
      // Reset to dark off state
      this.headlightLensMaterial.color.set('#222831');
      this.headlightLensMaterial.emissive.set('#000000');
      this.headlightLensMaterial.emissiveIntensity = 0.0;

      this.headlightLenses.forEach((item) => {
        item.lensMat.color.set('#333b48');
        item.lensMat.emissive.set('#000000');
        item.lensMat.emissiveIntensity = 0.0;

        item.bulbMat.color.set('#222222');
        item.bulbMat.emissive.set('#000000');
        item.bulbMat.emissiveIntensity = 0.0;

        item.sprite.visible = false;
        item.spriteMat.opacity = 0.0;
      });
    }
  }

  setBodyColor(hexColor) {
    this.carPaintMaterial.color.set(hexColor);
  }

  toggleRoof() {
    if (this.roofMesh) {
      this.isRoofVisible = !this.isRoofVisible;
      this.roofMesh.visible = this.isRoofVisible;
      return this.isRoofVisible;
    }
    return true;
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

  setupExplodedOffsets() {
    this.meshes.forEach((mesh, index) => {
      mesh.userData.initialPosition = mesh.position.clone();
      let delta = new THREE.Vector3();

      // 8: Main body shell
      if (index === 8) {
        delta.set(0, 0.85, 0.1);
      }
      // 2: Soft-top roof
      else if (index === 2) {
        delta.set(0, 1.85, -0.2);
      }
      // 0: Left wheels & suspension
      else if (index === 0) {
        delta.set(-1.35, 0, 0);
      }
      // 4: Right wheels & suspension
      else if (index === 4) {
        delta.set(1.35, 0, 0);
      }
      // 6: Left rock rail / rear fender
      else if (index === 6) {
        delta.set(-0.7, 0.1, -0.3);
      }
      // 5: Right rock rail / rear fender
      else if (index === 5) {
        delta.set(0.7, 0.1, -0.3);
      }
      // 3: Front bumper & grille trim
      else if (index === 3) {
        delta.set(0, 0.1, 1.15);
      }
      // 1: Chassis / undercarriage
      else if (index === 1) {
        delta.set(0, -0.35, 0);
      }
      // 7: Rear frame / bumper
      else if (index === 7) {
        delta.set(0, -0.15, -0.95);
      }
      // 9: Front badge / emblem
      else if (index === 9) {
        delta.set(0, 0.85, 1.3);
      }
      // 10: Interior / seats
      else if (index === 10) {
        delta.set(0, 0.38, 0);
      }

      mesh.userData.explodeDelta = delta;
    });

    // Also link custom headlight assemblies to front offset
    this.headlightLenses.forEach((item) => {
      item.initialPosition = item.group.position.clone();
      item.explodeDelta = new THREE.Vector3(0, 0.1, 1.15);
    });
  }

  setExplodeFactor(factor) {
    const f = THREE.MathUtils.clamp(factor, 0, 1);
    this.meshes.forEach((mesh) => {
      if (mesh.userData.initialPosition && mesh.userData.explodeDelta) {
        mesh.position.copy(mesh.userData.initialPosition).addScaledVector(mesh.userData.explodeDelta, f);
      }
    });

    this.headlightLenses.forEach((item) => {
      if (item.initialPosition && item.explodeDelta) {
        item.group.position.copy(item.initialPosition).addScaledVector(item.explodeDelta, f);
      }
    });
  }
}
