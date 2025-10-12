import './Controls.css';

export function Controls(props: {
  mode: 'move' | 'wall';
  setMode: (m: 'move' | 'wall') => void;
  orientation: 'H' | 'V';
  setOrientation: (o: 'H' | 'V') => void;
  onReset: () => void;
}) {
  const { mode, setMode, orientation, setOrientation, onReset } = props;
  const orientationDisabled = mode !== 'wall';
  return (
    <div className="controls">
      <div className="controls__group">
        <span className="controls__label">Mode:</span>
        <button
          type="button"
          className={`controls__btn ${mode === 'move' ? 'controls__btn--active' : ''}`}
          title="Move (M)"
          onClick={() => setMode('move')}
        >
          Move
        </button>
        <button
          type="button"
          className={`controls__btn ${mode === 'wall' ? 'controls__btn--active' : ''}`}
          title="Wall (W)"
          onClick={() => setMode('wall')}
        >
          Wall
        </button>
      </div>
      <div className="controls__group">
        <span className="controls__label">Orientation:</span>
        <button
          type="button"
          className={`controls__btn ${orientation === 'H' ? 'controls__btn--active' : ''} ${orientationDisabled ? 'controls__btn--disabled' : ''}`}
          title="Horizontal (H)"
          {...(orientationDisabled ? { 'aria-disabled': true, tabIndex: -1 } : {})}
          onClick={() => {
            if (orientationDisabled) return;
            setOrientation('H');
          }}
        >
          H
        </button>
        <button
          type="button"
          className={`controls__btn ${orientation === 'V' ? 'controls__btn--active' : ''} ${orientationDisabled ? 'controls__btn--disabled' : ''}`}
          title="Vertical (V)"
          {...(orientationDisabled ? { 'aria-disabled': true, tabIndex: -1 } : {})}
          onClick={() => {
            if (orientationDisabled) return;
            setOrientation('V');
          }}
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
