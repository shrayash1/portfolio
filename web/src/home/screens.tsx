import { EMAIL } from "../shared/links";

// What the console shows when the About or Career cartridge is inserted.

export function ProfileScreen() {
  return (
    <>
      <div className="prof">
        <div className="pf-avatar">
          <img src="img/me-portrait.webp" alt="" />
        </div>
        <div>
          <p className="px">SHRAYASH PRADHAN</p>
          <dl className="kv">
            <dt>Class</dt><dd>Unity Game Developer</dd>
            <dt>Level</dt><dd>4+ years of Unity &amp; C#</dd>
            <dt>Base</dt><dd>Maryland, USA</dd>
            <dt>Quest</dt><dd>Master's in Software Design &amp; Management</dd>
            <dt>Status</dt><dd className="ok">Open to game development and software engineering roles</dd>
          </dl>
        </div>
      </div>
      <div className="trophies">
        <div><b>15+</b><span>games shipped &amp; built</span></div>
        <div><b>3 studios</b><span>team lead at 2</span></div>
        <div><b>iOS · Android · Web</b><span>shipped to</span></div>
      </div>
      <p className="px">INVENTORY</p>
      <ul className="inv">
        {["Unity", "C#", "Unreal", "Prototyping", "Game design", "Level design", "Figma", "Vector art", "Team lead", "GitHub", "Trello", "Multiplayer"].map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </>
  );
}

const QUESTS = [
  { st: "▶", now: true, title: "Master's student · Washington University of Science & Technology", when: "2024–now · in progress", text: "Master's in Software Design & Management." },
  { st: "✔", title: "Game Developer · DarkMatter Production", when: "2024", text: "Led development of KidSage Colorbook and KidSage, a learning game where a friendly yeti helps a village through shape and math quests, plus a horse race betting game. Built quest, inventory and shop systems, animation, sound and UI/UX. Trained interns as team lead." },
  { st: "✔", title: "Game Developer & Team Lead · Danson Solutions", when: "2023", text: "Shipped Arithmetica, Wack-a-Rat, Spell-Splatter, Frog Jump, Vidhya's Adventure, Rhythm Game and Multi-Brawl. Prototyped, tested and mentored interns." },
  { st: "✔", title: "Game Developer · Neo Digital Pvt. Ltd.", when: "2022–2023", text: "Designed, built, QA'd and deployed Super World Saga, 2 Player Football, Nimble Noggins and Ludo Super." },
  { st: "✔", title: "B.E. Software Engineering · Nepal College of Information Technology", when: "2017–2022", text: "First Class Honors." },
];

export function QuestLog() {
  return (
    <ol className="quests">
      {QUESTS.map((q) => (
        <li key={q.title} className={q.now ? "now" : undefined}>
          <span className="st">{q.st}</span>
          <div><b>{q.title}</b><small>{q.when}</small><p>{q.text}</p></div>
        </li>
      ))}
      <li className="next">
        <span className="st">?</span>
        <div><b>Next quest: your studio</b><p>Email me at {EMAIL}</p></div>
      </li>
    </ol>
  );
}
