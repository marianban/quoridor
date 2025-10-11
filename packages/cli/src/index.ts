#!/usr/bin/env node
import readline from 'readline';
import { Game, legalMoves } from '@quoridor/core';

type Cmd = { kind: 'move'; to: string } | { kind: 'wall'; anchor: string; o: 'H' | 'V' } | { kind: 'help' } | { kind: 'quit' };

function parse(input: string): Cmd | null {
  const t = input.trim();
  if (!t) return null;
  if (t === 'help' || t === '?') return { kind: 'help' };
  if (t === 'quit' || t === 'exit') return { kind: 'quit' };
  const parts = t.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  if (cmd === 'move' && parts[1]) return { kind: 'move', to: parts[1] };
  if (cmd === 'wall' && parts[1] && parts[2]) {
    const o = parts[2].toUpperCase();
    if (o === 'H' || o === 'V') return { kind: 'wall', anchor: parts[1], o };
  }
  return null;
}

function fmtStateBanner(g: Game): string {
  const { P1, P2 } = g.state.pawns;
  const { P1: w1, P2: w2 } = g.state.wallsRemaining;
  return `Turn: ${g.turn} | P1 @ (${P1.r},${P1.c}) w=${w1} | P2 @ (${P2.r},${P2.c}) w=${w2}`;
}

function renderBoard(g: Game): string {
  // Build blocked edge maps from state.blockedEdges
  const hBlock: boolean[][] = Array.from({ length: 9 }, () => Array(8).fill(false)); // between (r,c)-(r,c+1)
  const vBlock: boolean[][] = Array.from({ length: 8 }, () => Array(9).fill(false)); // between (r,c)-(r+1,c)
  for (const e of g.state.blockedEdges) {
    const [a, b] = e.split('|');
    const [r1s, c1s] = a.split(',');
    const [r2s, c2s] = b.split(',');
    const r1 = Number(r1s), c1 = Number(c1s), r2 = Number(r2s), c2 = Number(c2s);
    if (r1 === r2) {
      // horizontal adjacency edge
      const r = r1; const c = Math.min(c1, c2);
      if (r >= 0 && r <= 8 && c >= 0 && c <= 7) hBlock[r][c] = true;
    } else if (c1 === c2) {
      // vertical adjacency edge
      const c = c1; const r = Math.min(r1, r2);
      if (r >= 0 && r <= 7 && c >= 0 && c <= 8) vBlock[r][c] = true;
    }
  }

  // Compute highlight set for legal pawn destinations
  const highlight = new Set<string>();
  for (const m of legalMoves(g.state)) {
    if ((m as any).type === 'PawnMove') {
      const to = (m as any).to;
      highlight.add(`${to.r},${to.c}`);
    }
  }

  const key = (r: number, c: number) => `${r},${c}`;
  const cellChar = (r: number, c: number): string => {
    if (g.state.pawns.P1.r === r && g.state.pawns.P1.c === c) return '1';
    if (g.state.pawns.P2.r === r && g.state.pawns.P2.c === c) return '2';
    return highlight.has(key(r, c)) ? '*' : '.';
  };

  const lines: string[] = [];
  for (let r = 0; r < 9; r++) {
    // Cell line with horizontal wall indicators between cells
    let cellLine = '';
    for (let c = 0; c < 9; c++) {
      cellLine += cellChar(r, c);
      if (c < 8) cellLine += hBlock[r][c] ? '|' : ' ';
    }
    lines.push(cellLine);
    // Wall line between rows
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

function parseCoord(s: string): { r: number; c: number } | null {
  const m = s.match(/^(\d+),(\d+)$/);
  if (!m) return null;
  return { r: Number(m[1]), c: Number(m[2]) };
}

function help(): string {
  return [
    'Commands:',
    '  move r,c         # move pawn to coordinate (e.g., move 1,4)',
    "  wall r,c O       # place wall at anchor r,c with orientation O in {H,V} (e.g., wall 3,3 H)",
    '  help             # show this help',
    '  quit             # exit',
  ].join('\n');
}

async function main() {
  let g = Game.initial();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

  console.log('Quoridor CLI');
  console.log(help());
  console.log(renderBoard(g));
  console.log(fmtStateBanner(g));

  while (true) {
    if (g.isTerminal()) {
      console.log(`Game over. Winner: ${g.winner()}`);
      break;
    }
    const line = await ask('> ');
    const cmd = parse(line);
    if (!cmd) {
      console.log('Unrecognized. Type help.');
      continue;
    }
    if (cmd.kind === 'quit') break;
    if (cmd.kind === 'help') {
      console.log(help());
      continue;
    }
    if (cmd.kind === 'move') {
      const to = parseCoord(cmd.to);
      if (!to) {
        console.log('Bad coord. Use r,c');
        continue;
      }
      const res = g.applyMove({ type: 'PawnMove', to });
      if (!res.ok) {
        console.log(`Error: ${res.code} - ${res.reason}`);
      } else {
        g = res.value;
  console.log(renderBoard(g));
        console.log(fmtStateBanner(g));
      }
      continue;
    }
    if (cmd.kind === 'wall') {
      const anchor = parseCoord(cmd.anchor);
      if (!anchor) {
        console.log('Bad anchor. Use r,c');
        continue;
      }
      const res = g.applyMove({ type: 'WallPlacement', anchor, o: cmd.o });
      if (!res.ok) {
        console.log(`Error: ${res.code} - ${res.reason}`);
      } else {
        g = res.value;
  console.log(renderBoard(g));
        console.log(fmtStateBanner(g));
      }
    }
  }
  rl.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
