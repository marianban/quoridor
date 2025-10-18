import { describe, it, expect } from 'vitest';
import { applyMove, canApplyMove, createInitialState, legalMoves, isTerminal } from './index.js';
import { edgesForWall } from './rules.js';

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

  it('rejects jump without adjacent opponent with illegal_jump code', () => {
    const s = createInitialState();
    const illegal = { type: 'PawnMove' as const, to: { r: 2, c: 4 } }; // too far from start
    const can = canApplyMove(s, illegal);
    expect(can.ok).toBe(false);
    if (!can.ok) expect(can.code).toBe('illegal_jump');
    const res = applyMove(s, illegal);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('illegal_jump');
  });

  it('rejects diagonal when straight jump available', () => {
    const base = createInitialState();
    const s: typeof base = {
      ...base,
      pawns: { P1: { r: 4, c: 4 }, P2: { r: 5, c: 4 } },
      turn: 'P1',
    };
    const attempt = { type: 'PawnMove' as const, to: { r: 5, c: 5 } };
    const can = canApplyMove(s, attempt);
    expect(can.ok).toBe(false);
    if (!can.ok) expect(can.code).toBe('diagonal_not_allowed');
  });

  it('allows diagonal when jump is blocked by edge', () => {
    const base = createInitialState();
    const s: typeof base = {
      ...base,
      pawns: { P1: { r: 7, c: 4 }, P2: { r: 8, c: 4 } },
      turn: 'P1',
    };
    const attempt = { type: 'PawnMove' as const, to: { r: 8, c: 5 } };
    const can = canApplyMove(s, attempt);
    expect(can.ok).toBe(true);
  });

  it('rejects pawn move outside the board with bounds_cell code', () => {
    const s = createInitialState();
    const attempt = { type: 'PawnMove' as const, to: { r: -1, c: 4 } };
    const can = canApplyMove(s, attempt);
    expect(can.ok).toBe(false);
    if (!can.ok) expect(can.code).toBe('bounds_cell');
  });

  it('rejects moves from non-active player with not_your_turn code', () => {
    const s = createInitialState();
    const attempt = { type: 'PawnMove' as const, to: { r: 1, c: 4 } };
    const can = canApplyMove(s, attempt, 'P2');
    expect(can.ok).toBe(false);
    if (!can.ok) expect(can.code).toBe('not_your_turn');
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

  it('rejects further moves after terminal with already_terminal code', () => {
    let s = createInitialState();
    // Drive P1 to victory quickly (down moves); P2 makes minimal moves
    for (let i = 0; i < 20 && !isTerminal(s); i++) {
      if (s.turn === 'P1') {
        const startR = s.pawns.P1.r;
        const mv = legalMoves(s).find((m) => m.type === 'PawnMove' && m.to.r > startR);
        if (!mv) break;
        const r = applyMove(s, mv);
        if (r.ok) s = r.value;
      } else {
        const mv2 = legalMoves(s).find((m) => m.type === 'PawnMove');
        if (!mv2) break;
        const r2 = applyMove(s, mv2);
        if (r2.ok) s = r2.value;
      }
    }
    expect(isTerminal(s)).toBe(true);
    // any further move should be rejected by canApplyMove
    const anyMove = { type: 'PawnMove' as const, to: { r: 0, c: 3 } };
    const can = canApplyMove(s, anyMove);
    expect(can.ok).toBe(false);
    if (!can.ok) expect(can.code).toBe('already_terminal');
  });
});
