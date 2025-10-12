import type { GameState, Move } from '@quoridor/core';
import './Board.css';

export function Board(props: {
  state: GameState;
  mode: 'move' | 'wall';
  orientation: 'H' | 'V';
  onApplyMove: (m: Move) => void;
}) {
  const { state } = props;
  return (
    <div className="board" role="grid" aria-label="Quoridor board">
      <div className="board__grid" />
    </div>
  );
}
