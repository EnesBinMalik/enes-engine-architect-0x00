/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// Procedural Canvas Textures
export function createSiliconDieTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep silicon obsidian background
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, 512, 512);

  // Grid of micro-transistors and bus traces
  ctx.strokeStyle = '#0f293a';
  ctx.lineWidth = 1;
  const step = 32;
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Glowing micro-circuit runs
  ctx.strokeStyle = '#00f3ff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const startX = (i * 37) % 512;
    const startY = (i * 73) % 512;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + 64, startY);
    ctx.lineTo(startX + 64, startY + 64);
    ctx.stroke();

    // Solder contact node
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(startX + 62, startY + 62, 5, 5);
  }

  // Microchip die core labeling
  ctx.font = '10px monospace';
  ctx.fillStyle = '#00f3ff44';
  ctx.fillText('CORE: ENES-0x26 // VULKAN-RT', 16, 28);
  ctx.fillText('BUS: 512-BIT ULTRA-INTERCONNECT', 16, 44);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

export function createPcbTraceTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Industrial dark matte PCB green/black
  ctx.fillStyle = '#06130b';
  ctx.fillRect(0, 0, 512, 512);

  // Copper traces
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2.5;

  for (let i = 0; i < 30; i++) {
    const y = i * 18;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(120, y);
    ctx.lineTo(160, y + (i % 2 === 0 ? 30 : -30));
    ctx.lineTo(350, y + (i % 2 === 0 ? 30 : -30));
    ctx.lineTo(390, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // Via holes
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(120, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(390, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

export function createRegisterLabelTexture(name: string, hexVal: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, 256, 512);

  // Border glow
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 504);

  // Header
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(8, 8, 240, 60);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(name, 128, 50);

  // Vertical data readout
  ctx.fillStyle = '#22d3ee';
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('64-BIT REGISTER', 128, 110);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(hexVal, 128, 150);

  // Bit activity bar ladder
  for (let i = 0; i < 16; i++) {
    const isLit = (i * 7) % 3 === 0;
    ctx.fillStyle = isLit ? '#38bdf8' : '#0e7490';
    ctx.fillRect(32, 200 + i * 16, 192, 10);
  }

  ctx.fillStyle = '#38bdf888';
  ctx.font = '14px monospace';
  ctx.fillText('ENES ARCH-0x26', 128, 480);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createLaserBarrierTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Crimson warning hazard field
  ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 12;
  ctx.beginPath();
  for (let y = 0; y <= 256; y += 32) {
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#fee2e2';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('0x7FFF00A1', 128, 110);
  ctx.fillText('MEM_LOCKED', 128, 145);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createRamPageTexture(pageHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 248);

  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAGE 4KB BLOCK', 128, 50);

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(pageHex, 128, 90);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PAGE_FAULT: SWAP IN', 24, 140);
  ctx.fillText('DIRTY: 0x01 | REF: 0x01', 24, 165);
  ctx.fillText('STATUS: SUSPENDED', 24, 190);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
