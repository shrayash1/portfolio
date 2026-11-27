import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import "./world.css";
import { Game } from "./engine/game";
import { defaultQuality } from "./engine/renderer";
import { chapter1 } from "./chapters/ch1";
import { chapter2 } from "./chapters/ch2";
import type { ChapterScene } from "./chapters/types";
import { CHAPTERS } from "./story/chapters";
import { loadProgress, nextChapter, pickChapter, saveProgress } from "./story/progress";
import { store } from "./store";
import { StartScreen } from "./ui/StartScreen";
import { ChapterSelect } from "./ui/ChapterSelect";
import { Hud } from "./ui/Hud";
import { Moment } from "./ui/Moment";
import { Cinema } from "./ui/Cinema";
import { PauseMenu, type Settings } from "./ui/PauseMenu";

type Screen = "start" | "select" | "play";
const SCENES: Record<number, ChapterScene> = { 1: chapter1, 2: chapter2 };

export function WorldApp() {
  const [screen, setScreen] = useState<Screen>("start");
  const [chapterId, setChapterId] = useState(1);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [settings, setSettings] = useState<Settings>({ quality: defaultQuality(matchMedia("(hover: none)").matches), time: "golden", subtitles: true });
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const pauseRef = useRef<() => void>(() => {});
  const live = useRef(settings); live.current = settings;
  const ui = useSyncExternalStore(store.subscribe, store.get);
  const next = nextChapter(chapterId, SCENES, CHAPTERS);

  useEffect(() => {
    if (screen !== "play" || !host.current) return;
    const el = host.current;
    const pause = () => { g.pause(); setPaused(true); };
    pauseRef.current = pause;
    const g = new Game({
      host: el,
      onPause: pause,
      onComplete: () => saveProgress({ lastChapter: chapterId, done: [chapterId] }),
    });
    game.current = g;
    setFailed(false);
    void g.start(SCENES[chapterId]).then(() => {
      if (game.current !== g) return; // left or switched chapter while loading
      if (!el.querySelector("canvas")) setFailed(true); // no WebGL: the note says why
      else { g.setQuality(live.current.quality); g.setTime(live.current.time); }
    }).catch(() => {
      if (game.current === g) { store.set({ loading: false }); setFailed(true); } // a load error must not leave the loading screen up forever
    });
    return () => {
      g.dispose(); game.current = null; pauseRef.current = () => {}; el.replaceChildren();
      store.set({ objective: null, optional: null, prompt: null, dialogue: null, note: null, loading: false, thought: null, last: false, complete: false, moment: null, subtitle: null, rec: null, cinema: false });
      setPaused(false);
    };
  }, [screen, chapterId]);

  const play = (id: number) => { setChapterId(id); setScreen("play"); };
  const resume = () => { setPaused(false); game.current?.resume(); };
  const change = (s: Settings) => {
    if (s.quality !== settings.quality) game.current?.setQuality(s.quality);
    if (s.time !== settings.time) game.current?.setTime(s.time);
    setSettings(s);
  };

  return (
    <>
      <div ref={host} className="gamehost" />
      {screen === "start" && <StartScreen onPlay={() => play(pickChapter(loadProgress().lastChapter, SCENES))} onSelect={() => setScreen("select")} />}
      {screen === "select" && <ChapterSelect done={loadProgress().done} onPick={play} onBack={() => setScreen("start")} />}
      {screen === "play" && ui.loading && <div className="screen loading" role="status">Loading chapter…</div>}
      {screen === "play" && failed && (
        <main className="screen" role="alert">
          <p>{ui.note ?? "This browser can't show the 3D world."}</p>
          <a className="btn primary" href="index.html">Back to the website</a>
        </main>
      )}
      {screen === "play" && !failed && !ui.loading && (
        <Hud chapter={CHAPTERS[chapterId - 1]} subtitles={settings.subtitles} onTalk={() => game.current?.interact()} onPause={() => pauseRef.current()} />
      )}
      {screen === "play" && !failed && !ui.loading && <Cinema onSkip={() => game.current?.skip()} />}
      {screen === "play" && !failed && !ui.loading && <Moment onContinue={() => game.current?.continueMoment()} />}
      {screen === "play" && ui.complete && !paused && (
        <main className="screen endcard" role="dialog" aria-label="Chapter complete">
          <p className="label">Chapter {chapterId}</p>
          <h2 className="big small">Chapter {chapterId} complete</h2>
          {next ? <p className="sub">Next: {CHAPTERS[next - 1].en}.</p> : <p className="sub">The next chapter is coming soon.</p>}
          <nav className="menu">
            {next && <button type="button" className="btn primary" autoFocus onClick={() => play(next)}>Continue to Chapter {next}</button>}
            <a className={"btn" + (next ? "" : " primary")} href="portfolio.html#work" autoFocus={!next}>See the games →</a>
            <button type="button" className="btn" onClick={() => setScreen("select")}>Chapter select</button>
          </nav>
        </main>
      )}
      {screen === "play" && paused && (
        <PauseMenu settings={settings} onSettings={change} onResume={resume} onSelect={() => setScreen("select")} />
      )}
    </>
  );
}
