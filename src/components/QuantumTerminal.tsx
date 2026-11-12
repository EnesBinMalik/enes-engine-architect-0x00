/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * QuantumTerminal: Q-TERM 0x64 Handheld Quantum Terminal
 * Direct socket to CPU Core. Pure programmer craftsmanship with JIT execution,
 * live hex memory inspection, mechanical keyboard foley, and zero auto-complete.
 */

import React, { useState, useRef, useEffect } from 'react';
import { TerminalOutputLine, HardwareMetrics, RegisterState, BitSwitchState, MalwareEntity, GameZone } from '../types/game';
import { JitCompiler } from '../engine/JitCompiler';
import { hardwareAudio } from '../audio/HardwareAudio';
import { Terminal, Cpu, Database, Binary, HelpCircle, ShieldAlert, Sparkles, Send } from 'lucide-react';

interface QuantumTerminalProps {
  currentZone: GameZone;
  registers: RegisterState;
  bitSwitchState: BitSwitchState;
  malwareList: MalwareEntity[];
  onJitSuccess: (result: ReturnType<typeof JitCompiler.compileAndExecute>) => void;
  onJitError: (result: ReturnType<typeof JitCompiler.compileAndExecute>) => void;
  onBitSwitchToggle: (bitIndex: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const QuantumTerminal: React.FC<QuantumTerminalProps> = ({
  currentZone,
  registers,
  bitSwitchState,
  malwareList,
  onJitSuccess,
  onJitError,
  onBitSwitchToggle,
  isOpen,
  onToggleOpen,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'HEX_MEM' | 'REGISTERS' | 'BITWISE'>('CONSOLE');
  const [history, setHistory] = useState<TerminalOutputLine[]>([
    {
      id: 'init-1',
      type: 'INFO',
      text: '*** ENES ENGINE 0x26 // QUANTUM TERMINAL INTERFACE READY ***',
      timestamp: '00:00:01',
    },
    {
      id: 'init-2',
      type: 'INFO',
      text: 'SYSTEM ARCHITECT: Enes Öztürk | HOST: Socket 0x64 | COMPILER: C++26 JIT',
      timestamp: '00:00:02',
    },
    {
      id: 'init-3',
      type: 'STDOUT',
      text: 'Type "HELP" or "ARCH" for hardware directives. Overcome physical obstacles via runtime code.',
      timestamp: '00:00:03',
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputCode(e.target.value);
    hardwareAudio.playKeyClick();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = inputCode.trim();
    if (!command) return;

    hardwareAudio.playKeyClick();

    const timestamp = new Date().toTimeString().split(' ')[0];
    const cmdLine: TerminalOutputLine = {
      id: Math.random().toString(),
      type: 'CMD',
      text: `enes@quantum-core:0x00# ${command}`,
      timestamp,
    };

    const res = JitCompiler.compileAndExecute(
      command,
      currentZone,
      registers,
      bitSwitchState,
      malwareList
    );

    const newOutputs: TerminalOutputLine[] = [cmdLine];

    if (res.success) {
      hardwareAudio.playBuildSuccess();
      newOutputs.push({
        id: Math.random().toString(),
        type: 'JIT_SUCCESS',
        text: res.stdout,
        timestamp,
      });
      onJitSuccess(res);
    } else {
      newOutputs.push({
        id: Math.random().toString(),
        type: 'STDERR',
        text: res.stderr || 'Syntax error encountered during assembly compilation.',
        timestamp,
      });
      onJitError(res);
    }

    setHistory((prev) => [...prev, ...newOutputs]);
    setInputCode('');
  };

  const insertSnippet = (snippet: string) => {
    setInputCode(snippet);
    hardwareAudio.playKeyClick();
    inputRef.current?.focus();
  };

  return (
    <div
      className={`fixed transition-all duration-300 z-30 font-mono select-none ${
        isOpen
          ? 'bottom-20 right-4 w-[95vw] sm:w-[620px] max-h-[82vh] h-[520px]'
          : 'bottom-20 right-4 w-72 h-14'
      }`}
    >
      {/* Container Frame with Cyber Glow */}
      <div className="w-full h-full flex flex-col bg-slate-950/95 border-2 border-cyan-500/70 rounded-lg shadow-[0_0_25px_rgba(6,182,212,0.3)] overflow-hidden">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-950/90 to-slate-900 border-b border-cyan-500/40 text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-cyan-300 tracking-wider">
              Q-TERM 0x64 [JIT ENGINE]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleOpen}
              className="px-2.5 py-0.5 text-[11px] font-bold rounded bg-cyan-900/60 hover:bg-cyan-700 text-cyan-200 border border-cyan-400/50 cursor-pointer transition-colors"
            >
              {isOpen ? 'KÜÇÜLT (DOCK)' : 'GENİŞLET (TERMINAL)'}
            </button>
          </div>
        </div>

        {isOpen && (
          <>
            {/* Terminal Tab Bar */}
            <div className="flex items-center bg-black/60 border-b border-slate-800 text-[11px] px-2 pt-1 gap-1">
              <button
                onClick={() => setActiveTab('CONSOLE')}
                className={`px-3 py-1.5 rounded-t font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'CONSOLE'
                    ? 'bg-cyan-950/80 text-cyan-300 border-t-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                KONSOL
              </button>
              <button
                onClick={() => setActiveTab('HEX_MEM')}
                className={`px-3 py-1.5 rounded-t font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'HEX_MEM'
                    ? 'bg-cyan-950/80 text-cyan-300 border-t-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                BELLEK (HEX)
              </button>
              <button
                onClick={() => setActiveTab('REGISTERS')}
                className={`px-3 py-1.5 rounded-t font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'REGISTERS'
                    ? 'bg-cyan-950/80 text-cyan-300 border-t-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                KAYITÇILAR
              </button>
              <button
                onClick={() => setActiveTab('BITWISE')}
                className={`px-3 py-1.5 rounded-t font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'BITWISE'
                    ? 'bg-cyan-950/80 text-cyan-300 border-t-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Binary className="w-3.5 h-3.5" />
                8-BIT VERİ YOLU
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-3 text-xs space-y-2">
              {activeTab === 'CONSOLE' && (
                <div>
                  <div className="space-y-1.5 mb-3">
                    {history.map((line) => (
                      <div key={line.id} className="leading-relaxed">
                        {line.type === 'CMD' && (
                          <div className="text-cyan-400 font-semibold flex gap-2">
                            <span>{line.text}</span>
                          </div>
                        )}
                        {line.type === 'STDOUT' && (
                          <div className="text-slate-300 whitespace-pre-wrap pl-2 border-l border-slate-700">
                            {line.text}
                          </div>
                        )}
                        {line.type === 'STDERR' && (
                          <div className="text-red-400 bg-red-950/40 p-2 rounded border border-red-500/40 whitespace-pre-wrap font-bold">
                            {line.text}
                          </div>
                        )}
                        {line.type === 'JIT_SUCCESS' && (
                          <div className="text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-500/40 whitespace-pre-wrap font-semibold">
                            {line.text}
                          </div>
                        )}
                        {line.type === 'INFO' && (
                          <div className="text-sky-400/90 italic">{line.text}</div>
                        )}
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>

                  {/* Directive Quick Snippets */}
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <span className="text-cyan-400 font-bold mr-1">HIZLI DİREKTİFLER:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => insertSnippet('POKE 0x7FFF00A1 0x9090')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer"
                      >
                        POKE 0x7FFF00A1 0x9090
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('SHL 01101100 2')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
                      >
                        SHL 01101100 2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('MOV RAX, 0xFF')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                      >
                        MOV RAX, 0xFF
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('PATCH 0xL3 NOP')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 cursor-pointer"
                      >
                        PATCH 0xL3 NOP
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('PEEK 0x7FFF00A1')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                      >
                        PEEK 0x7FFF00A1
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('DMESG')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                      >
                        DMESG
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'HEX_MEM' && (
                <div className="space-y-3">
                  <div className="text-cyan-400 font-bold border-b border-cyan-900/50 pb-1 flex justify-between">
                    <span>CANLI BELLEK DÖKÜMÜ (HEX DUMP)</span>
                    <span className="text-slate-400">OFFSET: 0x7FFF0000</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-[11px] font-mono">
                    <div className="flex justify-between p-1 rounded bg-black/60">
                      <span className="text-slate-500">0x7FFF00A0:</span>
                      <span className="text-red-400 font-bold bg-red-950/40 px-1 rounded">
                        0x7FFF00A1 [LASER REG: 0x9090]
                      </span>
                      <span className="text-slate-400">NOP NOP</span>
                    </div>
                    <div className="flex justify-between p-1 rounded bg-black/40">
                      <span className="text-slate-500">0x7FFF00B0:</span>
                      <span className="text-cyan-300">48 89 E5 48 83 EC 20 00</span>
                      <span className="text-slate-400">MOV RBP, RSP</span>
                    </div>
                    <div className="flex justify-between p-1 rounded bg-black/40">
                      <span className="text-slate-500">0x7FFF00C0:</span>
                      <span className="text-cyan-300">B8 01 00 00 00 0F 05 00</span>
                      <span className="text-slate-400">SYSCALL</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'REGISTERS' && (
                <div className="space-y-3">
                  <div className="text-cyan-400 font-bold border-b border-cyan-900/50 pb-1">
                    x86-64 GENEL AMAÇLI KAYITÇILAR (64-BIT REGISTERS)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(registers).map(([k, v]) => (
                      <div
                        key={k}
                        className="p-2 rounded bg-black/50 border border-slate-800 flex justify-between items-center"
                      >
                        <span className="text-cyan-300 font-bold">{k}</span>
                        <span className="text-slate-200 font-mono">
                          0x{v.toString(16).toUpperCase().padStart(8, '0')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'BITWISE' && (
                <div className="space-y-3">
                  <div className="text-amber-400 font-bold border-b border-amber-900/50 pb-1 flex justify-between">
                    <span>8-BIT VERİ YOLU ŞALTERLERİ (BUS SWITCH MATRIX)</span>
                    <span>HEDEF: 10110000 (0xB0)</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Köprüyü geçilebilir kılmak için bitleri kaydırın veya tek tek şalterlere tıklayarak hizalayın.
                  </div>

                  {/* 8-bit switches grid */}
                  <div className="grid grid-cols-8 gap-1.5 pt-2">
                    {bitSwitchState.bits.map((bit, idx) => {
                      const bitIndex = 7 - idx;
                      return (
                        <button
                          key={bitIndex}
                          type="button"
                          onClick={() => {
                            hardwareAudio.playRelayClick(bit === 0);
                            onBitSwitchToggle(bitIndex);
                          }}
                          className={`p-2 rounded text-center border font-bold cursor-pointer transition-all ${
                            bit === 1
                              ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                              : 'bg-red-950/60 border-red-500/60 text-red-400'
                          }`}
                        >
                          <div className="text-[9px] text-slate-400">b{bitIndex}</div>
                          <div className="text-lg">{bit}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 rounded bg-black/60 border border-slate-800 text-xs flex justify-between">
                    <span>MEVCUT KELİME: {bitSwitchState.bits.join('')}</span>
                    <span
                      className={`font-bold ${
                        bitSwitchState.isBridgeAligned ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {bitSwitchState.isBridgeAligned ? 'KÖPRÜ KİLİTLİ VE GEÇİLEBİLİR' : 'HİZASIZ'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Command Line Input Footer */}
            <form
              onSubmit={handleFormSubmit}
              className="p-2 bg-black/90 border-t border-cyan-500/40 flex items-center gap-2"
            >
              <span className="text-cyan-400 font-bold text-xs">enes#</span>
              <input
                ref={inputRef}
                type="text"
                value={inputCode}
                onChange={handleInputChange}
                placeholder="Örn: POKE 0x7FFF00A1 0x9090 veya SHL 01101100 2"
                className="flex-1 bg-transparent text-cyan-200 text-xs outline-none font-mono placeholder:text-slate-600 caret-cyan-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded cursor-pointer flex items-center gap-1 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                DERLE
              </button>
            </form>
          </>
        )}

        {!isOpen && (
          <div
            onClick={onToggleOpen}
            className="flex-1 flex items-center justify-between px-3 cursor-pointer text-xs text-cyan-300 hover:bg-cyan-950/40"
          >
            <span>enes@core:0x00# Kod yazmak için tıkla (TAB)</span>
            <span className="text-[10px] bg-cyan-900/50 px-1.5 py-0.5 rounded text-cyan-300">
              Q-TERM
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
