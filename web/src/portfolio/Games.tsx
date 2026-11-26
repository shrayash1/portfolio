import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MOTION } from "../shared/motion";
import { clamp, scrollToY } from "../shared/scroll";
import { Chapter } from "./sections";
import { GAMES } from "./data";

const N = GAMES.length;

/**
 * Games: the section pins while you scroll, and each step of scrolling pulls the next cartridge out of the library.
 * The cartridge hovers over a console, ready to insert; inserting lights up the play links.
 */
export function Games() {
  const [gi, setGi] = useState(0);
  const [inserted, setInserted] = useState(false);
  const [live, setLive] = useState(false);
  const [out, setOut] = useState(false); // the cartridge is out of its case, hovering over the console
  const [swap, setSwap] = useState(false); // the case-swap animation
  const pinRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rackRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const g = GAMES[gi];

  const pinRange = () => {
    const pin = pinRef.current!;
    return [pin.getBoundingClientRect().top + scrollY, pin.offsetHeight - innerHeight] as const;
  };
  const goGame = (i: number) => {
    const [top, range] = pinRange();
    scrollToY(top + (range * clamp(i, 0, N - 1)) / (N - 1) + 1);
  };

  // scroll position → which game is out
  useEffect(() => {
    pinRef.current!.style.height = `calc(100vh + ${(N - 1) * 55}vh)`;
    // React skips the render when the game hasn't changed, so no frame throttle is needed
    const onScroll = () => {
      const [top, range] = pinRange();
      setGi(clamp(Math.round(((scrollY - top) / range) * (N - 1)), 0, N - 1));
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    // the first cartridge slides out when the chapter comes into view
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setOut(true); io.disconnect(); } }), { threshold: 0.4 });
    io.observe(wrapRef.current!);
    return () => { removeEventListener("scroll", onScroll); io.disconnect(); };
  }, []);

  // a new game: eject, swap the case in, slide the cartridge out, keep the library shelf centred on it
  useEffect(() => {
    setInserted(false);
    setLive(false);
    const rack = rackRef.current!, b = rack.children[gi] as HTMLElement;
    rack.scrollTo({ left: b.offsetLeft - rack.clientWidth / 2 + b.offsetWidth / 2, behavior: MOTION.on ? "smooth" : "auto" });
    if (first.current) { first.current = false; return; }
    if (!MOTION.on) { setOut(true); return; }
    setOut(false);
    setSwap(false);
    const r = requestAnimationFrame(() => setSwap(true)); // re-adding the class restarts the animation
    const t = setTimeout(() => setOut(true), 260);
    return () => { cancelAnimationFrame(r); clearTimeout(t); };
  }, [gi]);

  const toggleInsert = () => {
    if (inserted) { setInserted(false); setLive(false); return; }
    setOut(true);
    setInserted(true);
    setTimeout(() => setLive(true), MOTION.on ? 600 : 0);
  };

  return (
    <section id="work" data-ch="04" data-name="Games" style={{ paddingBottom: 0 }}>
      <div className="wrap">
        <Chapter en="Games" dv="खेल" ch="CH.04" />
        <p className="lead">Mobile and web games for kids and casual players, published on Google Play, the App Store and the web. Scroll to pull each cartridge from the library, then insert it to play.</p>
      </div>
      <div className="pin" ref={pinRef}>
        <div className="pin-stage">
          <div className="wrap">
            <div className="stage">
              <div className={`case-wrap${out ? " out" : ""}${swap ? " swap" : ""}${inserted ? " inserted" : ""}`} ref={wrapRef} style={{ "--gc": g.c } as CSSProperties}>
                <button type="button" className="ocart" aria-label={inserted ? "Eject the cartridge" : "Insert the cartridge"} onClick={toggleInsert}><span className="ol" /><span className="op" /></button>
                <div className="case" aria-hidden="true">
                  <div className="cover">{g.i ? <img src={`img/${g.i}`} alt="" /> : <span className="initials">{g.k}</span>}</div>
                  <span className="num">{String(gi + 1).padStart(2, "0")}</span>
                  <span className="script">{g.n}</span>
                  <span className="sticker">{g.tag[0]}</span>
                </div>
                <span className="ins-hint" aria-hidden="true">▼ INSERT TO PLAY</span>
                <div className="wdock" aria-hidden="true"><div className="ctop"><div className="cslot" /></div><div className="cbody"><span className="led" /><span className="cbrand">SP-1</span><span className="vents" /></div></div>
              </div>
              <div className="info" aria-live="polite">
                <span className="count">GAME {String(gi + 1).padStart(2, "0")} OF {N}</span>
                <h3>{g.n}</h3>
                <div className="tags">{g.tag.map((t) => <span key={t}>{t}</span>)}</div>
                <p>{g.d}</p>
                <p className="stack-line">Built with {g.s}</p>
                <div className={`links${live ? " live" : ""}`}>
                  {g.l.length ? g.l.map(([t, u]) => <a key={u} href={u} target="_blank" rel="noopener">{t} ↗</a>) : <span className="nolink">No public link yet.</span>}
                </div>
                <div className="ctrl">
                  <button type="button" aria-label="Previous game" onClick={() => goGame(gi - 1)}>←</button>
                  <button type="button" className="insert" onClick={toggleInsert}>{inserted ? "⏏ Eject" : "Insert cartridge ▸"}</button>
                  <button type="button" aria-label="Next game" onClick={() => goGame(gi + 1)}>→</button>
                </div>
              </div>
            </div>
            <div className="library">
              <div className="rack" ref={rackRef} aria-label="Game library">
                {GAMES.map((x, i) => (
                  <button key={x.n} type="button" className="lcart" style={{ "--gc": x.c } as CSSProperties} aria-label={x.n} aria-current={i === gi} onClick={() => goGame(i)}>
                    <span className="ll">{x.i ? <img src={`img/${x.i}`} alt="" /> : x.k}</span>
                    <span className="ln">{x.n}</span>
                  </button>
                ))}
              </div>
              <div className="plank" />
            </div>
            <p className="scrollhint">Scroll to pull the next cartridge, or pick one from the shelf</p>
          </div>
        </div>
      </div>
    </section>
  );
}
