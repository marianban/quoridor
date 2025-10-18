import { applyMove, createInitialState } from '@quoridor/core';
import { render, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Board } from './Board';

describe('Board wall preview', () => {
  it('renders a valid preview when hovering a cell in wall mode', () => {
    const state = createInitialState();
    const { container } = render(
      <Board state={state} mode="wall" orientation="H" onApplyMove={vi.fn()} />,
    );

    const cell = container.querySelector<HTMLElement>('[data-r="0"][data-c="0"]');
    expect(cell).toBeTruthy();
    fireEvent.pointerEnter(cell!);

    const previewSegments = container.querySelectorAll('[data-preview="valid"]');
    expect(previewSegments).toHaveLength(3);
  });

  it('marks preview as invalid when placement is not allowed', () => {
    const base = createInitialState();
    const applied = applyMove(base, {
      type: 'WallPlacement',
      anchor: { r: 0, c: 0 },
      o: 'H',
    });
    const state = applied.ok ? applied.value : base;
    const { container } = render(
      <Board state={state} mode="wall" orientation="H" onApplyMove={vi.fn()} />,
    );

    const cell = container.querySelector<HTMLElement>('[data-r="0"][data-c="0"]');
    expect(cell).toBeTruthy();
    fireEvent.pointerEnter(cell!);

    const previewSegments = container.querySelectorAll('[data-preview="invalid"]');
    expect(previewSegments).toHaveLength(3);
  });

  it('applies a wall when clicking a preview lane segment', () => {
    const state = createInitialState();
    const onApplyMove = vi.fn();
    const { container } = render(
      <Board state={state} mode="wall" orientation="H" onApplyMove={onApplyMove} />,
    );

    const lane = container.querySelector<HTMLElement>('[data-gr="1"][data-gc="0"]');
    expect(lane).toBeTruthy();
    fireEvent.pointerEnter(lane!);
    fireEvent.click(lane!);

    expect(onApplyMove).toHaveBeenCalledWith({
      type: 'WallPlacement',
      anchor: { r: 0, c: 0 },
      o: 'H',
    });
  });
});
