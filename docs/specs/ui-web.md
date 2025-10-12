# UI Functional Specs – Web HTML (MVP)

Scope: Functional behavior and UX for the packages/web-html React adapter; core rules/state remain unchanged.

## 1. Controls and Modes

- Modes
  - Move mode (default)
  - Wall mode
- Orientation (only in Wall mode): Horizontal (H), Vertical (V)
- Orientation controls are disabled in Move mode (visually and with aria-disabled="true"; unfocusable).
- Buttons expose simple title tooltips with shortcuts: Move (M), Wall (W), Horizontal (H), Vertical (V).

## 2. Keyboard and Mouse Interaction

- Global shortcuts
  - M → select Move mode
  - W → select Wall mode
  - H → select Horizontal (affects Wall mode)
  - V → select Vertical (affects Wall mode)
- Board keyboard navigation
  - Arrow keys move a focus cursor over 9×9 cells.
  - When the board gains focus, the cursor starts on the active pawn’s cell.
  - Enter/Space applies the current action at the focused cell.
- Mouse
  - Move mode: click a legal destination cell to move the active pawn.
  - Wall mode: click a cell to use it as the wall’s top-left anchor; orientation H/V determines placement.
  - Edge anchors: if click hits r=8 or c=8, clamp that coordinate to 7 (valid anchors 0..7).

## 3. Board Visualization and Layout

- Grid
  - Visible thin grid lines (1px) separating cells.
  - 17×17 CSS grid (9 cells + interleaving lanes for walls) to support visible wall lanes.
  - Responsive sizing via vmin (e.g., --board-size: min(90vmin, 720px)).
- Pawns
  - Solid circles: P1 Blue, P2 Red.
- Walls
  - Solid-color thick gap bars in the inter-cell lanes (thicker than grid lines, thinner than cells), brown.
  - Wall preview in Wall mode:
    - Hover/focus preview at the anchor with current orientation (semi-transparent).
    - Illegal preview shown in a warning color (e.g., rgba(176, 0, 32, 0.4)).
- Legal-move highlights (Move mode)
  - Subtle highlight (e.g., #efefef) for legal destination cells (always-on while in Move mode).

## 4. Status and Feedback

- Layout: side controls to the right; status bar placed below the board.
- Status content
  - Current player (turn)
  - Last error from core (CODE: reason) shown with alert styling
  - Optional info (e.g., last successful action summary)
- Terminal state
  - Show Winner: P1 or Winner: P2.
  - Disable board/controls except Reset.

## 5. Accessibility

- Buttons are focusable with visible outlines and title tooltips; disabled orientation buttons use aria-disabled="true" and are unfocusable.
- Board uses role="grid" with a roving tabindex so arrow keys move the focused cell.
- Status error area uses role="alert" or aria-live to announce errors.

## 6. Behavior Details and Edge Cases

- Action mapping to core
  - Move: { type: 'PawnMove', to: { r, c } }
  - Wall: { type: 'WallPlacement', anchor: { r: clamp(r,0,7), c: clamp(c,0,7) }, o: 'H'|'V' }
- Illegal actions must not change state and must surface the exact { code, reason } from core.
- Focus
  - Board focus starts at active pawn; after a successful move, focus tracks the pawn’s new cell.
  - Changing mode/orientation does not steal board focus.
- Deterministic visuals
  - Active styles reflect current mode/orientation; orientation controls disabled in Move mode.

## 7. Acceptance Criteria

- Default mode is Move; orientation controls disabled until Wall mode.
- Shortcuts (M/W/H/V) work; tooltips display shortcuts.
- Board supports arrow navigation and Enter/Space to act; focus starts on active pawn.
- Move mode shows legal-move highlights; click/Enter on legal cell moves the pawn.
- Wall mode previews walls; illegal previews use warning color; click/Enter attempts placement.
- Clicking with r=8 or c=8 clamps to 7 for anchor.
- Errors appear in the status bar; success clears error.
- On win, only Reset is interactive; status shows the winner.
- Board resizes with viewport and keeps visible 1px grid lines.

## 8. Notes for Implementation (non-normative)

- Implement rendering/hit-testing in Board.tsx; attach keyboard handlers to the board container.
- Add title attributes and aria-disabled to Controls.tsx; disable orientation buttons in Move mode.
- Move StatusBar placement under the board in App.tsx while retaining side controls.
- Use Game.applyMove/canApplyMove to surface errors from core.
