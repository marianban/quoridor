// Utility helpers for consistent coordinate identifiers across the UI

export function coordId(r: number, c: number): string {
  return `${r}-${c}`;
}

export function coordToId(coord: { r: number; c: number }): string {
  return `${coord.r}-${coord.c}`;
}
