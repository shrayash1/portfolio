import { useRef, useState } from "react";
import { EMAIL, SOCIAL, copyText } from "../shared/links";
import type { CartId, GameId, PanelId } from "./Home";

type Props = { id: PanelId; onCart: (id: CartId) => void; onGame: (id: GameId) => void };

// The text column. It follows whichever cartridge is in front (or the game card under the pointer).
export function PanelText({ id, onCart, onGame }: Props) {
  switch (id) {
    case "about":
      return (
        <section key="about">
          <p>I'm a <b>Unity game developer with 4+ years of C#</b>, shipping mobile and web games for kids from prototype to the App Store and Google Play.</p>
          <p>At DarkMatter Production, Danson Solutions and Neo Digital I led small teams, trained interns, and built everything from core mechanics and quest systems to UI/UX and animation. I'm now doing a Master's in Software Design &amp; Management in Maryland, USA, and I'm open to game development and software engineering roles.</p>
          <div className="stats"><span><b>15+</b> games shipped &amp; built</span><span><b>iOS + Android</b></span><span><b>Team lead</b> at 2 studios</span></div>
          <FindMe />
          <button type="button" className="go" onClick={() => onCart("about")}>Insert for my player profile ▸</button>
          <p className="hint">Turn the cartridges, or put a game card in the handheld.</p>
        </section>
      );
    case "portfolio":
      return (
        <section key="portfolio">
          <p><b>Portfolio.</b> My games, experience, tech stack, art and contact, all in one place.</p>
          <p>Insert the cartridge to open it.</p>
          <button type="button" className="go" onClick={() => onCart("portfolio")}>Insert and open ▸</button>
        </section>
      );
    case "art":
      return (
        <section key="art">
          <p><b>Art.</b> Vector portraits, paintings and hand-painted decor from my Instagram.</p>
          <button type="button" className="go" onClick={() => onCart("art")}>Insert and open ▸</button>
        </section>
      );
    case "career":
      return (
        <section key="career">
          <div className="jobs">
            <div><b>Game Developer · DarkMatter Production</b><small>2024</small><span>KidSage, KidSage Colorbook and a horse race betting game.</span></div>
            <div><b>Game Developer &amp; Team Lead · Danson Solutions</b><small>2023</small><span>Arithmetica, Wack-a-Rat, Spell-Splatter, Frog Jump and more.</span></div>
            <div><b>Game Developer · Neo Digital</b><small>2022–2023</small><span>Super World Saga, 2 Player Football, Nimble Noggins, Ludo Super.</span></div>
            <div><b>Master's student · WUST</b><small>2024–now</small><span>Software Design &amp; Management.</span></div>
          </div>
          <p>Your studio next? Email me at <b>{EMAIL}</b>.</p>
          <button type="button" className="go" onClick={() => onCart("career")}>Insert for the quest log ▸</button>
        </section>
      );
    case "island":
      return (
        <section key="island">
          <p><b>Island.</b> Walk around my island as a little cartoon me, find 9 stars that tell my story, and stack blocks.</p>
          <button type="button" className="go" onClick={() => onGame("island")}>Insert card and play ▸</button>
        </section>
      );
    case "wilds":
      return (
        <section key="wilds">
          <p><b>Pocket Wilds.</b> A pixel monster survivor game: pick a fire, water or grass partner, learn moves, evolve and outlast the wild hordes.</p>
          <button type="button" className="go" onClick={() => onGame("wilds")}>Insert card and play ▸</button>
        </section>
      );
  }
}

function FindMe() {
  const mailRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = () =>
    copyText(EMAIL, mailRef.current).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  return (
    <p>
      Find me on <a href={SOCIAL.github} target="_blank" rel="noopener">GitHub</a>, <a href={SOCIAL.linkedin} target="_blank" rel="noopener">LinkedIn</a> and{" "}
      <a href={SOCIAL.instagram} target="_blank" rel="noopener">Instagram</a>, or email me at{" "}
      <button type="button" className="linkish" ref={mailRef} onClick={copy}>{EMAIL}</button>
      <span className="hint" aria-live="polite">{copied ? " (copied)" : ""}</span>.
    </p>
  );
}
