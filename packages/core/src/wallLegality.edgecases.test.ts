import { describe, it, expect } from 'vitest';
import { applyMove, canApplyMove, createInitialState } from './index';
import { edgesForWall } from './rules';

describe('wall legality edge cases', () => {
  it('rejects out-of-bounds wall anchors', () => {
    const s = createInitialState();
    expect(canApplyMove(s, { type: 'WallPlacement', anchor: { r: 8, c: 7 }, o: 'H' }).ok).toBe(false);
    expect(canApplyMove(s, { type: 'WallPlacement', anchor: { r: 7, c: 8 }, o: 'V' }).ok).toBe(false);
    expect(canApplyMove(s, { type: 'WallPlacement', anchor: { r: -1 as unknown as number, c: 0 }, o: 'H' }).ok).toBe(false);
  });

  it('disallows overlap and crossing at same anchor', () => {
    const s = createInitialState();
    // Place H(3,3)
    const r1 = applyMove(s, { type: 'WallPlacement', anchor: { r: 3, c: 3 }, o: 'H' });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const s1 = r1.value;
    // Overlap same wall
    const overlap = canApplyMove(s1, { type: 'WallPlacement', anchor: { r: 3, c: 3 }, o: 'H' });
    expect(overlap.ok).toBe(false);
    if (!overlap.ok) expect(overlap.code).toBe('wall_overlap');
    // Crossing perpendicular at same anchor
    const cross = canApplyMove(s1, { type: 'WallPlacement', anchor: { r: 3, c: 3 }, o: 'V' });
    expect(cross.ok).toBe(false);
    if (!cross.ok) expect(cross.code).toBe('wall_cross');
  });

  it('allows adjacent end-to-end horizontal walls', () => {
    const s = createInitialState();
    const r1 = applyMove(s, { type: 'WallPlacement', anchor: { r: 0, c: 0 }, o: 'H' });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const s1 = r1.value;
    const can2 = canApplyMove(s1, { type: 'WallPlacement', anchor: { r: 0, c: 1 }, o: 'H' });
    expect(can2.ok).toBe(true);
    const r2 = applyMove(s1, { type: 'WallPlacement', anchor: { r: 0, c: 1 }, o: 'H' });
    expect(r2.ok).toBe(true);
  });

  it('allows perpendicular adjacency that touches at an end but does not cross', () => {
    const s = createInitialState();
    const r1 = applyMove(s, { type: 'WallPlacement', anchor: { r: 3, c: 3 }, o: 'H' });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const s1 = r1.value;
    // V(3,4) should be allowed (touches end of H(3,3) without crossing)
    const can2 = canApplyMove(s1, { type: 'WallPlacement', anchor: { r: 3, c: 4 }, o: 'V' });
    expect(can2.ok).toBe(true);
  });

  it('accepts corner anchor (7,7) and updates blocked edges accordingly', () => {
    const s = createInitialState();
    const r1 = applyMove(s, { type: 'WallPlacement', anchor: { r: 7, c: 7 }, o: 'H' });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const s1 = r1.value;
    const segs = edgesForWall({ r: 7, c: 7, o: 'H' });
    for (const e of segs) expect(s1.blockedEdges).toContain(e);
  });
});
