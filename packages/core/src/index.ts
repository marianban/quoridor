import type { CreateOptions, GameState, Move, Orientation, Player, Result, WallPlacement, PawnMove } from './types';
import { canPlaceWall, generatePawnMoves, edgesForWall } from './rules';

export { type Coord, type GameState, type Move, type Player, type Result } from './types';
export { Game } from './game';

export function createInitialState(options?: CreateOptions): GameState {
  return {
    boardSize: 9,
    turn: options?.startingPlayer ?? 'P1',
    pawns: { P1: { r: 0, c: 4 }, P2: { r: 8, c: 4 } },
    wallsRemaining: { P1: 10, P2: 10 },
    placedWalls: [],
    blockedEdges: [],
    history: [],
  };
}

export function legalMoves(state: GameState): Move[] {
  if (isTerminal(state)) return [];
  const who = state.turn;
  // Pawn moves
  const pawnDests = generatePawnMoves(state, who);
  const pawnMoves: PawnMove[] = pawnDests.map((to) => ({ type: 'PawnMove', to }));
  // Wall placements
  const walls: WallPlacement[] = [];
  const remaining = state.wallsRemaining[who];
  if (remaining > 0) {
    for (let r = 0; r <= 7; r++) {
      for (let c = 0; c <= 7; c++) {
        const orientations: Orientation[] = ['H', 'V'];
        for (const o of orientations) {
          const wp: WallPlacement = { type: 'WallPlacement', anchor: { r, c }, o };
          const check = canPlaceWall(state, { r, c, o });
          if (check.ok) walls.push(wp);
        }
      }
    }
  }
  // Deterministic ordering: PawnMove before WallPlacement; sort by tuple
  pawnMoves.sort((a, b) => (a.to.r - b.to.r) || (a.to.c - b.to.c));
  walls.sort((a, b) => (a.o === b.o ? 0 : a.o === 'H' ? -1 : 1) || a.anchor.r - b.anchor.r || a.anchor.c - b.anchor.c);
  return [...pawnMoves, ...walls];
}

export function canApplyMove(state: GameState, move: Move): Result<void> {
  if (isTerminal(state)) return { ok: false, code: 'already_terminal', reason: 'Game ended' };
  // turn check implicit: moves don’t carry player; we validate against state.turn
  if (move.type === 'PawnMove') {
    const allowed = generatePawnMoves(state, state.turn).some((p) => p.r === move.to.r && p.c === move.to.c);
    return allowed ? { ok: true, value: undefined } : { ok: false, code: 'illegal_pawn_move', reason: 'Destination not legal' };
  }
  // WallPlacement
  const remaining = state.wallsRemaining[state.turn];
  if (remaining <= 0) return { ok: false, code: 'no_walls_left', reason: 'No walls remaining' };
  return canPlaceWall(state, { r: move.anchor.r, c: move.anchor.c, o: move.o });
}

export function applyMove(state: GameState, move: Move): Result<GameState> {
  const check = canApplyMove(state, move);
  if (!check.ok) return { ok: false, code: check.code, reason: check.reason };
  if (move.type === 'PawnMove') {
    const who = state.turn;
    const pawns: GameState['pawns'] = { ...state.pawns, [who]: { r: move.to.r, c: move.to.c } };
    const next: GameState = {
      ...state,
      pawns,
      turn: who === 'P1' ? 'P2' : 'P1',
      history: [...state.history, move],
    };
    return { ok: true, value: next };
  }
  // Wall placement
  const who = state.turn;
  const placedWalls = [...state.placedWalls, { r: move.anchor.r, c: move.anchor.c, o: move.o }];
  // compute new blocked edges
  // reuse rules.edgesForWall through canPlaceWall already; recompute here for clarity
  const newEdges = edgesForWall({ r: move.anchor.r, c: move.anchor.c, o: move.o });
  const blockedEdges = [...state.blockedEdges, ...newEdges];
  const wallsRemaining: GameState['wallsRemaining'] = { ...state.wallsRemaining, [who]: state.wallsRemaining[who] - 1 };
  const next: GameState = {
    ...state,
    placedWalls,
    blockedEdges,
    wallsRemaining,
    turn: who === 'P1' ? 'P2' : 'P1',
    history: [...state.history, move],
  };
  return { ok: true, value: next };
}

export function isTerminal(state: GameState): boolean {
  const goal = state.boardSize - 1;
  const p1Win = state.pawns.P1.r === goal;
  const p2Win = state.pawns.P2.r === 0;
  return p1Win || p2Win;
}

export function getWinner(state: GameState): Player | null {
  const goal = state.boardSize - 1;
  if (state.pawns.P1.r === goal) return 'P1';
  if (state.pawns.P2.r === 0) return 'P2';
  return null;
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(json: string): Result<GameState> {
  try {
    const parsed: unknown = JSON.parse(json);
    // Minimal shape check via type guard
    if (isGameState(parsed)) return { ok: true, value: parsed };
  } catch {
    // swallow and return invalid
  }
  return { ok: false, code: 'deserialize_invalid', reason: 'Invalid or incompatible state JSON' };
}

function isGameState(x: unknown): x is GameState {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  if (obj.boardSize !== 9) return false;
  if (obj.turn !== 'P1' && obj.turn !== 'P2') return false;
  const pawns = obj.pawns as unknown;
  if (!pawns || typeof pawns !== 'object') return false;
  const p1 = (pawns as any).P1;
  const p2 = (pawns as any).P2;
  const isCoord = (v: any) => v && typeof v.r === 'number' && typeof v.c === 'number';
  if (!isCoord(p1) || !isCoord(p2)) return false;
  const wallsRem = obj.wallsRemaining as any;
  if (!wallsRem || typeof wallsRem.P1 !== 'number' || typeof wallsRem.P2 !== 'number') return false;
  if (!Array.isArray(obj.placedWalls) || !Array.isArray(obj.blockedEdges) || !Array.isArray(obj.history)) return false;
  return true;
}
