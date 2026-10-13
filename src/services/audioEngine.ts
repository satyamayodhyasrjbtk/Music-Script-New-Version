import { Track, AudioQuality } from '../types/music';

export interface EqBandConfig {
  label: string;
  sublabel: string;
  freq: number;
  type: BiquadFilterType;
}

export const EQ_BANDS: EqBandConfig[] = [
  { label: '60 Hz', sublabel: 'Sub Bass', freq: 60, type: 'lowshelf' },
  { label: '250 Hz', sublabel: 'Bass', freq: 250, type: 'peaking' },
  { label: '1 kHz', sublabel: 'Midrange', freq: 1000, type: 'peaking' },
  { label: '4 kHz', sublabel: 'Presence', freq: 4000, type: 'peaking' },
  { label: '12 kHz', sublabel: 'Treble', freq: 12000, type: 'highshelf' },
];

class AudioEngineService {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private eqGains: number[] = [0, 0, 0, 0, 0];
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private bassBoostEnabled: boolean = false;
  private currentTrack: Track | null = null;
  private currentQuality: AudioQuality = '320kbps';
  private timerInterval: any = null;
  private playbackTime: number = 0;
  private onTimeUpdateCallback: ((time: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private stepIndex: number = 0;
  private schedulerInterval: any = null;
  private audioEl: HTMLAudioElement | null = null;
  private audioElSource: MediaElementAudioSourceNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.setValueAtTime(100, this.ctx.currentTime);
      this.bassFilter.gain.setValueAtTime(this.bassBoostEnabled ? 9 : 0, this.ctx.currentTime);

      // Create 5-band Equalizer Filters Chain
      this.eqFilters = EQ_BANDS.map((band, idx) => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type = band.type;
        filter.frequency.setValueAtTime(band.freq, this.ctx!.currentTime);
        if (band.type === 'peaking') {
          filter.Q.setValueAtTime(1.2, this.ctx!.currentTime);
        }
        filter.gain.setValueAtTime(this.eqGains[idx] || 0, this.ctx!.currentTime);
        return filter;
      });

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.8, this.ctx.currentTime);

      // Routing: BassFilter -> EQ0 -> EQ1 -> EQ2 -> EQ3 -> EQ4 -> Analyser -> MasterGain -> Destination
      this.bassFilter.connect(this.eqFilters[0]);
      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].connect(this.eqFilters[i + 1]);
      }
      this.eqFilters[this.eqFilters.length - 1].connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEqualizerBand(index: number, gainDb: number) {
    if (index >= 0 && index < 5) {
      this.eqGains[index] = gainDb;
      if (this.eqFilters[index] && this.ctx) {
        this.eqFilters[index].gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.05);
      }
    }
  }

  public setAllEqualizerBands(gains: number[]) {
    gains.forEach((gain, idx) => {
      this.setEqualizerBand(idx, gain);
    });
  }

  public getEqualizerGains(): number[] {
    return [...this.eqGains];
  }

  public setVolume(val: number) { // 0.0 to 1.0
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
    if (this.audioEl) {
      this.audioEl.volume = Math.max(0, Math.min(1, val));
    }
  }

  public toggleBassBoost(enabled: boolean) {
    this.bassBoostEnabled = enabled;
    if (this.bassFilter && this.ctx) {
      this.bassFilter.gain.setTargetAtTime(enabled ? 10 : 0, this.ctx.currentTime, 0.05);
    }
  }

  public isBassBoostOn() {
    return this.bassBoostEnabled;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setQuality(quality: AudioQuality) {
    this.currentQuality = quality;
  }

  public getQuality(): AudioQuality {
    return this.currentQuality;
  }

  public playTrack(track: Track, startTime: number = 0, onTimeUpdate?: (t: number) => void, onEnded?: () => void) {
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }

    this.currentTrack = track;
    this.playbackTime = startTime;
    this.isPlaying = true;
    this.onTimeUpdateCallback = onTimeUpdate || null;
    this.onEndedCallback = onEnded || null;

    // If an HTMLAudioElement was previously playing, pause it
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl = null;
    }

    this.stopScheduler();
    clearInterval(this.timerInterval);

    // If track has real audioUrl, stream real MP3
    if (track.audioUrl) {
      try {
        const audio = new Audio(track.audioUrl);
        audio.currentTime = startTime;
        audio.volume = this.gainNode ? this.gainNode.gain.value : 0.8;

        audio.ontimeupdate = () => {
          if (this.isPlaying) {
            this.playbackTime = Math.floor(audio.currentTime);
            if (this.onTimeUpdateCallback) {
              this.onTimeUpdateCallback(this.playbackTime);
            }
          }
        };

        audio.onended = () => {
          this.stop();
          if (this.onEndedCallback) {
            this.onEndedCallback();
          }
        };

        audio.onerror = (e) => {
          console.warn('Real audio file failed to play, falling back to synthesizer:', e);
          this.startScheduler();
        };

        audio.play().catch((err) => {
          console.warn('Audio play error, falling back to synth:', err);
          this.startScheduler();
        });

        this.audioEl = audio;
        return;
      } catch (err) {
        console.warn('Error initiating audio element, falling back to synth:', err);
      }
    }

    // Synthesizer playback fallback
    this.startScheduler();

    this.timerInterval = setInterval(() => {
      if (this.isPlaying && this.currentTrack) {
        this.playbackTime += 1;
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.playbackTime);
        }
        if (this.playbackTime >= this.currentTrack.duration) {
          this.stop();
          if (this.onEndedCallback) {
            this.onEndedCallback();
          }
        }
      }
    }, 1000);
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.stopScheduler();
    clearInterval(this.timerInterval);
  }

  public resume() {
    if (this.currentTrack) {
      this.init();
      this.isPlaying = true;

      if (this.audioEl) {
        this.audioEl.play().catch(console.warn);
        return;
      }

      this.startScheduler();
      clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.isPlaying && this.currentTrack) {
          this.playbackTime += 1;
          if (this.onTimeUpdateCallback) {
            this.onTimeUpdateCallback(this.playbackTime);
          }
          if (this.playbackTime >= this.currentTrack.duration) {
            this.stop();
            if (this.onEndedCallback) {
              this.onEndedCallback();
            }
          }
        }
      }, 1000);
    }
  }

  public seek(seconds: number) {
    this.playbackTime = Math.max(0, Math.min(seconds, this.currentTrack?.duration || 100));
    if (this.audioEl) {
      this.audioEl.currentTime = this.playbackTime;
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.playbackTime);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    this.stopScheduler();
    clearInterval(this.timerInterval);
    this.playbackTime = 0;
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  public getCurrentTime() {
    return this.playbackTime;
  }

  // DJ Synthesis Pattern Scheduler
  private startScheduler() {
    if (!this.ctx || !this.bassFilter) return;

    const bpm = this.currentTrack?.bpm || 128;
    const intervalMs = (60 / bpm) * 250; // 16th notes
    this.stepIndex = 0;

    this.schedulerInterval = setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.bassFilter) return;
      this.playStep(this.stepIndex % 16);
      this.stepIndex = (this.stepIndex + 1) % 64;
    }, intervalMs);
  }

  private stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  // Trigger synthesized audio notes per 16th step
  private playStep(step: number) {
    if (!this.ctx || !this.bassFilter) return;
    const now = this.ctx.currentTime;
    const preset = this.currentTrack?.audioPreset || 'bhojpuri_beat';

    // 1. Kick Drum (Steps 0, 4, 8, 12 - 4-on-the-floor DJ club beat)
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.14);

      env.gain.setValueAtTime(1.0, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(env);
      env.connect(this.bassFilter);

      osc.start(now);
      osc.stop(now + 0.24);
    }

    // 2. Snare / Dholak Slap (Steps 4, 12)
    if (step === 4 || step === 12) {
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = preset === 'punjabi_dhol' ? 800 : 1800;

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.6, now);
      env.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      whiteNoise.connect(filter);
      filter.connect(env);
      env.connect(this.bassFilter);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.13);
    }

    // 3. Hi-Hats / Shaker (Offbeat: 2, 6, 10, 14)
    if (step % 2 === 0 && step % 4 !== 0) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(7000, now);

      env.gain.setValueAtTime(0.18, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(env);
      env.connect(this.bassFilter);
      osc.start(now);
      osc.stop(now + 0.06);
    }

    // 4. Bassline Synthesizer (Steps 2, 6, 10, 14 - Offbeat bouncy bass)
    if (step % 4 === 2 || (step % 8 === 6 && preset === 'haryanvi_bass')) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      const baseFreq = preset === 'bhakti_special' ? 65.41 : 55.0; // C2 or A1

      const notes = [baseFreq, baseFreq * 1.2, baseFreq * 1.5, baseFreq * 1.33];
      const noteFreq = notes[Math.floor(this.stepIndex / 8) % notes.length];

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(noteFreq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.18);

      env.gain.setValueAtTime(0.7, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.bassFilter);

      osc.start(now);
      osc.stop(now + 0.22);
    }

    // 5. Melodic Lead Arpeggio (Indian Flute / Synth Lead riff)
    if (step % 4 === 0 || step % 4 === 3) {
      const leadOsc = this.ctx.createOscillator();
      const leadEnv = this.ctx.createGain();

      const scale = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440];
      const melodyIndex = (step * 2 + Math.floor(this.stepIndex / 4)) % scale.length;
      leadOsc.type = 'sine';
      leadOsc.frequency.setValueAtTime(scale[melodyIndex], now);

      leadEnv.gain.setValueAtTime(0.18, now);
      leadEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      leadOsc.connect(leadEnv);
      leadEnv.connect(this.bassFilter);

      leadOsc.start(now);
      leadOsc.stop(now + 0.16);
    }
  }

  // Generates real downloadable WAV/MP3 audio blob with DJ soundbite
  public async generateAudioBlob(track: Track, quality: AudioQuality): Promise<Blob> {
    if (track.audioUrl) {
      try {
        const downloadUrl = track.audioUrl.includes('?')
          ? `${track.audioUrl}&download=1`
          : `${track.audioUrl}?download=1`;
        const res = await fetch(downloadUrl);
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 1000) {
            return blob;
          }
        }
      } catch (err) {
        console.warn('Direct audioUrl fetch fallback to synth generation:', err);
      }
    }

    const sampleRate = quality === '128kbps' ? 22050 : 44100;
    const durationSeconds = quality === 'ringtone' ? 30 : 60; // 60s sample or 30s ringtone
    const numChannels = 2;
    const totalSamples = sampleRate * durationSeconds;

    const offlineCtx = new OfflineAudioContext(numChannels, totalSamples, sampleRate);

    // Build synthesized groove track
    const bpm = track.bpm || 128;
    const beatDuration = 60 / bpm;

    for (let time = 0; time < durationSeconds; time += beatDuration) {
      // 4-on-floor kick
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(150, time);
      kickOsc.frequency.exponentialRampToValueAtTime(35, time + 0.15);
      kickGain.gain.setValueAtTime(0.9, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      kickOsc.connect(kickGain);
      kickGain.connect(offlineCtx.destination);
      kickOsc.start(time);
      kickOsc.stop(time + 0.22);

      // Bass note
      const bassOsc = offlineCtx.createOscillator();
      const bassGain = offlineCtx.createGain();
      bassOsc.type = 'sawtooth';
      const bassFreq = 55 * (1 + (Math.floor(time / 2) % 4) * 0.25);
      bassOsc.frequency.setValueAtTime(bassFreq, time + beatDuration * 0.5);
      bassGain.gain.setValueAtTime(0.5, time + beatDuration * 0.5);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + beatDuration * 0.95);
      bassOsc.connect(bassGain);
      bassGain.connect(offlineCtx.destination);
      bassOsc.start(time + beatDuration * 0.5);
      bassOsc.stop(time + beatDuration);

      // Melodic tone
      const leadOsc = offlineCtx.createOscillator();
      const leadGain = offlineCtx.createGain();
      leadOsc.type = 'sine';
      leadOsc.frequency.setValueAtTime(330 + (Math.floor(time * 3) % 5) * 60, time);
      leadGain.gain.setValueAtTime(0.2, time);
      leadGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      leadOsc.connect(leadGain);
      leadGain.connect(offlineCtx.destination);
      leadOsc.start(time);
      leadOsc.stop(time + 0.35);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return this.bufferToWave(renderedBuffer, renderedBuffer.length);
  }

  // Convert AudioBuffer to downloadable RIFF WAVE Blob
  private bufferToWave(abuffer: AudioBuffer, len: number): Blob {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const outBuffer = new ArrayBuffer(length);
    const view = new DataView(outBuffer);
    const channels: Float32Array[] = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF identifier
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // 16 for PCM format
    setUint16(1); // format 1 (PCM)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4); // chunk length

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (offset < len) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([outBuffer], { type: 'audio/wav' });
  }
}

export const audioEngine = new AudioEngineService();
