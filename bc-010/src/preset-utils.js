import presets from "./data/presets.json";

export { presets };

export function applyPreset(preset, actions) {
  const {
    updateAllSynthEnvelopes,
    toggleOscillators,
    setOctave,
    updateAllFilterEnvelopes,
    changePreset,
  } = actions;

  updateAllSynthEnvelopes(preset.synthesizer.envelope);
  toggleOscillators(preset.synthesizer.oscillator.type);
  setOctave(preset.octave.octave);
  updateAllFilterEnvelopes(preset.filterParams);
  changePreset(preset);
}

export function getAdjacentPreset(currentPresetId, direction) {
  const currentPresetIndex = presets.findIndex(
    (preset) => preset.id === currentPresetId,
  );

  if (currentPresetIndex === -1) {
    return presets[0];
  }

  const nextPresetIndex =
    (currentPresetIndex + direction + presets.length) % presets.length;

  return presets[nextPresetIndex];
}
