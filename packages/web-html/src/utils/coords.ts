// Utility helper for consistent coordinate identifiers across the UI
// Accepts either a Coord-like object or separate r,c numbers
export function coordToId(a: { r: number; c: number } | number, b?: number): string {
  if (typeof a === 'object') return `${a.r}-${a.c}`;
  return `${a}-${b as number}`;
}
