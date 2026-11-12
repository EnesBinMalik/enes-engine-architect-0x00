/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WorldBuilder: Generates the 3 micro-architectural CPU environments:
 * 1. The Registers of Doom (Kayıtçı Tapınakları)
 * 2. L3 Cache Matrix (L3 Önbellek Labirenti)
 * 3. The Page Fault Abyss (Sanal Bellek Uçurumu)
 */

import * as THREE from 'three';
import { GameZone, RegisterState, BitSwitchState, MalwareEntity } from '../types/game';
import {
  createSiliconDieTexture,
  createPcbTraceTexture,
  createRegisterLabelTexture,
  createLaserBarrierTexture,
  createRamPageTexture
} from './Materials';

export interface WorldContext {
  scene: THREE.Scene;
  zone: GameZone;
  registers: RegisterState;
  laserUnlocked: boolean;
  bitSwitchState: BitSwitchState;
  malwareList: MalwareEntity[];
  anisotropy: number;
}

export class WorldBuilder {
  private zoneGroup: THREE.Group = new THREE.Group();
  private animatedElements: Array<{ update: (elapsed: number, delta: number) => void }> = [];
  private laserBarrierMesh: THREE.Mesh | null = null;
  private bridgeSlabs: THREE.Group[] = [];
  private bitSwitchMeshes: THREE.Group[] = [];
  private registerColumns: Map<string, THREE.Group> = new Map();
  private malwareMeshes: Map<string, THREE.Group> = new Map();

  public buildZone(ctx: WorldContext): THREE.Group {
    // Clear previous
    this.dispose();
    this.zoneGroup = new THREE.Group();
    this.animatedElements = [];
    this.registerColumns.clear();
    this.malwareMeshes.clear();
    this.bridgeSlabs = [];
    this.bitSwitchMeshes = [];

    switch (ctx.zone) {
      case 'REGISTERS_OF_DOOM':
        this.buildRegistersOfDoom(ctx);
        break;
      case 'L3_CACHE_MATRIX':
        this.buildL3CacheMatrix(ctx);
        break;
      case 'PAGE_FAULT_ABYSS':
        this.buildPageFaultAbyss(ctx);
        break;
    }

    return this.zoneGroup;
  }

  // -------------------------------------------------------------
  // ZONE 1: THE REGISTERS OF DOOM (Kayıtçı Tapınakları)
  // -------------------------------------------------------------
  private buildRegistersOfDoom(ctx: WorldContext) {
    const siliconTex = createSiliconDieTexture(ctx.anisotropy);
    const pcbTex = createPcbTraceTexture(ctx.anisotropy);

    // Floor: Colossal CPU die substrate with micro-circuit traces
    const floorGeo = new THREE.PlaneGeometry(160, 160, 16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      map: siliconTex,
      roughness: 0.25,
      metalness: 0.85,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.zoneGroup.add(floor);

    // Sub-floor perimeter heat-spreader borders (composite frame)
    const frameGeo = new THREE.BoxGeometry(170, 4, 6);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.9,
    });
    const frameN = new THREE.Mesh(frameGeo, frameMat);
    frameN.position.set(0, 2, -82);
    this.zoneGroup.add(frameN);

    const frameS = new THREE.Mesh(frameGeo, frameMat);
    frameS.position.set(0, 2, 82);
    this.zoneGroup.add(frameS);

    // 8 Colossal General-Purpose Register Monoliths + 1 RIP (Instruction Pointer)
    const regNames = ['RAX', 'RBX', 'RCX', 'RDX', 'RSP', 'RBP', 'RSI', 'RDI'];
    const positions = [
      [-28, -25], [-12, -35], [12, -35], [28, -25],
      [-32, 10], [-18, 25], [18, 25], [32, 10],
    ];

    regNames.forEach((name, i) => {
      const [x, z] = positions[i];
      const val = (ctx.registers as unknown as Record<string, number>)[name] || 0;
      const hexVal = '0x' + val.toString(16).toUpperCase().padStart(8, '0');
      const regCol = this.createRegisterColumn(name, hexVal, x, z);
      this.registerColumns.set(name, regCol);
      this.zoneGroup.add(regCol);
    });

    // The Master Instruction Pointer (RIP) Altar at the sanctuary end
    const ripCol = this.createRegisterColumn('RIP', ctx.registers.RIP ? '0x' + ctx.registers.RIP.toString(16).toUpperCase() : '0x7FFF00A1', 0, -55, 1.4);
    this.registerColumns.set('RIP', ripCol);
    this.zoneGroup.add(ripCol);

    // Electron Bus Pathways (Glowing golden & cyan lines pulsing across floor)
    const busGeo = new THREE.BoxGeometry(4, 0.25, 60);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x0088aa,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.95,
    });
    const busLeft = new THREE.Mesh(busGeo, busMat);
    busLeft.position.set(-8, 0.15, -15);
    this.zoneGroup.add(busLeft);

    const busRight = new THREE.Mesh(busGeo, busMat);
    busRight.position.set(8, 0.15, -15);
    this.zoneGroup.add(busRight);

    // Data packet particles moving on buses
    const packetGeo = new THREE.BoxGeometry(0.8, 0.8, 1.6);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const packetCount = 8;
    const packets: THREE.Mesh[] = [];
    for (let k = 0; k < packetCount; k++) {
      const pkt = new THREE.Mesh(packetGeo, packetMat);
      pkt.position.set((k % 2 === 0 ? -8 : 8), 0.7, -40 + k * 8);
      this.zoneGroup.add(pkt);
      packets.push(pkt);
    }
    this.animatedElements.push({
      update: (elapsed) => {
        packets.forEach((p, idx) => {
          p.position.z = -45 + ((elapsed * 12 + idx * 7) % 55);
        });
      }
    });

    // Laser Barrier at z = -42 (Address: 0x7FFF00A1)
    const laserGroup = new THREE.Group();
    const laserMat = new THREE.MeshBasicMaterial({
      map: createLaserBarrierTexture(),
      transparent: true,
      opacity: ctx.laserUnlocked ? 0 : 0.85,
      side: THREE.DoubleSide,
    });
    const laserMesh = new THREE.Mesh(new THREE.PlaneGeometry(36, 18), laserMat);
    laserMesh.position.set(0, 9, -42);
    laserGroup.add(laserMesh);

    // Laser Emitter Pylons on Left & Right (Composite 3-part pylons)
    [-18.5, 18.5].forEach((px) => {
      const pylon = new THREE.Group();
      // Base
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 2.2, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 })
      );
      base.position.y = 2;
      pylon.add(base);

      // Core rod
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 16, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.1 })
      );
      rod.position.y = 10;
      pylon.add(rod);

      // Glowing emitter lens
      const lens = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshStandardMaterial({
          color: ctx.laserUnlocked ? 0x22c55e : 0xef4444,
          emissive: ctx.laserUnlocked ? 0x22c55e : 0xef4444,
          emissiveIntensity: 0.9,
          roughness: 0.2
        })
      );
      lens.position.y = 18;
      pylon.add(lens);

      pylon.position.x = px;
      pylon.position.z = -42;
      laserGroup.add(pylon);
    });

    this.laserBarrierMesh = laserMesh;
    this.zoneGroup.add(laserGroup);

    // Floating Platform Stepping Stones for Vertical Platforming
    const platMat = new THREE.MeshStandardMaterial({
      map: pcbTex,
      roughness: 0.3,
      metalness: 0.8,
    });
    for (let p = 0; p < 5; p++) {
      const plat = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 6), platMat);
      plat.position.set(-16 + (p % 2) * 32, 3 + p * 3.2, -10 - p * 6);
      this.zoneGroup.add(plat);
    }
  }

  // -------------------------------------------------------------
  // ZONE 2: L3 CACHE MATRIX (L3 Önbellek Labirenti)
  // -------------------------------------------------------------
  private buildL3CacheMatrix(ctx: WorldContext) {
    const siliconTex = createSiliconDieTexture(ctx.anisotropy);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150),
      new THREE.MeshStandardMaterial({ map: siliconTex, roughness: 0.15, metalness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.zoneGroup.add(floor);

    // Mirrored Crystalline L3 Cache Cells (Set-Associative Matrix: 4x4 Grid of monoliths)
    const mirrorMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a192f,
      roughness: 0.05,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    for (let row = -2; row <= 2; row++) {
      for (let col = -2; col <= 2; col++) {
        if (row === 0 && col === 0) continue; // central arena

        const cellGroup = new THREE.Group();
        const height = 18 + ((row * 3 + col * 7) % 6);

        // Core mirror pillar
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(5, height, 5), mirrorMat);
        pillar.position.y = height / 2;
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        cellGroup.add(pillar);

        // Neon Tag Line (Cache Tag indicator)
        const tagLineGeo = new THREE.BoxGeometry(5.2, 0.4, 5.2);
        const tagLineMat = new THREE.MeshStandardMaterial({
          color: (row + col) % 2 === 0 ? 0x06b6d4 : 0x3b82f6,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.7,
        });
        const tagLine = new THREE.Mesh(tagLineGeo, tagLineMat);
        tagLine.position.y = height * 0.75;
        cellGroup.add(tagLine);

        // Base footing
        const footing = new THREE.Mesh(
          new THREE.BoxGeometry(6.5, 1.2, 6.5),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.8 })
        );
        footing.position.y = 0.6;
        cellGroup.add(footing);

        cellGroup.position.set(col * 18, 0, row * 18);
        this.zoneGroup.add(cellGroup);
      }
    }

    // Spawn 3D Malware Daemons (Kernel Worms / Spectre Anomaly)
    ctx.malwareList.forEach((mal) => {
      const malwareGroup = this.createMalwareMesh(mal);
      this.malwareMeshes.set(mal.id, malwareGroup);
      this.zoneGroup.add(malwareGroup);
    });

    // Animate malware floating & pulsing
    this.animatedElements.push({
      update: (elapsed) => {
        this.malwareMeshes.forEach((mesh, id) => {
          const malData = ctx.malwareList.find((m) => m.id === id);
          if (malData && !malData.isNeutralized) {
            mesh.position.y = malData.y + Math.sin(elapsed * 3 + malData.x) * 0.8;
            mesh.rotation.y += 0.02;
            mesh.rotation.x = Math.sin(elapsed * 2) * 0.15;
          } else {
            mesh.scale.setScalar(Math.max(0.001, mesh.scale.x - 0.05));
          }
        });
      }
    });
  }

  // -------------------------------------------------------------
  // ZONE 3: THE PAGE FAULT ABYSS (Sanal Bellek Uçurumu)
  // -------------------------------------------------------------
  private buildPageFaultAbyss(ctx: WorldContext) {
    // Vast infinite void canyon below with floating data blocks
    // Left Cliff: NVMe Controller Substrate
    const cliffMat = new THREE.MeshStandardMaterial({
      map: createPcbTraceTexture(ctx.anisotropy),
      roughness: 0.4,
      metalness: 0.85,
    });

    const leftCliff = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 80), cliffMat);
    leftCliff.position.set(-35, -10, 0);
    leftCliff.receiveShadow = true;
    this.zoneGroup.add(leftCliff);

    // Right Cliff: DDR5 RAM Bus Substrate
    const rightCliff = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 80), cliffMat);
    rightCliff.position.set(35, -10, 0);
    rightCliff.receiveShadow = true;
    this.zoneGroup.add(rightCliff);

    // Floating 4KB Memory Pages in the Abyss
    const pageCoords = [
      [-12, -4, -18, '0x00001000'],
      [-4, 2, -10, '0x00002000'],
      [6, -2, -22, '0x00003000'],
      [14, 4, -14, '0x00004000'],
      [0, -6, 12, '0x00005000'],
      [-10, 3, 20, '0x00006000'],
      [12, -3, 18, '0x00007000'],
    ];

    const floatingPages: THREE.Mesh[] = [];
    pageCoords.forEach(([px, py, pz, hexAddr]) => {
      const pageMat = new THREE.MeshStandardMaterial({
        map: createRamPageTexture(hexAddr as string),
        roughness: 0.2,
        metalness: 0.8,
      });
      const pageMesh = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 6), pageMat);
      pageMesh.position.set(px as number, py as number, pz as number);
      this.zoneGroup.add(pageMesh);
      floatingPages.push(pageMesh);
    });

    // Inverted gravity floating oscillation
    this.animatedElements.push({
      update: (elapsed) => {
        floatingPages.forEach((page, i) => {
          page.position.y += Math.sin(elapsed * 1.5 + i) * 0.015;
          page.rotation.y += 0.003;
        });
      }
    });

    // The 8-Bit Bus Bridge across the chasm (from x = -15 to x = 15, at z = 0)
    // 8 bit switch pedestals standing on the left cliff edge (x = -17)
    this.bitSwitchMeshes = [];
    for (let b = 7; b >= 0; b--) {
      const bitVal = ctx.bitSwitchState.bits[7 - b];
      const bitGroup = this.createBitSwitch(b, bitVal, -17, (7 - b) * 4 - 14);
      this.bitSwitchMeshes.push(bitGroup);
      this.zoneGroup.add(bitGroup);
    }

    // Bridge Slabs: 4 giant interlocking bus slabs that extend across when aligned
    for (let s = 0; s < 4; s++) {
      const slabGroup = new THREE.Group();
      const slabGeo = new THREE.BoxGeometry(7, 1.2, 10);
      const slabMat = new THREE.MeshStandardMaterial({
        color: ctx.bitSwitchState.isBridgeAligned ? 0x0284c7 : 0x334155,
        emissive: ctx.bitSwitchState.isBridgeAligned ? 0x0284c7 : 0x0f172a,
        emissiveIntensity: ctx.bitSwitchState.isBridgeAligned ? 0.6 : 0.1,
        roughness: 0.25,
        metalness: 0.9,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slabGroup.add(slab);

      // Neon runway lines on slab
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1.25, 10),
        new THREE.MeshBasicMaterial({ color: ctx.bitSwitchState.isBridgeAligned ? 0x38bdf8 : 0x475569 })
      );
      slabGroup.add(strip);

      // Position across the gap
      const targetX = -10.5 + s * 7;
      slabGroup.position.set(
        ctx.bitSwitchState.isBridgeAligned ? targetX : targetX + (s % 2 === 0 ? -12 : 12),
        0,
        0
      );
      this.bridgeSlabs.push(slabGroup);
      this.zoneGroup.add(slabGroup);
    }
  }

  // Composite 3D Register Column Monolith (3-5 parts: Base, Core, Label Display, Top Ring)
  private createRegisterColumn(name: string, hexVal: string, x: number, z: number, scale = 1.0): THREE.Group {
    const colGroup = new THREE.Group();
    colGroup.scale.setScalar(scale);

    // 1. Heavy Silicon Base Plate
    const baseGeo = new THREE.CylinderGeometry(3.5, 4.2, 2.5, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.85,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1.25;
    base.castShadow = true;
    base.receiveShadow = true;
    colGroup.add(base);

    // 2. Main Gothic Silicon Tower Core
    const coreHeight = 22;
    const coreGeo = new THREE.BoxGeometry(4.2, coreHeight, 4.2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x030712,
      roughness: 0.2,
      metalness: 0.95,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = coreHeight / 2 + 2.5;
    core.castShadow = true;
    core.receiveShadow = true;
    colGroup.add(core);

    // 3. Register Data HUD Display Face (Front facing)
    const labelTex = createRegisterLabelTexture(name, hexVal);
    const labelMat = new THREE.MeshBasicMaterial({
      map: labelTex,
      transparent: true,
    });
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 7.6), labelMat);
    labelMesh.position.set(0, 14, 2.15);
    colGroup.add(labelMesh);

    // 4. Glowing Crown Ring on top
    const crownGeo = new THREE.TorusGeometry(2.4, 0.35, 8, 24);
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x00f3ff,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.rotation.x = Math.PI / 2;
    crown.position.y = coreHeight + 2.5;
    colGroup.add(crown);

    colGroup.position.set(x, 0, z);
    return colGroup;
  }

  // Composite 3D Bit Switch Pedestal (Base + Switch Lever + Bit LED)
  private createBitSwitch(bitIndex: number, bitValue: number, x: number, z: number): THREE.Group {
    const group = new THREE.Group();

    // Pedestal
    const pedGeo = new THREE.BoxGeometry(2, 3, 2);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.y = 1.5;
    group.add(ped);

    // Switch Handle Lever (Tilted based on 0 or 1)
    const leverGeo = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const leverMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    const lever = new THREE.Mesh(leverGeo, leverMat);
    lever.position.y = 3.6;
    lever.rotation.z = bitValue === 1 ? -0.4 : 0.4;
    group.add(lever);

    // Glowing LED Indicator (Red for 0, Emerald for 1)
    const ledGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const ledMat = new THREE.MeshStandardMaterial({
      color: bitValue === 1 ? 0x22c55e : 0xef4444,
      emissive: bitValue === 1 ? 0x22c55e : 0xef4444,
      emissiveIntensity: 0.9,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 3.2, 1.05);
    group.add(led);

    group.position.set(x, 0, z);
    return group;
  }

  // Composite 3D Malware Mesh (Dark crystal dodecahedron with glowing spike tentacles)
  private createMalwareMesh(malware: MalwareEntity): THREE.Group {
    const group = new THREE.Group();

    // Core entity
    const coreGeo = new THREE.DodecahedronGeometry(1.8, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x450a0a,
      emissive: 0xdc2626,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Orbiting data fragments / spikes
    const spikeGeo = new THREE.ConeGeometry(0.4, 1.6, 4);
    const spikeMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true });
    for (let s = 0; s < 6; s++) {
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      const angle = (s / 6) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 2.5, Math.sin(angle) * 0.8, Math.sin(angle) * 2.5);
      spike.rotation.z = angle;
      group.add(spike);
    }

    group.position.set(malware.x, malware.y, malware.z);
    return group;
  }

  public update(elapsed: number, delta: number) {
    this.animatedElements.forEach((anim) => anim.update(elapsed, delta));
  }

  public setLaserUnlocked(unlocked: boolean) {
    if (this.laserBarrierMesh) {
      this.laserBarrierMesh.visible = !unlocked;
    }
  }

  public updateBridgeAlignment(isAligned: boolean) {
    this.bridgeSlabs.forEach((slab, s) => {
      const targetX = -10.5 + s * 7;
      if (isAligned) {
        slab.position.x = targetX;
      } else {
        slab.position.x = targetX + (s % 2 === 0 ? -12 : 12);
      }
    });
  }

  public dispose() {
    this.zoneGroup.clear();
  }
}
