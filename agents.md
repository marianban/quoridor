# Agents and Architecture Decisions (ADR Log)

This document tracks key decisions and conventions so contributors (including AI agents) stay aligned.

## ADR-0001: Core in TypeScript, Framework-Free

- Status: Proposed
- Context: We need a reusable engine that works in Node and browsers and is testable.
- Decision: Implement core game logic in strict TypeScript with no runtime deps beyond stdlib.
- Consequences: Easier portability and testing. UI adapters must wrap the core via thin layers.

## ADR-0002: Immutable Game State

- Status: Proposed
- Context: Predictability and suitability for AI search and undo/redo.
- Decision: All reducers (applyMove) return new state objects; no mutation in core.
- Consequences: Slight allocations overhead; simplifies testing and time-travel features.

## ADR-0003: Coordinate and Wall System

- Status: Proposed
- Context: Clear, unambiguous references to cells and walls.
- Decision: Use 0-based row/col for cells (0..8). Walls identified by top-left anchor (r,c) with orientation 'H'|'V'.
- Consequences: Matches common Quoridor representations; simplifies path blocking logic.

## ADR-0004: Edge-Blocking Representation

- Status: Proposed
- Context: Efficient legality checks and pathfinding.
- Decision: Maintain a Set of blocked edges normalized as "r1,c1|r2,c2" with lexicographic ordering.
- Consequences: O(1) edge checks; easy to derive graph during pathfinding.

## ADR-0005: Ports and Adapters

- Status: Proposed
- Context: Swap presentation layers without touching core.
- Decision: Define Renderer, Input, and Storage ports in core. Adapters implement them (CLI, Canvas, React).
- Consequences: Separation enables testing and multiple UIs; slight upfront interface design.

## ADR-0006: Legal Move Computation Contract

- Status: Proposed
- Context: Deterministic behavior and performance expectations.
- Decision: legalMoves(state) must be pure, stable order (deterministic ordering), and complete within target time budget (<10ms typical).
- Consequences: Facilitates snapshot tests and AI move ordering.

## ADR-0007: AI Agent Interface

- Status: Proposed
- Context: Pluggable agents (human, random, minimax, MCTS later).
- Decision: Define Agent interface: async selectMove(state, options) -> Move | null with budget constraints.
- Consequences: Enables human vs AI and AI vs AI, time-boxed searches.

## ADR-0008: Error Reporting

- Status: Proposed
- Context: Developer and user feedback for illegal moves.
- Decision: All validation functions return discriminated unions { ok: true; value } | { ok: false; reason; code }.
- Consequences: Clear error handling across adapters and tests.
