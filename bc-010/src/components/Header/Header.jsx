// @flow
import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { toggleSidenav } from "./../SideNav/actions.js";
import { changePreset } from "./../SideNav/actions.js";
import { setOctave } from "./../OctaveContainer/actions.js";
import { toggleOscillators } from "./../WaveformContainer/actions.js";
import {
  updateAllFilterEnvelopes,
  updateAllSynthEnvelopes,
} from "./../VerticalSlider/actions.js";
import { applyPreset, getAdjacentPreset } from "./../../preset-utils.js";

const HamburgerButton = styled(FontAwesomeIcon)`
  font-size: 2rem;

  :hover {
    cursor: pointer;
    opacity: 0.8;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

const HeaderContainer = styled.header`
  align-items: center;
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.tertiary};
  display: flex;
  font-size: 2vw;
  font-weight: bold;
  justify-content: space-between;
  padding: 0 10px;
  position: relative;
  transition: all ${({ theme }) => theme.globalTransition};

  @media (max-width: 768px) {
    font-size: 14px;
    min-height: 30px;
  }
`;

const PresetNameDisplay = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.tertiary};
  display: flex;
  font-size: 2rem;
  gap: 10px;
  letter-spacing: 3px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-transform: uppercase;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const PresetNavButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: ${({ theme }) => theme.tertiary};
  cursor: pointer;
  display: flex;
  font-size: 1.3rem;
  justify-content: center;
  padding: 0;
  transition: opacity ${({ theme }) => theme.globalTransition};

  &:hover {
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const PresetLabel = styled.span`
  min-width: 6em;
  text-align: center;
`;

const SideNavButton = styled.div`
  border: 1px solid ${({ theme }) => theme.tertiary};
  height: auto;
  padding: 5px;
  transition: all ${({ theme }) => theme.globalTransition};

  @media (max-width: 768px) {
    display: none;
  }

  &:hover {
    background-color: ${({ theme }) => theme.quaternary};
    cursor: pointer;
    opacity: 0.8;
  }
`;

const SynthName = styled.h1`
  color: ${({ theme }) => theme.tertiary};
  font-size: 3rem;
  line-height: 2rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

function Header({
  presetId,
  presetName,
  toggleSidenav,
  changePreset,
  setOctave,
  toggleOscillators,
  updateAllSynthEnvelopes,
  updateAllFilterEnvelopes,
}) {
  const handlePresetStep = (direction) => {
    const nextPreset = getAdjacentPreset(presetId, direction);

    applyPreset(nextPreset, {
      updateAllSynthEnvelopes,
      toggleOscillators,
      setOctave,
      updateAllFilterEnvelopes,
      changePreset,
    });
  };

  return (
    <HeaderContainer>
      <SynthName>bc-010</SynthName>
      <PresetNameDisplay>
        <PresetNavButton
          aria-label="Show previous preset"
          onClick={() => handlePresetStep(-1)}
          type="button"
        >
          <FontAwesomeIcon icon={faAngleLeft} />
        </PresetNavButton>
        <PresetLabel>{presetName}</PresetLabel>
        <PresetNavButton
          aria-label="Show next preset"
          onClick={() => handlePresetStep(1)}
          type="button"
        >
          <FontAwesomeIcon icon={faAngleRight} />
        </PresetNavButton>
      </PresetNameDisplay>
      <SideNavButton onClick={() => toggleSidenav()}>MENU</SideNavButton>
      <HamburgerButton icon={faBars} onClick={() => toggleSidenav()} />
    </HeaderContainer>
  );
}

const mapStateToProps = (state) => ({
  presetId: state.preset.id,
  presetName: state.preset.name,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      toggleSidenav,
      changePreset,
      setOctave,
      toggleOscillators,
      updateAllSynthEnvelopes,
      updateAllFilterEnvelopes,
    },
    dispatch,
  );

Header.propTypes = {
  /** Change the current synth preset. */
  changePreset: PropTypes.func,
  /** Name of current synth preset. */
  presetName: PropTypes.string,
  /** Id of current synth preset. */
  presetId: PropTypes.string,
  /** Set the synth octave. */
  setOctave: PropTypes.func,
  /** Toggle the side nav bar. */
  toggleSidenav: PropTypes.func,
  /** Toggle oscillator waveform. */
  toggleOscillators: PropTypes.func,
  /** Update filter params for the active preset. */
  updateAllFilterEnvelopes: PropTypes.func,
  /** Update synth envelope for the active preset. */
  updateAllSynthEnvelopes: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(Header);
