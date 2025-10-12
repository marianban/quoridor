import type { GameState, Move } from '@quoridor/core';
import './Board.css';

export function Board(props: {
  state: GameState;
  mode: 'move' | 'wall';
  orientation: 'H' | 'V';
  onApplyMove: (m: Move) => void;
}) {
  void props; // placeholder to satisfy no-unused-vars until implemented
  // props kept for future implementation; no-op for scaffold stage
  return (
    <div className="board" role="grid" aria-label="Quoridor board">
      <div className="board__grid" />
    </div>
  );
}
