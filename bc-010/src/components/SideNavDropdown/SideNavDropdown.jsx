// @flow
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Chevron = styled(FontAwesomeIcon)`
  color: ${({ theme }) => theme.primary};
  font-weight: 100;
  margin-right: 5px;
  transition: all 0.1s;

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      -webkit-transform: rotate(180deg);
      transform: rotate(180deg);
    `};
`;

const ItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.2s;

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      max-height: 2000px;
      opacity: 1;
    `};
`;

const DropdownItem = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  display: flex;
  font-size: 2rem;
  justify-content: center;
  letter-spacing: 3px;
  line-height: 70%;
  padding: 20px 0;
  text-align: center;
  text-transform: uppercase;
  transition: all ${({ theme }) => theme.globalTransition};
  width: 100%;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }

  &:hover {
    background-color: ${({ theme }) => theme.quaternary};
    color: white;
    cursor: pointer;
    opacity: 0.8;
  }

  ${({ $isActive }) =>
    $isActive &&
    css`
      background-color: ${({ theme }) => theme.secondary};
      color: ${({ theme }) => theme.tertiary};
    `};
`;

const Header = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.primary};
  border-top: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  display: flex;
  font-size: 2rem;
  justify-content: space-between;
  letter-spacing: 3px;
  line-height: 70%;
  padding: 20px 0;
  text-align: center;
  text-transform: uppercase;
  transition: all ${({ theme }) => theme.globalTransition};
  width: 100%;

  &:hover {
    cursor: pointer;
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const getItemName = item => (typeof item === 'string' ? item : item.name);

type Props = {
  clickHandler: Function,
  currentSelection: Function,
  items: Array<string | Object>,
  name: string,
};

function SideNavDropdown({
  clickHandler,
  currentSelection,
  items,
  name,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Header onClick={() => setIsOpen(!isOpen)}>
        {name}
        <Chevron icon={faChevronDown} $isOpen={isOpen} />
      </Header>
      <ItemContainer $isOpen={isOpen}>
        {items.map((item, idx) => {
          const isActive = currentSelection(item);
          const itemName = getItemName(item);
          return (
            <DropdownItem
              $isActive={isActive}
              onClick={() => {
                clickHandler(item);
              }}
              key={`${itemName}-${idx}`}
            >
              {itemName}
            </DropdownItem>
          );
        })}
      </ItemContainer>
    </>
  );
}

SideNavDropdown.propTypes = {
  /** Function that runs when dropdown item is clicked. */
  clickHandler: PropTypes.func,
  /** Determines if current dropdown item is active, mostly used for styling active state. */
  currentSelection: PropTypes.func,
  /** Array of items to be listed in dropdown. */
  items: PropTypes.array,
  /** Header name of the dropdown. */
  name: PropTypes.string,
};

export default SideNavDropdown;
