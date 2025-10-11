import { describe, it, expect } from 'vitest';
import { applyMove, canApplyMove, createInitialState, legalMoves } from './index';
import { edgesForWall } from './rules';

describe('applyMove end-to-end', () => {
  it('applies a wall placement immutably and updates state', () => {
    const s = createInitialState();
    const move = { type: 'WallPlacement' as const, anchor: { r: 0, c: 0 }, o: 'H' as const };
    const can = canApplyMove(s, move);
    expect(can.ok).toBe(true);
    const res = applyMove(s, move);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const s2 = res.value;
    // original unchanged
    expect(s.wallsRemaining.P1).toBe(10);
    expect(s.placedWalls.length).toBe(0);
    expect(s.blockedEdges.length).toBe(0);
    // updated state
    expect(s2.wallsRemaining.P1).toBe(9);
    expect(s2.turn).toBe('P2');
    expect(s2.placedWalls).toContainEqual({ r: 0, c: 0, o: 'H' });
    const segs = edgesForWall({ r: 0, c: 0, o: 'H' });
    for (const e of segs) expect(s2.blockedEdges).toContain(e);
    expect(s2.history[s2.history.length - 1]).toEqual(move);
  });

  it('rejects overlapping wall with stable error code', () => {
    const s = createInitialState();
    const m = { type: 'WallPlacement' as const, anchor: { r: 0, c: 0 }, o: 'H' as const };
    const r1 = applyMove(s, m);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const s2 = r1.value;
    const can2 = canApplyMove(s2, m);
    expect(can2.ok).toBe(false);
    if (!can2.ok) expect(can2.code).toBe('wall_overlap');
    const r2 = applyMove(s2, m);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.code).toBe('wall_overlap');
    // state purity: not modified by failed apply (function returns Result)
    expect(s2.placedWalls.length).toBe(1);
  });

  it('no walls left returns correct error', () => {
    const s = createInitialState();
    const s0 = { ...s, wallsRemaining: { ...s.wallsRemaining, P1: 0 } };
    const m = { type: 'WallPlacement' as const, anchor: { r: 0, c: 0 }, o: 'H' as const };
    const can = canApplyMove(s0, m);
    expect(can.ok).toBe(false);
    if (!can.ok) expect(can.code).toBe('no_walls_left');
  });

  it('rejects illegal pawn move and returns stable code', () => {
    const s = createInitialState();
    const illegal = { type: 'PawnMove' as const, to: { r: 2, c: 4 } }; // too far from start
    const can = canApplyMove(s, illegal);
    expect(can.ok).toBe(false);
    if (!can.ok) expect(can.code).toBe('illegal_pawn_move');
    const res = applyMove(s, illegal);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('illegal_pawn_move');
  });

  it('applies pawn move immutably and flips turn', () => {
    const s = createInitialState();
    const moves = legalMoves(s);
    const pawn = moves.find((m) => m.type === 'PawnMove');
    if (!pawn) throw new Error('Expected at least one pawn move');
    const res = applyMove(s, pawn);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const s2 = res.value;
    expect(s2.turn).toBe('P2');
    expect(s2.pawns.P1).toEqual(pawn.to);
    expect(s2.history[s2.history.length - 1]).toEqual(pawn);
    // original unchanged
    expect(s.turn).toBe('P1');
  });
});
