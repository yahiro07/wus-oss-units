// classic web audio lookahead scheduler. the setInterval timer wakes up every
// ~25ms and queues any steps that fall inside the next 100ms of audio time.
// that way the audio clock stays accurate even when the main thread stutters.
//
// step interval in seconds = 60 / bpm / 4   (sixteenth notes)

function createScheduler(audioCtx, opts) {
  const lookahead = opts.lookahead || 25;        // ms between wake ups
  const scheduleAhead = opts.scheduleAhead || 0.1; // seconds of audio to queue

  let isRunning = false;
  let currentStep = 0;
  let nextStepTime = 0;
  let timerId = null;

  let bpm = opts.bpm || 120;
  let onStep = opts.onStep || function () {};

  function stepDuration() {
    return 60.0 / bpm / 4.0;
  }

  function advance() {
    nextStepTime += stepDuration();
    currentStep = (currentStep + 1) % 16;
  }

  function tick() {
    while (nextStepTime < audioCtx.currentTime + scheduleAhead) {
      onStep(currentStep, nextStepTime);
      advance();
    }
  }

  return {
    start() {
      if (isRunning) return;
      isRunning = true;
      currentStep = 0;
      nextStepTime = audioCtx.currentTime + 0.05;
      tick();
      timerId = setInterval(tick, lookahead);
    },
    stop() {
      isRunning = false;
      if (timerId) clearInterval(timerId);
      timerId = null;
    },
    setBpm(v) { bpm = v; },
    isRunning() { return isRunning; },
    stepDuration,
  };
}
