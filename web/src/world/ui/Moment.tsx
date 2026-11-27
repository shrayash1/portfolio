import { useEffect, useSyncExternalStore } from "react";
import { store } from "../store";

/** Full-screen cinematic card; resolves on Continue (button or Enter). Accent per kind is CSS only. */
export function Moment({ onContinue }: { onContinue: () => void }) {
  const m = useSyncExternalStore(store.subscribe, store.get).moment;
  useEffect(() => {
    if (!m) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); onContinue(); } };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [m, onContinue]);
  if (!m) return null;
  return (
    <main className={"screen moment" + (m.kind ? " " + m.kind : "")} role="dialog" aria-label={m.title}>
      {m.kind === "graduation" && <div className="caps" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${4 + i * 8}%`, animationDelay: `${(i % 5) * 0.7}s`, animationDuration: `${4 + (i % 4)}s` }} />)}</div>}
      {m.image && <img className="momentimg" src={m.image} alt="" />}
      <h2 className="big small">{m.title}</h2>
      {m.sub && <p className="sub">{m.sub}</p>}
      <button type="button" className="btn primary" autoFocus onClick={onContinue}>Continue</button>
    </main>
  );
}
