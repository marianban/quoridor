import { describe, it, expect } from 'vitest';
import { createInitialState, applyMove } from './index';
import { edgeKey, edgesForWall, neighbors, hasPathToGoal, generatePawnMoves, canPlaceWall } from './rules';

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
});
