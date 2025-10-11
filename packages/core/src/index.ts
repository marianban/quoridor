import type { Coord, CreateOptions, GameState, Move, Player, Result } from './types';

export { type Coord, type GameState, type Move, type Player, type Result } from './types';

export function createInitialState(options?: CreateOptions): GameState {
  return {
    boardSize: 9,
    turn: options?.startingPlayer ?? 'P1',
    pawns: { P1: { r: 0, c: 4 }, P2: { r: 8, c: 4 } },
    wallsRemaining: { P1: 10, P2: 10 },
    placedWalls: [],
    blockedEdges: [],
    history: [],
  } as const;
}

export function legalMoves(_state: GameState): Move[] {
  // Stub: returns empty until implemented
  return [];
}

export function canApplyMove(_state: GameState, _move: Move): Result<void> {
  return { ok: true, value: undefined };
}

export function applyMove(state: GameState, move: Move): Result<GameState> {
  const check = canApplyMove(state, move);
  if (!check.ok) return check as Result<GameState>;
  // Stub: return state unchanged but with history appended for now
  return { ok: true, value: { ...state, history: [...state.history, move] } };
}

export function isTerminal(_state: GameState): boolean {
  return false;
}

export function getWinner(_state: GameState): Player | null {
  return null;
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(json: string): Result<GameState> {
  try {
    const parsed = JSON.parse(json) as GameState;
    // Minimal shape check
    if (parsed && parsed.boardSize === 9 && parsed.pawns && parsed.wallsRemaining) {
      return { ok: true, value: parsed };
    }
  } catch (e) {
    // fallthrough
  }
  return { ok: false, code: 'deserialize_invalid', reason: 'Invalid or incompatible state JSON' };
}
