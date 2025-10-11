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
    const idx = (c: number) => c * 2;
    expect(lines[0][idx(4)]).toBe('1');
    // right neighbor should be '*'
    expect(lines[0][idx(5)]).toBe('*');
    // left neighbor should be '*'
    expect(lines[0][idx(3)]).toBe('*');
    // below on next cell row (lines[2]) same column index
    expect(lines[2][idx(4)]).toBe('*');
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
    const idx = (c: number) => c * 2;

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
        const barIdx = idx(c) + 1; // between c and c+1
        expect(cellRow[barIdx]).toBe('|');
      } else if (c1 === c2) {
        // vertical adjacency (between rows): expect '-'
        const c = c1,
          r = Math.min(r1, r2);
        const wallRow = lines[r * 2 + 1];
        expect(wallRow[idx(c)]).toBe('-');
      }
    }
  });

  it('buildBlockedMaps maps edges correctly', () => {
    const { hBlock, vBlock } = buildBlockedMaps([
      '0,0|0,1', // horizontal adjacency -> hBlock[0][0]
      '1,2|2,2', // vertical adjacency -> vBlock[1][2]
    ]);
    expect(hBlock[0][0]).toBe(true);
    expect(vBlock[1][2]).toBe(true);
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
    expect(cellCharAt(g.state, hs, 0, 4)).toBe('1');
    expect(cellCharAt(g.state, hs, 8, 4)).toBe('2');
    // A highlighted move
    expect(cellCharAt(g.state, hs, 0, 5)).toBe('*');
    // Non-highlight empty
    expect(cellCharAt(g.state, hs, 0, 0)).toBe('.');
  });

  it('renderCellLine and renderWallLine compose correctly', () => {
    const g = Game.initial();
    const { hBlock, vBlock } = buildBlockedMaps(['0,0|0,1', '0,4|0,5', '0,7|0,8', '0,0|1,0']);
    const hs = computePawnHighlights(g.state);
    const row0 = renderCellLine(g.state, hs, hBlock[0], 0);
    const wall0 = renderWallLine(vBlock[0]);
    // Expect '|' positions at between cells (0|1), (4|5), (7|8) -> indices 1, 9, 15
    expect(row0[1]).toBe('|');
    expect(row0[9]).toBe('|');
    expect(row0[15]).toBe('|');
    // Expect '-' at column 0 under row 0
    expect(wall0[0]).toBe('-');
  });
});
