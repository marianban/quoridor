import { GameState, Move } from '@quoridor/core';
import { legalMoves } from '@quoridor/core';

function isPawnMove(m: Move): m is { type: 'PawnMove'; to: { r: number; c: number } } {
  return (
    (m as any).type === 'PawnMove' &&
    typeof (m as any).to?.r === 'number' &&
    typeof (m as any).to?.c === 'number'
  );
}

export function renderBoardState(state: GameState): string {
  const hBlock: boolean[][] = Array.from({ length: 9 }, () => Array(8).fill(false));
  const vBlock: boolean[][] = Array.from({ length: 8 }, () => Array(9).fill(false));
  for (const e of state.blockedEdges) {
    const [a, b] = e.split('|');
    const [r1s, c1s] = a.split(',');
    const [r2s, c2s] = b.split(',');
    const r1 = Number(r1s),
      c1 = Number(c1s),
      r2 = Number(r2s),
      c2 = Number(c2s);
    if (r1 === r2) {
      const r = r1;
      const c = Math.min(c1, c2);
      if (r >= 0 && r <= 8 && c >= 0 && c <= 7) hBlock[r][c] = true;
    } else if (c1 === c2) {
      const c = c1;
      const r = Math.min(r1, r2);
      if (r >= 0 && r <= 7 && c >= 0 && c <= 8) vBlock[r][c] = true;
    }
  }

  const highlight = new Set<string>();
  for (const m of legalMoves(state)) {
    if (isPawnMove(m)) {
      highlight.add(`${m.to.r},${m.to.c}`);
    }
  }

  const key = (r: number, c: number) => `${r},${c}`;
  const cellChar = (r: number, c: number): string => {
    if (state.pawns.P1.r === r && state.pawns.P1.c === c) return '1';
    if (state.pawns.P2.r === r && state.pawns.P2.c === c) return '2';
    return highlight.has(key(r, c)) ? '*' : '.';
  };

  const lines: string[] = [];
  for (let r = 0; r < 9; r++) {
    let cellLine = '';
    for (let c = 0; c < 9; c++) {
      cellLine += cellChar(r, c);
      if (c < 8) cellLine += hBlock[r][c] ? '|' : ' ';
    }
    lines.push(cellLine);
    if (r < 8) {
      let wallLine = '';
      for (let c = 0; c < 9; c++) {
        wallLine += vBlock[r][c] ? '-' : ' ';
        if (c < 8) wallLine += ' ';
      }
      lines.push(wallLine);
    }
  }
  return lines.join('\n');
}

// Convenience wrapper for Game object callers
export function renderBoard(g: { state: GameState }): string {
  return renderBoardState(g.state);
}
