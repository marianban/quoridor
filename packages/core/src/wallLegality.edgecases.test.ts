import { describe, it, expect } from 'vitest';
import { applyMove, canApplyMove, createInitialState } from './index';
import { edgesForWall } from './rules';

describe('wall legality edge cases', () => {
  it('rejects out-of-bounds wall anchors', () => {
    const s = createInitialState();
    expect(canApplyMove(s, { type: 'WallPlacement', anchor: { r: 8, c: 7 }, o: 'H' }).ok).toBe(
      false,
    );
    expect(canApplyMove(s, { type: 'WallPlacement', anchor: { r: 7, c: 8 }, o: 'V' }).ok).toBe(
      false,
    );
    expect(
      canApplyMove(s, {
        type: 'WallPlacement',
        anchor: { r: -1 as unknown as number, c: 0 },
        o: 'H',
      }).ok,
    ).toBe(false);
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

  it('disallows partial overlap for same-orientation walls', () => {
    const s = createInitialState();
    const r1 = applyMove(s, { type: 'WallPlacement', anchor: { r: 4, c: 3 }, o: 'V' });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const s1 = r1.value;
    const vOverlap = canApplyMove(s1, { type: 'WallPlacement', anchor: { r: 5, c: 3 }, o: 'V' });
    expect(vOverlap.ok).toBe(false);
    if (!vOverlap.ok) expect(vOverlap.code).toBe('wall_overlap');

    const r2 = applyMove(s, { type: 'WallPlacement', anchor: { r: 2, c: 2 }, o: 'H' });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    const s2 = r2.value;
    const hOverlap = canApplyMove(s2, { type: 'WallPlacement', anchor: { r: 2, c: 3 }, o: 'H' });
    expect(hOverlap.ok).toBe(false);
    if (!hOverlap.ok) expect(hOverlap.code).toBe('wall_overlap');
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

  it('rejects wall that would remove the last path by closing the only gap', () => {
    // Create a horizontal barrier between rows 4 and 5 by blocking vertical edges (4,c)-(5,c) for all c except c=4
    let s = createInitialState();
    const barrier: string[] = [];
    for (let c = 0; c <= 8; c++) {
      if (c === 4 || c === 5) continue; // leave two adjacent gaps at columns 4 and 5
      barrier.push(`4,${c}|5,${c}`);
    }
    s = { ...s, blockedEdges: barrier };
    // Attempt to place a vertical wall at (4,4) which blocks (4,4)-(5,4) and (4,5)-(5,5), closing the gap
    const attempt = canApplyMove(s, { type: 'WallPlacement', anchor: { r: 4, c: 4 }, o: 'V' });
    expect(attempt.ok).toBe(false);
    if (!attempt.ok) expect(attempt.code).toBe('no_path_after_placement');
  });

  it('disallows perpendicular crossing at corner anchor (7,7)', () => {
    const s = createInitialState();
    const r1 = applyMove(s, { type: 'WallPlacement', anchor: { r: 7, c: 7 }, o: 'H' });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const s1 = r1.value;
    const cross = canApplyMove(s1, { type: 'WallPlacement', anchor: { r: 7, c: 7 }, o: 'V' });
    expect(cross.ok).toBe(false);
    if (!cross.ok) expect(cross.code).toBe('wall_cross');
  });
});
