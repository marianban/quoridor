import { describe, expect, it } from 'vitest';
import { createInitialState, serialize, deserialize, isTerminal, legalMoves, Game } from './index';

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

  it('Game wrapper delegates and preserves immutability', () => {
    const g = Game.initial();
    const before = g.state;
    const ms = g.legalMoves();
    expect(ms.length).toBeGreaterThan(0);
    const firstPawn = ms.find((m) => m.type === 'PawnMove');
    if (!firstPawn) throw new Error('expected a pawn move');
    const res = g.applyMove(firstPawn);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const g2 = res.value;
      // immutability: original state unchanged
      expect(g.state).toBe(before);
      // turn flipped
      expect(g2.state.turn).not.toBe(g.state.turn);
      // history appended
      expect(g2.state.history[g2.state.history.length - 1]).toEqual(firstPawn);
    }
  });
});
