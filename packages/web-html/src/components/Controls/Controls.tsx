import './Controls.css';

export function Controls(props: {
  mode: 'move' | 'wall';
  setMode: (m: 'move' | 'wall') => void;
  orientation: 'H' | 'V';
  setOrientation: (o: 'H' | 'V') => void;
  onReset: () => void;
}) {
  const { mode, setMode, orientation, setOrientation, onReset } = props;
  return (
    <div className="controls">
      <div className="controls__group">
        <span className="controls__label">Mode:</span>
        <button
          type="button"
          className={`controls__btn ${mode === 'move' ? 'controls__btn--active' : ''}`}
          onClick={() => setMode('move')}
        >
          Move
        </button>
        <button
          type="button"
          className={`controls__btn ${mode === 'wall' ? 'controls__btn--active' : ''}`}
          onClick={() => setMode('wall')}
        >
          Wall
        </button>
      </div>
      <div className="controls__group">
        <span className="controls__label">Orientation:</span>
        <button
          type="button"
          className={`controls__btn ${orientation === 'H' ? 'controls__btn--active' : ''}`}
          onClick={() => setOrientation('H')}
        >
          H
        </button>
        <button
          type="button"
          className={`controls__btn ${orientation === 'V' ? 'controls__btn--active' : ''}`}
          onClick={() => setOrientation('V')}
        >
          V
        </button>
      </div>
      <div className="controls__group">
        <button type="button" className="controls__btn" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
