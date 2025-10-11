import { describe, expect, it } from 'vitest';
import { createInitialState, serialize, deserialize, isTerminal, legalMoves, Game, applyMove, getWinner } from './index.js';

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

  it('detects terminal state and winner when P1 reaches last row', () => {
    let s = createInitialState();
    // advance P1 toward last row; on P2 turns place a harmless wall once
    let placed = false;
    for (let iter = 0; iter < 32; iter++) {
      if (isTerminal(s)) break;
      if (s.turn === 'P1') {
        const startR = s.pawns.P1.r;
        const mv = legalMoves(s).find((m) => m.type === 'PawnMove' && m.to.r > startR);
        if (!mv) throw new Error('Expected a forward pawn move for P1');
        const r1 = applyMove(s, mv);
        if (!r1.ok) throw new Error('apply failed');
        s = r1.value;
      } else {
        if (!placed) {
          const wall = { type: 'WallPlacement' as const, anchor: { r: 0, c: 0 }, o: 'H' as const };
          const r2 = applyMove(s, wall);
          if (r2.ok) s = r2.value;
          placed = true;
        } else {
          // skip turn simulation by making a legal pawn move for P2 upwards
          const startR = s.pawns.P2.r;
          const mv2 = legalMoves(s).find((m) => m.type === 'PawnMove' && m.to.r < startR);
          if (!mv2) break;
          const r3 = applyMove(s, mv2);
          if (r3.ok) s = r3.value;
        }
      }
    }
    expect(isTerminal(s)).toBe(true);
    expect(getWinner(s)).toBe('P1');
    expect(legalMoves(s)).toEqual([]);
  });
});
