const engine = new AdditiveEngine();
let isInitialized = false;

// Note frequencies (A4 = 440Hz, equal temperament)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function noteFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

// Keyboard range: C4 (60) to B5 (83) = 2 octaves
const KEYBOARD_START = 60;
const KEYBOARD_END = 83;

// Computer keyboard mapping
const KEY_MAP = {
    'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64,
    'f': 65, 't': 66, 'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71,
    'k': 72, 'o': 73, 'l': 74, 'p': 75, ';': 76,
    "'": 77, ']': 78
};

const activeKeys = new Set();
let harmonicsEditorDragging = false;

// ── Initialize ──
async function initAudio() {
    if (isInitialized) return;
    await engine.init();
    isInitialized = true;
    loadPreset('Sawtooth');
    startVisualization();
}

// ── Presets ──
function buildPresetSelector() {
    const sel = document.getElementById('presetSelect');
    const categories = {};

    for (const [name, preset] of Object.entries(PRESETS)) {
        if (!categories[preset.category]) categories[preset.category] = [];
        categories[preset.category].push(name);
    }

    for (const [cat, names] of Object.entries(categories)) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = cat;
        for (const name of names) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            optgroup.appendChild(opt);
        }
        sel.appendChild(optgroup);
    }
}

function loadPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;

    engine.setHarmonics(preset.harmonics);
    engine.setADSR(preset.adsr.attack, preset.adsr.decay, preset.adsr.sustain, preset.adsr.release);

    document.getElementById('attack').value = preset.adsr.attack * 500;
    document.getElementById('decay').value = preset.adsr.decay * 500;
    document.getElementById('sustain').value = preset.adsr.sustain * 100;
    document.getElementById('release').value = preset.adsr.release * 250;

    document.getElementById('presetSelect').value = name;
    updateHarmonicsDisplay();
}

function onPresetChange() {
    loadPreset(document.getElementById('presetSelect').value);
}

// ── Harmonics Editor ──
function buildHarmonicsEditor() {
    const editor = document.getElementById('harmonicsEditor');
    editor.innerHTML = '';
    for (let i = 0; i < engine.NUM_PARTIALS; i++) {
        const bar = document.createElement('div');
        bar.className = 'harmonic-bar' + (i === 0 ? ' fundamental' : '');
        bar.dataset.index = i;
        editor.appendChild(bar);
    }
}

function updateHarmonicsDisplay() {
    const bars = document.querySelectorAll('.harmonic-bar');
    const maxH = 88; // max height in px (editor height - padding)
    bars.forEach((bar, i) => {
        const amp = engine.harmonicAmplitudes[i];
        bar.style.height = Math.max(1, amp * maxH) + 'px';
    });
}

function handleHarmonicsInteraction(e) {
    const editor = document.getElementById('harmonicsEditor');
    const rect = editor.getBoundingClientRect();
    const padding = 6;
    const innerHeight = rect.height - padding * 2;
    const innerWidth = rect.width - padding * 2;

    let clientX, clientY;
    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const x = clientX - rect.left - padding;
    const y = clientY - rect.top - padding;
    const barIndex = Math.floor((x / innerWidth) * engine.NUM_PARTIALS);
    const amplitude = 1 - Math.max(0, Math.min(1, y / innerHeight));

    if (barIndex >= 0 && barIndex < engine.NUM_PARTIALS) {
        engine.harmonicAmplitudes[barIndex] = amplitude;
        updateHarmonicsDisplay();
    }
}

// ── Virtual Keyboard ──
function buildKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    const blackKeys = [1, 3, 6, 8, 10]; // semitones that are black keys

    for (let midi = KEYBOARD_START; midi <= KEYBOARD_END; midi++) {
        const semitone = midi % 12;
        const isBlack = blackKeys.includes(semitone);
        const key = document.createElement('div');
        key.className = 'key ' + (isBlack ? 'black' : 'white');
        key.dataset.midi = midi;

        if (!isBlack) {
            const octave = Math.floor(midi / 12) - 1;
            key.innerHTML = `<span>${NOTE_NAMES[semitone]}${octave}</span>`;
        }

        keyboard.appendChild(key);
    }
}

function handleKeyDown(midi) {
    if (activeKeys.has(midi)) return;
    activeKeys.add(midi);

    const keyEl = document.querySelector(`.key[data-midi="${midi}"]`);
    if (keyEl) keyEl.classList.add('active');

    if (!isInitialized) {
        initAudio().then(() => engine.noteOn(noteFreq(midi), midi));
    } else {
        engine.noteOn(noteFreq(midi), midi);
    }
}

function handleKeyUp(midi) {
    if (!activeKeys.has(midi)) return;
    activeKeys.delete(midi);

    const keyEl = document.querySelector(`.key[data-midi="${midi}"]`);
    if (keyEl) keyEl.classList.remove('active');

    engine.noteOff(midi);
}

// ── Slider Controls ──
function updateAttack() { engine.adsr.attack = document.getElementById('attack').value / 500; }
function updateDecay() { engine.adsr.decay = document.getElementById('decay').value / 500; }
function updateSustain() { engine.adsr.sustain = document.getElementById('sustain').value / 100; }
function updateRelease() { engine.adsr.release = document.getElementById('release').value / 250; }
function updateReverb() { engine.setReverb(document.getElementById('reverb').value / 100); }
function updateVolume() { engine.setVolume(document.getElementById('vol').value / 100); }

// ── Visualization ──
let animId = null;
const particles = [];

function initParticles(count) {
    particles.length = 0;
    const canvas = document.getElementById('viz');
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            r: 1 + Math.random() * 2,
            hue: 30 + Math.random() * 30
        });
    }
}

function startVisualization() {
    const canvas = document.getElementById('viz');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resize() {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
        if (particles.length === 0) initParticles(50);
    }
    resize();
    window.addEventListener('resize', resize);

    const freqData = new Uint8Array(engine.analyser.frequencyBinCount);
    const timeData = new Uint8Array(engine.analyser.fftSize);

    function draw() {
        animId = requestAnimationFrame(draw);
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;

        ctx.fillStyle = 'rgba(10, 10, 18, 0.15)';
        ctx.fillRect(0, 0, w, h);

        engine.analyser.getByteFrequencyData(freqData);
        engine.analyser.getByteTimeDomainData(timeData);

        // Energy analysis
        let bass = 0, mid = 0, high = 0;
        for (let i = 0; i < 30; i++) bass += freqData[i];
        for (let i = 30; i < 200; i++) mid += freqData[i];
        for (let i = 200; i < 600; i++) high += freqData[i];
        bass /= 30 * 255; mid /= 170 * 255; high /= 400 * 255;

        // Spectral bars
        const barCount = Math.min(64, Math.floor(w / 8));
        const barW = w / barCount;
        for (let i = 0; i < barCount; i++) {
            const idx = Math.floor(i * freqData.length / barCount);
            const val = freqData[idx] / 255;
            const barH = val * h * 0.4;
            const hue = 30 + (i / barCount) * 20;
            ctx.fillStyle = `hsla(${hue}, 50%, 50%, ${val * 0.12})`;
            ctx.fillRect(i * barW, h - barH, barW - 1, barH);
        }

        // Waveform (oscilloscope)
        if (Object.keys(engine.activeVoices).length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(232, 168, 56, ${0.3 + bass * 0.3})`;
            ctx.lineWidth = 1.5;
            const sliceWidth = w / timeData.length;
            for (let i = 0; i < timeData.length; i++) {
                const v = timeData[i] / 128.0;
                const y = (v * h) / 2;
                if (i === 0) ctx.moveTo(0, y);
                else ctx.lineTo(i * sliceWidth, y);
            }
            ctx.stroke();
        }

        // Particles
        particles.forEach(p => {
            p.x += p.vx + bass * (Math.random() - 0.5) * 2;
            p.y += p.vy + mid * (Math.random() - 0.5) * 1.5;
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;

            const alpha = 0.1 + high * 0.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 45%, 60%, ${alpha})`;
            ctx.fill();
        });

        // Central glow
        const glowAlpha = 0.01 + bass * 0.06;
        const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.5);
        grad.addColorStop(0, `hsla(35, 40%, 40%, ${glowAlpha})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    draw();
}

// ── Event Listeners ──
document.addEventListener('DOMContentLoaded', () => {
    buildPresetSelector();
    buildHarmonicsEditor();
    buildKeyboard();
    updateHarmonicsDisplay();

    // Harmonics editor interaction
    const editor = document.getElementById('harmonicsEditor');
    editor.addEventListener('mousedown', (e) => {
        harmonicsEditorDragging = true;
        initAudio();
        handleHarmonicsInteraction(e);
    });
    document.addEventListener('mousemove', (e) => {
        if (harmonicsEditorDragging) handleHarmonicsInteraction(e);
    });
    document.addEventListener('mouseup', () => { harmonicsEditorDragging = false; });

    editor.addEventListener('touchstart', (e) => {
        e.preventDefault();
        harmonicsEditorDragging = true;
        initAudio();
        handleHarmonicsInteraction(e);
    }, { passive: false });
    editor.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (harmonicsEditorDragging) handleHarmonicsInteraction(e);
    }, { passive: false });
    editor.addEventListener('touchend', () => { harmonicsEditorDragging = false; });

    // Virtual keyboard - mouse
    const keyboard = document.getElementById('keyboard');
    let mouseDownOnKeyboard = false;

    keyboard.addEventListener('mousedown', (e) => {
        const key = e.target.closest('.key');
        if (!key) return;
        mouseDownOnKeyboard = true;
        initAudio();
        handleKeyDown(parseInt(key.dataset.midi));
    });

    keyboard.addEventListener('mouseover', (e) => {
        if (!mouseDownOnKeyboard) return;
        const key = e.target.closest('.key');
        if (key) handleKeyDown(parseInt(key.dataset.midi));
    });

    keyboard.addEventListener('mouseout', (e) => {
        if (!mouseDownOnKeyboard) return;
        const key = e.target.closest('.key');
        if (key) handleKeyUp(parseInt(key.dataset.midi));
    });

    document.addEventListener('mouseup', () => {
        if (mouseDownOnKeyboard) {
            mouseDownOnKeyboard = false;
            activeKeys.forEach(midi => handleKeyUp(midi));
        }
    });

    // Virtual keyboard - touch
    keyboard.addEventListener('touchstart', (e) => {
        e.preventDefault();
        initAudio();
        for (const touch of e.changedTouches) {
            const key = document.elementFromPoint(touch.clientX, touch.clientY);
            if (key && key.closest('.key')) {
                handleKeyDown(parseInt(key.closest('.key').dataset.midi));
            }
        }
    }, { passive: false });

    keyboard.addEventListener('touchend', (e) => {
        e.preventDefault();
        activeKeys.forEach(midi => handleKeyUp(midi));
    }, { passive: false });

    // Computer keyboard
    document.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        const midi = KEY_MAP[e.key.toLowerCase()];
        if (midi !== undefined) {
            e.preventDefault();
            initAudio();
            handleKeyDown(midi);
        }
    });

    document.addEventListener('keyup', (e) => {
        const midi = KEY_MAP[e.key.toLowerCase()];
        if (midi !== undefined) {
            e.preventDefault();
            handleKeyUp(midi);
        }
    });
});
