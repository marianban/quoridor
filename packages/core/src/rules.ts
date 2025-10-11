import type { Coord, GameState, Wall } from './types';

export function edgeKey(a: Coord, b: Coord): string {
  const aFirst = a.r < b.r || (a.r === b.r && a.c <= b.c);
  const p = aFirst ? a : b;
  const q = aFirst ? b : a;
  return `${p.r},${p.c}|${q.r},${q.c}`;
}

export function edgesForWall(w: Wall): [string, string] {
  const { r, c, o } = w;
  if (o === 'H') {
    // blocks (r,c)-(r,c+1) and (r+1,c)-(r+1,c+1)
    return [edgeKey({ r, c }, { r, c: c + 1 }), edgeKey({ r: r + 1, c }, { r: r + 1, c: c + 1 })];
  }
  // 'V' blocks (r,c)-(r+1,c) and (r,c+1)-(r+1,c+1)
  return [edgeKey({ r, c }, { r: r + 1, c }), edgeKey({ r, c: c + 1 }, { r: r + 1, c: c + 1 })];
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
