import { useMemo, useState } from 'react';
import { Game } from '@quoridor/core';
import { Board } from './components/Board/Board';
import { Controls } from './components/Controls/Controls';
import { StatusBar } from './components/StatusBar/StatusBar';
import './App.css';

export function App() {
  const [game, setGame] = useState(() => Game.initial());
  const [mode, setMode] = useState<'move' | 'wall'>('move');
  const [orientation, setOrientation] = useState<'H' | 'V'>('H');
  const [error, setError] = useState<string | null>(null);

  const state = game.state;

  const onReset = () => {
    setGame(Game.initial());
    setError(null);
  };

  const onApplyMove = (move: Parameters<typeof game.applyMove>[0]) => {
    const res = game.applyMove(move);
    if (!res.ok) {
      setError(`${res.code}: ${res.reason}`);
      return;
    }
    setError(null);
    setGame(res.value);
  };

  return (
    <div className="app">
      <div className="app__header">
        <h1 className="app__title">Quoridor</h1>
      </div>
      <div className="app__main">
        <Board state={state} mode={mode} orientation={orientation} onApplyMove={onApplyMove} />
        <div className="app__side">
          <Controls
            mode={mode}
            setMode={setMode}
            orientation={orientation}
            setOrientation={setOrientation}
            onReset={onReset}
          />
          <StatusBar state={state} error={error} />
        </div>
      </div>
    </div>
  );
}
