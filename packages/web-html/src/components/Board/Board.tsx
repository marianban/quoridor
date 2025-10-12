import type { GameState, Move } from '@quoridor/core';
import { legalMoves } from '@quoridor/core';
import { coordToId } from '../../utils/coords';
import { useMemo } from 'react';
import './Board.css';

type CellProps = {
  r: number;
  c: number;
  style: React.CSSProperties;
  highlighted?: boolean;
  onClick?: () => void;
};
function Cell(props: CellProps) {
  const { r, c, style, highlighted, onClick } = props;
  const cls = highlighted ? 'cell cell--highlight' : 'cell';
  return (
    <div
      className={cls}
      role="gridcell"
      data-r={r}
      data-c={c}
      style={style}
      onClick={onClick}
    />
  );
}

type LaneProps = { r: number; c: number; style: React.CSSProperties };
function Lane(props: LaneProps) {
  const { r, c, style } = props;
  const isIntersection = r % 2 === 1 && c % 2 === 1;
  const isHLane = r % 2 === 1 && c % 2 === 0;
  const isVLane = r % 2 === 0 && c % 2 === 1;
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
  | { kind: 'lane'; key: string; r: number; c: number; style: React.CSSProperties };

export function Board(props: {
  state: GameState;
  mode: 'move' | 'wall';
  orientation: 'H' | 'V';
  onApplyMove: (m: Move) => void;
}) {
  void props;

  // Compute highlight set for legal pawn destinations when in Move mode
  const highlightSet = useMemo(() => {
    if (props.mode !== 'move') return new Set<string>();
    const lm = legalMoves(props.state);
    const set = new Set<string>();
    for (const m of lm) {
      if (m.type === 'PawnMove') set.add(coordToId(m.to));
    }
    return set;
  }, [props.mode, props.state]);

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
          out.push({ kind: 'lane', key: `lane-${gr}-${gc}`, r: gr, c: gc, style });
        }
      }
    }
    return out;
  }, []);

  return (
    <div className="board" role="grid" aria-label="Quoridor board">
      <div className="board__grid">
        {items.map((it) => {
          if (it.kind === 'cell') {
            const isHighlighted = highlightSet.has(coordToId(it.r, it.c));
            return (
              <Cell
                key={it.key}
                r={it.r}
                c={it.c}
                style={it.style}
                highlighted={isHighlighted}
                onClick={
                  isHighlighted
                    ? () => props.onApplyMove({ type: 'PawnMove', to: { r: it.r, c: it.c } })
                    : undefined
                }
              />
            );
          }
          return <Lane key={it.key} r={it.r} c={it.c} style={it.style} />;
        })}
      </div>
    </div>
  );
}
