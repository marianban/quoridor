import type { GameState, Move } from '@quoridor/core';
import './Board.css';

export function Board(props: {
  state: GameState;
  mode: 'move' | 'wall';
  orientation: 'H' | 'V';
  onApplyMove: (m: Move) => void;
}) {
  void props;
  // Render a 17x17 grid: cells at even-even indices (0-based), lanes elsewhere
  const gridChildren: JSX.Element[] = [];
  for (let gr = 0; gr < 17; gr++) {
    for (let gc = 0; gc < 17; gc++) {
      const isCell = gr % 2 === 0 && gc % 2 === 0;
      const style = { gridRow: gr + 1, gridColumn: gc + 1 } as const;
      if (isCell) {
        const r = gr / 2;
        const c = gc / 2;
        gridChildren.push(
          <div
            key={`cell-${r}-${c}`}
            className="cell"
            role="gridcell"
            data-r={r}
            data-c={c}
            style={style}
          />,
        );
      } else {
        const isIntersection = gr % 2 === 1 && gc % 2 === 1;
        const isHLane = gr % 2 === 1 && gc % 2 === 0;
        const isVLane = gr % 2 === 0 && gc % 2 === 1;
        const cls = isIntersection
          ? 'lane lane--x'
          : isHLane
            ? 'lane lane--h'
            : isVLane
              ? 'lane lane--v'
              : 'lane';
        gridChildren.push(
          <div key={`lane-${gr}-${gc}`} className={cls} aria-hidden="true" style={style} />,
        );
      }
    }
  }

  return (
    <div className="board" role="grid" aria-label="Quoridor board">
      <div className="board__grid">{gridChildren}</div>
    </div>
  );
}
