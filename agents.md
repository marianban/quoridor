# Agents and Architecture Decisions (ADR Log)

This document tracks key decisions and conventions so contributors (including AI agents) stay aligned.

## ADR-0001: Core in TypeScript, Framework-Free

- Status: Decided
- Context: We need a reusable engine that works in Node and browsers and is testable.
- Decision: Implement core game logic in strict TypeScript with no runtime deps beyond stdlib.
- Consequences: Easier portability and testing. UI adapters must wrap the core via thin layers.

## ADR-0002: Immutable Game State

- Status: Decided
- Context: Predictability and suitability for AI search and undo/redo.
- Decision: All reducers (applyMove) return new state objects; no mutation in core.
- Consequences: Slight allocations overhead; simplifies testing and time-travel features.

## ADR-0003: Coordinate and Wall System

- Status: Decided
- Context: Clear, unambiguous references to cells and walls.
- Decision: Use 0-based row/col for cells (0..8). Walls identified by top-left anchor (r,c) with orientation 'H'|'V'.
- Consequences: Matches common Quoridor representations; simplifies path blocking logic.

## ADR-0004: Edge-Blocking Representation

- Status: Decided
- Context: Efficient legality checks and pathfinding while keeping state simple and JSON-friendly.
- Decision: Represent blocked edges as a string array in `GameState`, each normalized as "r1,c1|r2,c2" with lexicographic ordering. Do not use Set in core state.
- Consequences: Simple serialization and snapshots. Linear membership checks are acceptable for 9x9 Quoridor (<= 40 segments typical). If performance tuning is needed later, it will be addressed without changing the public state shape.

## ADR-0005: Ports and Adapters

- Status: Decided
- Context: Swap presentation layers without touching core.
- Decision: Define Renderer, Input, and Storage ports in core. Adapters implement them (CLI, Canvas, React).
- Consequences: Separation enables testing and multiple UIs; slight upfront interface design.

## ADR-0006: Legal Move Computation Contract

- Status: Decided
- Context: Deterministic behavior and performance expectations.
- Decision: legalMoves(state) must be pure, stable order (deterministic ordering), and complete within target time budget (<10ms typical).
- Consequences: Facilitates snapshot tests and AI move ordering.

## ADR-0007: AI Agent Interface

- Status: Proposed (to be finalized before M3)
- Context: Pluggable agents (human, random, minimax, MCTS later).
- Decision: Define Agent interface: async selectMove(state, options) -> Move | null with budget constraints.
- Consequences: Enables human vs AI and AI vs AI, time-boxed searches.

## ADR-0008: Error Reporting

- Status: Decided
- Context: Developer and user feedback for illegal moves.
- Decision: All validation functions return discriminated unions { ok: true; value } | { ok: false; code; reason } with stable error codes.
- Consequences: Clear error handling across adapters and tests.

## ADR-0009: Phase 1 UI Target

- Status: Decided
- Context: We need a fast path to a playable PvP MVP.
- Decision: Phase 1 UI is CLI; web UI can follow later.
- Consequences: Faster iteration and easier local testing.

## ADR-0010: Tooling and Test Stack

- Status: Decided
- Context: Choose package manager, test runner, and CI policy.
- Decision: Use npm workspaces for monorepo; Vitest for unit tests; no CI initially; docs via Typedoc optional.
- Consequences: Simple setup, fast tests; can add GitHub Actions later; documentation optional at start.

## ADR-0011: License

- Status: Decided
- Context: Open-source friendly license requested.
- Decision: MIT License.
- Consequences: Broad permissive use.

## ADR-0012: Rules Scope for MVP

- Status: Decided
- Context: Keep v1 simple and standard.
- Decision: Standard 9x9 board, 10 walls per player, no timers, no special draw rules, undo/redo optional (not required for MVP).
- Consequences: Reduces complexity; can extend later.

## ADR-0013: State Encoding Choices

- Status: Decided
- Context: Simple, readable core data structures for portability and testing.
- Decisions:
  - Edge key encoding uses strings normalized as "r1,c1|r2,c2". No bitset representation will be used.
  - GameState includes a history array of moves for replay; history is immutable append-only.
- Consequences: Improves readability and debuggability; small overhead acceptable for 9x9 board size.

## ADR-0014: Strict TypeScript Typings (No `as` Assertions)

- Status: Decided
- Context: Reduce runtime type risks and keep types trustworthy. Avoid using `as` to force types, which can hide bugs and weaken type safety.
- Decision: Do not use TypeScript `as` assertions in core code. Prefer precise types, discriminated unions, type guards, and narrowing. For literals, avoid `as const` where it would constrain types incorrectly across public APIs. When parsing untyped data (e.g., JSON), use explicit type guards instead of casting.
- Consequences: Clearer, safer code; slightly more verbose guards and helper functions (e.g., `isGameState`). Lint and reviews should flag `as` usages in core. Adapters may use assertions sparingly at boundaries, but core remains assertion-free.
