// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import styled from "styled-components";

import Key from "./../Key";
import PropTypes from "prop-types";
import arrOfKeyObjects from "./../../data/arrOfKeyObjects.json";
import autoBind from "react-autobind";

const BlackKeys = styled.section`
  display: flex;
  flex: 1 0 auto;
  padding-left: 5vw;
  width: 100%;

  > :nth-child(5n + 3) {
    margin-left: 12vw;
  }

  > * {
    background-color: ${({ theme }) => theme.secondary};
  }
`;

const Container = styled.section`
  background-color: ${({ theme }) => theme.background};
  border: 2px solid ${({ theme }) => theme.primary};
  display: flex;
  flex-direction: column;
  height: 40vh;
  padding: 1vh;
  transition: all ${({ theme }) => theme.globalTransition};
`;

const WhiteKeys = styled.section`
  display: flex;
  flex: 1 0 auto;
  width: 100%;
`;

type Props = {
  keyPressDown: Function,
  keyPressUp: Function,
  octave: number,
};

type State = {
  activeKeyPressed: Object,
};

/** Filter the keys json data for just white keys */
const whiteKeysArray: Array<Object> = arrOfKeyObjects.filter((key) => {
  return key.type === "white";
});

/** Filter the keys json data for just black keys */
const blackKeysArray: Array<Object> = arrOfKeyObjects.filter((key) => {
  return key.type === "black";
});

/** Holds all the white and black keys. Also holds the logic for registering
 computer keyboard presses. */
class Keyboard extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    autoBind(this);
    this.state = {
      highlightKey: 0,
      activeKeyPressed: {},
    };
  }

  /** Make sure the correct octave is associated with the synth
   * keyboard key pressed note.
   * @public
   */
  updateNoteOctave(noteObj: Object | void): string | void {
    if (noteObj) {
      let updatedOctave: number = noteObj.startingOctave + this.props.octave;
      let updatedNote: string = noteObj.note + updatedOctave;
      return updatedNote;
    }
  }

  /** Search an array of objects, that contain a `keyCode` property,
   *  to see if it matches a number.
   *  @public
   */
  findKeyCodeMatch(
    numberToFind: number,
    arrayToSearch: Array<Object>,
  ): Object | void {
    return arrayToSearch.find((keyObj) => {
      return keyObj.keyCode === numberToFind;
    });
  }

  /** Handler for the (computer) keyboard letter press events:
   * @public
   */
  keyboardLetterPress(event: SyntheticKeyboardEvent<*>): void {
    /** If key pressed matches a key object in arrOfKeyObjects.json array,
     * fire the keyPressDown() function to sound the synth. */
    const matchedNoteObj = this.findKeyCodeMatch(event.which, arrOfKeyObjects);

    if (
      matchedNoteObj !== undefined &&
      this.state.activeKeyPressed !== matchedNoteObj
    ) {
      this.props.keyPressDown(this.updateNoteOctave(matchedNoteObj));
      this.setState({ activeKeyPressed: matchedNoteObj });
    }
  }

  keyUpHandler(event: SyntheticKeyboardEvent<*>): void {
    const matchedNoteObj = this.findKeyCodeMatch(event.which, arrOfKeyObjects);
    if (matchedNoteObj === this.state.activeKeyPressed) {
      this.props.keyPressUp();
      this.setState({ activeKeyPressed: {} });
    }
  }

  /** Add the keypress event listener to the document once the component mounts. */
  componentDidMount() {
    // $FlowFixMe
    // document.addEventListener('keydown', this.keyboardLetterPress);
    // $FlowFixMe
    // document.addEventListener('keyup', this.keyUpHandler);
  }

  /** Remove keypress event listener after component unmounts to prevent
   potential errors and memory leaks. */
  componentWillUnmount() {
    // $FlowFixMe
    // document.removeEventListener('keydown', this.keyboardLetterPress);
    // document.removeEventListener('keyup', this.props.keyPressUp);
  }

  render() {
    const { keyPressDown, keyPressUp, octave } = this.props;
    const { activeKeyPressed } = this.state;

    /** Logic for parameter of .map key generation below */
    const generateKeys = ({ id, keyCode, letter, note, startingOctave }) => (
      <Key
        displayOctave={octave + startingOctave}
        highlightKey={activeKeyPressed.keyCode}
        key={`${id}-${note}`}
        keyCode={keyCode}
        keyPressDown={keyPressDown}
        keyPressUp={keyPressUp}
        letter={letter}
        note={note}
      />
    );

    return (
      <Container>
        <BlackKeys>{blackKeysArray.map(generateKeys)}</BlackKeys>
        <WhiteKeys>{whiteKeysArray.map(generateKeys)}</WhiteKeys>
      </Container>
    );
  }
}

const mapStateToProps = (state) => ({
  octave: state.octave.octave,
});

Keyboard.propTypes = {
  /** Actually plays/fires the note on the Tone.js synth. */
  keyPressDown: PropTypes.func,
  /** Stops the note on the Tone.js synth. */
  keyPressUp: PropTypes.func,
  /** Current octave for the keyboard. Derived from App.jsx state. */
  octave: PropTypes.number,
};

export default connect(mapStateToProps)(Keyboard);
