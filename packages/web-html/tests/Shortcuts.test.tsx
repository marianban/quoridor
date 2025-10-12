import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';

describe('Keyboard shortcuts', () => {
  it('M and W toggle modes; H/V set orientation only in Wall mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    const btnMove = screen.getByRole('button', { name: 'Move' });
    const btnWall = screen.getByRole('button', { name: 'Wall' });
    const btnH = screen.getByRole('button', { name: 'H' });
    const btnV = screen.getByRole('button', { name: 'V' });

    // Default is Move mode; orientation disabled
    expect(btnMove.className).toMatch(/controls__btn--active/);
    expect(btnH).toHaveAttribute('aria-disabled', 'true');
    expect(btnV).toHaveAttribute('aria-disabled', 'true');

    // Press 'w' -> Wall mode
    await user.keyboard('w');
    expect(btnWall.className).toMatch(/controls__btn--active/);
    expect(btnH).not.toHaveAttribute('aria-disabled');
    expect(btnV).not.toHaveAttribute('aria-disabled');

    // Orientation via H/V
    await user.keyboard('v');
    expect(btnV.className).toMatch(/controls__btn--active/);
    await user.keyboard('h');
    expect(btnH.className).toMatch(/controls__btn--active/);

    // Back to Move
    await user.keyboard('m');
    expect(btnMove.className).toMatch(/controls__btn--active/);
    expect(btnH).toHaveAttribute('aria-disabled', 'true');
    expect(btnV).toHaveAttribute('aria-disabled', 'true');
  });
});
