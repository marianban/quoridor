import { describe, it, expect } from 'vitest';
import { createInitialState, applyMove } from './index.js';
import {
  edgeKey,
  edgesForWall,
  neighbors,
  hasPathToGoal,
  generatePawnMoves,
  canPlaceWall,
  clampWallAnchor,
} from './rules.js';

describe('rules utilities', () => {
  it('edgeKey normalizes order', () => {
    const a = { r: 1, c: 2 };
    const b = { r: 0, c: 2 };
    expect(edgeKey(a, b)).toBe('0,2|1,2');
    expect(edgeKey(b, a)).toBe('0,2|1,2');
  });

  it('edgesForWall maps anchors to segments', () => {
    expect(edgesForWall({ r: 0, c: 0, o: 'H' })).toEqual(['0,0|0,1', '1,0|1,1']);
    expect(edgesForWall({ r: 3, c: 4, o: 'V' })).toEqual(['3,4|4,4', '3,5|4,5']);
  });

  it('neighbors excludes blocked directions', () => {
    const s = createInitialState();
    // With no walls, center has 4 neighbors
    expect(neighbors(s, { r: 4, c: 4 }).length).toBe(4);
  });

  it('hasPathToGoal is true initially for both players', () => {
    const s = createInitialState();
    expect(hasPathToGoal(s, 'P1')).toBe(true);
    expect(hasPathToGoal(s, 'P2')).toBe(true);
  });

  it('clampWallAnchor normalizes coordinates to 0..boardSize-2', () => {
    expect(clampWallAnchor({ r: 0, c: 0 }, 9)).toEqual({ r: 0, c: 0 });
    expect(clampWallAnchor({ r: 8, c: 8 }, 9)).toEqual({ r: 7, c: 7 });
    expect(clampWallAnchor({ r: -1, c: 12 }, 9)).toEqual({ r: 0, c: 7 });
  });

  it('generatePawnMoves initial state P1 has 3', () => {
    const s = createInitialState();
    const m = generatePawnMoves(s, 'P1').sort((a, b) => a.r - b.r || a.c - b.c);
    expect(m).toEqual([
      { r: 0, c: 3 },
      { r: 0, c: 5 },
      { r: 1, c: 4 },
    ]);
  });

  it('canPlaceWall disallows crossing and preserves paths', () => {
    const s = createInitialState();
    expect(canPlaceWall(s, { r: 0, c: 0, o: 'H' }).ok).toBe(true);
    // place H(0,0) then crossing V(0,0) should be disallowed
    const res = applyMove(s, { type: 'WallPlacement', anchor: { r: 0, c: 0 }, o: 'H' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      const s2 = res.value;
      expect(canPlaceWall(s2, { r: 0, c: 0, o: 'V' }).ok).toBe(false);
    }
  });

  describe('pawn jumps and diagonals', () => {
    it('straight jump forward allows only the jump in that direction (no diagonals), other orth moves remain', () => {
      const s = createInitialState();
      const s1 = {
        ...s,
        pawns: { P1: { r: 3, c: 4 }, P2: { r: 4, c: 4 } },
      } as const;
      const m = generatePawnMoves(s1, 'P1');
      const has = (r: number, c: number) => m.some((p) => p.r === r && p.c === c);
      // jump over opponent
      expect(has(5, 4)).toBe(true);
      // diagonals around opponent should NOT be present when straight jump is available
      expect(has(4, 3)).toBe(false);
      expect(has(4, 5)).toBe(false);
      // other directions still allowed
      expect(has(2, 4)).toBe(true); // up
      expect(has(3, 3)).toBe(true); // left
      expect(has(3, 5)).toBe(true); // right
    });

    it('diagonal-around when jump is blocked by a wall', () => {
      const base = createInitialState();
      const s1 = {
        ...base,
        pawns: { P1: { r: 3, c: 4 }, P2: { r: 4, c: 4 } },
      } as const;
      // Block the edge from opponent (4,4) to beyond (5,4) with vertical wall at (4,4)
      const segs = edgesForWall({ r: 4, c: 4, o: 'V' });
      const s2 = { ...s1, blockedEdges: [...s1.blockedEdges, ...segs] } as const;
      const m = generatePawnMoves(s2, 'P1');
      const has = (r: number, c: number) => m.some((p) => p.r === r && p.c === c);
      // straight jump not allowed
      expect(has(5, 4)).toBe(false);
      // diagonals allowed
      expect(has(4, 3)).toBe(true);
      expect(has(4, 5)).toBe(true);
      // other orth moves still allowed
      expect(has(2, 4)).toBe(true);
      expect(has(3, 3)).toBe(true);
      expect(has(3, 5)).toBe(true);
    });

    it('diagonal-around when jump is impossible due to board edge', () => {
      const s = createInitialState();
      const s1 = {
        ...s,
        pawns: { P1: { r: 7, c: 4 }, P2: { r: 8, c: 4 } },
      } as const;
      const m = generatePawnMoves(s1, 'P1');
      const has = (r: number, c: number) => m.some((p) => p.r === r && p.c === c);
      // no straight jump (beyond would be out of bounds)
      expect(has(9, 4)).toBe(false);
      // diagonals allowed
      expect(has(8, 3)).toBe(true);
      expect(has(8, 5)).toBe(true);
      // other orth moves still allowed
      expect(has(6, 4)).toBe(true);
      expect(has(7, 3)).toBe(true);
      expect(has(7, 5)).toBe(true);
    });

    it('P2 diagonal-around when jump is impossible due to top edge', () => {
      const s = createInitialState();
      const s1 = {
        ...s,
        pawns: { P1: { r: 0, c: 4 }, P2: { r: 1, c: 4 } },
      } as const;
      const m = generatePawnMoves(s1, 'P2');
      const has = (r: number, c: number) => m.some((p) => p.r === r && p.c === c);
      // no straight jump (beyond would be out of bounds)
      expect(has(-1 as unknown as number, 4)).toBe(false);
      // diagonals allowed
      expect(has(0, 3)).toBe(true);
      expect(has(0, 5)).toBe(true);
      // other orth moves still allowed
      expect(has(2, 4)).toBe(true);
      expect(has(1, 3)).toBe(true);
      expect(has(1, 5)).toBe(true);
    });
  });
});
