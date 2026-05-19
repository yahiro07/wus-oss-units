function setupWebAudioUnit() {
  window.hostInterface?.setupUnitAgent({
    type: "instrument",
    noteInput: {
      noteOn(noteNumber) {
        ctrl.note_on(noteNumber);
      },
      noteOff(noteNumber) {
        ctrl.note_off(noteNumber);
      },
    },
  });
}