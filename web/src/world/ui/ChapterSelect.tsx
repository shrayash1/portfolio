import { CHAPTERS } from "../story/chapters";

// `ready`: the chapters that have a scene built; an available chapter without one still shows "Coming soon"
export function ChapterSelect({ done, ready, onPick, onBack }: { done: number[]; ready?: number[]; onPick: (id: number) => void; onBack: () => void }) {
  return (
    <main className="screen select">
      <h1 className="big small">Chapter select</h1>
      <ul className="tiles">
        {CHAPTERS.map((c) => {
          const playable = c.available && (!ready || ready.includes(c.id));
          return (
            <li key={c.id} className={"ch" + c.id}>
              <button type="button" className="tile" disabled={!playable} onClick={() => onPick(c.id)}>
                <span className="label">Chapter {c.id}</span>
                <b>{c.en}</b>
                <span className="dv" lang="ne">{c.dv} · {c.place}</span>
                <span className="yrs">{!playable ? "Coming soon" : done.includes(c.id) ? "Completed" : c.years}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="btn" onClick={onBack}>← Back</button>
    </main>
  );
}
