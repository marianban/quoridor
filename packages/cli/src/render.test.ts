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
    // Pick a guaranteed-legal wall from legalMoves and verify ASCII by inspecting blockedEdges
    let g = Game.initial();
    const moves = legalMoves(g.state);
    const wall = moves.find(
      (m: Move): m is Extract<Move, { type: 'WallPlacement' }> => m.type === 'WallPlacement',
    );
    expect(wall).toBeDefined();
    if (!wall) throw new Error('No wall move found');
    const res = g.applyMove(wall);
    expect(res.ok).toBe(true);
    if (res.ok) g = res.value;

    const s = renderBoardState(g.state);
    const lines = s.split('\n');
    const si = (c: number) => c * 3;

    // For each blocked edge, check the ASCII matches
    for (const e of g.state.blockedEdges) {
      const [a, b] = e.split('|');
      const [r1s, c1s] = a.split(',');
      const [r2s, c2s] = b.split(',');
      const r1 = Number(r1s),
        c1 = Number(c1s),
        r2 = Number(r2s),
        c2 = Number(c2s);
      if (r1 === r2) {
        // horizontal adjacency (between cells in same row): expect '|'
        const r = r1,
          c = Math.min(c1, c2);
        const cellRow = lines[r * 2];
        const barIdx = si(c) + 2; // between c and c+1 after 2-char token
        expect(cellRow[barIdx]).toBe('|');
      } else if (c1 === c2) {
        // vertical adjacency (between rows): expect '-'
        const c = c1,
          r = Math.min(r1, r2);
        const wallRow = lines[r * 2 + 1];
        expect(wallRow.slice(si(c), si(c) + 2)).toBe('--');
      }
    }
  });

  it('buildBlockedMaps maps walls correctly', () => {
    const g = Game.initial();
    // simulate two walls
    const state = {
      ...g.state,
      placedWalls: [
        { r: 0, c: 0, o: 'H' }, // should set hBlock[0][0] and hBlock[1][0]
        { r: 1, c: 2, o: 'V' }, // should set vBlock[1][2] and vBlock[1][3]
      ],
    } as typeof g.state;
    const { hBlock, vBlock } = buildBlockedMaps(state);
    expect(hBlock[0][0]).toBe(true);
    expect(hBlock[1][0]).toBe(true);
    expect(vBlock[1][2]).toBe(true);
    expect(vBlock[1][3]).toBe(true);
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
        { r: 0, c: 0, o: 'V' }, // '-' at c=0
        { r: 0, c: 4, o: 'V' }, // '-' at c=4
        { r: 0, c: 7, o: 'V' }, // '-' at c=7
        { r: 0, c: 0, o: 'H' }, // '|' at c=0 on rows 0 and 1
      ],
    } as typeof g.state;
    const { hBlock, vBlock } = buildBlockedMaps(state);
    const hs = computePawnHighlights(g.state);
    const row0 = renderCellLine(g.state, hs, hBlock[0], 0);
    const wall0 = renderWallLine(vBlock[0]);
    const si = (c: number) => c * 3;
    // Expect '|' from the H wall at c=0 between cells (0|1) -> index 2
    expect(row0[si(0) + 2]).toBe('|');
    // '|' at c=4 and c=7 should not be set on row0 (those were V walls -> '-')
    expect(row0[si(4) + 2]).toBe(' ');
    expect(row0[si(7) + 2]).toBe(' ');
    // Expect '--' at columns 0,4,7 under row 0
    expect(wall0.slice(si(0), si(0) + 2)).toBe('--');
    expect(wall0.slice(si(4), si(4) + 2)).toBe('--');
    expect(wall0.slice(si(7), si(7) + 2)).toBe('--');
  });
});
