import type { GameState, Move } from '@quoridor/core';
import { canApplyMove, clampWallAnchor, legalMoves } from '@quoridor/core';
import { coordToId } from '../../utils/coords';
import { useCallback, useMemo, useState } from 'react';
import './Board.css';

type CellProps = {
  r: number;
  c: number;
  style: React.CSSProperties;
  highlighted?: boolean;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  pawn?: 'P1' | 'P2';
};
function Cell(props: CellProps) {
  const { r, c, style, highlighted, onClick, pawn, onPointerEnter, onPointerLeave } = props;
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
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {pawn ? (
        <div className={`pawn ${pawn === 'P1' ? 'pawn--p1' : 'pawn--p2'}`} data-pawn={pawn} />
      ) : null}
    </div>
  );
}

type PreviewOverlay = { orientation: 'H' | 'V'; status: 'valid' | 'invalid' };

type PreviewAnchorState = {
  anchor: { r: number; c: number };
  wallCount: number;
  mode: 'move' | 'wall';
};

type LaneProps = {
  r: number;
  c: number;
  style: React.CSSProperties;
  wall?: 'H' | 'V';
  preview?: PreviewOverlay;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
};
function Lane(props: LaneProps) {
  const { r, c, style, wall, preview, onPointerEnter, onPointerLeave, onClick } = props;
  const isIntersection = r % 2 === 1 && c % 2 === 1;
  const isHLane = r % 2 === 1 && c % 2 === 0;
  const isVLane = r % 2 === 0 && c % 2 === 1;
  const classes = ['lane'];
  if (isIntersection) classes.push('lane--x');
  else if (isHLane) classes.push('lane--h');
  else if (isVLane) classes.push('lane--v');
  if (wall) {
    classes.push('lane--wall');
    classes.push(wall === 'H' ? 'lane--wall-h' : 'lane--wall-v');
  }
  if (preview) {
    classes.push('lane--preview');
    classes.push(preview.orientation === 'H' ? 'lane--preview-h' : 'lane--preview-v');
    classes.push(preview.status === 'valid' ? 'lane--preview-valid' : 'lane--preview-invalid');
  }
  if (onClick) classes.push('lane--clickable');
  return (
    <div
      className={classes.join(' ')}
      aria-hidden="true"
      style={style}
      data-gr={r}
      data-gc={c}
      {...(preview ? { 'data-preview': preview.status } : {})}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    />
  );
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
  const { state, mode, orientation, onApplyMove } = props;
  const [previewState, setPreviewState] = useState<PreviewAnchorState | null>(null);

  // Compute highlight set for legal pawn destinations when in Move mode
  const highlightSet = useMemo(() => {
    if (mode !== 'move') return new Set<string>();
    const lm = legalMoves(state);
    const set = new Set<string>();
    for (const m of lm) {
      if (m.type === 'PawnMove') set.add(coordToId(m.to));
    }
    return set;
  }, [mode, state]);

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

  const wallMap = useMemo(() => {
    const map = new Map<string, 'H' | 'V'>();
    for (const w of state.placedWalls) {
      const baseRow = w.r * 2;
      const baseCol = w.c * 2;
      if (w.o === 'H') {
        const row = baseRow + 1;
        map.set(`${row},${baseCol}`, 'H');
        map.set(`${row},${baseCol + 1}`, 'H');
        map.set(`${row},${baseCol + 2}`, 'H');
      } else {
        const col = baseCol + 1;
        map.set(`${baseRow},${col}`, 'V');
        map.set(`${baseRow + 1},${col}`, 'V');
        map.set(`${baseRow + 2},${col}`, 'V');
      }
    }
    return map;
  }, [state.placedWalls]);

  const activePreviewAnchor = useMemo(() => {
    if (!previewState) return null;
    if (mode !== 'wall') return null;
    if (previewState.mode !== mode) return null;
    if (previewState.wallCount !== state.placedWalls.length) return null;
    return previewState.anchor;
  }, [previewState, mode, state.placedWalls.length]);

  const previewMap = useMemo(() => {
    if (!activePreviewAnchor) return null;
    const anchor = clampWallAnchor(activePreviewAnchor, state.boardSize);
    const result = canApplyMove(state, {
      type: 'WallPlacement',
      anchor,
      o: orientation,
    });
    const status: PreviewOverlay['status'] = result.ok ? 'valid' : 'invalid';
    const segments = new Map<string, PreviewOverlay>();
    if (orientation === 'H') {
      const row = anchor.r * 2 + 1;
      const colStart = anchor.c * 2;
      for (let delta = 0; delta <= 2; delta++) {
        segments.set(`${row},${colStart + delta}`, { orientation: 'H', status });
      }
    } else {
      const col = anchor.c * 2 + 1;
      const rowStart = anchor.r * 2;
      for (let delta = 0; delta <= 2; delta++) {
        segments.set(`${rowStart + delta},${col}`, { orientation: 'V', status });
      }
    }
    return segments;
  }, [activePreviewAnchor, orientation, state]);

  const applyWall = useCallback(
    (anchor: { r: number; c: number }) => {
      onApplyMove({
        type: 'WallPlacement',
        anchor,
        o: orientation,
      });
    },
    [onApplyMove, orientation],
  );

  const handlePreviewEnter = useCallback(
    (candidate: { r: number; c: number }) => {
      if (mode !== 'wall') return;
      const clamped = clampWallAnchor(candidate, state.boardSize);
      setPreviewState({
        anchor: clamped,
        wallCount: state.placedWalls.length,
        mode,
      });
    },
    [mode, state.boardSize, state.placedWalls.length],
  );

  const handleGridPreview = useCallback(
    (gridR: number, gridC: number) => {
      handlePreviewEnter({ r: Math.floor(gridR / 2), c: Math.floor(gridC / 2) });
    },
    [handlePreviewEnter],
  );

  const clearPreview = useCallback(() => {
    setPreviewState(null);
  }, []);

  return (
    <div className="board" role="grid" aria-label="Quoridor board" onPointerLeave={clearPreview}>
      <div className="board__grid">
        {items.map((it) => {
          if (it.kind === 'cell') {
            const isHighlighted = highlightSet.has(coordToId(it.r, it.c));
            let pawn: 'P1' | 'P2' | undefined;
            if (state.pawns.P1.r === it.r && state.pawns.P1.c === it.c) pawn = 'P1';
            else if (state.pawns.P2.r === it.r && state.pawns.P2.c === it.c) pawn = 'P2';

            let onClick: (() => void) | undefined;
            if (mode === 'move' && isHighlighted) {
              onClick = () => onApplyMove({ type: 'PawnMove', to: { r: it.r, c: it.c } });
            } else if (mode === 'wall') {
              const anchor = clampWallAnchor({ r: it.r, c: it.c }, state.boardSize);
              onClick = () => applyWall(anchor);
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
                onPointerEnter={
                  mode === 'wall' ? () => handlePreviewEnter({ r: it.r, c: it.c }) : undefined
                }
              />
            );
          }
          const key = `${it.r},${it.c}`;
          const preview = previewMap?.get(key);
          return (
            <Lane
              key={it.key}
              r={it.r}
              c={it.c}
              style={it.style}
              wall={wallMap.get(key)}
              preview={preview ?? undefined}
              onPointerEnter={mode === 'wall' ? () => handleGridPreview(it.r, it.c) : undefined}
              onClick={
                mode === 'wall' && preview && activePreviewAnchor
                  ? () => applyWall(activePreviewAnchor)
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
