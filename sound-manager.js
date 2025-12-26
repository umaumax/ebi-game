/**
 * 音声管理クラス (Web Audio API)
 */
export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)
            ();
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.bgmTempo = 250;
        this.bgmPitchRate = 1.0;
        this.bgmVolume = 0.3;
        this.seVolume = 0.5;
    }

    init() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, vol = 0.1, isBGM = false) {
        const masterVol = isBGM ? this.bgmVolume : this.seVolume;
        const finalVol = vol * masterVol;
        if (finalVol <= 0.001) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(finalVol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime +
            duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playJump() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime +
            0.1);
        gain.gain.setValueAtTime(0.1 * this.seVolume, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime +
            0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playHit() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime +
            0.3);
        gain.gain.setValueAtTime(0.2 * this.seVolume, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime +
            0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playItem() {
        this.playTone(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1800, 'sine', 0.2, 0.1),
            50);
    }

    playBubble() {
        this.playTone(800 + Math.random() * 200, 'sine', 0.05,
            0.02);
    }

    playNoise(vol = 0.1) {
        if (this.ctx.state !== 'running') return;
        // 簡易的なノイズ生成（激流音）
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx
            .sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // ローパスフィルタをかけて水流のような低い音にする
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // こもらせる

        const gain = this.ctx.createGain();
        gain.gain.value = vol * this.seVolume;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    setBGMParams(score, inRapidCurrentZone) {
        // スコア(深度)に応じてテンポを遅く、ピッチを低くする
        // 0m: 250ms, 1.0
        // 2000m: 400ms, 0.6
        const ratio = Math.min(score / 2000, 1.0);
        this.bgmTempo = 250 + ratio * 150;
        this.bgmPitchRate = 1.0 - ratio * 0.4;

        if (inRapidCurrentZone) {
            this.bgmTempo *= 0.5; // テンポアップ（さらに速く）
            this.bgmPitchRate += 0.5; // ピッチアップ（さらに高く）
        }
    }

    startBGM() {
        if (this.bgmTimer) return;
        this.playBGMStep();
    }

    playBGMStep() {
        const notes = [196, 0, 261, 0, 220, 0, 196, 0]; // G3, C4, A3, G3

        if (this.ctx.state !== 'suspended') {
            const baseFreq = notes[this.bgmStep % notes.length];
            if (baseFreq > 0) {
                this.playTone(baseFreq * this.bgmPitchRate,
                    'triangle', 0.2, 0.1, true);
            }
        }
        this.bgmStep++;
        this.bgmTimer = setTimeout(() => this.playBGMStep(), this
            .bgmTempo);
    }

    stopBGM() {
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}
