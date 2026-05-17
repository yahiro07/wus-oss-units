class AdditiveEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.analyser = null;
        this.reverbGain = null;
        this.dryGain = null;
        this.compressor = null;
        this.convolver = null;
        this.NUM_PARTIALS = 32;
        this.activeVoices = {};
        this.adsr = { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.5 };
        this.harmonicAmplitudes = new Float32Array(this.NUM_PARTIALS);
        this.harmonicAmplitudes[0] = 1.0;
        this.reverbMix = 0.3;
        this.volume = 0.5;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') await this.ctx.resume();

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -12;
        this.compressor.knee.value = 10;
        this.compressor.ratio.value = 6;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.15;
        this.compressor.connect(this.ctx.destination);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;

        // Dry path
        this.dryGain = this.ctx.createGain();
        this.dryGain.gain.value = 1 - this.reverbMix;

        // Reverb path
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.value = this.reverbMix;

        this.convolver = this.ctx.createConvolver();
        this.convolver.buffer = this._generateIR(2.5, 4);

        this.masterGain.connect(this.dryGain);
        this.masterGain.connect(this.convolver);
        this.convolver.connect(this.reverbGain);

        this.dryGain.connect(this.analyser);
        this.reverbGain.connect(this.analyser);
        this.analyser.connect(this.compressor);

        this.isInitialized = true;
    }

    _generateIR(duration, decay) {
        const length = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return buffer;
    }

    noteOn(freq, noteId) {
        if (!this.isInitialized) return;
        if (this.activeVoices[noteId]) this.noteOff(noteId);

        const now = this.ctx.currentTime;
        const voice = {
            oscillators: [],
            gains: [],
            envelope: this.ctx.createGain(),
            noteId: noteId
        };

        voice.envelope.gain.setValueAtTime(0, now);
        voice.envelope.gain.linearRampToValueAtTime(1, now + this.adsr.attack);
        voice.envelope.gain.linearRampToValueAtTime(
            this.adsr.sustain,
            now + this.adsr.attack + this.adsr.decay
        );
        voice.envelope.connect(this.masterGain);

        for (let i = 0; i < this.NUM_PARTIALS; i++) {
            const amp = this.harmonicAmplitudes[i];
            if (amp < 0.001) continue;

            const partialFreq = freq * (i + 1);
            if (partialFreq > 20000) break;

            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = partialFreq;

            const gain = this.ctx.createGain();
            gain.gain.value = amp * (1 / Math.sqrt(i + 1)) * 0.3;

            osc.connect(gain);
            gain.connect(voice.envelope);
            osc.start(now);

            voice.oscillators.push(osc);
            voice.gains.push(gain);
        }

        this.activeVoices[noteId] = voice;
    }

    noteOff(noteId) {
        const voice = this.activeVoices[noteId];
        if (!voice) return;

        const now = this.ctx.currentTime;
        voice.envelope.gain.cancelScheduledValues(now);
        voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, now);
        voice.envelope.gain.linearRampToValueAtTime(0, now + this.adsr.release);

        const stopTime = now + this.adsr.release + 0.05;
        voice.oscillators.forEach(osc => osc.stop(stopTime));

        setTimeout(() => {
            voice.oscillators.forEach(osc => { try { osc.disconnect(); } catch(e) {} });
            voice.gains.forEach(g => { try { g.disconnect(); } catch(e) {} });
            try { voice.envelope.disconnect(); } catch(e) {}
        }, (this.adsr.release + 0.1) * 1000);

        delete this.activeVoices[noteId];
    }

    setHarmonics(amplitudes) {
        for (let i = 0; i < this.NUM_PARTIALS; i++) {
            this.harmonicAmplitudes[i] = amplitudes[i] || 0;
        }
    }

    setADSR(a, d, s, r) {
        this.adsr = { attack: a, decay: d, sustain: s, release: r };
    }

    setReverb(mix) {
        this.reverbMix = mix;
        if (this.dryGain) this.dryGain.gain.value = 1 - mix;
        if (this.reverbGain) this.reverbGain.gain.value = mix;
    }

    setVolume(v) {
        this.volume = v;
        if (this.masterGain) this.masterGain.gain.value = v;
    }

    allNotesOff() {
        Object.keys(this.activeVoices).forEach(id => this.noteOff(id));
    }
}

// Presets
const PRESETS = {
    // === Classic Waveforms ===
    'Sawtooth': {
        category: 'Classic Waveforms',
        harmonics: Array.from({length: 32}, (_, i) => 1 / (i + 1)),
        adsr: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 }
    },
    'Square Wave': {
        category: 'Classic Waveforms',
        harmonics: Array.from({length: 32}, (_, i) => (i % 2 === 0) ? 1 / (i + 1) : 0),
        adsr: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 }
    },
    'Triangle': {
        category: 'Classic Waveforms',
        harmonics: Array.from({length: 32}, (_, i) => (i % 2 === 0) ? (1 / ((i + 1) * (i + 1))) * ((i/2 % 2 === 0) ? 1 : -1 > 0 ? 1 : 0.5) : 0),
        adsr: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 }
    },
    'Pulse 25%': {
        category: 'Classic Waveforms',
        harmonics: Array.from({length: 32}, (_, i) => Math.abs(Math.sin(Math.PI * (i + 1) * 0.25)) / (i + 1)),
        adsr: { attack: 0.01, decay: 0.15, sustain: 0.7, release: 0.3 }
    },
    'Pulse 10%': {
        category: 'Classic Waveforms',
        harmonics: Array.from({length: 32}, (_, i) => Math.abs(Math.sin(Math.PI * (i + 1) * 0.1)) / (i + 1)),
        adsr: { attack: 0.01, decay: 0.15, sustain: 0.7, release: 0.3 }
    },

    // === Organs ===
    'Hammond 888': {
        category: 'Organs',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=1; h[2]=1; h[3]=1; h[4]=1; h[5]=1; h[6]=1; h[7]=1; return h; })(),
        adsr: { attack: 0.005, decay: 0.01, sustain: 1.0, release: 0.08 }
    },
    'Hammond 888000000': {
        category: 'Organs',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=1; h[2]=1; return h; })(),
        adsr: { attack: 0.005, decay: 0.01, sustain: 1.0, release: 0.08 }
    },
    'Cathedral Organ': {
        category: 'Organs',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.6; h[2]=0.8; h[3]=0.3; h[4]=0.5; h[5]=0.2; h[6]=0.3; h[7]=0.15; h[8]=0.2; h[9]=0.1; h[10]=0.15; h[11]=0.08; h[15]=0.1; return h; })(),
        adsr: { attack: 0.08, decay: 0.1, sustain: 0.95, release: 0.4 }
    },
    'Jazz Organ': {
        category: 'Organs',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.8; h[2]=0.9; h[3]=0.5; h[4]=0.3; h[5]=0.2; h[7]=0.15; return h; })(),
        adsr: { attack: 0.005, decay: 0.01, sustain: 0.95, release: 0.1 }
    },
    'Gospel Organ': {
        category: 'Organs',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=1; h[2]=1; h[3]=0.8; h[4]=0.9; h[5]=0.7; h[6]=0.6; h[7]=0.8; h[8]=0.4; h[9]=0.3; return h; })(),
        adsr: { attack: 0.005, decay: 0.01, sustain: 1.0, release: 0.1 }
    },
    'Flute Stop': {
        category: 'Organs',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.05; h[2]=0.03; return h; })(),
        adsr: { attack: 0.04, decay: 0.05, sustain: 0.9, release: 0.15 }
    },

    // === Bells & Percussion ===
    'Church Bell': {
        category: 'Bells & Percussion',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.6; h[2]=0.3; h[3]=0.5; h[4]=0.15; h[5]=0.35; h[6]=0.1; h[8]=0.2; h[10]=0.15; h[13]=0.12; h[16]=0.08; h[20]=0.06; return h; })(),
        adsr: { attack: 0.001, decay: 1.5, sustain: 0.0, release: 2.0 }
    },
    'Tubular Bell': {
        category: 'Bells & Percussion',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.4; h[2]=0.6; h[3]=0.2; h[5]=0.3; h[7]=0.15; h[9]=0.1; h[12]=0.08; h[15]=0.05; return h; })(),
        adsr: { attack: 0.001, decay: 2.0, sustain: 0.0, release: 2.5 }
    },
    'Glockenspiel': {
        category: 'Bells & Percussion',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[2]=0.4; h[4]=0.15; h[8]=0.08; h[12]=0.04; return h; })(),
        adsr: { attack: 0.001, decay: 0.8, sustain: 0.0, release: 1.0 }
    },
    'Gamelan': {
        category: 'Bells & Percussion',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.3; h[2]=0.7; h[4]=0.5; h[6]=0.35; h[9]=0.2; h[13]=0.15; h[17]=0.1; h[22]=0.08; return h; })(),
        adsr: { attack: 0.001, decay: 1.8, sustain: 0.0, release: 2.0 }
    },
    'Chime': {
        category: 'Bells & Percussion',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.2; h[2]=0.5; h[3]=0.1; h[5]=0.3; h[8]=0.15; h[11]=0.1; h[15]=0.05; return h; })(),
        adsr: { attack: 0.001, decay: 1.2, sustain: 0.0, release: 1.5 }
    },
    'Vibraphone': {
        category: 'Bells & Percussion',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[3]=0.4; h[7]=0.15; h[11]=0.08; return h; })(),
        adsr: { attack: 0.001, decay: 1.0, sustain: 0.1, release: 1.2 }
    },

    // === Strings ===
    'Violin': {
        category: 'Strings',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.8; h[2]=0.6; h[3]=0.45; h[4]=0.3; h[5]=0.2; h[6]=0.15; h[7]=0.12; h[8]=0.08; h[9]=0.06; h[10]=0.04; h[11]=0.03; return h; })(),
        adsr: { attack: 0.1, decay: 0.15, sustain: 0.85, release: 0.25 }
    },
    'Cello': {
        category: 'Strings',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.9; h[2]=0.7; h[3]=0.5; h[4]=0.4; h[5]=0.3; h[6]=0.25; h[7]=0.2; h[8]=0.15; h[9]=0.1; h[10]=0.08; h[11]=0.06; h[12]=0.05; h[13]=0.04; return h; })(),
        adsr: { attack: 0.15, decay: 0.2, sustain: 0.8, release: 0.35 }
    },
    'String Ensemble': {
        category: 'Strings',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.7; h[2]=0.5; h[3]=0.35; h[4]=0.25; h[5]=0.18; h[6]=0.12; h[7]=0.08; h[8]=0.06; return h; })(),
        adsr: { attack: 0.3, decay: 0.2, sustain: 0.85, release: 0.5 }
    },
    'Plucked String': {
        category: 'Strings',
        harmonics: Array.from({length: 32}, (_, i) => 1 / ((i + 1) * (i + 1))),
        adsr: { attack: 0.001, decay: 0.6, sustain: 0.0, release: 0.5 }
    },

    // === Brass ===
    'Trumpet': {
        category: 'Brass',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=0.7; h[1]=1; h[2]=0.9; h[3]=0.75; h[4]=0.6; h[5]=0.45; h[6]=0.35; h[7]=0.25; h[8]=0.15; h[9]=0.1; return h; })(),
        adsr: { attack: 0.04, decay: 0.1, sustain: 0.85, release: 0.15 }
    },
    'French Horn': {
        category: 'Brass',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.85; h[2]=0.7; h[3]=0.55; h[4]=0.4; h[5]=0.3; h[6]=0.2; h[7]=0.12; h[8]=0.08; return h; })(),
        adsr: { attack: 0.06, decay: 0.15, sustain: 0.8, release: 0.2 }
    },
    'Trombone': {
        category: 'Brass',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.9; h[2]=0.8; h[3]=0.65; h[4]=0.5; h[5]=0.4; h[6]=0.3; h[7]=0.2; h[8]=0.12; h[9]=0.08; h[10]=0.05; return h; })(),
        adsr: { attack: 0.05, decay: 0.1, sustain: 0.85, release: 0.2 }
    },
    'Muted Trumpet': {
        category: 'Brass',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=0.5; h[1]=1; h[2]=0.8; h[3]=0.4; h[4]=0.6; h[5]=0.3; h[6]=0.5; h[7]=0.2; h[8]=0.3; h[9]=0.15; return h; })(),
        adsr: { attack: 0.03, decay: 0.1, sustain: 0.8, release: 0.12 }
    },

    // === Woodwinds ===
    'Clarinet': {
        category: 'Woodwinds',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[2]=0.75; h[4]=0.5; h[6]=0.25; h[8]=0.15; h[10]=0.08; h[12]=0.04; return h; })(),
        adsr: { attack: 0.06, decay: 0.1, sustain: 0.85, release: 0.15 }
    },
    'Oboe': {
        category: 'Woodwinds',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=0.6; h[1]=1; h[2]=0.8; h[3]=0.7; h[4]=0.55; h[5]=0.4; h[6]=0.3; h[7]=0.2; h[8]=0.12; h[9]=0.08; return h; })(),
        adsr: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.15 }
    },
    'Flute': {
        category: 'Woodwinds',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.25; h[2]=0.1; h[3]=0.05; return h; })(),
        adsr: { attack: 0.08, decay: 0.1, sustain: 0.75, release: 0.2 }
    },
    'Bassoon': {
        category: 'Woodwinds',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.9; h[2]=0.85; h[3]=0.7; h[4]=0.55; h[5]=0.4; h[6]=0.35; h[7]=0.25; h[8]=0.2; h[9]=0.15; h[10]=0.1; return h; })(),
        adsr: { attack: 0.06, decay: 0.12, sustain: 0.82, release: 0.18 }
    },
    'Pan Flute': {
        category: 'Woodwinds',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.15; h[2]=0.08; h[4]=0.03; return h; })(),
        adsr: { attack: 0.1, decay: 0.15, sustain: 0.7, release: 0.25 }
    },

    // === Vocal / Formant ===
    'Choir Ah': {
        category: 'Vocal',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.6; h[2]=0.3; h[3]=0.2; h[4]=0.25; h[5]=0.15; h[6]=0.1; h[7]=0.08; h[8]=0.12; h[9]=0.06; return h; })(),
        adsr: { attack: 0.2, decay: 0.2, sustain: 0.8, release: 0.4 }
    },
    'Choir Oh': {
        category: 'Vocal',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.7; h[2]=0.15; h[3]=0.1; h[4]=0.08; h[5]=0.05; h[7]=0.08; h[8]=0.04; return h; })(),
        adsr: { attack: 0.25, decay: 0.2, sustain: 0.8, release: 0.4 }
    },
    'Choir Ee': {
        category: 'Vocal',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.3; h[2]=0.6; h[3]=0.2; h[4]=0.35; h[5]=0.1; h[6]=0.15; h[7]=0.08; h[8]=0.12; h[9]=0.05; return h; })(),
        adsr: { attack: 0.2, decay: 0.2, sustain: 0.8, release: 0.4 }
    },

    // === Pads & Textures ===
    'Warm Pad': {
        category: 'Pads & Textures',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.5; h[2]=0.3; h[3]=0.2; h[4]=0.12; h[5]=0.08; h[6]=0.05; h[7]=0.03; return h; })(),
        adsr: { attack: 0.5, decay: 0.3, sustain: 0.9, release: 1.0 }
    },
    'Glass Pad': {
        category: 'Pads & Textures',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[2]=0.4; h[4]=0.2; h[7]=0.15; h[11]=0.1; h[15]=0.08; h[19]=0.05; h[23]=0.03; return h; })(),
        adsr: { attack: 0.4, decay: 0.5, sustain: 0.7, release: 1.2 }
    },
    'Digital Pad': {
        category: 'Pads & Textures',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.3; h[3]=0.5; h[5]=0.2; h[7]=0.4; h[9]=0.15; h[11]=0.3; h[13]=0.1; h[15]=0.2; return h; })(),
        adsr: { attack: 0.3, decay: 0.4, sustain: 0.85, release: 0.8 }
    },
    'Ethereal': {
        category: 'Pads & Textures',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[4]=0.3; h[6]=0.2; h[11]=0.15; h[15]=0.1; h[19]=0.08; h[23]=0.05; h[27]=0.03; h[31]=0.02; return h; })(),
        adsr: { attack: 0.8, decay: 0.5, sustain: 0.9, release: 1.5 }
    },
    'Crystal': {
        category: 'Pads & Textures',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.1; h[3]=0.3; h[6]=0.2; h[10]=0.15; h[14]=0.12; h[19]=0.08; h[24]=0.05; return h; })(),
        adsr: { attack: 0.01, decay: 0.6, sustain: 0.4, release: 1.0 }
    },
    'Dark Ambient': {
        category: 'Pads & Textures',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.9; h[2]=0.7; h[3]=0.6; h[4]=0.5; h[5]=0.4; h[6]=0.35; h[7]=0.3; return h; })(),
        adsr: { attack: 1.0, decay: 0.5, sustain: 0.9, release: 2.0 }
    },

    // === Bass ===
    'Sub Bass': {
        category: 'Bass',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.15; return h; })(),
        adsr: { attack: 0.01, decay: 0.15, sustain: 0.9, release: 0.2 }
    },
    'Synth Bass': {
        category: 'Bass',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.6; h[2]=0.8; h[3]=0.4; h[4]=0.5; h[5]=0.2; h[6]=0.15; return h; })(),
        adsr: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.15 }
    },
    'Pluck Bass': {
        category: 'Bass',
        harmonics: Array.from({length: 32}, (_, i) => i < 12 ? 1 / (i + 1) : 0),
        adsr: { attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.3 }
    },
    'Organ Bass': {
        category: 'Bass',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[1]=0.7; h[2]=0.5; h[3]=0.3; h[5]=0.2; return h; })(),
        adsr: { attack: 0.005, decay: 0.05, sustain: 0.95, release: 0.1 }
    },

    // === Experimental ===
    'Metallic': {
        category: 'Experimental',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[2]=0.6; h[5]=0.4; h[8]=0.5; h[12]=0.3; h[17]=0.25; h[22]=0.2; h[28]=0.15; return h; })(),
        adsr: { attack: 0.001, decay: 1.0, sustain: 0.1, release: 1.5 }
    },
    'Alien': {
        category: 'Experimental',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=0.5; h[3]=1; h[6]=0.7; h[10]=0.5; h[15]=0.35; h[21]=0.25; h[28]=0.15; return h; })(),
        adsr: { attack: 0.3, decay: 0.8, sustain: 0.6, release: 1.0 }
    },
    'Robot Voice': {
        category: 'Experimental',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=1; h[2]=0.8; h[4]=0.5; h[6]=0.7; h[8]=0.3; h[10]=0.4; h[12]=0.2; h[14]=0.35; h[16]=0.15; return h; })(),
        adsr: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.15 }
    },
    'Ice': {
        category: 'Experimental',
        harmonics: (() => { const h = new Array(32).fill(0); h[0]=0.3; h[5]=1; h[10]=0.6; h[15]=0.4; h[20]=0.3; h[25]=0.2; h[30]=0.15; return h; })(),
        adsr: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 1.5 }
    },
    'Harmonic Cloud': {
        category: 'Experimental',
        harmonics: Array.from({length: 32}, (_, i) => Math.sin((i + 1) * 0.3) * 0.5 + 0.5).map((v, i) => v / (1 + i * 0.1)),
        adsr: { attack: 0.6, decay: 0.4, sustain: 0.85, release: 1.2 }
    },
    'Odd Harmonics': {
        category: 'Experimental',
        harmonics: Array.from({length: 32}, (_, i) => (i % 2 === 0) ? 0.8 / (i + 1) : 0),
        adsr: { attack: 0.05, decay: 0.2, sustain: 0.75, release: 0.4 }
    },
    'Even Harmonics': {
        category: 'Experimental',
        harmonics: Array.from({length: 32}, (_, i) => (i % 2 === 1) ? 0.8 / (i + 1) : (i === 0 ? 1 : 0)),
        adsr: { attack: 0.05, decay: 0.2, sustain: 0.75, release: 0.4 }
    },
    'Formant Sweep': {
        category: 'Experimental',
        harmonics: Array.from({length: 32}, (_, i) => Math.exp(-((i - 8) * (i - 8)) / 20) * 0.8 + (i === 0 ? 0.5 : 0)),
        adsr: { attack: 0.15, decay: 0.3, sustain: 0.7, release: 0.5 }
    }
};
