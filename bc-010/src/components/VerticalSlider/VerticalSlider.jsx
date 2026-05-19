// @flow
import React, { Component } from 'react';

import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { updateSynthEnvelope, updateFilterEnvelope } from './actions.js';

const InputSlider = styled.input`
  -webkit-transform: rotate(270deg);
  -moz-transform: rotate(270deg);
  -o-transform: rotate(270deg);
  -ms-transform: rotate(270deg);
  -webkit-appearance: none;
  appearance: none;
  background: ${({ theme }) => theme.secondary};
  /* Grey background */
  cursor: pointer;
  height: 0.75vw;
  /*  This is actually the fatness of the slider */
  outline: none;
  /* Remove outline */
  transform: rotate(270deg);
  transition: all ${({ theme }) => theme.globalTransition};
  width: 25vh;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    /* Override default look */
    appearance: none;
    background: ${({ theme }) => theme.secondary};
    color: red;
    /* Green background */
    border-left: 0.25vw solid ${({ theme }) => theme.primary};
    border-right: 0.25vw solid ${({ theme }) => theme.primary};
    /* Cursor on hover */
    cursor: pointer;
    /* Slider handle height */
    height: 1.75vw;
    /* Set a specific slider handle width */
    transition: all ${({ theme }) => theme.globalTransition};
    width: 1vw;
  }

  &:hover::-webkit-slider-thumb {
    background: white;
    border-left: 0.25vw solid ${({ theme }) => theme.quaternary};
    border-right: 0.25vw solid ${({ theme }) => theme.quaternary};
  }

  &:active::-webkit-slider-thumb {
    background: white;
    border-left: 0.25vw solid ${({ theme }) => theme.quaternary};
    border-right: 0.25vw solid ${({ theme }) => theme.quaternary};
  }

  &:hover::-webkit-slider-thumb {
    background: white;
    border-left: 0.25vw solid ${({ theme }) => theme.quaternary};
    border-right: 0.25vw solid ${({ theme }) => theme.quaternary};
  }

  &::-moz-range-thumb {
    background: ${({ theme }) => theme.secondary};
    /* Green background */
    border-bottom: 0;
    border-left: 0.35vw solid ${({ theme }) => theme.primary};
    border-right: 0.35vw solid ${({ theme }) => theme.primary};
    border-top: 0;
    border-radius: 0;
    /* Cursor on hover */
    cursor: pointer;
    /* Slider handle height */
    height: 2.55vh;
    transition: all ${({ theme }) => theme.globalTransition};
    /* Set a specific slider handle width */
    width: 0.25vw;
  }

  &:active::-moz-range-thumb {
    background: white;
    border-color: ${({ theme }) => theme.quaternary};
  }

  &:hover::-moz-range-thumb {
    background: white;
    border-color: ${({ theme }) => theme.quaternary};
  }

  @media screen and (max-width: 768px) {
    height: 4.5vw;
    /* Responsive thumb slider styling for Chrome, Opera, Safari & Edge */
    &::-webkit-slider-thumb {
      border-left: 1.25vw solid ${({ theme }) => theme.primary};
      border-right: 1.25vw solid ${({ theme }) => theme.primary};
      width: 3vw;
      /* Set a specific slider handle width */
      height: 4.5vw;
      /* Slider handle height */
    }
    /* Responsive thumb slider styling for Firefox */
    &::-moz-range-thumb {
      border-left: 1vw solid ${({ theme }) => theme.primary};
      border-right: 1vw solid ${({ theme }) => theme.primary};
      width: 0.5vw;
      /* Set a specific slider handle width */
      height: 4.75vw;
      /* Slider handle height */
    }
  }
`;

const SliderContainer = styled.div`
  align-self: center;
`;

const SliderHousing = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

type Props = {
  max: number,
  min: number,
  sliderName: string,
  step: number,
  type: string,
  typeOfParams: string,
  updateFilterEnvelope: Function,
  updateSynthEnvelope: Function,
  value: number,
};

type State = {
  value: number,
};

/** The slider component with the HTML input slider logic. */
class VerticalSlider extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    autoBind(this);
    this.state = {
      value: 0,
    };
  }

  /** Calls the function in App.jsx to update the synth timbre
   * @public
   */
  updateSynthValue(): void {
    const {
      sliderName,
      typeOfParams,
      updateSynthEnvelope,
      updateFilterEnvelope,
    } = this.props;
    const { value } = this.state;
    if (typeOfParams === 'synthParams') {
      updateSynthEnvelope(sliderName, value);
    }
    if (typeOfParams === 'filterParams') {
      updateFilterEnvelope(sliderName, value);
    }
  }

  /** Actually updates state in this slider state.
   * @public
   */
  updateValue(value: number): void {
    this.setState({ value: value });
  }

  /** Handler for HTML input slider changes. Makes sure the argument
   * passed into updateValue() is a number.
   * @public
   */
  handleChange(event: SyntheticEvent<HTMLInputElement>): void {
    this.updateValue(parseFloat(event.currentTarget.value));
    this.updateSynthValue();
  }

  render() {
    const { sliderName, max, min, step, value } = this.props;
    return (
      <SliderHousing>
        <SliderContainer>
          <InputSlider
            aria-label={sliderName}
            name={sliderName}
            type="range"
            min={min}
            max={max}
            onChange={this.handleChange}
            step={step}
            value={value}
          />
        </SliderContainer>
      </SliderHousing>
    );
  }
}

const mapStateToProps = state => ({
  envelope: state.synthesizer.envelope,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      updateSynthEnvelope,
      updateFilterEnvelope,
    },
    dispatch,
  );

VerticalSlider.propTypes = {
  /** Maximum value the slider can reach. */
  max: PropTypes.number,
  /** Minimum value the slider can reach. */
  min: PropTypes.number,
  /** Full name of the parameter the slider changes (eg. "attack", "decay" etc.) */
  sliderName: PropTypes.string,
  /** Specifies the size of each movement for the slider control */
  step: PropTypes.number,
  /** Always listed as "range" so that each HTML slider is of range type. */
  type: PropTypes.string,
  /** Name of object with parameters to be adjusted */
  typeOfParams: PropTypes.string,
  /** Function to update the filter envelope */
  updateFilterEnvelope: PropTypes.func,
  /** Function to update the synth envelope */
  updateSynthEnvelope: PropTypes.func,
  /** Value for that parameter as it is in App.jsx state. */
  value: PropTypes.number,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(VerticalSlider);
