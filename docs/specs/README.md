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

## 3. Algorithms

- Legal move generation
- Reachability check for wall legality: graph search over dynamic adjacency from blocked edges
- Validation ordering and reason codes

## 4. Public API Contracts (Core)

- createInitialState(options?) → GameState
- legalMoves(state) → Move[] (deterministic order)
- canApplyMove(state, move) → Result
- applyMove(state, move) → GameState
- isTerminal(state) → boolean; getWinner(state) → Player | null
- shortestPathLength(state, player) → number
- serialize(state) → string; deserialize(json) → GameState

## 5. Core Contracts

- Purity/immutability: no mutation of inputs (ADR-0002).
- Deterministic ordering for legalMoves (ADR-0006).
- Result model: discriminated unions with stable error codes (ADR-0008).

## 6. Performance Targets

- Legal move generation typical latency
- Pathfinding budget per call

## 7. Test Cases

- Canonical setups (opening, mid, near-end)
- Edge cases (borders, overlapping walls attempts, jump/diagonal specifics)
- Property-based invariants

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
