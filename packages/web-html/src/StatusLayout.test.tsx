import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('Status below board', () => {
  it('renders status after the board in the left column and shows current turn', () => {
    render(<App />);
    const grid = screen.getByRole('grid', { name: /quoridor board/i });
    // Status has role alert only when there is an error; otherwise just text. Find by text "Turn:".
    const statusTurn = screen.getByText(/Turn:/i);
    // Both grid and status should be inside the left column container
    const left = grid.closest('.app__left');
    expect(left).not.toBeNull();
    expect(left).toContainElement(grid);
    expect(left).toContainElement(statusTurn);
    // Ensure DOM order: board comes before status
    const children = Array.from(left!.children);
    const gridIndex = children.indexOf(grid);
    const statusIndex = children.indexOf(statusTurn.closest('.status')!);
    expect(gridIndex).toBeLessThan(statusIndex);
    // Turn text should include current player (P1 or P2)
    expect(statusTurn.textContent).toMatch(/Turn:\s*(P1|P2)/);
  });
});
