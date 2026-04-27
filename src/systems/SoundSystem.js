/**
 * SoundSystem — Web Audio API procedural sound effects.
 * No asset files needed: all sounds are synthesised from oscillators and noise.
 * Volume is controlled by the master and SFX gain nodes which are kept in sync
 * with Settings on every play() call.
 */
export class SoundSystem {
    constructor(engine) {
        this.engine  = engine;
        this._ctx    = null;   // AudioContext, created on first interaction
        this._master = null;   // GainNode
        this._sfx    = null;   // GainNode
    }

    // ── Public ──────────────────────────────────────────────────────────────

    play(name) {
        const ctx = this._getCtx();
        if (!ctx) return;
        this._syncVolume();

        switch (name) {
            case 'step':       return this._playStep(ctx);
            case 'dig':        return this._playDig(ctx);
            case 'break':      return this._playBreak(ctx);
            case 'place':      return this._playPlace(ctx);
            case 'jump':       return this._playJump(ctx);
            case 'hurt':       return this._playHurt(ctx);
            case 'ui_click':   return this._playClick(ctx);
            case 'pickup':     return this._playPickup(ctx);
            case 'splash':     return this._playSplash(ctx);
            case 'strip':      return this._playStrip(ctx);
            case 'hoe':        return this._playHoe(ctx);
            case 'break_tool': return this._playBreakTool(ctx);
        }
    }

    update(_dt) {}

    dispose() {
        this._ctx?.close();
        this._ctx = null;
    }

    // ── Internal ────────────────────────────────────────────────────────────

    _getCtx() {
        if (this._ctx) return this._ctx;
        try {
            this._ctx    = new (window.AudioContext ?? window.webkitAudioContext)();
            this._master = this._ctx.createGain();
            this._sfx    = this._ctx.createGain();
            this._sfx.connect(this._master);
            this._master.connect(this._ctx.destination);
            this._syncVolume();
        } catch { return null; }
        return this._ctx;
    }

    _syncVolume() {
        if (!this._master) return;
        const settings = this.engine.settings;
        const master   = settings?.get('masterVolume') ?? 1;
        const sfx      = settings?.get('sfxVolume')    ?? 0.8;
        this._master.gain.value = master;
        this._sfx.gain.value    = sfx;
    }

    // Connect an audio node to the SFX chain and auto-stop it
    _connect(node) {
        node.connect(this._sfx);
        return node;
    }

    // White-noise burst (block-break / footsteps base)
    _noise(ctx, duration, gain = 0.3) {
        const bufSize = ctx.sampleRate * duration;
        const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data    = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(gain, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        src.connect(g);
        this._connect(g);
        src.start();
        src.stop(ctx.currentTime + duration);
    }

    // Simple oscillator helper
    _osc(ctx, type, freq, duration, gain = 0.25, freqEnd = null) {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
        g.gain.setValueAtTime(gain, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(g);
        this._connect(g);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    _playStep(ctx) {
        this._noise(ctx, 0.06, 0.08);
        this._osc(ctx, 'sine', 120, 0.06, 0.04, 80);
    }

    _playDig(ctx) {
        this._noise(ctx, 0.12, 0.12);
        this._osc(ctx, 'sawtooth', 200, 0.1, 0.06, 80);
    }

    _playBreak(ctx) {
        this._noise(ctx, 0.22, 0.25);
        this._osc(ctx, 'sine', 300, 0.2, 0.1, 60);
    }

    _playPlace(ctx) {
        this._osc(ctx, 'sine', 180, 0.08, 0.12, 220);
        this._noise(ctx, 0.05, 0.07);
    }

    _playJump(ctx) {
        this._osc(ctx, 'sine', 220, 0.12, 0.1, 380);
    }

    _playHurt(ctx) {
        this._osc(ctx, 'square', 180, 0.18, 0.15, 100);
        this._noise(ctx, 0.18, 0.1);
    }

    _playClick(ctx) {
        this._osc(ctx, 'sine', 800, 0.05, 0.06, 600);
    }

    _playPickup(ctx) {
        this._osc(ctx, 'sine', 880, 0.06, 0.07, 1100);
        this._osc(ctx, 'sine', 1200, 0.03, 0.04, 1500);
    }

    _playSplash(ctx) {
        this._noise(ctx, 0.28, 0.22);
        this._osc(ctx, 'sine', 90, 0.28, 0.1, 45);
        this._osc(ctx, 'sine', 160, 0.18, 0.12, 60);
    }

    _playStrip(ctx) {
        this._noise(ctx, 0.14, 0.18);
        this._osc(ctx, 'triangle', 180, 0.12, 0.1, 60);
    }

    _playHoe(ctx) {
        this._noise(ctx, 0.09, 0.09);
        this._osc(ctx, 'sawtooth', 140, 0.07, 0.05, 90);
    }

    _playBreakTool(ctx) {
        this._noise(ctx, 0.12, 0.18);
        this._osc(ctx, 'square', 450, 0.14, 0.1, 50);
        this._osc(ctx, 'sine', 700, 0.08, 0.06, 80);
    }
}
