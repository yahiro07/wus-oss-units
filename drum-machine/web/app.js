// glue: ui, pattern state, persistence, plus wiring the scheduler to the voices.

(function () {
  const VOICES = [
    { key: "kick", label: "kick" },
    { key: "snare", label: "snare" },
    { key: "hhc", label: "hihat closed" },
    { key: "hho", label: "hihat open" },
    { key: "clap", label: "clap" },
  ];

  const STEPS = 16;
  const STORAGE_KEY = "drum-machine.v1";

  // pattern[voiceKey] = boolean[16]
  let pattern = emptyPattern();

  function emptyPattern() {
    const p = {};
    VOICES.forEach((v) => {
      p[v.key] = new Array(STEPS).fill(false);
    });
    return p;
  }

  // dom
  const grid = document.getElementById("grid");
  const playBtn = document.getElementById("playBtn");
  const clearBtn = document.getElementById("clearBtn");
  const bpmInput = document.getElementById("bpm");
  const bpmValue = document.getElementById("bpmValue");
  const masterInput = document.getElementById("master");
  const stepReadout = document.getElementById("stepReadout");
  const patternSelect = document.getElementById("patternSelect");
  const saveBtn = document.getElementById("saveBtn");
  const loadBtn = document.getElementById("loadBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const aboutBtn = document.getElementById("aboutBtn");
  const aboutDialog = document.getElementById("aboutDialog");
  const closeAbout = document.getElementById("closeAbout");

  // audio set up lazily so browsers don't yell about user gesture
  let audioCtx = null;
  let masterGain = null;
  let scheduler = null;
  const cellRefs = {}; // cellRefs[voice][step] = element

  function ensureAudio() {
    if (audioCtx) return;
    audioCtx = window.hostInterface?.audioContext ?? new AudioContext();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = parseFloat(masterInput.value);
    masterGain.connect(audioCtx.destination);

    scheduler = createScheduler(audioCtx, {
      bpm: parseInt(bpmInput.value, 10),
      onStep(step, when) {
        // schedule any active voices for this step
        VOICES.forEach((v) => {
          if (pattern[v.key][step]) {
            Voices[v.key](audioCtx, masterGain, when);
          }
        });
        // visual update on the right beat. use setTimeout based on the audio
        // delta so the highlight matches what you hear.
        const delay = Math.max(0, (when - audioCtx.currentTime) * 1000);
        setTimeout(() => highlightStep(step), delay);
      },
    });
  }

  // build grid dom
  function renderGrid() {
    grid.innerHTML = "";
    VOICES.forEach((v) => {
      const row = document.createElement("div");
      row.className = "row";
      row.dataset.voice = v.key;

      const label = document.createElement("div");
      label.className = "row-label";
      label.textContent = v.label;
      grid.appendChild(label);

      cellRefs[v.key] = [];
      for (let s = 0; s < STEPS; s++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell";
        // shade every 4th step, darker every 8th
        if (s % 4 === 0) cell.classList.add("beat-mark");
        if (s % 8 === 0) cell.classList.add("measure");
        cell.dataset.voice = v.key;
        cell.dataset.step = s;
        cell.setAttribute("aria-label", `${v.label} step ${s + 1}`);
        cell.addEventListener("click", () => toggleCell(v.key, s));
        // need the parent .row class for css var pickup, but row uses display:contents
        // so we copy the data-voice directly onto the cell parent below
        grid.appendChild(cell);
        cellRefs[v.key].push(cell);
      }
    });
    // assign css color var per cell based on its voice
    Object.keys(cellRefs).forEach((voice) => {
      const colorVar = {
        kick: "var(--row-kick)",
        snare: "var(--row-snare)",
        hhc: "var(--row-hhc)",
        hho: "var(--row-hho)",
        clap: "var(--row-clap)",
      }[voice];
      cellRefs[voice].forEach((c) => {
        c.style.setProperty("--row-color", colorVar);
      });
    });
    syncGrid();
  }

  function syncGrid() {
    VOICES.forEach((v) => {
      pattern[v.key].forEach((on, s) => {
        cellRefs[v.key][s].classList.toggle("on", on);
      });
    });
  }

  function toggleCell(voice, step) {
    pattern[voice][step] = !pattern[voice][step];
    cellRefs[voice][step].classList.toggle("on", pattern[voice][step]);
  }

  let lastHighlight = -1;
  function highlightStep(step) {
    if (lastHighlight >= 0) {
      VOICES.forEach((v) =>
        cellRefs[v.key][lastHighlight].classList.remove("playing"),
      );
    }
    VOICES.forEach((v) => cellRefs[v.key][step].classList.add("playing"));
    lastHighlight = step;
    stepReadout.textContent = `step ${step + 1} / 16`;
  }

  function clearPlayingHighlight() {
    if (lastHighlight >= 0) {
      VOICES.forEach((v) =>
        cellRefs[v.key][lastHighlight].classList.remove("playing"),
      );
    }
    lastHighlight = -1;
    stepReadout.textContent = "step 1 / 16";
  }

  // transport
  playBtn.addEventListener("click", () => {
    ensureAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    if (scheduler.isRunning()) {
      scheduler.stop();
      playBtn.textContent = "play";
      playBtn.classList.remove("playing");
      clearPlayingHighlight();
    } else {
      scheduler.start();
      playBtn.textContent = "stop";
      playBtn.classList.add("playing");
    }
  });

  clearBtn.addEventListener("click", () => {
    pattern = emptyPattern();
    syncGrid();
  });

  bpmInput.addEventListener("input", () => {
    const v = parseInt(bpmInput.value, 10);
    bpmValue.textContent = v;
    if (scheduler) scheduler.setBpm(v);
  });

  masterInput.addEventListener("input", () => {
    if (masterGain) masterGain.gain.value = parseFloat(masterInput.value);
  });

  // persistence
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { patterns: {} };
      return JSON.parse(raw);
    } catch (e) {
      return { patterns: {} };
    }
  }

  function saveStore(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function refreshPatternSelect() {
    const store = loadStore();
    const names = Object.keys(store.patterns).sort();
    patternSelect.innerHTML = '<option value="">saved patterns</option>';
    names.forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;
      patternSelect.appendChild(opt);
    });
  }

  saveBtn.addEventListener("click", () => {
    const name = prompt("pattern name?");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const store = loadStore();
    store.patterns[trimmed] = {
      bpm: parseInt(bpmInput.value, 10),
      pattern,
    };
    saveStore(store);
    refreshPatternSelect();
    patternSelect.value = trimmed;
  });

  loadBtn.addEventListener("click", () => {
    const name = patternSelect.value;
    if (!name) return;
    const store = loadStore();
    const entry = store.patterns[name];
    if (!entry) return;
    pattern = emptyPattern();
    VOICES.forEach((v) => {
      const arr = (entry.pattern && entry.pattern[v.key]) || [];
      for (let s = 0; s < STEPS; s++) pattern[v.key][s] = !!arr[s];
    });
    if (entry.bpm) {
      bpmInput.value = entry.bpm;
      bpmValue.textContent = entry.bpm;
      if (scheduler) scheduler.setBpm(entry.bpm);
    }
    syncGrid();
  });

  deleteBtn.addEventListener("click", () => {
    const name = patternSelect.value;
    if (!name) return;
    if (!confirm(`delete pattern "${name}"?`)) return;
    const store = loadStore();
    delete store.patterns[name];
    saveStore(store);
    refreshPatternSelect();
  });

  // about dialog
  aboutBtn.addEventListener("click", () => aboutDialog.showModal());
  closeAbout.addEventListener("click", () => aboutDialog.close());

  // bootstrap
  renderGrid();
  refreshPatternSelect();

  // a small starter beat so the grid does not look empty on first load
  pattern.kick[0] = pattern.kick[8] = true;
  pattern.snare[4] = pattern.snare[12] = true;
  for (let s = 0; s < 16; s += 2) pattern.hhc[s] = true;
  syncGrid();

  window.hostInterface?.setupUnitAgent({
    type: "instrument",
    setBpm(bpm) {
      bpmInput.value = bpm;
      bpmValue.textContent = bpm;
      if (scheduler) scheduler.setBpm(bpm);
    },
    setPlayState(playing) {
      if (playing) {
        ensureAudio();
        if (audioCtx.state === "suspended") audioCtx.resume();
        if (!scheduler.isRunning()) {
          scheduler.start();
          playBtn.textContent = "stop";
          playBtn.classList.add("playing");
        }
      } else {
        ensureAudio();
        if (audioCtx.state === "suspended") audioCtx.resume();
        if (scheduler.isRunning()) {
          scheduler.stop();
          playBtn.textContent = "play";
          playBtn.classList.remove("playing");
          clearPlayingHighlight();
        }
      }
    },
  });
})();
