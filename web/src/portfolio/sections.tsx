import { useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import { Garland, NARROW } from "../shared/Garland";
import { EMAIL, SOCIAL, copyText } from "../shared/links";
import { clamp } from "../shared/scroll";
import { STACK } from "./data";

/** Chapter title: prayer flags, a line, the English word in the Nepali style, then the Nepali word small. */
export function Chapter({ en, dv, ch }: { en: string; dv: string; ch: string }) {
  return (
    <>
      <Garland n={NARROW ? 9 : 15} />
      <header className="ch">
        <span className="ch-line" />
        <h2 className="ch-dv np grad">{en}</h2>
        <span className="ch-en"><span className="dvs">{dv}</span> · {ch}</span>
      </header>
    </>
  );
}

export function Hero({ painted }: { painted: boolean }) {
  return (
    <section id="hero" data-ch="01" data-name="Start" className={painted ? "painted" : undefined}>
      <div className="h-layer h-back" id="hBack" />
      <figure className="h-art" id="hArt">
        <img className="sketch" src="img/me-portrait.webp" alt="" />
        <img className="color" src="img/me-portrait.webp" alt="Painted portrait of Shrayash in sunglasses and a floral shirt" />
      </figure>
      <div className="h-layer h-front" id="hFront" />
      <Garland n={NARROW ? 10 : 22} sag={18} className="garland hero-garland" />
      <div className="h-name" id="hName">
        <span className="hi">Hello! I'm</span>
        <h1><span className="np grad">Shrayash</span><span className="np grad last">Pradhan</span></h1>
        <p>UNITY GAME DEVELOPER</p>
        <small>I build games that teach and delight · Maryland, USA</small>
      </div>
      <div className="h-dv" aria-hidden="true"><span className="dv np grad">Namaste</span><span className="cap"><span className="dvs">नमस्ते</span> · CH.01</span></div>
      <div className="h-console" id="hConsole" aria-hidden="true">
        <span className="tag">SP-1 · ON<br />SCROLL ▼</span>
        <div className="ctop"><div className="cslot" /></div>
        <div className="cbody"><span className="led" /><span className="cbrand">SP-1</span><span className="vents" /></div>
      </div>
      <div className="h-scroll" aria-hidden="true">SCROLL<i /></div>
    </section>
  );
}

const CARDS = [
  { c: "#1f9e88", no: "01", h: "Gameplay", sub: "Unity · C#", p: "Core mechanics, quest, inventory and shop systems, physics, animation and sound, built to feel good on phones.", chips: ["Unity", "C#", "Unreal", "Prototyping"] },
  { c: "#e0a325", no: "02", h: "Design", sub: "Game · Level · UI", p: "Game and level design for kids' learning games, plus UI/UX in Figma and my own illustration and vector art.", chips: ["Game design", "Level design", "Figma", "Vector art"] },
  { c: "#e2553d", no: "03", h: "Teams", sub: "Lead · Ship", p: "Leading small teams, mentoring interns, testing and shipping to Google Play, the App Store and the web.", chips: ["Team lead", "GitHub", "Trello", "Multiplayer"] },
];

export function About() {
  return (
    <section id="about" data-ch="02" data-name="About">
      <div className="wrap">
        <Chapter en="About" dv="परिचय" ch="CH.02" />
        <div className="about">
          <div className="sheet rv">
            <span className="stampp">PLAYER 1</span>
            <h3>Shrayash Pradhan</h3>
            <div className="dvsub">खेल विकासकर्ता · game developer</div>
            <dl className="kv">
              <dt>CLASS</dt><dd>Unity Game Developer</dd>
              <dt>LEVEL</dt><dd>4+ years of Unity &amp; C#</dd>
              <dt>LOOT</dt><dd>15+ games shipped &amp; built</dd>
              <dt>GUILDS</dt><dd>3 studios, team lead at 2</dd>
              <dt>BASE</dt><dd>Maryland, USA</dd>
              <dt>STATUS</dt><dd className="ok">Open to game development and software engineering roles</dd>
            </dl>
          </div>
          <div className="note rv">
            <p className="big1">I'm a Unity game developer with 4+ years of C#, shipping mobile and web games for kids from prototype to the App Store and Google Play.</p>
            <p>At DarkMatter Production, Danson Solutions and Neo Digital I led small teams, trained interns, and built everything from core mechanics and quest systems to UI/UX and animation. I'm now doing a Master's in Software Design &amp; Management in Maryland, USA, and I'm open to game development and software engineering roles.</p>
            <p className="sign">— Shrayash</p>
          </div>
        </div>
        <div className="slashes" aria-hidden="true">
          <div id="sl1">/ UNITY / C# / GAME DESIGN / LEVEL DESIGN / PROTOTYPING / UNITY / C# / GAME DESIGN / LEVEL DESIGN / PROTOTYPING /</div>
          <div id="sl2">/ UI-UX / FIGMA / VECTOR ART / TEAM LEAD / MULTIPLAYER / UI-UX / FIGMA / VECTOR ART / TEAM LEAD / MULTIPLAYER /</div>
        </div>
        <div className="cards">
          {CARDS.map((c) => (
            <article key={c.h} className="tcard rv" style={{ "--c": c.c } as CSSProperties}>
              <div className="ty"><span>CLASS {c.no}</span><span>★★★</span></div>
              <h3>{c.h}</h3>
              <div className="sub">{c.sub}</div>
              <p>{c.p}</p>
              <div className="chips">{c.chips.map((x) => <i key={x}>{x}</i>)}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const SAVES = [
  { slot: "SAVE FILE 01 · IN PROGRESS", role: "Master's student", co: "Washington University of Science & Technology", text: "Master's in Software Design & Management, after a B.E. in Software Engineering with First Class Honors from Nepal College of Information Technology (2017–2022).", time: "2024–now" },
  { slot: "SAVE FILE 02 · CLEARED", role: "Game Developer", co: "DarkMatter Production", text: "Led development of KidSage Colorbook and KidSage, a learning game where a friendly yeti helps a village through shape and math quests, plus a horse race betting game.", list: ["Built quest, inventory and shop systems, animation, sound and UI/UX.", "Coded, prototyped and tested; trained interns as team lead."], time: "2024" },
  { slot: "SAVE FILE 03 · CLEARED", role: "Game Developer & Team Lead", co: "Danson Solutions", text: "Shipped Arithmetica, Wack-a-Rat, Spell-Splatter, Frog Jump, Vidhya's Adventure, Rhythm Game and Multi-Brawl.", list: ["Prototyped, tested and mentored interns."], time: "2023" },
  { slot: "SAVE FILE 04 · CLEARED", role: "Game Developer", co: "Neo Digital Pvt. Ltd.", text: "Designed, built, QA'd and deployed Super World Saga, 2 Player Football, Nimble Noggins and Ludo Super.", time: "2022–23" },
];

export function Experience() {
  return (
    <section id="experience" data-ch="03" data-name="Experience">
      <div className="wrap">
        <Chapter en="Experience" dv="अनुभव" ch="CH.03" />
        <div className="tl" id="tl">
          <span className="tl-fill" id="tlFill" />
          {SAVES.map((s) => (
            <article key={s.co} className="save rv">
              <div>
                <span className="slot">{s.slot}</span>
                <h3>{s.role}</h3>
                <div className="co">{s.co}</div>
                <p>{s.text}</p>
                {s.list && <ul>{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
              </div>
              <div className="time">PLAYTIME<b>{s.time}</b></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const YT = "https://www.youtube.com/watch?v=6bCW7ueh8qU";
export function Gameplay() {
  return (
    <section id="gameplay" data-ch="05" data-name="Gameplay">
      <div className="wrap">
        <Chapter en="Gameplay" dv="खेलाइ" ch="CH.05" />
        <p className="lead" style={{ marginBottom: 40 }}>A full playthrough of Super World Saga, all 24 levels, recorded by <a href="https://www.youtube.com/@AngryEmma" target="_blank" rel="noopener">Angry Emma</a> on YouTube.</p>
        <PlaythroughTV />
        <div className="jump">
          <span>Jump to</span>
          {[["0:00", 0], ["19:11", 1151], ["38:22", 2302], ["57:33", 3453], ["1:13:00", 4380]].map(([label, t]) => (
            <a key={label} href={`${YT}&t=${t}s`} target="_blank" rel="noopener">{label}</a>
          ))}
        </div>
      </div>
    </section>
  );
}

// The TV shows the poster; pressing play swaps in the YouTube player (only when asked, so the page stays light).
function PlaythroughTV() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="tvset rv">
      <div className="screen">
        {playing ? (
          <iframe
            src="https://www.youtube-nocookie.com/embed/6bCW7ueh8qU?autoplay=1&rel=0"
            title="Super World Saga full playthrough by Angry Emma"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ width: "100%", height: "100%", border: 0, position: "relative", zIndex: 3 }}
          />
        ) : (
          <>
            <img src="img/super-world-saga.jpg" alt="Super World Saga" />
            <button type="button" className="play" aria-label="Play the Super World Saga playthrough" onClick={() => setPlaying(true)} style={{ border: 0, background: "none", cursor: "pointer" }}>
              <span aria-hidden="true">▶</span>
            </button>
          </>
        )}
      </div>
      <span className="label">SP-TV · CH 05</span><span className="knobs"><i /><i /></span>
    </div>
  );
}

export function Stack() {
  const lid = useRef<HTMLDivElement>(null);
  const drag = useRef<HTMLElement | null>(null);
  const move = (e: RPointerEvent) => {
    const el = drag.current, box = lid.current?.getBoundingClientRect();
    if (!el || !box) return;
    el.style.setProperty("--x", clamp(((e.clientX - box.left) / box.width) * 100, 4, 96) + "%");
    el.style.setProperty("--y", clamp(((e.clientY - box.top) / box.height) * 100, 6, 94) + "%");
  };
  const drop = () => { drag.current?.classList.remove("drag"); drag.current = null; };
  return (
    <section id="stack" data-ch="07" data-name="Stack">
      <div className="wrap">
        <Chapter en="Tech Stack" dv="प्रविधि" ch="CH.07" />
        <p className="lead" style={{ marginBottom: 36 }}>The tools on my laptop lid. Drag the stickers around.</p>
        <div
          className="lid rv" ref={lid} role="list" aria-label="Tech stack"
          onPointerDown={(e) => {
            const s = (e.target as HTMLElement).closest<HTMLElement>(".stk");
            if (!s) return;
            drag.current = s;
            s.classList.add("drag");
            s.setPointerCapture(e.pointerId);
            lid.current?.appendChild(s); // bring to the front
          }}
          onPointerMove={move} onPointerUp={drop} onPointerCancel={drop}
        >
          <span className="logo" aria-hidden="true">SP</span>
          {STACK.map(([t, bg, fg, shape, x, y, r]) => (
            <span key={t} role="listitem" className={`stk ${shape}`} style={{ "--x": `${x}%`, "--y": `${y}%`, "--r": `${r}deg`, "--bgc": bg, "--fg": fg } as CSSProperties}>{t}</span>
          ))}
        </div>
        <p className="stack-note">Unity · C# · Unreal · C++ · Java · Python · Photon · Netcode · WebGL · Figma · Miro · GitHub · Trello</p>
      </div>
    </section>
  );
}

const TROPHY = (
  <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3zm-1 4v1a2 2 0 0 0 2 2V7H6zm12 0h-2v3a2 2 0 0 0 2-2V7z" /></svg>
);
export function Achievements() {
  return (
    <section id="certs" data-ch="08" data-name="Achievements">
      <div className="wrap">
        <Chapter en="Achievements" dv="उपलब्धि" ch="CH.08" />
        <div className="certs">
          <figure className="plaque rv"><img src="img/cert-google.jpg" alt="Google for Startups Startup School: Prompt to Prototype, certificate of completion awarded to Shrayash Pradhan on December 9, 2025" loading="lazy" /></figure>
          <div className="achs">
            <div className="ach rv" style={{ "--tc": "#e0a325" } as CSSProperties}>
              <span className="trophy" style={{ color: "#e0a325" }}>{TROPHY}</span>
              <div><small>ACHIEVEMENT UNLOCKED · DEC 9, 2025</small><b>Startup School: Prompt to Prototype</b><span>Google for Startups · certificate of completion</span></div>
            </div>
            <div className="ach rv" style={{ "--tc": "#c0c7d4" } as CSSProperties}>
              <span className="trophy" style={{ color: "#c0c7d4" }}>{TROPHY}</span>
              <div><small>ACHIEVEMENT UNLOCKED · 2019</small><b>NCIT Expo on Technology 2019</b><span>Nepal College of Information Technology · project competition certificate</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const mail = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  return (
    <section id="contact" data-ch="09" data-name="Contact">
      <div className="wrap">
        <Chapter en="Contact" dv="सम्पर्क" ch="CH.09" />
        <h2 className="contact-h">Let's make <em>a game.</em></h2>
        <div className="cgrid">
          <div>
            <h4>EMAIL</h4>
            <button type="button" className="mail" ref={mail} onClick={() => copyText(EMAIL, mail.current).then((ok) => { if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800); } })}>{EMAIL}</button>
            <p aria-live="polite" style={{ minHeight: "1.6em", marginTop: 8 }}>{copied ? "Copied to your clipboard." : ""}</p>
            <h4>BASED IN</h4>
            <p>Maryland, USA. Open to game development and software engineering roles. References available on request.</p>
          </div>
          <div>
            <h4>EDUCATION</h4>
            <p>Master's in Software Design &amp; Management, WUST, 2024–present</p>
            <p>B.E. Software Engineering, First Class Honors, NCIT, 2017–2022</p>
          </div>
          <div className="soc">
            <h4>SOCIAL</h4>
            <a href={SOCIAL.github} target="_blank" rel="noopener">GitHub <span>↗</span></a>
            <a href={SOCIAL.linkedin} target="_blank" rel="noopener">LinkedIn <span>↗</span></a>
            <a href={SOCIAL.instagram} target="_blank" rel="noopener">Instagram <span>↗</span></a>
            <a href="index.html">Back to the home console <span>⏏</span></a>
          </div>
        </div>
        <footer><span>Designed and developed by <b>Shrayash Pradhan</b></span><span>© 2026 · shrayashpradhan.com.np</span></footer>
      </div>
    </section>
  );
}
