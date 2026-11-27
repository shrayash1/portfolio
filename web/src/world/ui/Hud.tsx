import { useEffect, useState, useSyncExternalStore } from "react";
import { store } from "../store";
import type { ChapterInfo } from "../story/types";

/** Everything drawn over the game: title card, objective, prompt, dialogue, controls and touch buttons. */
export function Hud({ chapter, subtitles, onTalk }: { chapter: ChapterInfo; subtitles: boolean; onTalk: () => void }) {
  const s = useSyncExternalStore(store.subscribe, store.get);
  const [card, setCard] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setCard(false), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="hud">
      <div className={"card" + (card ? "" : " gone")} aria-hidden={!card}>
        <span className="label">Chapter {chapter.id}</span>
        <b>{chapter.en}</b>
        <span className="dv">{chapter.dv} · {chapter.place}</span>
      </div>
      {s.objective && (
        <div className="panel objective"><span className="label">Objective</span>{s.objective}</div>
      )}
      {s.note && <div className="panel note" role="status">{s.note}</div>}
      {s.prompt && !s.dialogue && (
        <div className="prompt" role="status"><kbd>E</kbd>{s.prompt}</div>
      )}
      {s.dialogue && (
        <div className="panel dialogue" role="status">
          <span className="who">{s.dialogue.who}</span>
          {subtitles && <p>{s.dialogue.text}</p>}
          <span className="next"><kbd>E</kbd>Next</span>
        </div>
      )}
      <div className="panel help">
        <span className="keys"><b>WASD</b> or arrows to walk · <b>Shift</b> run · <b>drag</b> to look · <b>E</b> talk · <b>Esc</b> pause</span>
        <span className="touch"><b>Left thumb</b> to walk · <b>right thumb</b> drag to look</span>
      </div>
      <div className="touchbtns">
        {(s.prompt || s.dialogue) && <button type="button" className="tbtn talk" onClick={onTalk}>Talk</button>}
        <button type="button" className="tbtn" aria-label="Jump">Jump</button>
      </div>
    </div>
  );
}
