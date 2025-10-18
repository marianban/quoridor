import type { Coord, GameState, Orientation, Player, Result, Wall } from './types';

export function edgeKey(a: Coord, b: Coord): string {
  const aFirst = a.r < b.r || (a.r === b.r && a.c <= b.c);
  const p = aFirst ? a : b;
  const q = aFirst ? b : a;
  return `${p.r},${p.c}|${q.r},${q.c}`;
}

export function edgesForWall(w: Wall): [string, string] {
  const { r, c, o } = w;
  if (o === 'H') {
    // horizontal wall blocks vertical movement across two adjacent files
    return [edgeKey({ r, c }, { r: r + 1, c }), edgeKey({ r, c: c + 1 }, { r: r + 1, c: c + 1 })];
  }
  // vertical wall blocks horizontal movement across two adjacent files
  return [edgeKey({ r, c }, { r, c: c + 1 }), edgeKey({ r: r + 1, c }, { r: r + 1, c: c + 1 })];
}

export function isBlocked(blocked: ReadonlyArray<string>, a: Coord, b: Coord): boolean {
  const key = edgeKey(a, b);
  // blockedEdges is small; linear search is fine; Set can be used later
  return blocked.includes(key);
}

export function neighbors(state: GameState, cell: Coord): Coord[] {
  const { r, c } = cell;
  const out: Coord[] = [];
  // Up
  if (r > 0 && !isBlocked(state.blockedEdges, cell, { r: r - 1, c })) out.push({ r: r - 1, c });
  // Down
  if (r < 8 && !isBlocked(state.blockedEdges, cell, { r: r + 1, c })) out.push({ r: r + 1, c });
  // Left
  if (c > 0 && !isBlocked(state.blockedEdges, cell, { r, c: c - 1 })) out.push({ r, c: c - 1 });
  // Right
  if (c < 8 && !isBlocked(state.blockedEdges, cell, { r, c: c + 1 })) out.push({ r, c: c + 1 });
  return out;
}

export function hasPathToGoal(state: GameState, who: 'P1' | 'P2'): boolean {
  const start = state.pawns[who];
  const goalRow = who === 'P1' ? 8 : 0;
  const seen = new Set<string>();
  const q: Coord[] = [start];
  const key = (p: Coord) => `${p.r},${p.c}`;
  while (q.length) {
    const cur = q.shift()!;
    if (cur.r === goalRow) return true;
    const k = key(cur);
    if (seen.has(k)) continue;
    seen.add(k);
    for (const nb of neighbors(state, cur)) q.push(nb);
  }
  return false;
}

export function inBoundsCell(p: Coord): boolean {
  return p.r >= 0 && p.r <= 8 && p.c >= 0 && p.c <= 8;
}

export function inBoundsWallAnchor(w: Wall): boolean {
  return w.r >= 0 && w.r <= 7 && w.c >= 0 && w.c <= 7;
}

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export function clampWallAnchor(candidate: Coord, boardSize: number): Coord {
  const maxAnchor = Math.max(0, boardSize - 2);
  const r = clamp(candidate.r, 0, maxAnchor);
  const c = clamp(candidate.c, 0, maxAnchor);
  return { r, c };
}

export function isOccupied(state: GameState, p: Coord): boolean {
  return (
    (state.pawns.P1.r === p.r && state.pawns.P1.c === p.c) ||
    (state.pawns.P2.r === p.r && state.pawns.P2.c === p.c)
  );
}

export function generatePawnMoves(state: GameState, who: Player): Coord[] {
  const self = state.pawns[who];
  const opp = state.pawns[who === 'P1' ? 'P2' : 'P1'];
  const moves: Coord[] = [];

  const tryAdd = (p: Coord) => {
    if (!inBoundsCell(p)) return;
    if (!isOccupied(state, p)) moves.push(p);
  };

  // orthogonal neighbors
  const dirs: Coord[] = [
    { r: -1, c: 0 },
    { r: 1, c: 0 },
    { r: 0, c: -1 },
    { r: 0, c: 1 },
  ];

  // helper to check block between two cells
  const blocked = (a: Coord, b: Coord) => isBlocked(state.blockedEdges, a, b);

  // for each dir, consider moves
  for (const d of dirs) {
    const adj: Coord = { r: self.r + d.r, c: self.c + d.c };
    if (!inBoundsCell(adj)) continue;
    if (blocked(self, adj)) continue;
    const oppIsHere = adj.r === opp.r && adj.c === opp.c;
    if (!oppIsHere) {
      tryAdd(adj);
      continue;
    }
    // opponent adjacent in this direction: consider jump or diagonals
    const beyond: Coord = { r: adj.r + d.r, c: adj.c + d.c };
    if (inBoundsCell(beyond) && !blocked(adj, beyond) && !isOccupied(state, beyond)) {
      tryAdd(beyond); // straight jump
    } else {
      // diagonals around the opponent when straight jump unavailable
      // compute two side directions perpendicular to d
      const side1: Coord = d.r !== 0 ? { r: 0, c: 1 } : { r: 1, c: 0 };
      const side2: Coord = { r: -side1.r, c: -side1.c };
      const diag1: Coord = { r: adj.r + side1.r, c: adj.c + side1.c };
      const diag2: Coord = { r: adj.r + side2.r, c: adj.c + side2.c };
      // require that path around is open: from self to side cell and from opp to diagonal cell
      const sideCell1: Coord = { r: self.r + side1.r, c: self.c + side1.c };
      const sideCell2: Coord = { r: self.r + side2.r, c: self.c + side2.c };
      if (
        inBoundsCell(diag1) &&
        inBoundsCell(sideCell1) &&
        !blocked(self, sideCell1) &&
        !blocked(adj, diag1) &&
        !isOccupied(state, diag1)
      ) {
        tryAdd(diag1);
      }
      if (
        inBoundsCell(diag2) &&
        inBoundsCell(sideCell2) &&
        !blocked(self, sideCell2) &&
        !blocked(adj, diag2) &&
        !isOccupied(state, diag2)
      ) {
        tryAdd(diag2);
      }
    }
  }

  return moves;
}

export function canPlaceWall(state: GameState, w: Wall): Result<void> {
  if (!inBoundsWallAnchor(w))
    return { ok: false, code: 'bounds_wall_anchor', reason: 'Wall anchor out of bounds' };
  // overlap: any segment already blocked
  const segs = edgesForWall(w);
  if (segs.some((e) => state.blockedEdges.includes(e))) {
    return { ok: false, code: 'wall_overlap', reason: 'Wall overlaps an existing wall' };
  }
  // partial overlap: same orientation sharing a cell span
  for (const pw of state.placedWalls) {
    if (pw.o !== w.o) continue;
    if (w.o === 'H') {
      if (pw.r === w.r && Math.abs(pw.c - w.c) <= 1) {
        return { ok: false, code: 'wall_overlap', reason: 'Wall overlaps an existing wall' };
      }
    } else if (pw.c === w.c && Math.abs(pw.r - w.r) <= 1) {
      return { ok: false, code: 'wall_overlap', reason: 'Wall overlaps an existing wall' };
    }
  }
  // cross: perpendicular wall at same anchor
  const perp: Orientation = w.o === 'H' ? 'V' : 'H';
  if (state.placedWalls.some((pw) => pw.r === w.r && pw.c === w.c && pw.o === perp)) {
    return { ok: false, code: 'wall_cross', reason: 'Wall crosses an existing wall' };
  }
  // path preservation: simulate
  const nextBlocked = [...state.blockedEdges, ...segs];
  const nextState: GameState = { ...state, blockedEdges: nextBlocked };
  if (!hasPathToGoal(nextState, 'P1') || !hasPathToGoal(nextState, 'P2')) {
    return { ok: false, code: 'no_path_after_placement', reason: 'Wall would block all paths' };
  }
  return { ok: true, value: undefined };
}
