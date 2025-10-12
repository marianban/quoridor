import type { GameState } from '@quoridor/core';
import './StatusBar.css';

export function StatusBar(props: { state: GameState; error: string | null }) {
  const { state, error } = props;
  const { P1, P2 } = state.pawns;
  const w1 = state.wallsRemaining.P1;
  const w2 = state.wallsRemaining.P2;

  return (
    <div className="status">
      <div className="status__line">
        Turn: <strong className="status__value">{state.turn}</strong>
      </div>
      <div className="status__line">
        P1 @ ({P1.r},{P1.c}) w={w1} | P2 @ ({P2.r},{P2.c}) w={w2}
      </div>
      {error ? (
        <div className="status__error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}
