#!/usr/bin/env node
import readline from 'readline';
import { Game } from '@quoridor/core';
import type { Move } from '@quoridor/core';
import { renderBoard } from './render.js';

type Cmd =
  | { kind: 'move'; to: string }
  | { kind: 'wall'; anchor: string; o: 'H' | 'V' }
  | { kind: 'demo' }
  | { kind: 'help' }
  | { kind: 'quit' };

function parse(input: string): Cmd | null {
  const t = input.trim();
  if (!t) return null;
  if (t === 'help' || t === '?') return { kind: 'help' };
  if (t === 'quit' || t === 'exit') return { kind: 'quit' };
  if (t === 'demo') return { kind: 'demo' };
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

// rendering moved to ./render.ts and imported as renderBoard

function parseCoord(s: string): { r: number; c: number } | null {
  const m = s.match(/^(\d+),(\d+)$/);
  if (!m) return null;
  return { r: Number(m[1]), c: Number(m[2]) };
}

function help(): string {
  return [
    'Commands:',
    '  move r,c         # move pawn to coordinate (e.g., move 1,4)',
    '  wall r,c O       # place wall at anchor r,c with orientation O in {H,V} (e.g., wall 3,3 H)',
    '  demo             # reset to a curated demo position with a few walls',
    '  help             # show this help',
    '  quit             # exit',
  ].join('\n');
}

function buildDemoGame(): Game {
  // Start from initial and apply a small, clearly legal sequence of moves and walls.
  // Goals: non-start pawn positions and a mix of horizontal and vertical walls without crossings.
  let g = Game.initial();
  const script: Move[] = [
    { type: 'PawnMove', to: { r: 1, c: 4 } }, // P1 down one
    { type: 'PawnMove', to: { r: 7, c: 4 } }, // P2 up one
    { type: 'WallPlacement', anchor: { r: 2, c: 2 }, o: 'H' }, // P1 H near top-left quadrant
    { type: 'WallPlacement', anchor: { r: 4, c: 6 }, o: 'V' }, // P2 V on right side
    { type: 'PawnMove', to: { r: 2, c: 4 } }, // P1 down one
    { type: 'PawnMove', to: { r: 6, c: 4 } }, // P2 up one
    { type: 'WallPlacement', anchor: { r: 5, c: 1 }, o: 'V' }, // P1 V on left side
    { type: 'WallPlacement', anchor: { r: 3, c: 5 }, o: 'H' }, // P2 H mid-right
  ];

  for (const move of script) {
    const res = g.applyMove(move); // apply in order; the Game API validates legality
    if (!res.ok) {
      // If any scripted step fails (unexpected), stop early with what we have.
      break;
    }
    g = res.value;
  }
  return g;
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
    if (cmd.kind === 'demo') {
      g = buildDemoGame();
      console.log(renderBoard(g));
      console.log(fmtStateBanner(g));
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
