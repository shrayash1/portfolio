import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MOTION } from "../shared/motion";
import { clamp } from "../shared/scroll";
import { Chapter } from "./sections";
import { ART, ART_KINDS, type Art as ArtPiece } from "./data";

const perRow = () => (innerWidth < 700 ? 2 : 4);

/** Art: prints hanging on strings with pegs. They sway with the scroll speed; click one for the large viewer. */
export function Art() {
  const [kind, setKind] = useState("All");
  const [per, setPer] = useState(perRow);
  const [open, setOpen] = useState<number | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const list = ART.filter((a) => kind === "All" || a.k === kind);
  const rows: ArtPiece[][] = [];
  for (let i = 0; i < list.length; i += per) rows.push(list.slice(i, i + per));

  useEffect(() => {
    const resize = () => setPer(perRow());
    addEventListener("resize", resize);
    // sway: follow the scroll speed, then ease back to rest
    let raf = 0, last = scrollY, vel = 0, sway = 0;
    if (MOTION.on) {
      const tick = () => {
        vel = scrollY - last; last = scrollY;
        sway += (clamp(vel * 0.35, -9, 9) - sway) * 0.08;
        galleryRef.current?.style.setProperty("--sway", sway.toFixed(2) + "deg");
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    return () => { removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);

  // lightbox keys
  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + list.length) % list.length));
      else if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % list.length));
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open === null, list.length]);

  const close = () => { setOpen(null); opener.current?.focus(); };
  const piece = open === null ? null : list[open];

  return (
    <section id="art" data-ch="06" data-name="Art">
      <div className="wrap">
        <Chapter en="Art" dv="कला" ch="CH.06" />
        <p className="lead" style={{ marginBottom: 34 }}>Vector portraits, paintings and hand-painted decor. More on my Instagram, <a href="https://www.instagram.com/shr_vector_arts/" target="_blank" rel="noopener">@shr_vector_arts</a>.</p>
        <div className="gallery" ref={galleryRef}>
          <span className="bigword" aria-hidden="true">SHR_VECTOR_ARTS</span>
          <div className="filters" aria-label="Filter artwork">
            {ART_KINDS.map((k) => <button key={k} type="button" aria-pressed={k === kind} onClick={() => setKind(k)}>{k}</button>)}
          </div>
          {rows.map((row, r) => (
            <div className="string" key={`${kind}-${r}`}>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                <path d={`M0,4 Q50,${row.length > 1 ? 34 : 14} 100,4`} fill="none" stroke="#d46a7e" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
              </svg>
              {row.map((a, k) => {
                const t = (k + 0.5) / per, dy = Math.round(26 * 4 * t * (1 - t)); // follow the string's sag
                return (
                  <button
                    key={a.f} type="button" className="hang" aria-label={`${a.t}, ${a.k}. Open larger`}
                    style={{ "--rot": `${[-3, 2, -1.5, 3][(k + r) % 4]}deg`, "--dy": `${dy}px` } as CSSProperties}
                    onClick={(e) => { opener.current = e.currentTarget; setOpen(list.indexOf(a)); }}
                  >
                    <span className="peg" />
                    <img src={`img/${a.f}`} alt={a.a} loading="lazy" />
                    <b>{a.t}</b>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <a className="ig" href="https://www.instagram.com/shr_vector_arts/" target="_blank" rel="noopener">Follow @shr_vector_arts ↗</a>
      </div>

      {piece && (
        <div className="lb" role="dialog" aria-modal="true" aria-label="Artwork viewer" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <button type="button" className="pv" aria-label="Previous artwork" onClick={() => setOpen((open! - 1 + list.length) % list.length)}>←</button>
          <figure>
            <img src={`img/${piece.f}`} alt={piece.a} />
            <figcaption>
              <span><b>{piece.t}</b> · {piece.k}</span>
              <a href={`https://www.instagram.com/${piece.u}`} target="_blank" rel="noopener">See on Instagram ↗</a>
            </figcaption>
          </figure>
          <button type="button" className="nx" aria-label="Next artwork" onClick={() => setOpen((open! + 1) % list.length)}>→</button>
          <button type="button" className="x" aria-label="Close" ref={closeRef} onClick={close}>✕</button>
        </div>
      )}
    </section>
  );
}
