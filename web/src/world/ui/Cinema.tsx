import { useSyncExternalStore } from "react";
import { store } from "../store";

/** Letterbox bars, timed subtitles and the optional ● REC vlog badge while a sequence plays. A tap skips it. */
export function Cinema({ onSkip }: { onSkip: () => void }) {
  const s = useSyncExternalStore(store.subscribe, store.get);
  if (!s.cinema) return null;
  return (
    <div className="cinema" onPointerDown={onSkip}>
      <i className="bar top" /><i className="bar bottom" />
      {s.rec && <span className="rec"><i />REC{s.rec.title && <b>{s.rec.title}</b>}</span>}
      {s.subtitle && <p className="sublines" role="status"><b>{s.subtitle.who}</b> {s.subtitle.text}</p>}
      <span className="skiphint">Esc or tap to skip</span>
    </div>
  );
}
