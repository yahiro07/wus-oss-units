// voice synthesis. each function takes the audio context, a destination node,
// and a start time in audio context seconds. nothing is sample based, every
// sound is built out of oscillators and filtered noise.

function makeNoiseBuffer(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buf;
}

const Voices = (function () {
  let noiseBuf = null;

  function noiseSource(ctx) {
    if (!noiseBuf) noiseBuf = makeNoiseBuffer(ctx, 1.0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    return src;
  }

  function kick(ctx, dest, t) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // pitch envelope: 120hz down to 50hz across 80ms
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(1.0, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  function snare(ctx, dest, t) {
    // noise body
    const n = noiseSource(ctx);
    const bp = ctx.createBiquadFilter();
    const ng = ctx.createGain();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.7;
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.9, t + 0.005);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    n.connect(bp).connect(ng).connect(dest);
    n.start(t);
    n.stop(t + 0.2);

    // tonal body
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.4, t + 0.003);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(og).connect(dest);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  function hat(ctx, dest, t, decay) {
    const n = noiseSource(ctx);
    const hp = ctx.createBiquadFilter();
    const g = ctx.createGain();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    n.connect(hp).connect(g).connect(dest);
    n.start(t);
    n.stop(t + decay + 0.05);
  }

  function hihatClosed(ctx, dest, t) {
    hat(ctx, dest, t, 0.05);
  }

  function hihatOpen(ctx, dest, t) {
    hat(ctx, dest, t, 0.25);
  }

  function clap(ctx, dest, t) {
    // four short bursts to fake the slap
    const offsets = [0, 0.01, 0.02, 0.04];
    const decays = [0.02, 0.02, 0.02, 0.12];
    for (let i = 0; i < offsets.length; i++) {
      const n = noiseSource(ctx);
      const bp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      bp.Q.value = 1.2;
      const start = t + offsets[i];
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.7, start + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, start + decays[i]);
      n.connect(bp).connect(g).connect(dest);
      n.start(start);
      n.stop(start + decays[i] + 0.05);
    }
  }

  return {
    kick,
    snare,
    hhc: hihatClosed,
    hho: hihatOpen,
    clap,
  };
})();
