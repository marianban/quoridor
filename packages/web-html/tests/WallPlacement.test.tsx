import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from '../src/components/Board/Board';
import { createInitialState } from '@quoridor/core';
import { App } from '../src/App';

// Step 7: Wall placements apply with clamping and error handling

describe('Wall placement interactions', () => {
  it('applies wall placement with current orientation', async () => {
    const state = createInitialState();
    const onApplyMove = vi.fn();
    render(<Board state={state} mode="wall" orientation="H" onApplyMove={onApplyMove} />);
    const anchorCell = document.querySelector('[data-r="0"][data-c="0"]') as HTMLElement;
    await userEvent.click(anchorCell);
    expect(onApplyMove).toHaveBeenCalledWith({
      type: 'WallPlacement',
      anchor: { r: 0, c: 0 },
      o: 'H',
    });
  });

  it('clamps wall anchor to board bounds (7,7)', async () => {
    const state = createInitialState();
    const onApplyMove = vi.fn();
    render(<Board state={state} mode="wall" orientation="V" onApplyMove={onApplyMove} />);
    const anchorCell = document.querySelector('[data-r="8"][data-c="8"]') as HTMLElement;
    await userEvent.click(anchorCell);
    expect(onApplyMove).toHaveBeenCalledWith({
      type: 'WallPlacement',
      anchor: { r: 7, c: 7 },
      o: 'V',
    });
  });

  it('shows error when wall placement is illegal', async () => {
    render(<App />);
    const wallBtn = document.querySelector('button[title="Wall (W)"]') as HTMLElement;
    await userEvent.click(wallBtn);

    const horizontalAnchor = document.querySelector('[data-r="0"][data-c="0"]') as HTMLElement;
    await userEvent.click(horizontalAnchor);

    const orientationBtn = document.querySelector('button[title="Vertical (V)"]') as HTMLElement;
    await userEvent.click(orientationBtn);

    const verticalAnchor = document.querySelector('[data-r="0"][data-c="0"]') as HTMLElement;
    await userEvent.click(verticalAnchor);

    const error = document.querySelector('.status__error');
    expect(error?.textContent ?? '').toContain('wall_cross');
  });
});
