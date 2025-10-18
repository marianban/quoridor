import type { GameState, Move } from '@quoridor/core';
import { clampWallAnchor, legalMoves } from '@quoridor/core';
import { coordToId } from '../../utils/coords';
import { useMemo } from 'react';
import './Board.css';

type CellProps = {
  r: number;
  c: number;
  style: React.CSSProperties;
  highlighted?: boolean;
  onClick?: () => void;
  pawn?: 'P1' | 'P2';
};
function Cell(props: CellProps) {
  const { r, c, style, highlighted, onClick, pawn } = props;
  const classes = ['cell'];
  if (highlighted) classes.push('cell--highlight');
  if (onClick) classes.push('cell--clickable');
  return (
    <div
      className={classes.join(' ')}
      role="gridcell"
      data-r={r}
      data-c={c}
      style={style}
      onClick={onClick}
    >
      {pawn ? (
        <div className={`pawn ${pawn === 'P1' ? 'pawn--p1' : 'pawn--p2'}`} data-pawn={pawn} />
      ) : null}
    </div>
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
            let pawn: 'P1' | 'P2' | undefined;
            if (props.state.pawns.P1.r === it.r && props.state.pawns.P1.c === it.c) pawn = 'P1';
            else if (props.state.pawns.P2.r === it.r && props.state.pawns.P2.c === it.c)
              pawn = 'P2';

            let onClick: (() => void) | undefined;
            if (props.mode === 'move' && isHighlighted) {
              onClick = () => props.onApplyMove({ type: 'PawnMove', to: { r: it.r, c: it.c } });
            } else if (props.mode === 'wall') {
              const anchor = clampWallAnchor({ r: it.r, c: it.c }, props.state.boardSize);
              onClick = () =>
                props.onApplyMove({
                  type: 'WallPlacement',
                  anchor,
                  o: props.orientation,
                });
            }

            return (
              <Cell
                key={it.key}
                r={it.r}
                c={it.c}
                style={it.style}
                highlighted={isHighlighted}
                pawn={pawn}
                onClick={onClick}
              />
            );
          }
          return <Lane key={it.key} r={it.r} c={it.c} style={it.style} />;
        })}
      </div>
    </div>
  );
}
