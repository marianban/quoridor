# Technical Architecture (Outline)

This folder will contain architecture and design details for the implementation.

## 1. Package Structure

- @quoridor/core
- @quoridor/agents
- @quoridor/ui-cli
- @quoridor/ui-web (and optionally @quoridor/ui-react)

Notes:

- Phase 1 presentation: CLI adapter.

## 2. Core Engine Design

- Domain types and constraints
- State immutability strategy
- Wall/edge representation
- Pathfinding utilities and caching
- Public API surface and versioning

## 3. Ports and Adapters

- Renderer interface
- Input and GameController interface
- Storage/serialization concerns

## 4. AI Agents

- Agent interface (async selectMove)
- Baseline heuristics
- Search algorithm and budgets
- Transposition table and move ordering (future)

## 5. Tooling and CI

- TypeScript config (strict)
- Testing: Vitest
- Lint/format: ESLint + Prettier
- Docs generation: Typedoc
- Releases: Changesets (optional initially)
- Monorepo: npm workspaces
- CI: none initially (can add GitHub Actions later)

## 6. Decisions

- CLI first (Phase 1), Node LTS + evergreen browsers, standard 9x9/10 walls, MIT license, npm workspaces, no CI initially.
