# drum-machine

![](docs/screenshot.png)

a 16-step drum sequencer with five synthesised voices, plain html and javascript, no samples or libraries. open `index.html` and you have a working drum machine.

i wanted an excuse to actually sit down with the web audio api and build the voices from scratch, so every sound here is oscillators and filtered noise. no wav files, no `Tone.js`.

## What is included

- 5 voices: kick, snare, hihat closed, hihat open, clap
- 16 step grid, click to toggle steps on or off
- bpm slider from 60 to 200
- play, stop, clear
- save and load named patterns to localStorage (bpm is stored with the pattern)
- master volume
- a small "step n / 16" readout that follows the play head

## How the voices are made

every voice is built fresh from oscillators and filtered noise on each hit. nothing is sampled.

- **kick**: sine oscillator, pitch swept from 120hz down to 50hz over 80ms, with a fast attack and 400ms decay envelope.
- **snare**: bandpassed white noise around 1.8khz layered with a short triangle body that pitches from 220hz to 140hz.
- **hihat closed**: white noise highpassed at 7khz, 50ms decay.
- **hihat open**: same source, 250ms decay so it bleeds into the next step.
- **clap**: four short bursts of bandpassed noise spaced a few ms apart, the last one with a longer tail to fake a small room.

## Timing

the heart of the sequencer is the standard web audio "lookahead" pattern. a `setInterval` wakes up every 25ms and queues any steps that fall inside the next 100ms of audio time. all the actual scheduling happens on `audioCtx.currentTime`, so the audio clock stays accurate even when the main thread is busy or you switch tabs.

step length is sixteenth notes:

```
stepInterval = 60 / bpm / 4   // seconds per step
```

so at 120 bpm a step is `60 / 120 / 4 = 0.125s` and a full bar of 16 steps is exactly 2 seconds. the visual play head is updated with a `setTimeout` based on the audio delta so the cell highlight matches what you actually hear.

## Requirements

a modern browser with web audio. tested in chrome, firefox and safari. no build tools, no node, no install.

## Getting it running

```
git clone https://github.com/secanakbulut/drum-machine.git
cd drum-machine
open index.html
```

or just double-click `index.html`. on linux, `xdg-open index.html` works, or serve the folder with any static server if you want.

the first click on play creates the audio context (browsers require a user gesture before any sound is allowed).

## Where to look in the code

- `voices.js` — the synth voices, one function per drum, each one returns nothing and just schedules nodes against the destination.
- `scheduler.js` — the lookahead scheduler. small enough to read end to end.
- `app.js` — ui, pattern state, save and load, hooking the scheduler to the voices.
- `index.html`, `style.css` — markup and styling.

a starter pattern (four on the floor kick, snare on 2 and 4, eighth-note closed hihat) is loaded on first paint so the grid is not empty.

## Stack

vanilla html, css, javascript. web audio api. localStorage for saved patterns. no dependencies.

## License

source-available under polyform noncommercial 1.0.0, see `LICENSE`. fine to play with, hack on, or learn from. not licensed for commercial use or resale.
