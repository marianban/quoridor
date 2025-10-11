import { describe, expect, it } from 'vitest';
import { createInitialState, serialize, deserialize, isTerminal, legalMoves } from './index';

describe('core skeleton', () => {
  it('creates initial state correctly', () => {
    const s = createInitialState();
    expect(s.boardSize).toBe(9);
    expect(s.pawns.P1).toEqual({ r: 0, c: 4 });
    expect(s.pawns.P2).toEqual({ r: 8, c: 4 });
    expect(s.wallsRemaining.P1).toBe(10);
    expect(s.wallsRemaining.P2).toBe(10);
    expect(Array.isArray(s.blockedEdges)).toBe(true);
    expect(Array.isArray(s.history)).toBe(true);
    expect(isTerminal(s)).toBe(false);
    expect(legalMoves(s)).toEqual([]);
  });

  it('serializes and deserializes', () => {
    const s = createInitialState();
    const json = serialize(s);
    const out = deserialize(json);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.value.boardSize).toBe(9);
    }
  });
});
