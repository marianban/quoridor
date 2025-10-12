// Utility helpers for consistent coordinate identifiers across the UI

export function coordId(r: number, c: number): string {
  return `${r}-${c}`;
}

// Overloads to support either a Coord-like object or separate r,c numbers
export function coordToId(coord: { r: number; c: number }): string;
export function coordToId(r: number, c: number): string;
export function coordToId(a: { r: number; c: number } | number, b?: number): string {
  if (typeof a === 'object') return `${a.r}-${a.c}`;
  return `${a}-${b as number}`;
}
