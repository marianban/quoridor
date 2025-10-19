import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Controls } from './Controls';

describe('Controls', () => {
  it('shows tooltips for buttons', () => {
    render(
      <Controls
        mode="move"
        setMode={() => {}}
        orientation="H"
        setOrientation={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Move' })).toHaveAttribute('title', 'Move (M)');
    expect(screen.getByRole('button', { name: 'Wall' })).toHaveAttribute('title', 'Wall (W)');
    expect(screen.getByRole('button', { name: 'H' })).toHaveAttribute('title', 'Horizontal (H)');
    expect(screen.getByRole('button', { name: 'V' })).toHaveAttribute('title', 'Vertical (V)');
  });

  it('disables orientation buttons when mode is move', () => {
    const setOrientation = vi.fn();
    render(
      <Controls
        mode="move"
        setMode={() => {}}
        orientation="H"
        setOrientation={setOrientation}
        onReset={() => {}}
      />,
    );
    const btnH = screen.getByRole('button', { name: 'H' });
    const btnV = screen.getByRole('button', { name: 'V' });
    expect(btnH).toHaveAttribute('aria-disabled', 'true');
    expect(btnV).toHaveAttribute('aria-disabled', 'true');
    // clicks should no-op
    fireEvent.click(btnH);
    fireEvent.click(btnV);
    expect(setOrientation).not.toHaveBeenCalled();
  });

  it('enables orientation buttons when mode is wall', () => {
    const setOrientation = vi.fn();
    render(
      <Controls
        mode="wall"
        setMode={() => {}}
        orientation="H"
        setOrientation={setOrientation}
        onReset={() => {}}
      />,
    );
    const btnH = screen.getByRole('button', { name: 'H' });
    const btnV = screen.getByRole('button', { name: 'V' });
    expect(btnH).not.toHaveAttribute('aria-disabled');
    expect(btnV).not.toHaveAttribute('aria-disabled');
    fireEvent.click(btnV);
    expect(setOrientation).toHaveBeenCalledWith('V');
  });
});
