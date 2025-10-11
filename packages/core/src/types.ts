export type Coord = { r: number; c: number }; // 0..8
export type Player = 'P1' | 'P2';
export type Orientation = 'H' | 'V';

export type Wall = { r: number; c: number; o: Orientation }; // anchors 0..7

export type PawnMove = { type: 'PawnMove'; to: Coord };
export type WallPlacement = {
  type: 'WallPlacement';
  anchor: { r: number; c: number };
  o: Orientation;
};
export type Move = PawnMove | WallPlacement;

export type ErrorCode =
  | 'bounds_cell'
  | 'bounds_wall_anchor'
  | 'not_your_turn'
  | 'already_terminal'
  | 'illegal_pawn_move'
  | 'illegal_jump'
  | 'diagonal_not_allowed'
  | 'no_walls_left'
  | 'wall_overlap'
  | 'wall_cross'
  | 'no_path_after_placement'
  | 'deserialize_invalid';

export type Result<T> = { ok: true; value: T } | { ok: false; code: ErrorCode; reason: string };

export type GameState = {
  boardSize: 9;
  turn: Player;
  pawns: { P1: Coord; P2: Coord };
  wallsRemaining: { P1: number; P2: number };
  placedWalls: ReadonlyArray<Wall>;
  blockedEdges: ReadonlyArray<string>; // normalized edge keys "r1,c1|r2,c2"
  history: ReadonlyArray<Move>;
};

export type CreateOptions = { startingPlayer?: Player };
