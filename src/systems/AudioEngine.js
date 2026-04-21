// ============================================
// AudioEngine.js — Web Audio API sound synthesis
// ============================================
import { PART_TYPES } from '../config/constants.js';
import { getFrequencyForRow } from '../utils/audioUtils.js';
import { loadProgress, saveProgress } from '../utils/storageUtils.js';

export class AudioEngine {
  constructor() {
    if (window.__AUDIO_ENGINE_INSTANCE) {
      return window.__AUDIO_ENGINE_INSTANCE; // Return existing singleton
    }
    
    window.__AUDIO_ENGINE_INSTANCE = this;
    this.ctx = null;
    this.masterGain = null;
    
    const save = loadProgress();
    this.volume = save.settings?.masterVolume ?? 0.7;
    this.isMuted = false; // Always defaults to false on fresh load
    
    // Compressor to glue sounds together and prevent clipping
    this.compressor = null; 

    // BGM Node
    this.bgmOsc = null;
    this.bgmGain = null;
  }

  /**
   * Initialize AudioContext on first user interaction
   */
  resume() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -12;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.01;
      this.compressor.release.value = 0.25;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play a sound for a given part type and grid row
   */
  playSound(partType, row) {
    if (!this.ctx) this.resume();

    switch (partType) {
      case PART_TYPES.HAMMER:
        this._playBell(row);
        break;
      case PART_TYPES.WRENCH:
        this._playDrum(row);
        break;
      case PART_TYPES.SPRING:
        this._playPiston(row);
        break;
      case PART_TYPES.TUNINGFORK:
        this._playChime(row);
        break;
      case PART_TYPES.GEAR:
        this._playGear(row);
        break;
    }
  }

  /** Bell — FM Synthesis (Metallic Clang) */
  _playBell(row) {
    const freq = getFrequencyForRow(row);
    const t = this.ctx.currentTime;
    
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const outGain = this.ctx.createGain();

    // FM Ratio: Modulator is 2x frequency of carrier
    carrier.type = 'sine';
    carrier.frequency.value = freq;
    
    modulator.type = 'sine';
    modulator.frequency.value = freq * 2;
    
    // Modulator envelope (Index drops quickly for a "ping")
    modGain.gain.setValueAtTime(freq * 1.5, t);
    modGain.gain.exponentialRampToValueAtTime(1, t + 0.3);

    // Output envelope
    outGain.gain.setValueAtTime(0.6, t);
    outGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency); // FM Modulation!
    
    carrier.connect(outGain);
    outGain.connect(this.masterGain);
    
    modulator.start(t);
    carrier.start(t);
    modulator.stop(t + 1.2);
    carrier.stop(t + 1.2);
  }

  /** Drum — Full kit mapped per row (hi-hat → kick, top to bottom) */
  _playDrum(row) {
    const t = this.ctx.currentTime;

    // Each row gets a different drum voice
    // Each row gets a different drum voice
    // Row 0: High Snare        — Piccolo snare, tight & bright
    // Row 1: Standard Snare    — crisp crack + rattle
    // Row 2: Mid Tom           — punchy mid
    // Row 3: Floor Tom         — deep thud
    // Row 4: Kick              — sub bass boom
    const drumMap = [
      { startFreq: 380,  endFreq: 180,  decay: 0.12, noiseType: 'highpass', noiseFreq: 1500, noiseVol: 0.55, noiseDur: 0.11, oscVol: 0.5,  waveType: 'triangle' },
      { startFreq: 280,  endFreq: 120,  decay: 0.14, noiseType: 'highpass', noiseFreq: 1200, noiseVol: 0.5,  noiseDur: 0.13, oscVol: 0.6,  waveType: 'triangle' },
      { startFreq: 220,  endFreq: 90,   decay: 0.18, noiseType: 'bandpass', noiseFreq: 800,  noiseVol: 0.15, noiseDur: 0.06, oscVol: 0.7,  waveType: 'triangle' },
      { startFreq: 160,  endFreq: 55,   decay: 0.22, noiseType: 'lowpass',  noiseFreq: 600,  noiseVol: 0.15, noiseDur: 0.05, oscVol: 0.75, waveType: 'triangle' },
      { startFreq: 100,  endFreq: 30,   decay: 0.30, noiseType: 'lowpass',  noiseFreq: 400,  noiseVol: 0.1,  noiseDur: 0.04, oscVol: 0.85, waveType: 'sine'     },
    ];

    // Clamp row to available drum voices
    const voice = drumMap[Math.min(row, drumMap.length - 1)];

    // Body oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = voice.waveType;
    osc.frequency.setValueAtTime(voice.startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(voice.endFreq, t + voice.decay * 0.6);

    oscGain.gain.setValueAtTime(voice.oscVol, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + voice.decay);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + voice.decay + 0.05);

    // Noise layer
    this._playNoiseBurst(voice.noiseDur, voice.noiseVol, voice.noiseType, voice.noiseFreq);
  }

  /** Piston — Saw wave with Filter Sweep (Squelchy Bass) */
  _playPiston(row) {
    const freq = getFrequencyForRow(row) * 0.5; // one octave lower
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth'; // Rich harmonics
    osc.frequency.value = freq;
    
    // Filter sweep
    filter.type = 'lowpass';
    filter.Q.value = 5; // Resonance
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(freq, t + 0.15);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.setTargetAtTime(0, t + 0.1, 0.05); // Smooth release

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.3);
  }

  /** Chime — Inharmonic Tubular Bells */
  _playChime(row) {
    const freq = getFrequencyForRow(row) * 2; // One octave higher, keeps the exact same musical note root!
    const t = this.ctx.currentTime;

    // Inharmonic ratios mimic rigid metal pipes
    const ratios = [1.0, 2.76, 5.4, 8.9];
    
    ratios.forEach((harmonic, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq * harmonic;
      
      gain.gain.setValueAtTime((0.2 / (i + 1)), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 1.5);
    });
  }

  /** Gear — Ratchet / Winding Mechanism (Fast mechanical ticks) */
  _playGear(row) {
    const baseFreq = getFrequencyForRow(row);
    const t = this.ctx.currentTime;

    // Play 4 fast clicks (a ratchet mechanism slipping over gear teeth)
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const tickStart = t + (i * 0.035); // 35ms between each click
      
      osc.type = 'sawtooth'; // Harsh, buzzy waveform — very mechanical
      
      // Fast pitch drop simulates the snap of a ratchet tooth
      osc.frequency.setValueAtTime(baseFreq * 4, tickStart);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, tickStart + 0.015);
      
      // Very fast decay for a tight "click"
      gain.gain.setValueAtTime(0.45, tickStart);
      gain.gain.exponentialRampToValueAtTime(0.001, tickStart + 0.025);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(tickStart);
      osc.stop(tickStart + 0.03);
    }
  }

  /** Filtered noise burst */
  _playNoiseBurst(duration, vol, filterType = 'lowpass', filterFreq = 1000) {
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    
    source.buffer = buffer;
    
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    source.start(t);
  }

  // --- UI SFX ---

  playUIHover() {
    if (!this.ctx) this.resume();
    if (this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.05);
    gain.gain.setValueAtTime(0.125, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playUIClick() {
    if (!this.ctx) this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playError() {
    if (!this.ctx) this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playUISuccess() {
    if (!this.ctx) this.resume();
    const t = this.ctx.currentTime;
    
    // Triumphant ascending arpeggio (C5 → E5 → G5 → C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const noteStart = t + (i * 0.12);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.35, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(noteStart + 0.65);
    });

    // Add a shimmery overtone on the final note for sparkle
    const shimmer = this.ctx.createOscillator();
    const shimGain = this.ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.value = 2093; // C7 — high sparkle
    const shimStart = t + 0.36;
    shimGain.gain.setValueAtTime(0, t);
    shimGain.gain.setValueAtTime(0.15, shimStart);
    shimGain.gain.exponentialRampToValueAtTime(0.001, shimStart + 0.8);
    shimmer.connect(shimGain);
    shimGain.connect(this.masterGain);
    shimmer.start(t);
    shimmer.stop(shimStart + 0.85);
  }

  // --- Ambient BGM ---

  startBGMProcedural() {
    if (!this.ctx) this.resume();
    if (this.bgmOsc) return;

    this.bgmOsc = this.ctx.createOscillator();
    this.bgmGain = this.ctx.createGain();

    this.bgmOsc.type = 'sine';
    this.bgmOsc.frequency.value = 55; // Low A drone

    // Very slow LFO for pulsing
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);

    this.bgmGain.gain.value = 0.05; // Base volume
    lfoGain.connect(this.bgmGain.gain);

    this.bgmOsc.connect(this.bgmGain);
    this.bgmGain.connect(this.masterGain);

    this.bgmOsc.start();
    lfo.start();
  }

  stopBGMProcedural() {
    if (this.bgmOsc) {
      this.bgmOsc.stop();
      this.bgmOsc.disconnect();
      this.bgmOsc = null;
    }
  }

  playWorldBGM(scene, worldId, targetVolume = 0.8) {
    if (this.currentWorldId === worldId && this.bgmAudio) {
      // Just change volume smoothly if already playing
      this.setBGMVolume(targetVolume);
      return;
    }

    this.stopBGM();

    const dataKey = worldId === 'menu' ? 'bgm_menu_raw' : `bgm_world${worldId}_raw`;
    
    if (scene.cache.binary.exists(dataKey)) {
      const buffer = scene.cache.binary.get(dataKey);
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      this.bgmAudio = new Audio(url);
      this.bgmAudio.loop = true;
      this.currentNominalVolume = targetVolume;
      this.bgmAudio.volume = (worldId === 'menu') ? targetVolume : (this.isMuted ? 0 : targetVolume);
      this.bgmAudio.play().catch(e => {
        console.warn("BGM Autoplay blocked, waiting for interaction...");
        const unlock = () => {
          if (this.bgmAudio) this.bgmAudio.play().catch(()=>{});
          document.removeEventListener('pointerdown', unlock);
          document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('pointerdown', unlock);
        document.addEventListener('keydown', unlock);
      });
      
      this.currentWorldId = worldId;
      this.currentBgmUrl = url;
    } else {
      // Fallback
      this.startBGMProcedural();
    }
  }

  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.src = "";
      this.bgmAudio = null;
    }
    if (this.currentBgmUrl) {
      URL.revokeObjectURL(this.currentBgmUrl);
      this.currentBgmUrl = null;
    }
    this.currentWorldId = null;
    this.stopBGMProcedural();
  }

  setBGMVolume(targetVolume) {
    this.currentNominalVolume = targetVolume;
    if (this.bgmAudio) {
      this.bgmAudio.volume = (this.currentWorldId === 'menu') ? targetVolume : (this.isMuted ? 0 : targetVolume);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;

    // Apply instantly
    if (this.bgmAudio) {
      const vol = this.currentNominalVolume || 0.8;
      this.bgmAudio.volume = (this.currentWorldId === 'menu') ? vol : (this.isMuted ? 0 : vol);
    }
    
    // UI Feedback sound
    if (!this.isMuted) {
      this.playUIClick();
    }
    
    return this.isMuted;
  }

  setVolume(value) {
    this.volume = value;
    if (this.masterGain) {
      this.masterGain.gain.value = value;
    }
  }

  stopAll() {
    this.stopBGM();
  }
}
