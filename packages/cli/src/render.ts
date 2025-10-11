import { GameState, Move } from '@quoridor/core';
import { legalMoves } from '@quoridor/core';

type PawnMoveLike = Extract<Move, { type: 'PawnMove' }>;
function isPawnMove(m: Move): m is PawnMoveLike {
  return m.type === 'PawnMove';
}

export function buildBlockedMaps(state: GameState): { hBlock: boolean[][]; vBlock: boolean[][] } {
  const hBlock: boolean[][] = Array.from({ length: 9 }, () => Array(8).fill(false)); // '|' between (r,c)-(r,c+1)
  const vBlock: boolean[][] = Array.from({ length: 8 }, () => Array(9).fill(false)); // '-' between (r,c)-(r+1,c)
  for (const w of state.placedWalls) {
    const { r, c, o } = w;
    if (o === 'H') {
      // Horizontal wall blocks horizontal adjacency (rendered as '|') on rows r and r+1 at column c
      if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        hBlock[r][c] = true;
        hBlock[r + 1][c] = true;
      }
    } else {
      // Vertical wall blocks vertical adjacency (rendered as '-') on row r at columns c and c+1
      if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        vBlock[r][c] = true;
        vBlock[r][c + 1] = true;
      }
    }
  }
  return { hBlock, vBlock };
}

export function computePawnHighlights(state: GameState): Set<string> {
  const highlight = new Set<string>();
  for (const m of legalMoves(state)) if (isPawnMove(m)) highlight.add(`${m.to.r},${m.to.c}`);
  return highlight;
}

export function keyOf(r: number, c: number): string {
  return `${r},${c}`;
}

export function cellCharAt(
  state: GameState,
  highlight: ReadonlySet<string>,
  r: number,
  c: number,
): string {
  if (state.pawns.P1.r === r && state.pawns.P1.c === c) return '1';
  if (state.pawns.P2.r === r && state.pawns.P2.c === c) return '2';
  return highlight.has(keyOf(r, c)) ? '*' : '.';
}

export function renderCellLine(
  state: GameState,
  highlight: ReadonlySet<string>,
  hRow: ReadonlyArray<boolean>,
  r: number,
): string {
  let cellLine = '';
  for (let c = 0; c < 9; c++) {
    cellLine += cellCharAt(state, highlight, r, c);
    if (c < 8) cellLine += hRow[c] ? '|' : ' ';
  }
  return cellLine;
}

export function renderWallLine(vRow: ReadonlyArray<boolean>): string {
  let wallLine = '';
  for (let c = 0; c < 9; c++) {
    wallLine += vRow[c] ? '-' : ' ';
    if (c < 8) wallLine += ' ';
  }
  return wallLine;
}

export function renderBoardState(state: GameState): string {
  const { hBlock, vBlock } = buildBlockedMaps(state);
  const highlight = computePawnHighlights(state);

  const lines: string[] = [];
  for (let r = 0; r < 9; r++) {
    lines.push(renderCellLine(state, highlight, hBlock[r], r));
    if (r < 8) lines.push(renderWallLine(vBlock[r]));
  }
  return lines.join('\n');
}

// Convenience wrapper for Game object callers
export function renderBoard(g: { state: GameState }): string {
  return renderBoardState(g.state);
}
