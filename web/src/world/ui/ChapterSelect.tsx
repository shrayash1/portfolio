import { CHAPTERS } from "../story/chapters";

export function ChapterSelect({ onPick, onBack }: { onPick: (id: number) => void; onBack: () => void }) {
  return (
    <main className="screen select">
      <h1 className="big small">Chapter select</h1>
      <ul className="tiles">
        {CHAPTERS.map((c) => (
          <li key={c.id} className={"ch" + c.id}>
            <button type="button" className="tile" disabled={!c.available} onClick={() => onPick(c.id)}>
              <span className="label">Chapter {c.id}</span>
              <b>{c.en}</b>
              <span className="dv">{c.dv} · {c.place}</span>
              <span className="yrs">{c.available ? c.years : "Coming soon"}</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn" onClick={onBack}>← Back</button>
    </main>
  );
}
