/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ENES ENGINE: ARCHITECT 0x00
 * Yazar & Proje Sahibi: Enes Öztürk
 * 3D Birinci Şahıs Siber-Mühendislik, Gerçek Zamanlı Derleme ve Donanım Hackleme Aksiyonu
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GameZone, HardwareMetrics, RegisterState, BitSwitchState, MalwareEntity, MissionObjective } from './types/game';
import { WorldBuilder } from './engine/WorldBuilder';
import { PlayerController } from './engine/PlayerController';
import { hardwareAudio } from './audio/HardwareAudio';
import { CyberVisorHUD } from './components/CyberVisorHUD';
import { QuantumTerminal } from './components/QuantumTerminal';
import { HardwareCockpit } from './components/HardwareCockpit';
import { JitCompiler } from './engine/JitCompiler';
import { Terminal, Shield, Zap, Sparkles, AlertTriangle } from 'lucide-react';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // Game States
  const [currentZone, setCurrentZone] = useState<GameZone>('REGISTERS_OF_DOOM');
  const [laserUnlocked, setLaserUnlocked] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isGlitchActive, setIsGlitchActive] = useState(false);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(true);

  // Hardware Metrics (Diegetic Telemetry)
  const [metrics, setMetrics] = useState<HardwareMetrics>({
    cpuTemp: 58.4,
    vCore: 1.284,
    clockFreq: 4.85,
    tdpWatts: 142,
    l3HitRate: 96.4,
    cacheMissCount: 2,
    instructionPointer: '0x00007FFF00A1',
    systemUptime: 0,
    memoryUsageMb: 4210,
    voltageFlicker: false,
    kernelPanic: false,
  });

  // x86-64 Registers
  const [registers, setRegisters] = useState<RegisterState>({
    RAX: 0x00000000,
    RBX: 0x00000040,
    RCX: 0x00000100,
    RDX: 0x00000000,
    RSP: 0x7FFFFFFF,
    RBP: 0x7FFFFFF0,
    RSI: 0x00401000,
    RDI: 0x00402000,
    RIP: 0x7FFF00A1,
  });

  // 8-Bit Bus Switch State (Default: 01101100 = 0x6C, target: 10110000 = 0xB0)
  const [bitSwitchState, setBitSwitchState] = useState<BitSwitchState>({
    bits: [0, 1, 1, 0, 1, 1, 0, 0],
    targetBits: [1, 0, 1, 1, 0, 0, 0, 0],
    isBridgeAligned: false,
  });

  // Malware Daemons in L3 Cache
  const [malwareList, setMalwareList] = useState<MalwareEntity[]>([
    {
      id: 'mal-1',
      name: 'KERNEL_WORM_0xBAD',
      address: '0xL3_WAY_0',
      health: 100,
      x: -12,
      y: 4,
      z: -14,
      type: 'WORM',
      isNeutralized: false,
    },
    {
      id: 'mal-2',
      name: 'BIT_ROT_SPECTRE',
      address: '0xL3_WAY_8',
      health: 100,
      x: 14,
      y: 6,
      z: 16,
      type: 'SPECTRE',
      isNeutralized: false,
    },
  ]);

  // Mission Objectives per Zone
  const getActiveObjective = useCallback((): MissionObjective => {
    switch (currentZone) {
      case 'REGISTERS_OF_DOOM':
        return {
          id: 'obj-1',
          zone: 'REGISTERS_OF_DOOM',
          title: laserUnlocked ? 'LAZER BARİYERİ AŞILDI!' : '0x7FFF00A1 LAZERİNİ NOP İLE EZ',
          description: laserUnlocked
            ? 'Bellek adresi 0x7FFF00A1 NOPlandı. Yol açıldı!'
            : 'Terminali açın ve `POKE 0x7FFF00A1 0x9090` yazarak lazer bariyerini devreden çıkarın.',
          targetAddress: '0x7FFF00A1',
          requiredCodeHint: 'POKE 0x7FFF00A1 0x9090',
          completed: laserUnlocked,
        };
      case 'L3_CACHE_MATRIX':
        const activeMalware = malwareList.filter((m) => !m.isNeutralized);
        const allDead = activeMalware.length === 0;
        return {
          id: 'obj-2',
          zone: 'L3_CACHE_MATRIX',
          title: allDead ? 'L3 CACHE TEMİZLENDİ' : 'ZARARLI DAEMONLARI DEBUG ET',
          description: allDead
            ? 'Bütün virüs/rot prosesleri sonlandırıldı. L3 Hit oranı %99.8.'
            : '`PATCH 0xL3 NOP` veya `KILL -9 0xBAD` derleyerek virüsleri temizleyin.',
          requiredCodeHint: 'PATCH 0xL3 NOP',
          completed: allDead,
        };
      case 'PAGE_FAULT_ABYSS':
        return {
          id: 'obj-3',
          zone: 'PAGE_FAULT_ABYSS',
          title: bitSwitchState.isBridgeAligned ? 'VERİ YOLU KENETLENDİ' : '8-BIT KÖPRÜYÜ SHL İLE HİZALA',
          description: bitSwitchState.isBridgeAligned
            ? '10110000 verisi doğrulandı. Kuantum köprü blokları kenetlendi!'
            : '01101100 verisini 2 bit sola kaydırın: `SHL 01101100 2` veya şalterlere tıklayın.',
          requiredCodeHint: 'SHL 01101100 2',
          completed: bitSwitchState.isBridgeAligned,
        };
    }
  }, [currentZone, laserUnlocked, malwareList, bitSwitchState.isBridgeAligned]);

  // Engine Refs
  const worldBuilderRef = useRef<WorldBuilder | null>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // -------------------------------------------------------------
  // INITIALIZE THREE.JS ENGINE SCENE
  // -------------------------------------------------------------
  useEffect(() => {
    if (!canvasMountRef.current) return;

    // Detect software WebGL per Three.js guidelines
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = canvasMountRef.current.clientWidth || window.innerWidth;
    const height = canvasMountRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 500);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Zero-dependency Procedural Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Rig
    const ambientLight = new THREE.HemisphereLight(0x00f3ff, 0x050a15, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    dirLight.position.set(30, 60, 20);
    dirLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 200;
      dirLight.shadow.camera.left = -50;
      dirLight.shadow.camera.right = 50;
      dirLight.shadow.camera.top = 50;
      dirLight.shadow.camera.bottom = -50;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    // Cyan Fill Rim Light
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.2);
    rimLight.position.set(-40, 20, -30);
    scene.add(rimLight);

    // Mount canvas
    canvasMountRef.current.appendChild(renderer.domElement);

    // Initialize Player Controller
    const controller = new PlayerController(camera);
    playerControllerRef.current = controller;

    // Initialize World Builder
    const worldBuilder = new WorldBuilder();
    worldBuilderRef.current = worldBuilder;

    // Build initial zone
    const anisotropy = renderer.capabilities.getMaxAnisotropy();
    const zoneMesh = worldBuilder.buildZone({
      scene,
      zone: currentZone,
      registers,
      laserUnlocked,
      bitSwitchState,
      malwareList,
      anisotropy,
    });
    scene.add(zoneMesh);

    // Animation Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Update player kinematics
      controller.update(delta, !laserUnlocked && currentZone === 'REGISTERS_OF_DOOM', 0);

      // Update 3D world elements
      worldBuilder.update(elapsed, delta);

      // Render
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle terminal with TAB or Backquote `
      if (e.code === 'Tab' || e.code === 'Backquote') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
        return;
      }
      controller.handleKeyDown(e);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      controller.handleKeyUp(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Resize Handler
    const handleResize = () => {
      if (!canvasMountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = canvasMountRef.current.clientWidth;
      const h = canvasMountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      worldBuilder.dispose();
      if (canvasMountRef.current && renderer.domElement) {
        canvasMountRef.current.innerHTML = '';
      }
    };
  }, []);

  // -------------------------------------------------------------
  // REBUILD ZONE WHEN ZONE STATE OR OBJECTIVES CHANGE
  // -------------------------------------------------------------
  useEffect(() => {
    if (!worldBuilderRef.current || !sceneRef.current || !rendererRef.current) return;

    // Reset player position based on zone
    if (playerControllerRef.current) {
      if (currentZone === 'REGISTERS_OF_DOOM') {
        playerControllerRef.current.resetPosition(0, 3.2, 25, 0);
      } else if (currentZone === 'L3_CACHE_MATRIX') {
        playerControllerRef.current.resetPosition(0, 3.2, 28, 0);
      } else if (currentZone === 'PAGE_FAULT_ABYSS') {
        playerControllerRef.current.resetPosition(-24, 3.2, 0, Math.PI / 2);
      }
    }

    // Clear old zone mesh and build new
    const anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();
    const newGroup = worldBuilderRef.current.buildZone({
      scene: sceneRef.current,
      zone: currentZone,
      registers,
      laserUnlocked,
      bitSwitchState,
      malwareList,
      anisotropy,
    });
    sceneRef.current.add(newGroup);
  }, [currentZone, laserUnlocked, bitSwitchState.isBridgeAligned, malwareList]);

  // -------------------------------------------------------------
  // HARDWARE TELEMETRY & AUDIO SIMULATION TICK
  // -------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics((prev) => {
        // Natural slight thermal and voltage fluctuations
        const loadRatio = Math.max(0.1, (prev.cpuTemp - 40) / 60);
        hardwareAudio.updateHardwareLoad(prev.cpuTemp, loadRatio);

        const targetTemp = prev.cpuTemp > 65 ? prev.cpuTemp - 0.4 : 60 + Math.random() * 2;
        const vNoise = (Math.random() - 0.5) * 0.008;

        return {
          ...prev,
          cpuTemp: Math.max(50, Math.min(102, targetTemp)),
          vCore: 1.28 + vNoise,
          systemUptime: prev.systemUptime + 1,
          voltageFlicker: false,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // MOUSE DRAG LOOK CONTROLS ON 3D CANVAS
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    hardwareAudio.init();
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !playerControllerRef.current) return;
    const dx = e.clientX - prevMousePos.current.x;
    const dy = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
    playerControllerRef.current.handleMouseMove(dx, dy);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // -------------------------------------------------------------
  // JIT EXECUTION CALLBACKS
  // -------------------------------------------------------------
  const handleJitSuccess = (result: ReturnType<typeof JitCompiler.compileAndExecute>) => {
    if (result.unlockedLaser) {
      setLaserUnlocked(true);
      if (worldBuilderRef.current) {
        worldBuilderRef.current.setLaserUnlocked(true);
      }
    }

    if (result.bridgeAligned !== undefined) {
      setBitSwitchState((prev) => ({
        ...prev,
        isBridgeAligned: result.bridgeAligned!,
        bits: result.updatedBits || prev.bits,
      }));
      if (worldBuilderRef.current) {
        worldBuilderRef.current.updateBridgeAlignment(result.bridgeAligned);
      }
    }

    if (result.updatedBits) {
      setBitSwitchState((prev) => ({
        ...prev,
        bits: result.updatedBits!,
        isBridgeAligned: result.bridgeAligned ?? prev.isBridgeAligned,
      }));
    }

    if (result.malwareKilledId) {
      setMalwareList((prev) =>
        prev.map((m) => (m.id === result.malwareKilledId ? { ...m, isNeutralized: true } : m))
      );
      setMetrics((m) => ({ ...m, l3HitRate: 99.8, cacheMissCount: 0 }));
    }

    if (result.updatedRegisters) {
      setRegisters((prev) => ({ ...prev, ...result.updatedRegisters }));
    }

    setMetrics((prev) => ({
      ...prev,
      cpuTemp: Math.max(50, prev.cpuTemp + result.tempDelta),
      kernelPanic: false,
    }));
  };

  const handleJitError = (result: ReturnType<typeof JitCompiler.compileAndExecute>) => {
    setIsGlitchActive(true);
    setTimeout(() => setIsGlitchActive(false), 450);

    setMetrics((prev) => ({
      ...prev,
      cpuTemp: Math.min(105, prev.cpuTemp + result.tempDelta),
      voltageFlicker: true,
      kernelPanic: true,
      cacheMissCount: prev.cacheMissCount + 1,
    }));
  };

  const handleBitSwitchToggle = (bitIndex: number) => {
    setBitSwitchState((prev) => {
      const newBits = [...prev.bits];
      newBits[7 - bitIndex] = newBits[7 - bitIndex] === 1 ? 0 : 1;
      const binStr = newBits.join('');
      const aligned = binStr === '10110000';

      if (worldBuilderRef.current) {
        worldBuilderRef.current.updateBridgeAlignment(aligned);
      }

      if (aligned) {
        hardwareAudio.playBuildSuccess();
      }

      return {
        ...prev,
        bits: newBits,
        isBridgeAligned: aligned,
      };
    });
  };

  const handleSelectZone = (zone: GameZone) => {
    hardwareAudio.init();
    hardwareAudio.playKeyClick();
    setCurrentZone(zone);
  };

  const handleResetPosition = () => {
    hardwareAudio.init();
    hardwareAudio.playKeyClick();
    if (playerControllerRef.current) {
      if (currentZone === 'REGISTERS_OF_DOOM') {
        playerControllerRef.current.resetPosition(0, 3.2, 25, 0);
      } else if (currentZone === 'L3_CACHE_MATRIX') {
        playerControllerRef.current.resetPosition(0, 3.2, 28, 0);
      } else if (currentZone === 'PAGE_FAULT_ABYSS') {
        playerControllerRef.current.resetPosition(-24, 3.2, 0, Math.PI / 2);
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none text-slate-100 font-mono">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* Diegetic Cyber-Visor HUD */}
      <CyberVisorHUD
        metrics={metrics}
        currentZone={currentZone}
        activeObjective={getActiveObjective()}
        isGlitchActive={isGlitchActive}
      />

      {/* Handheld Quantum Terminal */}
      <QuantumTerminal
        currentZone={currentZone}
        registers={registers}
        bitSwitchState={bitSwitchState}
        malwareList={malwareList}
        onJitSuccess={handleJitSuccess}
        onJitError={handleJitError}
        onBitSwitchToggle={handleBitSwitchToggle}
        isOpen={isTerminalOpen}
        onToggleOpen={() => setIsTerminalOpen(!isTerminalOpen)}
      />

      {/* Unified Bottom Control Dock */}
      <HardwareCockpit
        currentZone={currentZone}
        onSelectZone={handleSelectZone}
        onResetPosition={handleResetPosition}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        isTerminalOpen={isTerminalOpen}
      />

      {/* First-Person On-Screen Movement & Look Helper Pills */}
      <div className="fixed top-20 left-4 z-20 pointer-events-none hidden md:block text-[11px] font-mono text-cyan-400/80 bg-black/70 border border-cyan-900/60 p-2.5 rounded">
        <div className="text-[10px] text-slate-400 font-bold mb-1">KONTROLLER:</div>
        <div>• W / A / S / D: Yürüme & Keşif</div>
        <div>• Fare Sürükle: Bakış Açısı (360° Look)</div>
        <div>• Space: Zıplama</div>
        <div>• TAB veya ~ : Quantum Terminal</div>
      </div>

      {/* Welcome & Lore Intro Modal for Enes Öztürk */}
      {showWelcomeIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none font-mono">
          <div className="max-w-xl w-full bg-slate-950 border-2 border-cyan-500/80 rounded-lg p-6 shadow-[0_0_35px_rgba(6,182,212,0.4)] text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-base">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>ENES ENGINE: ARCHITECT 0x00</span>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                C++26 // VULKAN
              </span>
            </div>

            <div className="text-slate-300 space-y-2.5 text-[12px] leading-relaxed">
              <p>
                <strong className="text-cyan-300">Hoş geldin, Sistem Mimarı Enes Öztürk.</strong>
              </p>
              <p>
                Bu dünyada jenerik silahlar ve büyüler yok. İşlemcinin mikroskobik mimarisi içinde, doğrudan kuantum çekirdeğe bağlı el terminalinle fiziksel dünyayı saf makine kodu ve JIT derleme ile manipüle edeceksin.
              </p>
              <div className="p-3 bg-black/60 rounded border border-slate-800 space-y-1.5 text-[11px]">
                <div className="text-cyan-400 font-bold">TEMEL MEKANİKLER:</div>
                <div>• <strong className="text-slate-200">1. Bölge (Kayıtçı Tapınakları):</strong> 0x7FFF00A1 lazerini terminale <code className="text-cyan-300">POKE 0x7FFF00A1 0x9090</code> yazarak NOP ile ez.</div>
                <div>• <strong className="text-slate-200">2. Bölge (L3 Önbellek):</strong> Zararlı Spectre'ı <code className="text-cyan-300">PATCH 0xL3 NOP</code> ile debug et.</div>
                <div>• <strong className="text-slate-200">3. Bölge (Sanal Bellek Uçurumu):</strong> 8-Bit köprüyü <code className="text-amber-300">SHL 01101100 2</code> komutuyla sola kaydırarak kenetle.</div>
                <div className="text-red-400">⚠️ Dikkat: Sözdizimi hatası (Syntax Error) yaparsanız terminal patlar ve işlemci aşırı ısınır!</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  hardwareAudio.init();
                  hardwareAudio.playBuildSuccess();
                  setShowWelcomeIntro(false);
                }}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm rounded cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                MİKRO-MİMARİYE BAŞLA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
