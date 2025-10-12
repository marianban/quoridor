import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Board } from '../src/components/Board/Board';
import { Game } from '@quoridor/core';

describe('Board grid structure', () => {
  it('renders 81 gridcells with r,c data attributes', () => {
    const game = Game.initial();
    render(<Board state={game.state} mode="move" orientation="H" onApplyMove={() => {}} />);
    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(81);
    // Check corners
    const cell00 = cells.find(
      (el) => el.getAttribute('data-r') === '0' && el.getAttribute('data-c') === '0',
    );
    const cell88 = cells.find(
      (el) => el.getAttribute('data-r') === '8' && el.getAttribute('data-c') === '8',
    );
    expect(cell00).toBeTruthy();
    expect(cell88).toBeTruthy();
  });
});
