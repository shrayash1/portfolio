import { useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import { Garland, NARROW } from "../shared/Garland";
import { NepalSkyline } from "../shared/NepalSkyline";
import { MotionToggle } from "../shared/MotionToggle";
import { MOTION, TOUCH, wait } from "../shared/motion";
import { legacy } from "../shared/links";
import { PanelText } from "./panels";
import { ProfileScreen, QuestLog } from "./screens";

export type CartId = "about" | "portfolio" | "art" | "career";
export type GameId = "island" | "wilds";
export type PanelId = CartId | GameId;

// The four cartridges on the drum. Page cartridges open a page; About and Career boot a screen on the console.
const CARTS: { id: CartId; name: string; screen?: string; page?: string; strip: string; tag: string; art: ReactNode; artClass?: string }[] = [
  { id: "about", name: "About", screen: "PLAYER PROFILE", strip: "ABOUT", tag: "SP", art: <img src="img/me-portrait.webp" alt="" style={{ objectPosition: "50% 22%" }} /> },
  { id: "portfolio", name: "Portfolio", page: "portfolio.html", strip: "PORTFOLIO", tag: "STORY", artClass: "collage", art: <><img src="img/sws.jpg" alt="" /><img src="img/kidsage.jpg" alt="" /><img src="img/frog.jpg" alt="" /></> },
  { id: "art", name: "Art", page: "portfolio.html#art", strip: "ART", tag: "GALLERY", art: <img src="img/art-04.jpg" alt="" /> },
  {
    id: "career", name: "Career", screen: "QUEST LOG", strip: "CAREER", tag: "2022–", artClass: "career",
    art: <><i style={{ background: "#8b5cf6" }}>DM</i><i style={{ background: "#f59e0b" }}>DS</i><i style={{ background: "#10b981" }}>ND</i><i style={{ background: "#ef4444" }}>WU</i><i className="add">+</i></>,
  },
];
// The two games play on the floating handheld.
const GAMES: Record<GameId, { name: string; page: string }> = {
  island: { name: "Island", page: legacy("world.html") },
  wilds: { name: "Pocket Wilds", page: legacy("pocket-wilds/") },
};
const NAMES: Record<PanelId, string> = { about: "About", portfolio: "Portfolio", art: "Art", career: "Career", island: "Island", wilds: "Pocket Wilds" };
const DEV: Record<PanelId, string> = { about: "परिचय", portfolio: "काम", art: "कला", career: "अनुभव", island: "टापु", wilds: "खेल" };
const STEP = 36; // degrees between cartridges on the drum

export function Home() {
  const [panel, setPanel] = useState<PanelId>("about");
  const [screen, setScreen] = useState<CartId | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [loadRun, setLoadRun] = useState(false);
  const [dockOn, setDockOn] = useState(false);
  const [hhGame, setHhGame] = useState<GameId | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const hhSlotRef = useRef<HTMLSpanElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const ejectRef = useRef<HTMLButtonElement>(null);
  const cartRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cardRefs = useRef<Record<GameId, HTMLButtonElement | null>>({ island: null, wilds: null });
  // pos is the drum's angle in cartridge steps; it can sit between two cartridges while scrolling or dragging.
  const st = useRef({ pos: 0, cur: 0, busy: false, dragged: false, hoverGame: false, screenOpen: false, x0: null as number | null, pos0: 0, settleT: 0 });

  // ---------- drum ----------
  function layout() {
    const carts = cartRefs.current, N = CARTS.length, s = st.current;
    const R = (carts[0]?.offsetWidth ?? 168) * 1.75;
    s.cur = ((Math.round(s.pos) % N) + N) % N;
    carts.forEach((el, i) => {
      if (!el) return;
      let d = (((i - s.pos) % N) + N) % N;
      if (d > N / 2) d -= N;
      const a = Math.abs(d);
      el.style.setProperty("--t", `translateZ(${-R}px) rotateY(${d * STEP}deg) translateZ(${R}px)`);
      el.style.setProperty("--dim", Math.min(0.75, a * 0.5).toFixed(3));
      el.style.visibility = a > 1.6 ? "hidden" : "visible";
      el.classList.toggle("front-card", a < 0.5);
    });
    if (!s.hoverGame) setPanel(CARTS[s.cur].id);
  }
  function resetTilt() {
    cartRefs.current.forEach((c) => { c?.style.setProperty("--rx", "0deg"); c?.style.setProperty("--ry", "0deg"); });
  }
  function turnTo(i: number) {
    const s = st.current, N = CARTS.length;
    if (s.busy) return;
    let d = (((i - s.pos) % N) + N) % N;
    if (d > N / 2) d -= N;
    s.pos = Math.round(s.pos + d);
    ringRef.current?.classList.remove("live");
    resetTilt();
    layout();
  }
  function settle(delay: number) {
    const s = st.current;
    clearTimeout(s.settleT);
    s.settleT = window.setTimeout(() => { ringRef.current?.classList.remove("live"); s.pos = Math.round(s.pos); layout(); }, delay);
  }

  // ---------- inserting ----------
  function flash() {
    const f = flashRef.current;
    if (!MOTION.on || !f) return;
    f.classList.remove("go");
    void f.offsetWidth;
    f.classList.add("go");
  }
  async function openPage(name: string, page: string) {
    setLoading(`LOADING ${name.toUpperCase()}…`);
    setLoadRun(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setLoadRun(true)));
    await new Promise((r) => setTimeout(r, MOTION.on ? 1100 : 700)); // long enough to read
    location.href = page;
  }
  async function insertCart() {
    const s = st.current;
    if (s.busy) return;
    const c = CARTS[s.cur], el = cartRefs.current[s.cur], slot = slotRef.current, dock = dockRef.current;
    if (!el || !slot || !dock) return;
    s.busy = true;
    resetTilt();
    // push the cartridge in only as far as the console body can hide it, so its top stays visible above the slot
    const cr = el.getBoundingClientRect(), sr = slot.getBoundingClientRect(), dk = dock.getBoundingClientRect();
    const slotY = sr.top + sr.height / 2;
    el.classList.add("inserting");
    el.style.setProperty("--lift", `${slotY - cr.bottom + Math.min(cr.height * 0.45, dk.bottom - slotY - 8)}px`);
    await wait(650);
    setDockOn(true);
    flash();
    await wait(450);
    if (c.screen) { s.screenOpen = true; setScreen(c.id); return; } // About and Career play on the home page itself
    openPage(c.name, c.page!);
  }
  function ejectCart() {
    const s = st.current, el = cartRefs.current[s.cur];
    el?.classList.remove("inserting");
    el?.style.removeProperty("--lift");
    setDockOn(false);
    s.busy = false;
  }
  function closeScreen() {
    const s = st.current;
    if (!s.screenOpen) return;
    s.screenOpen = false;
    setScreen(null);
    ejectCart();
    drumRef.current?.focus();
  }
  async function goCart(id: CartId) {
    const i = CARTS.findIndex((c) => c.id === id);
    if (i !== st.current.cur) { turnTo(i); await wait(650); }
    insertCart();
  }

  // ---------- handheld ----------
  async function insertGame(id: GameId) {
    const s = st.current, btn = cardRefs.current[id], slot = hhSlotRef.current;
    if (s.busy || !btn || !slot) return;
    s.busy = true;
    setPanel(id);
    const sl = slot.getBoundingClientRect(), b = btn.getBoundingClientRect();
    const dx = sl.left + sl.width / 2 - (b.left + b.width / 2);
    const above = sl.top - b.height / 2 - 4 - (b.top + b.height / 2);
    btn.classList.add("flying");
    btn.style.transform = `translate(${dx}px, ${above}px) rotate(0deg)`;
    await wait(480);
    btn.style.transform = `translate(${dx}px, ${above + b.height * 0.66}px) rotate(0deg)`;
    await wait(420);
    setHhGame(id);
    await wait(1200);
    flash();
    openPage(GAMES[id].name, GAMES[id].page);
  }
  const hoverGame = (id: GameId | null) => {
    const s = st.current;
    if (s.busy) return;
    s.hoverGame = id !== null;
    setPanel(id ?? CARTS[s.cur].id);
  };

  // ---------- tilt the front cartridge toward the pointer ----------
  function tilt(e: RPointerEvent<HTMLButtonElement>, i: number) {
    const s = st.current;
    if (i !== s.cur || s.busy || !MOTION.on || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 14}deg`);
    e.currentTarget.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 18}deg`);
  }

  useEffect(() => {
    const s = st.current, stage = stageRef.current!, drum = drumRef.current!;
    layout();
    const stepPx = () => (cartRefs.current[0]?.offsetWidth ?? 168) * 1.1;
    // drag or swipe: the drum follows live, then settles on the nearest cartridge
    const down = (e: PointerEvent) => { if (s.busy) return; s.x0 = e.clientX; s.pos0 = s.pos; s.dragged = false; };
    const move = (e: PointerEvent) => {
      if (s.x0 === null) return;
      const dx = e.clientX - s.x0;
      if (!s.dragged && Math.abs(dx) < 8) return;
      s.dragged = true;
      ringRef.current?.classList.add("live");
      resetTilt();
      s.pos = s.pos0 - dx / stepPx();
      layout();
    };
    const up = () => {
      if (s.x0 === null) return;
      s.x0 = null;
      if (s.dragged) { settle(0); setTimeout(() => { s.dragged = false; }, 0); }
    };
    // wheel and trackpad: on the one-screen desktop layout, scrolling turns the drum; on phones only a sideways scroll does
    const oneScreen = matchMedia("(min-width: 1024px)");
    const wheel = (e: WheelEvent) => {
      if (s.busy) return;
      const delta = oneScreen.matches ? (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) : e.deltaX;
      if (!delta) return;
      e.preventDefault();
      const px = e.deltaMode === 1 ? delta * 32 : delta;
      ringRef.current?.classList.add("live");
      resetTilt();
      s.pos += Math.max(-0.5, Math.min(0.5, px / 300));
      layout();
      settle(160);
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") closeScreen(); };
    // coming back with the Back button: show the page fresh, not mid-insert
    const pageshow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setLoading(null); setScreen(null); setHhGame(null); s.screenOpen = false;
      ejectCart();
      Object.values(cardRefs.current).forEach((b) => { b?.classList.remove("flying"); if (b) b.style.transform = ""; });
      layout();
    };
    drum.addEventListener("pointerdown", down);
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
    stage.addEventListener("wheel", wheel, { passive: false });
    addEventListener("keydown", key);
    addEventListener("resize", layout);
    addEventListener("pageshow", pageshow);

    // parallax: the sun, mountains, skyline and handheld lean with the pointer
    let raf = 0;
    if (MOTION.on && !TOUCH) {
      let tx = 0, ty = 0, mx = 0, my = 0;
      const pm = (e: PointerEvent) => { const r = stage.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; };
      stage.addEventListener("pointermove", pm);
      const tick = () => {
        const nx = mx + (tx - mx) * 0.06, ny = my + (ty - my) * 0.06;
        if (Math.abs(nx - mx) > 0.0005 || Math.abs(ny - my) > 0.0005) { mx = nx; my = ny; stage.style.setProperty("--mx", mx.toFixed(4)); stage.style.setProperty("--my", my.toFixed(4)); }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    return () => {
      drum.removeEventListener("pointerdown", down);
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      stage.removeEventListener("wheel", wheel);
      removeEventListener("keydown", key);
      removeEventListener("resize", layout);
      removeEventListener("pageshow", pageshow);
      cancelAnimationFrame(raf);
    };
    // The handlers only touch refs and state setters, so running this once is correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (screen) ejectRef.current?.focus(); }, [screen]);

  const s = st.current;
  return (
    <div className="app">
      {/* The stage comes first so phones show the cartridges on top. */}
      <div className="stage" ref={stageRef}>
        <NepalSkyline />
        <Garland n={NARROW ? 9 : 16} sag={20} />
        <MotionToggle />

        <div
          className="drum" ref={drumRef} tabIndex={0} role="group" aria-label="Cartridges. Arrow keys turn, Enter inserts the front cartridge."
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); turnTo(s.cur + 1); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); turnTo(s.cur - 1); }
            else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); insertCart(); }
          }}
        >
          <div className="ring" ref={ringRef}>
            {CARTS.map((c, i) => (
              <button
                key={c.id} type="button" className="cart" tabIndex={-1}
                aria-label={c.page ? `${c.name}: insert to open` : c.name}
                ref={(el) => { cartRefs.current[i] = el; }}
                onPointerMove={(e) => tilt(e, i)}
                onPointerLeave={resetTilt}
                onClick={() => { if (s.dragged) return; if (i === s.cur) insertCart(); else turnTo(i); }}
              >
                <span className="f front">
                  <span className="grip" />
                  <span className="label">
                    <span className={`art${c.artClass ? ` ${c.artClass}` : ""}`}>{c.art}</span>
                    <span className="strip">{c.strip} <em>{c.tag}</em></span>
                  </span>
                  <span className="emboss">▼ SP-1 ▼</span>
                  <span className="pins" />
                </span>
                <span className="f back"><i /></span><span className="f side l" /><span className="f side r" /><span className="f cap t" /><span className="f cap b" />
              </button>
            ))}
          </div>
        </div>
        <div className="drumhint">{TOUCH ? "Swipe to turn · tap the front cartridge to insert" : "Scroll or drag to turn · click the front cartridge to insert"}</div>

        {/* the console: page cartridges go in here */}
        <div className={`dock${dockOn ? " on" : ""}`} ref={dockRef} aria-hidden="true">
          <div className="top"><div className="slot" ref={slotRef} /></div>
          <div className="body"><span className="led" /><span className="brand">SP-1</span><span className="vents" /></div>
        </div>

        {/* the floating handheld: each game has its own card */}
        <div className="hh-wrap">
          <div className="hh-float">
            <GameCard id="island" refCb={(el) => { cardRefs.current.island = el; }} onPlay={insertGame} onHover={hoverGame} />
            <GameCard id="wilds" refCb={(el) => { cardRefs.current.wilds = el; }} onPlay={insertGame} onHover={hoverGame} />
            <div className={`hh${hhGame ? " on" : ""}`}>
              <span className="slot2" ref={hhSlotRef} /><span className="pwr" /><span className="dpad" />
              <div className="screenframe">
                <div className={`scr${hhGame ? ` on ${hhGame}` : ""}`}>
                  {hhGame ? (
                    <span className="msg">{GAMES[hhGame].name.toUpperCase()}<span className="blink">PRESS START</span></span>
                  ) : (
                    <span className="msg">INSERT<br />GAME CARD</span>
                  )}
                </div>
              </div>
              <span className="btns"><i /><i /></span>
            </div>
          </div>
        </div>

        {screen && (
          <div className="tv" role="dialog" aria-labelledby="tvtitle">
            <div className="tvbar">
              <span id="tvtitle">{CARTS.find((c) => c.id === screen)?.screen}</span>
              <button type="button" className="eject" ref={ejectRef} onClick={closeScreen}>⏏ EJECT</button>
            </div>
            <div className="tvin">{screen === "about" ? <ProfileScreen /> : <QuestLog />}</div>
          </div>
        )}

        <div className="flash" ref={flashRef} />
        {loading && (
          <div className={`loading${loadRun ? " run" : ""}`} role="status">
            <span>{loading}</span>
            <span className="bar2"><i /></span>
          </div>
        )}
      </div>

      <div className="left">
        <div className="bar">
          <nav className="crumb" aria-label="Breadcrumb">
            <button type="button" onClick={() => turnTo(0)}>Shrayash Pradhan</button>
            <span aria-hidden="true">/</span>
            <h1>{NAMES[panel]}</h1>
          </nav>
          <button className="ticket" type="button" aria-label="Open to roles. Show my career." onClick={() => turnTo(CARTS.findIndex((c) => c.id === "career"))}>
            <span className="t1">Open to roles.</span><span className="t2" aria-hidden="true">↗</span>
          </button>
        </div>
        <div className="panel">
          <div className="ptitle" aria-hidden="true">
            <span className="np grad">{NAMES[panel]}</span>
            <span className="dvs">{DEV[panel]}</span>
          </div>
          <PanelText id={panel} onCart={goCart} onGame={insertGame} />
        </div>
      </div>
    </div>
  );
}

function GameCard({ id, refCb, onPlay, onHover }: { id: GameId; refCb: (el: HTMLButtonElement | null) => void; onPlay: (id: GameId) => void; onHover: (id: GameId | null) => void }) {
  return (
    <button
      className={`gcard ${id}`} type="button" ref={refCb}
      aria-label={`${GAMES[id].name} game card: insert to play`}
      onClick={() => onPlay(id)}
      onPointerEnter={() => onHover(id)} onFocus={() => onHover(id)} onPointerLeave={() => onHover(null)}
    >
      <span className="shell" />
      <span className="glabel">
        {id === "island" ? (
          <svg width="40" height="22" viewBox="0 0 40 22" aria-hidden="true">
            <ellipse cx="20" cy="18" rx="18" ry="5" fill="#d9c38e" /><ellipse cx="20" cy="15" rx="13" ry="4" fill="#4f9a4a" />
            <path d="M12 14 L15 5 L18 14Z M24 14 L27 3 L30 14Z" fill="#2f7a44" /><circle cx="33" cy="4" r="3" fill="#fff6d8" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <ellipse cx="13" cy="17" rx="7" ry="6" fill="#fff" /><circle cx="6" cy="10" r="3" fill="#fff" /><circle cx="11" cy="6" r="3" fill="#fff" /><circle cx="16" cy="6" r="3" fill="#fff" /><circle cx="21" cy="10" r="3" fill="#fff" />
          </svg>
        )}
        {id === "island" ? "ISLAND" : <>POCKET<br />WILDS</>}
      </span>
      <span className="gpins" />
    </button>
  );
}
