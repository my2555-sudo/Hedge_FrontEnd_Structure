import React from "react";
import HeadlineCard from "./HeadlineCard.jsx";

export default function NewsFeed({ events = [], onSelect }) {
  return (
    <section className="newsfeed">
      <header className="newsfeed__bar">
        <strong>News</strong>
        <span className="newsfeed__count">{events.length}</span>
      </header>

      <div className="newsfeed__ticker" role="list">
        {events.map((e) => (
          <div role="listitem" key={e.runtimeId} className="newsfeed__item">
            <HeadlineCard event={e} onClick={onSelect} />
          </div>
        ))}
        {events.length === 0 && (
          <div className="newsfeed__empty">No headlines yet—start the game!</div>
        )}
      </div>
    </section>
  );
}
