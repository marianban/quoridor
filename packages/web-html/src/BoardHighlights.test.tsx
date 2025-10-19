import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

// Step 5: Legal-move highlights
// Initial state: P1 at (0,4) should have 3 legal destinations: (0,3), (0,5), (1,4)

describe('Board highlights legal pawn destinations', () => {
  it('shows three highlighted cells in Move mode initially', () => {
    render(<App />);
    const highlighted = document.querySelectorAll('.cell.cell--highlight');
    expect(highlighted.length).toBe(3);
    // sanity: include expected coordinates
    const has = (r: number, c: number) =>
      Array.from(highlighted).some(
        (el) => el.getAttribute('data-r') === String(r) && el.getAttribute('data-c') === String(c),
      );
    expect(has(0, 3)).toBe(true);
    expect(has(0, 5)).toBe(true);
    expect(has(1, 4)).toBe(true);
  });

  it('hides highlights when switching to Wall mode', async () => {
    render(<App />);
    // switch to Wall mode via button
    const wallBtn = screen.getByRole('button', { name: /wall/i });
    await userEvent.click(wallBtn);
    const highlighted = document.querySelectorAll('.cell.cell--highlight');
    expect(highlighted.length).toBe(0);
  });
});
