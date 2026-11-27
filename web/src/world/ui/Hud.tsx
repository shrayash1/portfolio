import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { stickVector } from "../engine/input";
import { store } from "../store";
import type { ChapterInfo } from "../story/types";

/** Everything drawn over the game: title card, objective, prompt, dialogue, controls and touch buttons. */
export function Hud({ chapter, subtitles, onTalk, onPause }: { chapter: ChapterInfo; subtitles: boolean; onTalk: () => void; onPause: () => void }) {
  const s = useSyncExternalStore(store.subscribe, store.get);
  const [card, setCard] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setCard(false), 4000);
    return () => clearTimeout(t);
  }, []);
  // the ring shows where the left thumb is; the game reads the same touches itself (input.ts)
  const knob = useRef<HTMLElement>(null);
  useEffect(() => {
    let id = -1, ox = 0, oy = 0;
    const put = (x: number, y: number) => knob.current?.style.setProperty("transform", `translate(${x * 34}px, ${y * 34}px)`);
    const down = (e: PointerEvent) => { if (e.pointerType === "touch" && e.clientX < innerWidth / 2 && id < 0) { id = e.pointerId; ox = e.clientX; oy = e.clientY; } };
    const move = (e: PointerEvent) => { if (e.pointerId === id) { const v = stickVector(e.clientX - ox, e.clientY - oy); put(v.x, v.y); } };
    const up = (e: PointerEvent) => { if (e.pointerId === id) { id = -1; put(0, 0); } };
    addEventListener("pointerdown", down); addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
    return () => { removeEventListener("pointerdown", down); removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); };
  }, []);
  return (
    <div className={"hud" + (s.cinema ? " cinema" : "")}>
      <div className={"card" + (card ? "" : " gone")} aria-hidden={!card}>
        <span className="label">Chapter {chapter.id}</span>
        <b>{chapter.en}</b>
        <span className="dv" lang="ne">{chapter.dv} · {chapter.place}</span>
      </div>
      {s.objective && !s.cinema && (
        <div className="panel objective"><span className="label">Objective</span>{s.objective}{s.optional && <span className="opt">{s.optional}</span>}</div>
      )}
      {s.note && <div className="panel note" role="status">{s.note}</div>}
      {s.prompt && !s.dialogue && !s.cinema && (
        <div className="prompt" role="status"><kbd>E</kbd>{s.prompt}</div>
      )}
      {s.thought && !s.dialogue && <div className="thought" role="status">{s.thought}</div>}
      {s.dialogue && (
        <div className={"panel dialogue" + (s.dialogue.who === "You" ? " you" : "")} role="status">
          {s.dialogue.who !== "You" && <span className="who">{s.dialogue.who}</span>}
          {subtitles && <p>{s.dialogue.text}</p>}
          <span className="next"><kbd>E</kbd>{s.last ? "Close" : "Next"}</span>
        </div>
      )}
      <div className="panel help">
        <span className="keys"><b>WASD</b> or arrows to walk · <b>Shift</b> run · <b>drag</b> to look · <b>E</b> talk · <b>Esc</b> pause</span>
        <span className="touch"><b>Left thumb</b> to walk · <b>right thumb</b> drag to look</span>
      </div>
      <button type="button" className="tbtn pausebtn" aria-label="Pause" onClick={onPause}>II</button>
      <div className="ring" aria-hidden="true"><i ref={knob} /></div>
      {!s.dialogue && <span className="lookhint">Drag to look</span>}
      <div className="touchbtns">
        {(s.prompt || s.dialogue) && <button type="button" className="tbtn talk" onClick={onTalk}>Talk</button>}
      </div>
    </div>
  );
}
