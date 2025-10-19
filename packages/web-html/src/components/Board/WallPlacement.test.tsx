import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from './Board';
import { applyMove, createInitialState } from '@quoridor/core';
import { App } from '../../App';

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

  it('renders placed wall segments on the board', () => {
    const state = createInitialState();
    const horizontal = applyMove(state, {
      type: 'WallPlacement',
      anchor: { r: 0, c: 0 },
      o: 'H',
    });
    if (!horizontal.ok) throw new Error('Expected horizontal wall placement to succeed');
    const vertical = applyMove(horizontal.value, {
      type: 'WallPlacement',
      anchor: { r: 0, c: 1 },
      o: 'V',
    });
    if (!vertical.ok) throw new Error('Expected vertical wall placement to succeed');
    render(<Board state={vertical.value} mode="move" orientation="H" onApplyMove={() => {}} />);
    const horizontalSegments = [
      '[data-gr="1"][data-gc="0"]',
      '[data-gr="1"][data-gc="1"]',
      '[data-gr="1"][data-gc="2"]',
    ];
    for (const selector of horizontalSegments) {
      const el = document.querySelector(selector);
      expect(el).toBeTruthy();
      expect(el?.classList.contains('lane--wall')).toBe(true);
      expect(el?.classList.contains('lane--wall-h')).toBe(true);
    }

    const verticalSegments = [
      '[data-gr="0"][data-gc="3"]',
      '[data-gr="1"][data-gc="3"]',
      '[data-gr="2"][data-gc="3"]',
    ];
    for (const selector of verticalSegments) {
      const el = document.querySelector(selector);
      expect(el).toBeTruthy();
      expect(el?.classList.contains('lane--wall')).toBe(true);
      expect(el?.classList.contains('lane--wall-v')).toBe(true);
    }
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
