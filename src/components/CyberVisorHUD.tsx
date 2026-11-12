/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CyberVisorHUD: Diegetic Cyber-Visor Cockpit for System Architect Enes Öztürk.
 * 100% organic hardware interface: CRT scanlines, curved lens vignette,
 * real Linux kernel ring buffer, VCORE voltage oscillations, and CPU core diagnostics.
 */

import React from 'react';
import { HardwareMetrics, GameZone, MissionObjective } from '../types/game';

interface CyberVisorHUDProps {
  metrics: HardwareMetrics;
  currentZone: GameZone;
  activeObjective: MissionObjective;
  isGlitchActive: boolean;
}

export const CyberVisorHUD: React.FC<CyberVisorHUDProps> = ({
  metrics,
  currentZone,
  activeObjective,
  isGlitchActive,
}) => {
  const getZoneTitle = () => {
    switch (currentZone) {
      case 'REGISTERS_OF_DOOM':
        return 'KAYITÇI TAPINAKLARI (THE REGISTERS OF DOOM) // CPU DIE 0';
      case 'L3_CACHE_MATRIX':
        return 'L3 ÖNBELLEK LABİRENTİ (L3 CACHE MATRIX) // WAY 0-15';
      case 'PAGE_FAULT_ABYSS':
        return 'SANAL BELLEK UÇURUMU (THE PAGE FAULT ABYSS) // NVMe-DDR5';
    }
  };

  const tempColor =
    metrics.cpuTemp > 90
      ? 'text-red-500'
      : metrics.cpuTemp > 75
      ? 'text-amber-400'
      : 'text-cyan-400';

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-20 flex flex-col justify-between overflow-hidden p-4 select-none font-mono transition-opacity duration-150 ${
        metrics.voltageFlicker ? 'opacity-80' : 'opacity-100'
      }`}
    >
      {/* Curved CRT & Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,10,20,0.85)_100%)]" />

      {/* Diegetic Scanlines */}
      <div
        className="absolute inset-0 bg-repeat opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 2px, transparent 4px)',
        }}
      />

      {/* Screen Glitch Artifacts during Syntax Error / Kernel Fault */}
      {isGlitchActive && (
        <div className="absolute inset-0 bg-red-950/20 mix-blend-color-dodge animate-pulse pointer-events-none">
          <div className="absolute top-1/3 left-0 right-0 h-4 bg-cyan-400/30 transform -skew-x-12" />
          <div className="absolute top-2/3 left-0 right-0 h-6 bg-red-500/20 transform skew-x-6" />
        </div>
      )}

      {/* TOP HEADER: Architect ID & Clock/Voltage Diagnostics */}
      <div className="relative z-30 flex flex-wrap items-start justify-between gap-4 text-xs">
        {/* Architect Branding */}
        <div className="border border-cyan-500/40 bg-black/80 px-3.5 py-2 rounded shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-none">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold tracking-wider text-cyan-300">
              ARCHITECT: ENES ÖZTÜRK
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">ENES ENGINE v26 // VULKAN-RT</span>
          </div>
          <div className="mt-1 text-[11px] text-cyan-400/80 tracking-wide">
            SEKTÖR: {getZoneTitle()}
          </div>
        </div>

        {/* Diegetic Mission Objective Bar */}
        <div className="border border-amber-500/40 bg-black/80 px-3.5 py-2 rounded text-right shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <div className="text-[10px] uppercase tracking-wider text-amber-500 font-bold">
            GÖREV HEDEFİ (HARDWARE DIRECTIVE)
          </div>
          <div className="font-semibold text-amber-300">
            {activeObjective.title}
          </div>
          <div className="text-[11px] text-slate-400">
            {activeObjective.description}
          </div>
        </div>

        {/* Hardware Telemetry Monolith */}
        <div className="border border-cyan-500/30 bg-black/85 px-3 py-1.5 rounded flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[9px]">VCORE VOLTAGE</span>
            <span className="text-cyan-300 font-bold">
              {metrics.vCore.toFixed(3)} V
            </span>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-500 block text-[9px]">CORE CLOCK</span>
            <span className="text-emerald-400 font-bold">
              {metrics.clockFreq.toFixed(2)} GHz
            </span>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-500 block text-[9px]">DIE TEMP</span>
            <span className={`font-bold ${tempColor}`}>
              {metrics.cpuTemp.toFixed(1)} °C
            </span>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-500 block text-[9px]">TDP POWER</span>
            <span className="text-indigo-300 font-bold">
              {metrics.tdpWatts.toFixed(0)} W
            </span>
          </div>
        </div>
      </div>

      {/* CENTER RETICLE / VISOR FOCUS CROSSHAIR */}
      <div className="relative z-10 flex items-center justify-center my-auto">
        <div className="w-8 h-8 border border-cyan-400/30 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
        </div>
      </div>

      {/* BOTTOM DIEGETIC FOOTER: Real Linux Kernel Dmesg & RIP */}
      <div className="relative z-30 flex flex-wrap items-end justify-between gap-4 text-[11px]">
        {/* Real Linux Kernel Message Corner */}
        <div className="max-w-md border border-cyan-900/60 bg-black/85 p-2.5 rounded shadow-lg">
          <div className="text-[9px] font-bold text-cyan-500/80 border-b border-cyan-900/50 pb-1 mb-1.5 flex justify-between">
            <span>[KERNEL RING BUFFER : dmesg]</span>
            <span className="text-emerald-400">STATUS: RING_0 READY</span>
          </div>
          <div className="space-y-0.5 text-slate-400 text-[10px] leading-tight">
            <div>[  12.48102] cpu0: pstate boost active, throttling limit 105C</div>
            <div>
              [  12.49210] x86/vulkan: pipeline JIT binding at {metrics.instructionPointer}
            </div>
            {metrics.kernelPanic ? (
              <div className="text-red-400 font-bold bg-red-950/40 px-1 py-0.5 rounded">
                [!] KERNEL PANIC: Segmentation fault at {metrics.instructionPointer} (Core dumped)
              </div>
            ) : (
              <div className="text-cyan-300">
                [  12.51000] qterm: socket 0x64 connected to Quantum Core
              </div>
            )}
          </div>
        </div>

        {/* Instruction Pointer (RIP) & L3 Cache Rate */}
        <div className="border border-slate-800 bg-black/80 px-3 py-2 rounded text-right">
          <div className="text-[10px] text-slate-500">
            INSTRUCTION POINTER (RIP)
          </div>
          <div className="text-cyan-400 font-bold text-sm tracking-wider">
            {metrics.instructionPointer}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            L3 HIT: <span className="text-emerald-400">{metrics.l3HitRate}%</span> | MISS: <span className="text-amber-400">{metrics.cacheMissCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
