import type { GameState, Move } from '@quoridor/core';
import './Board.css';

type CellProps = { r: number; c: number; style: React.CSSProperties };
function Cell(props: CellProps) {
  const { r, c, style } = props;
  return <div className="cell" role="gridcell" data-r={r} data-c={c} style={style} />;
}

export function Board(props: {
  state: GameState;
  mode: 'move' | 'wall';
  orientation: 'H' | 'V';
  onApplyMove: (m: Move) => void;
}) {
  void props;
  // Pre-build array indices for 17x17 grid
  const idx = Array.from({ length: 17 }, (_, i) => i);
  const children = idx.flatMap((gr) =>
    idx.map((gc) => {
      const style = { gridRow: gr + 1, gridColumn: gc + 1 } as const;
      const isCell = gr % 2 === 0 && gc % 2 === 0;
      if (isCell) {
        const r = gr / 2;
        const c = gc / 2;
        return <Cell key={`cell-${r}-${c}`} r={r} c={c} style={style} />;
      }
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
      return <div key={`lane-${gr}-${gc}`} className={cls} aria-hidden="true" style={style} />;
    }),
  );

  return (
    <div className="board" role="grid" aria-label="Quoridor board">
      <div className="board__grid">{children}</div>
    </div>
  );
}
