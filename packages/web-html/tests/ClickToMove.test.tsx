import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';

// Step 6: Click a highlighted cell applies PawnMove and flips turn

describe('Click-to-move applies PawnMove', () => {
  it('clicking a highlighted cell moves P1 and updates StatusBar', async () => {
    render(<App />);

    // Initially, three highlighted cells exist; pick (1,4) (down move)
    const target = document.querySelector('[data-r="1"][data-c="4"]') as HTMLElement;
    expect(target).toBeTruthy();
    await userEvent.click(target);

    // Turn should switch to P2
    const turnLine = screen.getByText(/Turn:/i).parentElement as HTMLElement;
    const turnValue = turnLine.querySelector('.status__value') as HTMLElement;
    expect(turnValue.textContent).toBe('P2');

    // Highlights should now reflect P2's legal moves around (8,4)
    const highlighted = document.querySelectorAll('.cell.cell--highlight');
    expect(highlighted.length).toBe(3);
  });

  it('clicking a non-highlighted cell does nothing', async () => {
    render(<App />);
    // Non-highlighted example: a far cell like (8,8)
    const before = (screen.getByText(/Turn:/i).parentElement as HTMLElement).querySelector(
      '.status__value',
    )!.textContent;
    const far = document.querySelector('[data-r="8"][data-c="8"]') as HTMLElement;
    await userEvent.click(far);
    const after = (screen.getByText(/Turn:/i).parentElement as HTMLElement).querySelector(
      '.status__value',
    )!.textContent;
    expect(after).toBe(before);
  });
});
