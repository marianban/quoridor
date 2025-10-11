import { describe, it, expect } from 'vitest';
import { applyMove, canApplyMove, createInitialState, legalMoves } from './index';

function setupScenarioA() {
  let s = createInitialState();
  // P1: down to (1,4)
  s = applyOrThrow(s, pickPawnMoveTo(s, 1, 4));
  // P2: place wall H(4,4)
  s = applyOrThrow(s, { type: 'WallPlacement', anchor: { r: 4, c: 4 }, o: 'H' });
  // P1: place wall V(2,2)
  s = applyOrThrow(s, { type: 'WallPlacement', anchor: { r: 2, c: 2 }, o: 'V' });
  // P2: up to (7,4)
  s = applyOrThrow(s, pickPawnMoveTo(s, 7, 4));
  // P1: place wall H(5,1)
  s = applyOrThrow(s, { type: 'WallPlacement', anchor: { r: 5, c: 1 }, o: 'H' });
  return s;
}

function applyOrThrow(
  state: ReturnType<typeof createInitialState>,
  move: Parameters<typeof applyMove>[1],
) {
  const can = canApplyMove(state, move);
  if (!can.ok) throw new Error(`Illegal move in setup: ${can.code} - ${can.reason}`);
  const res = applyMove(state, move);
  if (!res.ok) throw new Error(`Apply failed in setup: ${res.code} - ${res.reason}`);
  return res.value;
}

function pickPawnMoveTo(state: ReturnType<typeof createInitialState>, r: number, c: number) {
  const ms = legalMoves(state);
  const m = ms.find((x) => x.type === 'PawnMove' && x.to.r === r && x.to.c === c);
  if (!m) throw new Error(`No pawn move to ${r},${c}`);
  return m;
}

describe('performance quick-checks', () => {
  it('legalMoves runs within budget on Scenario A', () => {
    const s = setupScenarioA();
    const start = performance.now();
    const moves = legalMoves(s);
    const elapsed = performance.now() - start;
    expect(moves.length).toBeGreaterThan(0);
    // Target budget: < 10ms typical
    expect(elapsed).toBeLessThan(10);
  });
});
