# Quoridor Game Specifications (Outline)

This folder contains the formal game rules and engine contracts for the core.

## 1. Rules of Play (MVP)

- Board: 9x9 cells; coordinates and orientation
- Initial setup
- Turn structure
- Pawn movement rules: orthogonal; jump over adjacent opponent if possible; if the jump is blocked, a diagonal step around the opponent is allowed; otherwise, no diagonals.
- Wall placement rules: bounds, non-overlap, non-crossing, path-preservation
- Winning condition
- Draw/stalemate handling (none for MVP)

## 2. Data Types

- Coordinate, Player, Orientation, Wall, Move (PawnMove | WallPlacement)
- GameState: structure, immutability requirements
- Error/Result types

Type sketches:

- Coordinate: { r: number; c: number }
- Player: 'P1' | 'P2'
- Orientation: 'H' | 'V'
- Wall: { r: number; c: number; o: Orientation }
- Move:
  - PawnMove: { type: 'PawnMove'; to: Coordinate }
  - WallPlacement: { type: 'WallPlacement'; anchor: { r: number; c: number }; o: Orientation }
- Result&lt;T&gt;:
  - { ok: true; value: T }
  - { ok: false; code: ErrorCode; reason: string }

## 3. Algorithms

- Legal move generation
- Reachability check for wall legality: graph search over dynamic adjacency from blocked edges
- Validation ordering and reason codes

## 4. Public API Contracts (Core)

- createInitialState(options?) → GameState
  - Options: { startingPlayer?: Player } (defaults to 'P1')
  - Initializes 9x9 board; P1 at (0,4), P2 at (8,4); 10 walls each; empty blocked edges.
- legalMoves(state) → Move[]
  - Returns all legal moves for the current player in deterministic order (see Move Ordering).
  - Never throws; returns [] if isTerminal(state) is true.
- canApplyMove(state, move) → Result&lt;void&gt;
  - Validates move against rules; on failure returns { ok: false, code, reason }.
- applyMove(state, move) → Result&lt;GameState&gt;
  - Pure; does not mutate input. Applies move if legal; otherwise mirrors canApplyMove failure codes.
- isTerminal(state) → boolean; getWinner(state) → Player | null
- serialize(state) → string; deserialize(json) → Result&lt;GameState&gt;
  - deserialize validates shape and invariants; error codes under Error Codes.
  
Note: Shortest-path utilities are not required for PvP legality and may live in agents/utilities later.

## 5. Core Contracts

- Purity/immutability: no mutation of inputs (ADR-0002).
- Deterministic ordering for legalMoves (ADR-0006).
- Result model: discriminated unions with stable error codes (ADR-0008).

### Error Codes (stable)

- bounds_cell: Target cell out of board bounds.
- bounds_wall_anchor: Wall anchor outside [0..7] range.
- not_your_turn: Move made for non-active player.
- already_terminal: Game is already won; no moves allowed.
- illegal_pawn_move: No orthogonal edge or destination occupied by opponent improperly.
- illegal_jump: Attempted jump without adjacent opponent or with blocked landing.
- diagonal_not_allowed: Diagonal attempted when jump not blocked.
- no_walls_left: Player has no remaining walls.
- wall_overlap: Wall shares segment with an existing wall.
- wall_cross: Wall crosses an existing perpendicular wall.
- no_path_after_placement: Wall would block all paths for a player.
- deserialize_invalid: Serialized state is invalid (shape, values, or invariants).

## 6. Performance Targets

- Legal move generation typical latency
- Pathfinding budget per call

Targets and guidance:

- legalMoves: < 10ms typical on commodity hardware.
- Wall validation reachability: run graph search only when testing wall placements; early-exit on first path found for each player.
- No mandatory caching; may add simple memoization later without API changes.

## 7. Test Cases

- Canonical setups (opening, mid, near-end)
- Edge cases (borders, overlapping walls attempts, jump/diagonal specifics)
- Property-based invariants

Fixtures to define:

- Opening state (initial).
- Adjacent-pawns with clear jump.
- Adjacent-pawns with blocked jump allowing diagonals (both sides).
- Border/corner adjacency cases.
- Wall adjacency end-to-end (valid) vs overlap (invalid) vs cross (invalid).
- Near-end states (one move to win) to verify terminal detection and ordering.

## 8. Extensibility

- N players variant (future), board sizes, wall counts
- Hooks for AI evaluation and transposition tables
  - Agent interface per ADR-0007

## 9. Non-Goals (MVP)

- Timers and draw rules
- Networked multiplayer
- Rich animations and effects

## 10. Phase 1 Presentation Layer

- CLI adapter is the initial target (ADR-0009).

## 11. Deterministic Move Ordering

- Category order: PawnMove before WallPlacement.
- PawnMove ordering: sort by destination (r asc, then c asc).
- WallPlacement ordering: sort by orientation ('H' before 'V'), then by anchor row asc, then col asc.

Rationale: stable snapshots and predictable AI ordering.

## 12. Wall Legality Rules (precise)

- Anchors: r,c in 0..7; orientation 'H' or 'V'.
- Segment mapping:
  - H(r,c) blocks (r,c)-(r,c+1) and (r+1,c)-(r+1,c+1)
  - V(r,c) blocks (r,c)-(r+1,c) and (r,c+1)-(r+1,c+1)
- Overlap: placing a wall that uses an already-blocked segment is illegal.
- Crossing: placing H(r,c) where V(r,c) exists (and vice versa) that would intersect mid-span is illegal.
- Adjacency: end-to-end adjacency is allowed (e.g., H(r,c) adjacent to H(r,c+1); V(r,c) adjacent to V(r+1,c)).
- Path preservation: after placement, each player must have at least one path to their goal row (reachability graph search).

## 13. Pawn Movement Details (precise)

Let A be the active player, B the opponent.

- Orthogonal step: A may move to an orthogonally adjacent cell if the edge is not blocked and the cell is not occupied.
- Jump: If B is orthogonally adjacent in direction d and the cell beyond B in direction d is within bounds and the edge(s) are not blocked, A may jump to that cell (two cells away).
- Diagonal around blocked jump: If B is adjacent in direction d, and the cell beyond B in direction d is either out of bounds or blocked, then A may move to either of the two diagonal cells adjacent to B and adjacent to A around B, provided the edges around B permit passage to that diagonal (no wall blocking between B and that diagonal cell). If both diagonals are blocked, no diagonal is allowed.
- A cannot move diagonally unless adjacent to B and the straight jump is unavailable (blocked or out of bounds).

Notes:

- “Edge blocked” checks use the blockedEdges set derived from placed walls.
- Examples should be added as diagrams in a later pass.

## 14. State Schema and Serialization

- GameState:
  - boardSize: 9
  - pawns: { P1: Coordinate; P2: Coordinate }
  - wallsRemaining: { P1: number; P2: number } (start at 10)
  - placedWalls: Array&lt;Wall&gt; (anchors with orientation)
  - blockedEdges: Array&lt;string&gt; of normalized edge keys "r1,c1|r2,c2" (lexicographic ordering per ADR)
  - turn: Player
  - history?: optional array of prior moves/states (not required for MVP)
- serialize(state): returns stable JSON (sorted arrays where applicable)
- deserialize(json): validates schema and invariants; returns Result&lt;GameState&gt; or { ok:false, code: 'deserialize_invalid', reason }

