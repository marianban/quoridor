import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { App } from '../src/App';

// Pawn visualization should render two pawns in initial positions

describe('Pawn rendering', () => {
  it('renders P1 and P2 pawns at initial coordinates', () => {
    render(<App />);
    const p1 = document.querySelector('.pawn[data-pawn="P1"]') as HTMLElement;
    const p2 = document.querySelector('.pawn[data-pawn="P2"]') as HTMLElement;
    expect(p1).toBeTruthy();
    expect(p2).toBeTruthy();
    // P1 at (0,4) and P2 at (8,4)
    const p1Parent = p1.closest('[data-r][data-c]') as HTMLElement;
    const p2Parent = p2.closest('[data-r][data-c]') as HTMLElement;
    expect(p1Parent.getAttribute('data-r')).toBe('0');
    expect(p1Parent.getAttribute('data-c')).toBe('4');
    expect(p2Parent.getAttribute('data-r')).toBe('8');
    expect(p2Parent.getAttribute('data-c')).toBe('4');
  });
});
