import { describe, it, expect } from 'vitest';
import { Game, legalMoves, type Move } from '@quoridor/core';
import {
  renderBoardState,
  buildBlockedMaps,
  computePawnHighlights,
  keyOf,
  cellCharAt,
  renderCellLine,
  renderWallLine,
} from './render.js';

describe('renderBoardState', () => {
  it('renders initial board with legal moves highlighted', () => {
    const g = Game.initial();
    const s = renderBoardState(g.state);
    // P1 at (0,4), legal moves include (1,4) and (0,3) and (0,5)
    const lines = s.split('\n');
    const si = (c: number) => c * 3; // start index per cell token (2 chars + 1 sep)
    expect(lines[0].slice(si(4), si(4) + 2)).toBe('1 ');
    // right neighbor should be '**'
    expect(lines[0].slice(si(5), si(5) + 2)).toBe('**');
    // left neighbor should be '**'
    expect(lines[0].slice(si(3), si(3) + 2)).toBe('**');
    // below on next cell row (lines[2]) same column index
    expect(lines[2].slice(si(4), si(4) + 2)).toBe('**');
  });

  it('renders walls as separators', () => {
    // Place one H and one V wall and verify ASCII directly.
    let g = Game.initial();
    // Ensure legal placements by selecting from legalMoves
    const ms = legalMoves(g.state);
    const h = ms.find(
      (m): m is Extract<Move, { type: 'WallPlacement' }> => m.type === 'WallPlacement' && m.o === 'H',
    );
    const v = ms.find(
      (m): m is Extract<Move, { type: 'WallPlacement' }> => m.type === 'WallPlacement' && m.o === 'V',
    );
    if (!h || !v) throw new Error('No H/V wall moves found');
    const r1 = g.applyMove(h);
    expect(r1.ok).toBe(true);
    if (r1.ok) g = r1.value;
    // recompute a legal V after placing H to avoid crossing
    const ms2 = legalMoves(g.state);
    const v2 = ms2.find(
      (m): m is Extract<Move, { type: 'WallPlacement' }> => m.type === 'WallPlacement' && m.o === 'V',
    );
    if (!v2) throw new Error('No V wall move found after placing H');
    const r2 = g.applyMove(v2);
    expect(r2.ok).toBe(true);
    if (r2.ok) g = r2.value;

    const s = renderBoardState(g.state);
    const lines = s.split('\n');
    const si = (c: number) => c * 3;
    const hr = h.anchor.r; // under this row
    const hc = h.anchor.c; // at columns c and c+1
  const vr = v2.anchor.r; // bars on rows r and r+1
  const vc = v2.anchor.c; // between vc and vc+1
    // Check horizontal '-' for H
    const wallRow = lines[hr * 2 + 1];
    expect(wallRow.slice(si(hc), si(hc) + 2)).toBe('--');
    expect(wallRow.slice(si(hc + 1), si(hc + 1) + 2)).toBe('--');
    // Check vertical '|' for V on both adjacent cell rows
    const cellRowTop = lines[vr * 2];
    const cellRowBottom = lines[(vr + 1) * 2];
    const barIdx = si(vc) + 2;
    expect(cellRowTop[barIdx]).toBe('|');
    expect(cellRowBottom[barIdx]).toBe('|');
  });

  it('buildBlockedMaps maps walls correctly', () => {
    const g = Game.initial();
    // simulate two walls
    const state = {
      ...g.state,
      placedWalls: [
        { r: 0, c: 0, o: 'H' }, // should set vBlock[0][0] and vBlock[0][1]
        { r: 1, c: 2, o: 'V' }, // should set hBlock[1][2] and hBlock[2][2]
      ],
    } as typeof g.state;
    const { hBlock, vBlock } = buildBlockedMaps(state);
    expect(vBlock[0][0]).toBe(true);
    expect(vBlock[0][1]).toBe(true);
    expect(hBlock[1][2]).toBe(true);
    expect(hBlock[2][2]).toBe(true);
  });

  it('computePawnHighlights returns legal destinations', () => {
    const g = Game.initial();
    const hs = computePawnHighlights(g.state);
    expect(hs.has(keyOf(0, 3))).toBe(true);
    expect(hs.has(keyOf(0, 5))).toBe(true);
    expect(hs.has(keyOf(1, 4))).toBe(true);
  });

  it('cellCharAt renders pieces and highlights', () => {
    const g = Game.initial();
    const hs = computePawnHighlights(g.state);
    // P1 and P2
    expect(cellCharAt(g.state, hs, 0, 4)).toBe('1 ');
    expect(cellCharAt(g.state, hs, 8, 4)).toBe('2 ');
    // A highlighted move
    expect(cellCharAt(g.state, hs, 0, 5)).toBe('**');
    // Non-highlight empty
    expect(cellCharAt(g.state, hs, 0, 0)).toBe('00');
  });

  it('renderCellLine and renderWallLine compose correctly', () => {
    const g = Game.initial();
    const state = {
      ...g.state,
      placedWalls: [
        { r: 0, c: 0, o: 'V' }, // '|' at c=0 on rows 0 and 1
        { r: 0, c: 4, o: 'V' }, // '|' at c=4 on rows 0 and 1
        { r: 0, c: 7, o: 'V' }, // '|' at c=7 on rows 0 and 1
        { r: 0, c: 0, o: 'H' }, // '-' under row 0 at c=0 and c=1
      ],
    } as typeof g.state;
    const { hBlock, vBlock } = buildBlockedMaps(state);
    const hs = computePawnHighlights(g.state);
    const row0 = renderCellLine(g.state, hs, hBlock[0], 0);
    const wall0 = renderWallLine(vBlock[0]);
    const si = (c: number) => c * 3;
    // Expect '|' from the V walls at c=0,4,7 between cells (0|1)
    expect(row0[si(0) + 2]).toBe('|');
    expect(row0[si(4) + 2]).toBe('|');
    expect(row0[si(7) + 2]).toBe('|');
    // Expect '--' under row 0 for H wall at columns 0 and 1 only
    expect(wall0.slice(si(0), si(0) + 2)).toBe('--');
    expect(wall0.slice(si(1), si(1) + 2)).toBe('--');
    // No '-' at 4 or 7 without H walls there
    expect(wall0.slice(si(4), si(4) + 2)).toBe('  ');
    expect(wall0.slice(si(7), si(7) + 2)).toBe('  ');
  });
});
