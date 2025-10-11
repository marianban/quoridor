# Quoridor JS/TS – Project Plan

## Objectives

- Build a Quoridor game engine and adapters in TypeScript/JavaScript.
- Phase 1: Local Player vs Player (same device) with a minimal UI.
- Phase 2: Play against AI (baseline first, then stronger).
- Clean, presentation-agnostic architecture so we can swap UIs (CLI, Canvas, React, etc.).
- High test coverage for rules, move validation, and pathfinding.

## Non-Goals (for initial phases)

- Online multiplayer and networking (can be later).
- Mobile-native packaging.
- 3D rendering or advanced animations.

## High-level Approach

- Core: pure, immutable TS engine (no runtime deps).
- Ports/adapters: thin CLI now; web later.
- Stable, minimal public API.

## Deliverables by Phase

- M0 – Repo + Tooling
  - Monorepo setup (npm workspaces), TypeScript config, linting, formatting, unit test runner. (Docs generation via Typedoc optional)

- M1 – Core Engine (PvP-ready)
  - Board model (9x9), coordinates, walls, pawn positions.
  - Rules: legal pawn moves incl. jumps/diagonals, legal wall placements, path-existence check.
  - Deterministic state transitions (applyMove) and serialization.
  - Reachability: graph search on a dynamic adjacency graph (blocked edges) to ensure wall placements keep at least one path for each player. (Shortest path optional for AI later.)
  - Acceptance tests for standard scenarios and edge-cases.

- M2 – Minimal UI Adapter (Local PvP)
  - CLI adapter using core API (Phase 1 target).
  - Game loop/controller for two human players, move entry/validation.

- M3 – AI v1 (Baseline)
  - Heuristic evaluation (shortest-path difference, mobility, wall count).
  - Alpha-beta search with iterative deepening and time budget.
  - Pluggable Agent interface; human vs AI and AI vs AI modes.

- M4 – Rich UI Adapter (Optional)
  - React-based web UI with drag-to-place walls, highlights, and move suggestions.

- M5 – Packaging & Docs
  - NPM packages: @quoridor/core, @quoridor/agents, and @quoridor/ui-[adapter].
  - README, examples, and a small demo. (API docs via Typedoc optional)

## Architecture Overview

- Packages (MVP + next):
  - @quoridor/core: domain, rules, engine, search utilities.
  - @quoridor/agents: human adapter (prompt/input), AI agents, search.
  - @quoridor/ui-cli: terminal UI.
  - @quoridor/ui-web: minimal vanilla TS/Canvas (optional later).

- Core Concepts:
  - Board: size 9x9 grid of cells with edges removed by walls.
  - Coordinates: row, col in [0..8]. Goal rows: player1 -> row 8, player2 -> row 0.
  - Walls: horizontal or vertical placed between cells, represented by blocking two parallel edges.
  - Move: PawnMove or WallPlacement.
  - GameState: whose turn, pawn positions, remaining walls per player, placed walls, history.

- Public API contracts: see docs/specs/README.md.

- Adapters and Controllers:
  - GameController abstracts "input -> intent -> validation -> state update -> render".
  - Renderers implement a minimal interface: render(state, highlights?), onEvent(fn), dispose().

## Rules Summary (to be specified precisely in specs)

- Board 9x9; two players start centered on opposite sides.
- On a turn, a player either moves their pawn or places a wall.
- Pawn moves: orthogonally to adjacent cell if not blocked; jump over adjacent opponent if possible; if the jump is blocked, a diagonal step around the opponent is allowed; otherwise, no diagonals.
- Walls: cannot overlap or cross existing walls; must remain within bounds; must not block all paths—each player must retain at least one path to the goal row.
- Each player has 10 walls.
- First to reach any cell on their goal row wins.

## Data Model Details (initial)

- Coordinate: { r: number; c: number }
- Wall: { r: number; c: number; o: 'H' | 'V' } referencing the top-left corner of the 2-cell span:
  - H wall at (r,c) blocks edges between (r,c)-(r,c+1) and (r+1,c)-(r+1,c+1)
  - V wall at (r,c) blocks edges between (r,c)-(r+1,c) and (r,c+1)-(r+1,c+1)
- Walls live on r in [0..7], c in [0..7].
- Represent blocked edges as a Set of normalized edge keys for O(1) checks.

## Testing Strategy

- Unit tests for rule primitives and helpers.
- Property-based tests (fast-check) for invariants: path exists after legal placements, applyMove is pure, symmetry properties.
- Scenario tests from published Quoridor examples.
- Snapshot tests for legalMoves on canonical states.

## Tooling (selected)

- npm workspaces for monorepo.
- TypeScript strict mode, path aliases, tsup or esbuild for bundling core.
- Vitest for tests; ESLint + Prettier.
- Docs generation: Typedoc (optional; not required initially); Changesets for versioning/releases.
- CI: none initially (can add GitHub Actions later).

## Milestones & Timeline (rough)

- Week 1: M0 + M1 (engine core, unit tests)
- Week 2: M2 (CLI minimal UI), polish, docs
- Week 3: M3 (AI baseline), playtest, refine eval heuristics

## Acceptance Criteria (PvP phase)

- Can start a game, alternate turns, enforce rules, detect win.
- Illegal moves are rejected with clear reasons.
- State is immutable; (undo/redo optional, not required for MVP).
- legalMoves completes in <10ms on typical states on a mid machine.

## Risks & Mitigations

- Rule edge cases (jumps/diagonals) are subtle → add reference tests.
- Pathfinding performance → precompute neighbors; avoid recompute with incremental updates if needed.
- UI drag-and-drop precision → keep hitboxes simple; keyboard fallback.

## Decisions (current)

- Phase 1 UI: CLI.
- Runtime targets: Node LTS + latest evergreen browsers.
- Rules: Standard board (9x9) with 10 walls/player; no timers/draw rules for MVP.
- Monorepo layout: packages for core, agents, ui-cli, ui-web.
- License: MIT.
- CI: none initially.
- Package manager: npm workspaces.

---

See also: docs/specs and docs/technical for deeper details.
