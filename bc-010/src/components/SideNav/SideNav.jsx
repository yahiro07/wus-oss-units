// @flow
import React, { useRef } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import {
  updateFilterEnvelope,
  updateSynthEnvelope,
  updateAllSynthEnvelopes,
  updateAllFilterEnvelopes,
} from "./../VerticalSlider/actions.js";
import { setOctave } from "./../OctaveContainer/actions.js";
import { toggleOscillators } from "./../WaveformContainer/actions.js";
import {
  changeTheme,
  changePreset,
  showSidenav,
  toggleSidenav,
} from "./actions.js";
import useOnClickOutside from "./../../hooks/useOnClickOutside.js";
import Dropdown from "./../SideNavDropdown";

import themeObj from "./../../styles/theme.js";
import { applyPreset, presets } from "./../../preset-utils.js";

const CloseButton = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.primary};
  padding: 0 2px;
  transition: all ${({ theme }) => theme.globalTransition};
  visibility: ${({ hidden }) => (hidden ? "hidden" : "visible")};
  &:hover {
    background-color: ${(props) => props.theme.quaternary};
    color: ${(props) => props.theme.tertiary};
    cursor: pointer;
    opacity: 0.8;
  }
`;

const OuterContainer = styled.div`
  background-color: ${(props) => props.theme.background};
  border-left: 1px solid ${(props) => props.theme.primary};
  box-shadow: ${({ $isSideNavOpen }) =>
    $isSideNavOpen ? "-5px 0px 10px 1px rgba(1, 1, 1, 0.2)" : "0"};
  height: 100%;
  overflow-x: hidden;
  opacity: ${({ $isSideNavOpen }) => ($isSideNavOpen ? "1" : "0")};
  position: fixed;
  right: 0;
  top: 0;
  transition: 0.5s;
  width: ${({ $isSideNavOpen }) => ($isSideNavOpen ? "30%" : "0")};
  z-index: 1;

  @media (max-width: 768px) {
    width: ${({ $isSideNavOpen }) => ($isSideNavOpen ? "60%" : "0")};
  }
`;

const SideNavHeaderSection = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  font-size: 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const SideNavTitle = styled.div`
  color: ${(props) => props.theme.primary};
  font-size: 3rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

function SideNav({
  activePresetId,
  activePreset,
  isSideNavOpen,
  setOctave,
  toggleOscillators,
  updateAllSynthEnvelopes,
  updateAllFilterEnvelopes,
  updateFilterEnvelope,
  updateSynthEnvelope,
  toggleSidenav,
  changePreset,
  showSidenav,
  changeTheme,
  currentTheme,
}) {
  const sideNavRef = useRef();

  useOnClickOutside(sideNavRef, () => showSidenav(false));

  return (
    <OuterContainer $isSideNavOpen={isSideNavOpen} ref={sideNavRef}>
      <SideNavHeaderSection>
        <CloseButton hidden icon={faTimes} onClick={() => toggleSidenav()} />
        <SideNavTitle>MENU</SideNavTitle>
        <CloseButton icon={faTimes} onClick={() => toggleSidenav()} />
      </SideNavHeaderSection>
      <Dropdown
        currentSelection={(selection) =>
          selection === currentTheme ? true : false
        }
        clickHandler={(item) => {
          changeTheme(item);
          toggleSidenav();
        }}
        items={Object.keys(themeObj).map((th) => th)}
        name=">> THEMES"
      />

      <Dropdown
        currentSelection={(selection) =>
          selection.id === activePresetId ? true : false
        }
        clickHandler={(preset) => {
          applyPreset(preset, {
            updateAllSynthEnvelopes,
            toggleOscillators,
            setOctave,
            updateAllFilterEnvelopes,
            changePreset,
          });
          toggleSidenav();
        }}
        items={presets}
        name=">> PRESETS"
      />
    </OuterContainer>
  );
}

const mapStateToProps = (state) => ({
  activePresetId: state.preset.id,
  activePreset: state.preset.name,
  currentTheme: state.theme.name,
  isSideNavOpen: state.sideNav.isSideNavOpen,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      setOctave,
      toggleOscillators,
      updateAllSynthEnvelopes,
      updateAllFilterEnvelopes,
      updateFilterEnvelope,
      updateSynthEnvelope,
      toggleSidenav,
      changePreset,
      showSidenav,
      changeTheme,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(SideNav);
