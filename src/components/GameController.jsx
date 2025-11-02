export default function GameController({ onStart, onPause, onResume, seconds, active }) {
  return (
    <div className="Controller">
      <div className="Button" onClick={onStart}>Start</div>
      <div className="Button" onClick={onPause} aria-disabled={!active}>Pause</div>
      <div className="Button" onClick={onResume} aria-disabled={active || seconds<=0}>Resume</div>
    </div>
  );
}
