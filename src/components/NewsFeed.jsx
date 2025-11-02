export default function NewsFeed({ items }) {
  return (
    <div className="NewsList">
      {items.length === 0 && (
        <div className="Headline">
          <div className="meta">No news yet</div>
          Waiting for market events...
        </div>
      )}
      {items.map(item => (
        <div key={item.id} className="Headline" title={item.detail}>
          <div className="meta">{item.type} • impact {(item.impactPct*100).toFixed(1)}%</div>
          {item.title}
        </div>
      ))}
    </div>
  );
}
