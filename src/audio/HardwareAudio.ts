/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HardwareAudio: 100% Procedural Web Audio API Synthesizer
 * Simulates real hardware foley: Dynamic CPU fan turbine, high-frequency coil whine,
 * mechanical relay switches, Cherry MX keyboard clatter, electric spark explosions,
 * and bit-crushed memory leak distortion.
 */

class HardwareAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private fanOsc: OscillatorNode | null = null;
  private fanGain: GainNode | null = null;
  private fanNoise: AudioBufferSourceNode | null = null;
  private fanFilter: BiquadFilterNode | null = null;
  private coilWhineOsc: OscillatorNode | null = null;
  private coilWhineGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private initialized: boolean = false;

  public init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Procedural CPU fan noise + turbine hum
      this.setupFanSound();
      // Procedural GPU/VRM Coil Whine
      this.setupCoilWhine();

      this.initialized = true;
    } catch {
      // AudioContext might require user gesture
    }
  }

  private setupFanSound() {
    if (!this.ctx || !this.masterGain) return;

    // Pink/white noise buffer for air friction
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.85 * b2 + white * 0.2;
      output[i] = (b0 + b1 + b2) * 0.15;
    }

    this.fanNoise = this.ctx.createBufferSource();
    this.fanNoise.buffer = noiseBuffer;
    this.fanNoise.loop = true;

    this.fanFilter = this.ctx.createBiquadFilter();
    this.fanFilter.type = 'lowpass';
    this.fanFilter.frequency.setValueAtTime(380, this.ctx.currentTime);

    this.fanGain = this.ctx.createGain();
    this.fanGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    // Motor harmonic pitch
    this.fanOsc = this.ctx.createOscillator();
    this.fanOsc.type = 'sawtooth';
    this.fanOsc.frequency.setValueAtTime(65, this.ctx.currentTime);

    const fanOscGain = this.ctx.createGain();
    fanOscGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    this.fanOsc.connect(fanOscGain);
    fanOscGain.connect(this.fanGain);

    this.fanNoise.connect(this.fanFilter);
    this.fanFilter.connect(this.fanGain);
    this.fanGain.connect(this.masterGain);

    this.fanNoise.start();
    this.fanOsc.start();
  }

  private setupCoilWhine() {
    if (!this.ctx || !this.masterGain) return;

    this.coilWhineOsc = this.ctx.createOscillator();
    this.coilWhineOsc.type = 'sine';
    this.coilWhineOsc.frequency.setValueAtTime(9200, this.ctx.currentTime);

    this.coilWhineGain = this.ctx.createGain();
    this.coilWhineGain.gain.setValueAtTime(0.005, this.ctx.currentTime);

    this.coilWhineOsc.connect(this.coilWhineGain);
    this.coilWhineGain.connect(this.masterGain);
    this.coilWhineOsc.start();
  }

  public updateHardwareLoad(tempCelsius: number, loadRatio: number) {
    if (!this.ctx || !this.initialized || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Fan pitch scales with temperature (40°C -> 60Hz, 95°C -> 240Hz)
    const baseFreq = 50 + (tempCelsius - 40) * 3.5;
    if (this.fanOsc) {
      this.fanOsc.frequency.setTargetAtTime(Math.max(45, Math.min(320, baseFreq)), t, 0.2);
    }
    if (this.fanFilter) {
      const filterFreq = 300 + loadRatio * 1400;
      this.fanFilter.frequency.setTargetAtTime(filterFreq, t, 0.2);
    }
    if (this.fanGain) {
      const vol = 0.05 + loadRatio * 0.15;
      this.fanGain.gain.setTargetAtTime(vol, t, 0.2);
    }
    if (this.coilWhineGain && this.coilWhineOsc) {
      // Coil whine spikes during compile or high GPU compute load
      const whineVol = loadRatio > 0.6 ? 0.015 * loadRatio : 0.003;
      this.coilWhineGain.gain.setTargetAtTime(whineVol, t, 0.1);
      this.coilWhineOsc.frequency.setTargetAtTime(8000 + loadRatio * 4000, t, 0.1);
    }
  }

  // Mechanical switch click (Relay sound for 0/1 bits)
  public playRelayClick(stateOn: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(stateOn ? 920 : 680, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.035);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  // Terminal Mechanical Key Click
  public playKeyClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    // Randomize pitch slightly for organic typing feel
    const pitch = 1800 + Math.random() * 400;
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.02);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  // Syntax Error Terminal Explosion / Electric Spark
  public playSyntaxErrorSpark() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    // Noise blast + down-swept saw
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);

    // Deep error buzzer buzz
    const buzz = this.ctx.createOscillator();
    const buzzGain = this.ctx.createGain();
    buzz.type = 'sawtooth';
    buzz.frequency.setValueAtTime(95, t);
    buzzGain.gain.setValueAtTime(0.3, t);
    buzzGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    buzz.connect(buzzGain);
    buzzGain.connect(this.masterGain);
    buzz.start(t);
    buzz.stop(t + 0.35);
  }

  // JIT Real-Time Build Success (Chime / Quantum Pipeline Lock)
  public playBuildSuccess() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.18, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.38);
    });
  }

  // Memory Leak / Cache Miss Bitcrusher Distortion Pulse
  public playBitcrushWarning() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.setValueAtTime(160, t + 0.08);
    osc.frequency.setValueAtTime(80, t + 0.16);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  // Platform jump / thruster step
  public playStepSound() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.06);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const hardwareAudio = new HardwareAudioEngine();
