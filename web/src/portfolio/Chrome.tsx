import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MotionToggle } from "../shared/MotionToggle";
import { MOTION, wait } from "../shared/motion";
import { EMAIL, SOCIAL, legacy } from "../shared/links";

const NAV = [["about", "About"], ["experience", "Experience"], ["work", "Games"], ["gameplay", "Gameplay"], ["art", "Art"], ["stack", "Stack"], ["certs", "Achievements"], ["contact", "Contact"]];

/** Top bar and chapter rail. Both follow the scroll: the bar turns solid after the hero, the rail names the current chapter. */
export function TopBarAndRail() {
  const [solid, setSolid] = useState(false);
  const [cur, setCur] = useState({ id: "hero", ch: "01", name: "Start" });
  const [fill, setFill] = useState(0);
  useEffect(() => {
    let ticking = false;
    const frame = () => {
      ticking = false;
      const hero = document.getElementById("hero");
      const h = hero?.offsetHeight ?? innerHeight, y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      setSolid(y > h - 70);
      let found = document.querySelector<HTMLElement>("main section[data-ch]");
      document.querySelectorAll<HTMLElement>("main section[data-ch]").forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.45) found = s; });
      if (found) setCur({ id: found.id, ch: found.dataset.ch!, name: found.dataset.name! });
      setFill(max > 0 ? (y / max) * 100 : 0);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", frame);
    frame();
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", frame); };
  }, []);
  return (
    <>
      <header className={`top${solid ? " on-paper" : ""}`}>
        <a className="brand" href="#hero">SP</a>
        <nav className="nav" aria-label="Chapters">
          {NAV.map(([id, label]) => <a key={id} href={`#${id}`} className={cur.id === id ? "on" : undefined}>{label}</a>)}
        </nav>
        <div className="tright">
          <MotionToggle />
          <a className="eject" href="index.html" aria-label="Eject: back to the home page"><span>⏏ Eject</span><span aria-hidden="true">↗</span></a>
        </div>
      </header>
      <div className={`rail${solid || scrollY > innerHeight * 0.6 ? "" : " hide"}`} aria-hidden="true">
        <span className="no">CH.{cur.ch}</span>
        <span className="bar"><i style={{ height: `${fill.toFixed(1)}%` }} /></span>
        <span className="name">{cur.name.toUpperCase()}</span>
      </div>
    </>
  );
}

const play = (id: GameId) => dispatchEvent(new CustomEvent<GameId>("sp-play", { detail: id }));

/** The always-visible social dock on the left (a row at the bottom on phones). */
export function Dock() {
  return (
    <nav className="dock" aria-label="Find me">
      <a href={SOCIAL.github} target="_blank" rel="noopener" aria-label="GitHub" data-tip="GitHub">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5z" /></svg>
      </a>
      <a href={SOCIAL.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn" data-tip="LinkedIn">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21H9z" /></svg>
      </a>
      <a href={`mailto:${EMAIL}`} aria-label="Email" data-tip="Email">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3.5 6.5 12 13l8.5-6.5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      </a>
      <a href={SOCIAL.instagram} target="_blank" rel="noopener" aria-label="Instagram" data-tip="Instagram">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" /></svg>
      </a>
      <a href={legacy("pocket-wilds/")} onClick={(e) => { e.preventDefault(); play("wilds"); }} aria-label="Play Pocket Wilds" data-tip="Play Pocket Wilds">
        <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><ellipse cx="12" cy="16" rx="5" ry="4.2" /><circle cx="5.5" cy="10.5" r="2.2" /><circle cx="9.5" cy="6.5" r="2.2" /><circle cx="14.5" cy="6.5" r="2.2" /><circle cx="18.5" cy="10.5" r="2.2" /></g></svg>
      </a>
      <a href="world.html" onClick={(e) => { e.preventDefault(); play("island"); }} aria-label="Play The Journey" data-tip="Play The Journey">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 7h10a5 5 0 0 1 4.9 6l-.8 4a2.5 2.5 0 0 1-4.3 1.2L14.6 16H9.4l-2.2 2.2A2.5 2.5 0 0 1 2.9 17l-.8-4A5 5 0 0 1 7 7zm0 3v1.5H5.5v1.5H7v1.5h1.5V13H10v-1.5H8.5V10zm8.5.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm2 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" /></svg>
      </a>
    </nav>
  );
}

export type GameId = "island" | "wilds";
const HGAMES: Record<GameId, { name: string; page: string }> = { island: { name: "The Journey", page: "world.html" }, wilds: { name: "Pocket Wilds", page: legacy("pocket-wilds/") } };

/** The handheld docked in the lower-right corner: put a game card in to play The Journey or Pocket Wilds. */
export function CornerHandheld() {
  const [on, setOn] = useState<GameId | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [run, setRun] = useState(false);
  const busy = useRef(false);
  const slotRef = useRef<HTMLSpanElement>(null);
  const cards = useRef<Record<GameId, HTMLButtonElement | null>>({ island: null, wilds: null });

  async function insert(id: GameId) {
    const btn = cards.current[id], slot = slotRef.current;
    if (busy.current || !btn || !slot) return;
    busy.current = true;
    gsap.to("#hcorner", { autoAlpha: 1, scale: 1, y: 0, duration: 0.3 }); // make sure it's showing (e.g. clicked from the dock at the top)
    const s = slot.getBoundingClientRect(), b = btn.getBoundingClientRect();
    const dx = s.left + s.width / 2 - (b.left + b.width / 2), above = s.top - b.height / 2 - 4 - (b.top + b.height / 2);
    btn.classList.add("flying");
    btn.style.transform = `translate(${dx}px, ${above}px) rotate(0deg)`;
    await wait(450);
    btn.style.transform = `translate(${dx}px, ${above + b.height * 0.62}px) rotate(0deg)`;
    await wait(380);
    setOn(id);
    await wait(1000);
    setLoading(`LOADING ${HGAMES[id].name.toUpperCase()}…`);
    setRun(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setRun(true)));
    await new Promise((r) => setTimeout(r, MOTION.on ? 1200 : 700));
    location.href = HGAMES[id].page;
  }

  useEffect(() => {
    const onPlay = (e: Event) => insert((e as CustomEvent<GameId>).detail);
    // coming back with the Back button: reset the handheld
    const pageshow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      busy.current = false; setOn(null); setLoading(null);
      Object.values(cards.current).forEach((b) => { b?.classList.remove("flying"); if (b) b.style.transform = ""; });
    };
    addEventListener("sp-play", onPlay);
    addEventListener("pageshow", pageshow);
    return () => { removeEventListener("sp-play", onPlay); removeEventListener("pageshow", pageshow); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="hcorner" id="hcorner">
        <div className="float">
          <span className="hc-tip">PICK A GAME CARD</span>
          <button className="gcard island" type="button" ref={(el) => { cards.current.island = el; }} onClick={() => insert("island")} aria-label="The Journey game card: insert to play">
            <span className="shell" />
            <span className="glabel">
              <svg width="30" height="16" viewBox="0 0 40 22" aria-hidden="true"><ellipse cx="20" cy="18" rx="18" ry="5" fill="#d9c38e" /><ellipse cx="20" cy="15" rx="13" ry="4" fill="#4f9a4a" /><path d="M12 14 L15 5 L18 14Z M24 14 L27 3 L30 14Z" fill="#2f7a44" /></svg>
              THE<br />JOURNEY
            </span>
            <span className="gpins" />
          </button>
          <button className="gcard wilds" type="button" ref={(el) => { cards.current.wilds = el; }} onClick={() => insert("wilds")} aria-label="Pocket Wilds game card: insert to play">
            <span className="shell" />
            <span className="glabel">
              <svg width="18" height="18" viewBox="0 0 26 26" aria-hidden="true"><ellipse cx="13" cy="17" rx="7" ry="6" fill="#fff" /><circle cx="6" cy="10" r="3" fill="#fff" /><circle cx="11" cy="6" r="3" fill="#fff" /><circle cx="16" cy="6" r="3" fill="#fff" /><circle cx="21" cy="10" r="3" fill="#fff" /></svg>
              POCKET WILDS
            </span>
            <span className="gpins" />
          </button>
          <div className={`hh${on ? " on" : ""}`}>
            <span className="slot2" ref={slotRef} /><span className="pwr" /><span className="dpad" />
            <div className="screenframe">
              <div className={`scr${on ? ` on ${on}` : ""}`}>
                {on ? <span className="msg">{HGAMES[on].name.toUpperCase()}<span className="blink">PRESS START</span></span> : <span className="msg">PICK A<br />GAME</span>}
              </div>
            </div>
            <span className="btns"><i /><i /></span>
          </div>
        </div>
      </div>
      {loading && (
        <div className={`loading${run ? " run" : ""}`} role="status">
          <span>{loading}</span>
          <span className="bar2"><i /></span>
        </div>
      )}
    </>
  );
}

/** Boot screen: the PC and console start the portfolio. Only shown when motion is on; GSAP drives it from Portfolio. */
export function Boot() {
  return (
    <div className="boot" id="boot">
      <div className="b-rig" id="brig">
        <div className="b-monitor"><div className="b-screen" id="bscreen"><div className="b-text" id="btext"><span>INITIALIZE SYSTEM</span><b id="bpct">0%</b><span className="b-bar"><i id="bfill" /></span></div></div></div>
        <div className="b-neck" /><div className="b-foot" />
        <div className="b-console back" aria-hidden="true"><div className="ctop"><div className="cslot" /></div><div className="cbody" /></div>
        <div className="b-cart" id="bcart"><div className="mcart"><div className="ml">PORTFOLIO</div><div className="mp" /></div></div>
        <div className="b-console"><div className="ctop"><div className="cslot" /></div><div className="cbody"><span className="led" /><span className="cbrand">SP-1</span><span className="vents" /></div></div>
      </div>
      <div className="boot-name">SHRAYASH <span>PRADHAN</span></div>
      <button type="button" className="boot-skip" id="bootSkip">Skip ▸</button>
    </div>
  );
}
