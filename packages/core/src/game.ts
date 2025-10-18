import type { CreateOptions, GameState, Move, Player, Result } from './types.js';
import {
  applyMove as coreApplyMove,
  canApplyMove as coreCanApplyMove,
  createInitialState,
  getWinner,
  isTerminal,
  legalMoves as coreLegalMoves,
} from './index.js';

export class Game {
  private readonly _state: GameState;

  private constructor(state: GameState) {
    this._state = state;
  }

  static initial(options?: CreateOptions): Game {
    return new Game(createInitialState(options));
  }

  static from(state: GameState): Game {
    return new Game(state);
  }

  get state(): GameState {
    return this._state;
  }

  get turn(): Player {
    return this._state.turn;
  }

  legalMoves(): Move[] {
    return coreLegalMoves(this._state);
  }

  canApplyMove(move: Move, player?: Player): Result<void> {
    return coreCanApplyMove(this._state, move, player);
  }

  applyMove(move: Move): Result<Game> {
    const res = coreApplyMove(this._state, move);
    if (!res.ok) return { ok: false, code: res.code, reason: res.reason };
    return { ok: true, value: new Game(res.value) };
  }

  isTerminal(): boolean {
    return isTerminal(this._state);
  }

  winner(): Player | null {
    return getWinner(this._state);
  }
}
