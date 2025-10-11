# Quoridor Game Specifications (Outline)

This folder will contain the formal game rules and engine contracts. Draft outline below.

## 1. Rules of Play

- Board: 9x9 cells; coordinates and orientation
- Initial setup
- Turn structure
- Pawn movement rules: orthogonal, jumps, diagonal around blocked jump
- Wall placement rules: bounds, non-overlap, non-crossing, path-preservation
- Winning condition
- Draw/stalemate handling (if any)

## 2. Data Types

- Coordinate, Player, Orientation, Wall, Move (PawnMove | WallPlacement)
- GameState: structure, immutability requirements
- Error/Result types

## 3. Algorithms

- Legal move generation
- Pathfinding (shortest path): BFS details, adjacency computation from blocked edges
- Validation ordering and reason codes

## 4. Public API Contracts (Core)

- createInitialState(options?)
- legalMoves(state)
- canApplyMove(state, move) -> Result
- applyMove(state, move)
- isTerminal(state), getWinner(state)
- shortestPathLength(state, player)
- serialize/deserialize

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
