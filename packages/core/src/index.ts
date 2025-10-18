import type {
  Coord,
  CreateOptions,
  GameState,
  Move,
  Orientation,
  Player,
  Result,
  WallPlacement,
  PawnMove,
} from './types';
import {
  canPlaceWall,
  generatePawnMoves,
  edgesForWall,
  inBoundsCell,
  isBlocked,
  isOccupied,
} from './rules.js';

export { type Coord, type GameState, type Move, type Player, type Result } from './types';
export { Game } from './game.js';

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
  pawnMoves.sort((a, b) => a.to.r - b.to.r || a.to.c - b.to.c);
  walls.sort(
    (a, b) =>
      (a.o === b.o ? 0 : a.o === 'H' ? -1 : 1) ||
      a.anchor.r - b.anchor.r ||
      a.anchor.c - b.anchor.c,
  );
  return [...pawnMoves, ...walls];
}

export function canApplyMove(state: GameState, move: Move, player?: Player): Result<void> {
  if (isTerminal(state)) return { ok: false, code: 'already_terminal', reason: 'Game ended' };
  const who = player ?? state.turn;
  if (who !== state.turn)
    return { ok: false, code: 'not_your_turn', reason: 'Move attempted by non-active player' };
  if (move.type === 'PawnMove') {
    return validatePawnMove(state, who, move);
  }
  // WallPlacement
  const remaining = state.wallsRemaining[who];
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
  const wallsRemaining: GameState['wallsRemaining'] = {
    ...state.wallsRemaining,
    [who]: state.wallsRemaining[who] - 1,
  };
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

function validatePawnMove(state: GameState, who: Player, move: PawnMove): Result<void> {
  const from = state.pawns[who];
  const to = move.to;
  if (!inBoundsCell(to))
    return { ok: false, code: 'bounds_cell', reason: 'Destination cell out of bounds' };
  if (from.r === to.r && from.c === to.c)
    return { ok: false, code: 'illegal_pawn_move', reason: 'Pawn must move to a new cell' };
  if (isOccupied(state, to))
    return { ok: false, code: 'illegal_pawn_move', reason: 'Destination already occupied' };

  const other: Player = who === 'P1' ? 'P2' : 'P1';
  const opp = state.pawns[other];
  const dr = to.r - from.r;
  const dc = to.c - from.c;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);
  const step = (delta: number): number => (delta > 0 ? 1 : delta < 0 ? -1 : 0);
  const blockedBetween = (a: Coord, b: Coord) => isBlocked(state.blockedEdges, a, b);

  if ((adr === 1 && adc === 0) || (adr === 0 && adc === 1)) {
    const next: Coord = { r: from.r + step(dr), c: from.c + step(dc) };
    if (blockedBetween(from, next))
      return { ok: false, code: 'illegal_pawn_move', reason: 'Path blocked by wall' };
    return { ok: true, value: undefined };
  }

  if ((adr === 2 && adc === 0) || (adr === 0 && adc === 2)) {
    const dir: Coord = { r: step(dr), c: step(dc) };
    const mid: Coord = { r: from.r + dir.r, c: from.c + dir.c };
    if (mid.r !== opp.r || mid.c !== opp.c)
      return { ok: false, code: 'illegal_jump', reason: 'No opponent to jump over' };
    if (blockedBetween(from, mid) || blockedBetween(mid, to))
      return { ok: false, code: 'illegal_jump', reason: 'Jump path blocked' };
    return { ok: true, value: undefined };
  }

  if (adr === 1 && adc === 1) {
    const verticalDir = step(dr);
    const horizontalDir = step(dc);
    const verticalAdj: Coord = { r: from.r + verticalDir, c: from.c };
    const horizontalAdj: Coord = { r: from.r, c: from.c + horizontalDir };
    let direction: Coord | null = null;
    if (verticalAdj.r === opp.r && verticalAdj.c === opp.c) {
      direction = { r: verticalDir, c: 0 };
    } else if (horizontalAdj.r === opp.r && horizontalAdj.c === opp.c) {
      direction = { r: 0, c: horizontalDir };
    }
    if (!direction)
      return {
        ok: false,
        code: 'illegal_pawn_move',
        reason: 'Diagonal move requires adjacent opponent',
      };
    const adj: Coord = { r: from.r + direction.r, c: from.c + direction.c };
    const beyond: Coord = { r: adj.r + direction.r, c: adj.c + direction.c };
    const straightAvailable =
      inBoundsCell(beyond) && !blockedBetween(adj, beyond) && !isOccupied(state, beyond);
    if (straightAvailable)
      return {
        ok: false,
        code: 'diagonal_not_allowed',
        reason: 'Straight jump is available instead of diagonal',
      };
    // The two perpendicular directions for diagonal moves: if jumping vertically, try left/right; if horizontally, try up/down.
    const sideOptions: Coord[] =
      direction.r !== 0 ? [{ r: 0, c: 1 }, { r: 0, c: -1 }] : [{ r: 1, c: 0 }, { r: -1, c: 0 }];
    for (const side of sideOptions) {
      const sideCell: Coord = { r: from.r + side.r, c: from.c + side.c };
      const diag: Coord = { r: adj.r + side.r, c: adj.c + side.c };
      if (diag.r === to.r && diag.c === to.c) {
        if (!inBoundsCell(sideCell) || !inBoundsCell(diag))
          return {
            ok: false,
            code: 'illegal_pawn_move',
            reason: 'Diagonal path leaves the board',
          };
        if (blockedBetween(from, sideCell) || blockedBetween(adj, diag))
          return { ok: false, code: 'illegal_pawn_move', reason: 'Diagonal path blocked by wall' };
        return { ok: true, value: undefined };
      }
    }
    return {
      ok: false,
      code: 'illegal_pawn_move',
      reason: 'Diagonal destination not reachable around opponent',
    };
  }

  return { ok: false, code: 'illegal_pawn_move', reason: 'Move not allowed by pawn rules' };
}

function isGameState(x: unknown): x is GameState {
  const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object';
  const isCoord = (v: unknown): v is { r: number; c: number } =>
    isObj(v) && typeof v['r'] === 'number' && typeof v['c'] === 'number';
  const isValidWall = (w: unknown): boolean =>
    isObj(w) &&
    typeof w['r'] === 'number' &&
    typeof w['c'] === 'number' &&
    w['r'] >= 0 &&
    w['r'] <= 7 &&
    w['c'] >= 0 &&
    w['c'] <= 7 &&
    (w['o'] === 'H' || w['o'] === 'V');

  if (!isObj(x)) return false;
  const obj = x;
  if (obj['boardSize'] !== 9) return false;
  if (obj['turn'] !== 'P1' && obj['turn'] !== 'P2') return false;

  const pawns = obj['pawns'];
  if (!isObj(pawns)) return false;
  if (!isCoord(pawns['P1']) || !isCoord(pawns['P2'])) return false;

  const wallsRem = obj['wallsRemaining'];
  if (!isObj(wallsRem)) return false;
  if (typeof wallsRem['P1'] !== 'number' || typeof wallsRem['P2'] !== 'number') return false;

  if (
    !Array.isArray(obj['placedWalls']) ||
    !Array.isArray(obj['blockedEdges']) ||
    !Array.isArray(obj['history'])
  )
    return false;

  if (!obj['placedWalls'].every(isValidWall)) return false;

  const edgeRe = /^\d+,\d+\|\d+,\d+$/;
  if (!obj['blockedEdges'].every((s) => typeof s === 'string' && edgeRe.test(s))) return false;

  const isHistPawnMove = (m: unknown): boolean =>
    isObj(m) && m['type'] === 'PawnMove' && isCoord(m['to']);
  const isHistWallPlacement = (m: unknown): boolean =>
    isObj(m) &&
    m['type'] === 'WallPlacement' &&
    isValidWall({
      r: isObj(m['anchor']) ? m['anchor']['r'] : undefined,
      c: isObj(m['anchor']) ? m['anchor']['c'] : undefined,
      o: m['o'],
    });
  if (!obj['history'].every((m) => isHistPawnMove(m) || isHistWallPlacement(m))) return false;

  return true;
}
