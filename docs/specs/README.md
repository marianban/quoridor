# Quoridor Game Specifications (Outline)

This folder will contain the formal game rules and engine contracts. Draft outline below.

## 1. Rules of Play (MVP)

- Board: 9x9 cells; coordinates and orientation
- Initial setup
- Turn structure
- Pawn movement rules: orthogonal; jump over adjacent opponent if possible; if the jump is blocked, diagonal move around the opponent is permitted; otherwise, no diagonals.
- Wall placement rules: bounds, non-overlap, non-crossing, path-preservation
- Winning condition
- Draw/stalemate handling (none for MVP)

## 2. Data Types

- Coordinate, Player, Orientation, Wall, Move (PawnMove | WallPlacement)
- GameState: structure, immutability requirements
- Error/Result types

## 3. Algorithms

- Legal move generation
- Pathfinding (shortest path): BFS details, adjacency computation from blocked edges
- Validation ordering and reason codes
- Use discriminated unions with codes per ADR-0008

## 4. Public API Contracts (Core)

- createInitialState(options?)
- legalMoves(state)
- canApplyMove(state, move) -> Result
- applyMove(state, move)
- isTerminal(state), getWinner(state)
- shortestPathLength(state, player)
- serialize/deserialize

Notes:

- All functions are pure and must not mutate inputs (ADR-0002).
- legalMoves must be deterministic in ordering (ADR-0006).

## 5. Performance Targets

- Legal move generation typical latency
- Pathfinding budget per call

## 6. Test Cases

- Canonical setups (opening, mid, near-end)
- Edge cases (borders, overlapping walls attempts, jump/diagonal specifics)
- Property-based invariants

## 7. Extensibility

- N players variant (future), board sizes, wall counts
- Hooks for AI evaluation and transposition tables
  - Agent interface per ADR-0007

## 8. Non-Goals (MVP)

- Timers and draw rules
- Networked multiplayer
- Rich animations and effects

## 9. Phase 1 Presentation Layer

- CLI adapter is the initial target (ADR-0009).
