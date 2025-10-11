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
    const moves = legalMoves(s);
    // Should have 3 pawn moves (down, left, right) + 128 wall placements = 131
    expect(moves.length).toBe(131);
    // Pawn moves come first and are sorted by row, then col
    expect(moves[0]).toEqual({ type: 'PawnMove', to: { r: 0, c: 3 } });
    expect(moves[1]).toEqual({ type: 'PawnMove', to: { r: 0, c: 5 } });
    expect(moves[2]).toEqual({ type: 'PawnMove', to: { r: 1, c: 4 } });
    // First wall is horizontal at (0,0)
    expect(moves[3]).toEqual({ type: 'WallPlacement', anchor: { r: 0, c: 0 }, o: 'H' });
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
