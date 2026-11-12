/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HardwareCockpit: Unified Collapsible Bottom Control Dock
 * Respects Three.js Ergonomic Guidelines (zero viewport occlusion, collapsible,
 * zero pulsating dots, static clean typography).
 */

import React, { useState } from 'react';
import { GameZone } from '../types/game';
import { hardwareAudio } from '../audio/HardwareAudio';
import { Volume2, VolumeX, Compass, ChevronDown, ChevronUp, Terminal, RotateCcw, Eye } from 'lucide-react';

interface HardwareCockpitProps {
  currentZone: GameZone;
  onSelectZone: (zone: GameZone) => void;
  onResetPosition: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
}

export const HardwareCockpit: React.FC<HardwareCockpitProps> = ({
  currentZone,
  onSelectZone,
  onResetPosition,
  onToggleTerminal,
  isTerminalOpen,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleMuteToggle = () => {
    const muted = hardwareAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 font-mono select-none w-full max-w-[940px] px-3 pointer-events-auto">
      {/* Collapse/Expand Toggle Button */}
      <div className="flex justify-center -mb-px">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-t-md bg-slate-900 border-t border-x border-cyan-500/40 text-[11px] text-cyan-300 hover:text-white cursor-pointer transition-colors shadow-lg"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>KOKPİTİ GÖSTER (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>SİNEMA MODU (GİZLE)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      {!isCollapsed && (
        <div className="bg-slate-950/90 border border-cyan-500/50 rounded-lg p-2.5 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-none">
          {/* Zone Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1">
              BÖLGE SEÇİMİ:
            </span>
            <button
              onClick={() => onSelectZone('REGISTERS_OF_DOOM')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                currentZone === 'REGISTERS_OF_DOOM'
                  ? 'bg-cyan-900/90 border-cyan-400 text-cyan-200'
                  : 'bg-black/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Kayıtçı Tapınakları
            </button>
            <button
              onClick={() => onSelectZone('L3_CACHE_MATRIX')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                currentZone === 'L3_CACHE_MATRIX'
                  ? 'bg-cyan-900/90 border-cyan-400 text-cyan-200'
                  : 'bg-black/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              2. L3 Önbellek Labirenti
            </button>
            <button
              onClick={() => onSelectZone('PAGE_FAULT_ABYSS')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                currentZone === 'PAGE_FAULT_ABYSS'
                  ? 'bg-cyan-900/90 border-cyan-400 text-cyan-200'
                  : 'bg-black/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Sanal Bellek Uçurumu
            </button>
          </div>

          {/* Quick Action Utility Buttons */}
          <div className="flex items-center gap-2">
            {/* Terminal Toggle Button */}
            <button
              onClick={onToggleTerminal}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] border font-bold cursor-pointer transition-colors ${
                isTerminalOpen
                  ? 'bg-cyan-600 text-black border-cyan-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/40'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>TERMINAL (TAB)</span>
            </button>

            {/* Position Reset */}
            <button
              onClick={onResetPosition}
              title="Mimar Enes'i başlangıç noktasına döndür"
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>RESET</span>
            </button>

            {/* Audio Foley Toggle */}
            <button
              onClick={handleMuteToggle}
              title={isMuted ? 'Donanım Akustiğini Aç' : 'Donanım Akustiğini Sustur'}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400">SES KAPALI</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-300">SES AÇIK</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
