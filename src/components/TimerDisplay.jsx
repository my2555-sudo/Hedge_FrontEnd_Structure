export default function TimerDisplay({ seconds, active }) {
  return (
    <div className="Timer">
      {String(seconds).padStart(2, "0")}s
      <span className="sub">{active ? "LIVE" : "PAUSED"}</span>
    </div>
  );
}
