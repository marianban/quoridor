import { describe, it, expect } from 'vitest';
import { applyMove, canApplyMove, createInitialState, legalMoves } from './index';

function applyOrThrow(state: ReturnType<typeof createInitialState>, move: Parameters<typeof applyMove>[1]) {
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

describe('legalMoves snapshots (mid-game)', () => {
  it('Scenario A: light center walls and early pawn advances', () => {
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

    const moves = legalMoves(s);
    expect(moves).toMatchSnapshot();
  });

  it('Scenario B: denser mid-board walls, both pawns near center', () => {
    let s = createInitialState();
    // P1: to (1,4)
    s = applyOrThrow(s, pickPawnMoveTo(s, 1, 4));
    // P2: to (7,4)
    s = applyOrThrow(s, pickPawnMoveTo(s, 7, 4));
    // P1: H(3,3)
    s = applyOrThrow(s, { type: 'WallPlacement', anchor: { r: 3, c: 3 }, o: 'H' });
    // P2: V(3,5)
    s = applyOrThrow(s, { type: 'WallPlacement', anchor: { r: 3, c: 5 }, o: 'V' });
  // P1: H(5,3) (avoid overlap with H(3,3))
  s = applyOrThrow(s, { type: 'WallPlacement', anchor: { r: 5, c: 3 }, o: 'H' });
    // P2: V(2,3)
    s = applyOrThrow(s, { type: 'WallPlacement', anchor: { r: 2, c: 3 }, o: 'V' });

    const moves = legalMoves(s);
    expect(moves).toMatchSnapshot();
  });

  it('Scenario C: near-terminal pawns with some walls', () => {
    let s = createInitialState();
    // P1: to (1,4)
    s = applyOrThrow(s, pickPawnMoveTo(s, 1, 4));
    // P2: to (7,4)
    s = applyOrThrow(s, pickPawnMoveTo(s, 7, 4));
    // P1: to (2,4)
    s = applyOrThrow(s, pickPawnMoveTo(s, 2, 4));
    // P2: to (6,4)
    s = applyOrThrow(s, pickPawnMoveTo(s, 6, 4));
    // P1: place a couple of walls that don't block path
    s = applyOrThrow(s, { type: 'WallPlacement', anchor: { r: 4, c: 1 }, o: 'H' });
    s = applyOrThrow(s, { type: 'WallPlacement', anchor: { r: 1, c: 6 }, o: 'V' });

    const moves = legalMoves(s);
    expect(moves).toMatchSnapshot();
  });
});
