import type { GameState, Move } from '@quoridor/core';
import { useMemo } from 'react';
import './Board.css';

type CellProps = { r: number; c: number; style: React.CSSProperties };
function Cell(props: CellProps) {
  const { r, c, style } = props;
  return <div className="cell" role="gridcell" data-r={r} data-c={c} style={style} />;
}

type LaneProps = { gr: number; gc: number; style: React.CSSProperties };
function Lane(props: LaneProps) {
  const { gr, gc, style } = props;
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
  return <div className={cls} aria-hidden="true" style={style} />;
}

type GridItem =
  | { kind: 'cell'; key: string; r: number; c: number; style: React.CSSProperties }
  | { kind: 'lane'; key: string; gr: number; gc: number; style: React.CSSProperties };

export function Board(props: {
  state: GameState;
  mode: 'move' | 'wall';
  orientation: 'H' | 'V';
  onApplyMove: (m: Move) => void;
}) {
  void props;

  const items = useMemo<GridItem[]>(() => {
    const idx = Array.from({ length: 17 }, (_, i) => i);
    const out: GridItem[] = [];
    for (const gr of idx) {
      for (const gc of idx) {
        const style = { gridRow: gr + 1, gridColumn: gc + 1 } as const;
        const isCell = gr % 2 === 0 && gc % 2 === 0;
        if (isCell) {
          const r = gr / 2;
          const c = gc / 2;
          out.push({ kind: 'cell', key: `cell-${r}-${c}`, r, c, style });
        } else {
          out.push({ kind: 'lane', key: `lane-${gr}-${gc}`, gr, gc, style });
        }
      }
    }
    return out;
  }, []);

  return (
    <div className="board" role="grid" aria-label="Quoridor board">
      <div className="board__grid">
        {items.map((it) =>
          it.kind === 'cell' ? (
            <Cell key={it.key} r={it.r} c={it.c} style={it.style} />
          ) : (
            <Lane key={it.key} gr={it.gr} gc={it.gc} style={it.style} />
          ),
        )}
      </div>
    </div>
  );
}
