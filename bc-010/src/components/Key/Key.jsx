// @flow
import PropTypes from "prop-types";
import React, { Fragment } from "react";
import styled, { css } from "styled-components";
import { isMobile } from "react-device-detect";

const KeyContainer = styled.article`
  border: 2px solid ${({ theme }) => theme.primary};
  margin: 0.5vw;
  transition: all ${({ theme }) => theme.globalTransition};
  width: 10vw;

  :hover {
    background-color: ${({ theme }) => theme.quaternary};
    cursor: pointer;
  }

  ${({ $isActive }) =>
    $isActive &&
    css`
      background-color: ${({ theme }) => theme.quaternary} !important;
    `};
`;

const Letter = styled.div`
  color: ${({ theme }) => theme.primary};
  display: flex;
  font-size: 5.625rem;
  justify-content: center;
  line-height: 0.7;
  width: 100%;

  @media screen and (max-width: 768px) {
    display: none;
  }
`;

const OuterLetterContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  overflow: hidden;

  header {
    color: ${({ theme }) => theme.primary};
    font-size: 1.25rem;
  }
`;

type Props = {
  displayOctave: number,
  highlightKey: number,
  keyCode: number,
  keyPressDown: Function,
  keyPressUp: Function,
  letter: string,
  note: string,
};

/** Component for the keys on keyboard. This is reused to make
 * both black and white keys.
 */
function Key({
  displayOctave,
  highlightKey,
  keyCode,
  keyPressDown,
  keyPressUp,
  letter,
  note,
}: Props) {
  let octaveNote: string = note + displayOctave;
  const keyInnerDisplay = (
    <OuterLetterContainer>
      <header>
        {note}
        {displayOctave}
      </header>
      {/* <Letter>{letter}</Letter> */}
    </OuterLetterContainer>
  );

  return (
    <Fragment>
      {isMobile ? (
        <KeyContainer
          $isActive={highlightKey === keyCode}
          onTouchStart={() => keyPressDown(octaveNote)}
          onTouchEnd={() => keyPressUp(octaveNote)}
        >
          {keyInnerDisplay}
        </KeyContainer>
      ) : (
        <KeyContainer
          $isActive={highlightKey === keyCode}
          onMouseDown={() => keyPressDown(octaveNote)}
          onMouseUp={() => keyPressUp(octaveNote)}
        >
          {keyInnerDisplay}
        </KeyContainer>
      )}
    </Fragment>
  );
}

Key.propTypes = {
  /** Display the correct octave after its been updated. */
  displayOctave: PropTypes.number,
  /** Number of the Char Code for the currently pressed key on the keybaord - it's stored in Keyboard.jsx state. */
  highlightKey: PropTypes.number,
  /** Char code that corresponds to that note on the synthesizer. */
  keyCode: PropTypes.number,
  /** Actually plays/fires the note on the Tone.js synth. */
  keyPressDown: PropTypes.func.isRequired,
  /** Stops the note on the Tone.js synth. */
  keyPressUp: PropTypes.func.isRequired,
  /** Letter on the computer keyboard that corresponds to that note on the synthesizer. */
  letter: PropTypes.string,
  /** Musical note for that key (eg. "Db", "E", "Bb", etc.) */
  note: PropTypes.string,
};

export default Key;
