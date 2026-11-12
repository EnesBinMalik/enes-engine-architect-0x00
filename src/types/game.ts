/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameZone = 'REGISTERS_OF_DOOM' | 'L3_CACHE_MATRIX' | 'PAGE_FAULT_ABYSS';

export interface HardwareMetrics {
  cpuTemp: number;         // e.g. 58°C - 98°C
  vCore: number;           // e.g. 1.284 V
  clockFreq: number;       // e.g. 4.85 GHz
  tdpWatts: number;        // e.g. 145 W
  l3HitRate: number;       // e.g. 96.4%
  cacheMissCount: number;
  instructionPointer: string; // e.g. "0x00007FFF00A1"
  systemUptime: number;
  memoryUsageMb: number;
  voltageFlicker: boolean;
  kernelPanic: boolean;
  panicMessage?: string;
}

export interface RegisterState {
  RAX: number; // 64-bit integer simulation
  RBX: number;
  RCX: number;
  RDX: number;
  RSP: number;
  RBP: number;
  RSI: number;
  RDI: number;
  RIP: number;
}

export interface MemoryPatch {
  address: string;
  originalBytes: string;
  currentBytes: string;
  label: string;
  isUnlocked: boolean;
}

export interface BitSwitchState {
  bits: number[]; // 8 bits array: e.g. [0, 1, 1, 0, 1, 1, 0, 0]
  targetBits: number[]; // e.g. [1, 0, 1, 1, 0, 0, 0, 0]
  isBridgeAligned: boolean;
}

export interface MalwareEntity {
  id: string;
  name: string;
  address: string;
  health: number; // 0 to 100
  x: number;
  y: number;
  z: number;
  type: 'WORM' | 'SPECTRE' | 'BIT_ROT';
  isNeutralized: boolean;
}

export interface TerminalOutputLine {
  id: string;
  type: 'CMD' | 'STDOUT' | 'STDERR' | 'JIT_SUCCESS' | 'KERNEL_PANIC' | 'INFO';
  text: string;
  timestamp: string;
}

export interface MissionObjective {
  id: string;
  zone: GameZone;
  title: string;
  description: string;
  targetAddress?: string;
  requiredCodeHint: string;
  completed: boolean;
}
