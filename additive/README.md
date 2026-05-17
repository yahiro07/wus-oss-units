# Additive — Harmonic Additive Synthesizer

Web-based additive synthesizer that builds complex timbres from individual sine-wave partials using the Web Audio API. Shape harmonics visually, play via keyboard, and explore dozens of presets spanning classic waveforms, acoustic instruments, bells, organs, and experimental textures.

**[Launch Additive](https://brendanjameslynskey.github.io/Synth_Additive/)**

---

## Features

- **32-partial additive engine** — each harmonic independently adjustable in real time
- **Interactive harmonic editor** — click and drag bars to sculpt your timbre visually
- **Virtual keyboard** — 2-octave piano with computer keyboard mapping
- **ADSR envelope** — full attack, decay, sustain, release shaping
- **40+ presets** — classic waveforms, organs, bells, strings, brass, woodwinds, vocals, pads, and experimental timbres
- **Convolution reverb** — algorithmic room simulation
- **Real-time visualization** — oscilloscope waveform, harmonic spectrum, and ambient particle system
- **Desktop & mobile versions** — optimized for both platforms

## Quick start

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

Or simply open `index.html` in any modern browser — the landing page detects your device and routes to the appropriate version.

## Mobile version

`additive_mobile.html` is a fully self-contained single-file version optimized for phones and tablets. It can be added to the home screen as a standalone web app (PWA-capable on iOS and Android).

## Files

| File | Description |
|------|-------------|
| `index.html` | Landing page with device detection |
| `desktop.html` | Desktop web app (multi-file) |
| `additive_mobile.html` | Mobile app (self-contained single file) |
| `style.css` | Desktop styles |
| `synth-engine.js` | Web Audio API additive synthesis engine |
| `app.js` | UI controller, keyboard, and visualization |

## Controls

| Control | Description |
|---------|-------------|
| Harmonic bars | Click/drag to set amplitude of each partial (1st = fundamental) |
| Keyboard | Click virtual keys or use computer keyboard (A-K = C4-B4, Q-I = C5-B5) |
| Attack | Time for note to reach full volume (0–2 seconds) |
| Decay | Time to fall from peak to sustain level (0–2 seconds) |
| Sustain | Volume level while key is held (0–100%) |
| Release | Time for note to fade after key release (0–4 seconds) |
| Reverb | Wet/dry mix of convolution reverb |
| Volume | Master output level |

## How it works

Additive synthesis constructs complex sounds by summing individual sine waves (partials) at harmonic intervals. The fundamental frequency determines the pitch, while each subsequent partial vibrates at an integer multiple of the fundamental — the 2nd partial at twice the frequency, the 3rd at three times, and so on.

The timbre of any periodic sound can be described by the relative amplitudes of its harmonics. A sawtooth wave contains all harmonics with amplitudes falling as 1/n. A square wave contains only odd harmonics (1, 3, 5, 7...) falling as 1/n. A clarinet emphasizes odd harmonics but with a more complex amplitude profile. A bell uses inharmonic partials — frequencies that are not exact integer multiples.

The engine creates 32 Web Audio `OscillatorNode` instances per voice, each routed through its own `GainNode` for amplitude control. An ADSR envelope generator shapes the amplitude over time. All partials feed into a master gain, through an optional convolution reverb, and into a dynamics compressor to prevent clipping.

---

## A History of Additive Synthesis

### The mathematical foundations (1822)

Additive synthesis rests on one of the most elegant theorems in mathematics. In 1822, Joseph Fourier published *Théorie analytique de la chaleur*, demonstrating that any periodic function can be decomposed into — or equivalently, constructed from — a sum of sine and cosine waves. This insight, originally developed for heat conduction, would become the theoretical bedrock of every additive synthesizer built since.

Fourier's theorem implies something remarkable for sound: every timbre you have ever heard — a violin, a human voice, a thunderclap — can be represented as a collection of sine waves at specific frequencies and amplitudes. To synthesize any sound, you need only combine the right sine waves.

### Helmholtz and the first physical demonstrations (1863)

Hermann von Helmholtz was the first to put Fourier's theorem to musical use. In *On the Sensations of Tone* (1863), he constructed an apparatus using electromagnetically driven tuning forks, each resonating at a different harmonic frequency, with adjustable Helmholtz resonators to control their amplitudes. By combining these pure tones, he could reconstruct the timbres of vowel sounds and simple instruments — the first practical demonstration of additive synthesis.

Helmholtz's work established a crucial insight: the perceived quality of a musical tone depends not on some mysterious essence but on the measurable distribution of energy across its harmonic series.

### Cahill's Telharmonium (1897–1914)

Thaddeus Cahill took additive synthesis from the laboratory to the concert hall with the Telharmonium, patented in 1897 and demonstrated publicly from 1906. This extraordinary instrument used massive tone wheels — rotating electromagnetic generators — each producing a pure sine tone at a specific frequency. By combining the outputs of multiple tone wheels with a polyphonic keyboard, performers could construct complex timbres additively in real time.

The Telharmonium weighed nearly 200 tons and filled an entire floor of a building in Manhattan. Cahill's vision was to distribute music over telephone lines — an early form of streaming. Though commercially unsuccessful (it interfered with telephone calls and was ruinously expensive), the Telharmonium proved that additive synthesis could produce musically expressive, real-time sound.

### The Hammond organ and practical tone wheels (1935)

Laurens Hammond's tonewheel organ, introduced in 1935, domesticated Cahill's concept. Each tonewheel generated a near-sinusoidal waveform, and the organ's famous drawbars allowed players to mix the fundamental with eight upper harmonics at various levels — a direct, intuitive interface for additive synthesis.

The drawbar system (labeled 16', 5⅓', 8', 4', 2⅔', 2', 1⅗', 1⅓', 1') corresponds to the sub-fundamental, the fundamental, and harmonics 2 through 8. By pulling drawbars out to different positions (0–8), organists sculpted timbres ranging from pure flute-like tones to rich, brassy textures. The Hammond B-3, introduced in 1955, became one of the most iconic instruments in jazz, gospel, rock, and blues.

### Early electronic and computer synthesis (1957–1970s)

The computer music revolution at Bell Labs and Princeton brought additive synthesis into the digital domain. Max Mathews' MUSIC I (1957) and its successors generated sound sample by sample, making it straightforward to sum arbitrary numbers of sinusoidal components programmatically. Jean-Claude Risset, working with Mathews at Bell Labs in the 1960s, used additive synthesis to create his landmark analyses and resyntheses of trumpet tones and bell sounds, demonstrating that the technique could capture the subtle, evolving spectra of real instruments.

At Stanford's CCRMA (Center for Computer Research in Music and Acoustics), John Chowning and others explored additive synthesis extensively. Though Chowning is best known for discovering FM synthesis, his group's work on spatial sound and timbral analysis relied heavily on additive decomposition.

The key challenge of early computer additive synthesis was computational cost. Each partial required its own oscillator, and realistic timbres needed dozens or hundreds of partials with time-varying amplitudes. On 1960s and 70s hardware, generating even a few seconds of sound could take hours.

### The Fairlight CMI and digital sampling convergence (1979)

The Fairlight CMI (Computer Musical Instrument), developed by Peter Vogel and Kim Ryrie in Sydney, Australia, included an additive synthesis mode alongside its famous sampling capabilities. Users could draw harmonic profiles on a light pen display, specifying the amplitude of each partial visually — a remarkably prescient interface that anticipated modern harmonic editors by decades.

The Fairlight demonstrated that additive synthesis could benefit from visual, intuitive interfaces rather than purely numerical parameter entry. Its additive mode was less commercially popular than its sampling features, but it influenced a generation of synthesizer designers.

### Kawai K5 and dedicated additive hardware (1987)

The Kawai K5, released in 1987, was one of the few commercially successful synthesizers dedicated to additive synthesis. It offered 128 harmonics per source with up to four sources per patch, digital filters, and a modulation system for evolving timbres. The K5 could produce extraordinarily rich, complex sounds that were difficult to achieve with subtractive or FM synthesis.

Despite its sonic capabilities, the K5 suffered from the fundamental UX challenge of additive synthesis: programming 128 individual harmonic levels was tedious without good visual tools. The K5m rack module partially addressed this with computer editor software, but the instrument remained a specialist's tool.

### Software revolution and real-time additive (1990s–2000s)

As personal computers grew powerful enough for real-time audio, additive synthesis experienced a renaissance in software. Native Instruments' Razor (2011) used additive synthesis as its core engine, generating all sounds from up to 320 partials. Razor demonstrated that additive synthesis, combined with modern effects and modulation, could produce sounds competitive with any synthesis method.

Camel Audio's Alchemy (2009, later acquired by Apple and integrated into Logic Pro) combined additive synthesis with other techniques, offering a spectral editor for manipulating individual partials. AIR Music Technology's Loom (2013) provided a dedicated additive environment with a distinctive visual interface.

### Analysis-resynthesis and spectral processing (2000s–present)

Modern additive synthesis has increasingly merged with spectral analysis techniques. Software like SPEAR (Sinusoidal Partial Editing Analysis and Resynthesis) by Michael Klingbeil allows users to analyze recorded sounds into their component partials, edit the spectral data, and resynthesize — enabling transformations impossible with other methods, such as time-stretching without pitch change, pitch-shifting without time change, and cross-synthesis between two sounds.

The iPhone app TC-11 (2011) and later iPad instruments brought touch-controlled additive synthesis to mobile platforms, using the multitouch screen as a natural controller for harmonic manipulation.

### The resurgence: modern instruments (2010s–present)

Additive synthesis has enjoyed a significant resurgence in recent years:

- **Apple's Alchemy** (integrated into Logic Pro X in 2015) brought high-quality additive synthesis to millions of producers
- **Newfangled Audio's Generate** (2020) combined additive oscillators with a chaos system and FM
- **VirSyn's Cube** series offered sophisticated additive synthesis on desktop and mobile
- **Arturia's Pigments** included an additive/harmonic engine alongside other synthesis types

Hardware instruments have also revisited additive synthesis. The Teenage Engineering OP-1's DNA synth engine uses additive principles, and various Eurorack modules (such as Qu-Bit's Nebulae and 4ms's Ensemble Oscillator) explore additive and spectral approaches in modular synthesizer contexts.

### Why additive synthesis matters

Additive synthesis occupies a unique position in sound design. It is simultaneously:

- **The most theoretically complete** — Fourier's theorem guarantees that any periodic sound can be constructed additively
- **The most computationally demanding** — realistic timbres may require hundreds of individually controlled oscillators
- **The most visually intuitive** — harmonic spectra map naturally to bar charts and spectral displays
- **The most analytically powerful** — any recorded sound can be decomposed into partials, edited, and resynthesized

As computing power continues to grow and visual interfaces become more sophisticated, additive synthesis is finally approaching the potential that Fourier's mathematics promised two centuries ago. The gap between "any sound is theoretically possible" and "any sound is practically achievable" narrows with each generation of hardware and software.

---

## License

MIT
