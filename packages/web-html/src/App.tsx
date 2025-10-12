import { useEffect, useState } from 'react';
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

  // Global keyboard shortcuts: M/W/H/V
  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      if (!el || !(el as Element).closest) return false;
      const elem = el as Element;
      const tag = elem.tagName ? elem.tagName.toLowerCase() : '';
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        (elem as HTMLElement).isContentEditable
      )
        return true;
      return false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isEditable(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === 'm') {
        setMode('move');
        e.preventDefault();
        return;
      }
      if (k === 'w') {
        setMode('wall');
        e.preventDefault();
        return;
      }
      if (k === 'h') {
        if (mode === 'wall') setOrientation('H');
        e.preventDefault();
        return;
      }
      if (k === 'v') {
        if (mode === 'wall') setOrientation('V');
        e.preventDefault();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

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
