import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import "./world.css";
import { Game } from "./engine/game";
import { defaultQuality } from "./engine/renderer";
import { chapter1 } from "./chapters/ch1";
import { CHAPTERS } from "./story/chapters";
import { loadProgress, saveProgress } from "./story/progress";
import { store } from "./store";
import { StartScreen } from "./ui/StartScreen";
import { ChapterSelect } from "./ui/ChapterSelect";
import { Hud } from "./ui/Hud";
import { PauseMenu, type Settings } from "./ui/PauseMenu";

type Screen = "start" | "select" | "play";
const SCENES: Record<number, typeof chapter1> = { 1: chapter1 };

export function WorldApp() {
  const [screen, setScreen] = useState<Screen>("start");
  const [chapterId, setChapterId] = useState(1);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [settings, setSettings] = useState<Settings>({ quality: defaultQuality(matchMedia("(hover: none)").matches), time: "golden", subtitles: true });
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const live = useRef(settings); live.current = settings;
  const ui = useSyncExternalStore(store.subscribe, store.get);

  useEffect(() => {
    if (screen !== "play" || !host.current) return;
    const el = host.current;
    const g = new Game({
      host: el, era: CHAPTERS[chapterId - 1].era,
      onPause: () => { g.pause(); setPaused(true); },
      onComplete: () => saveProgress({ lastChapter: chapterId, done: [chapterId] }),
    });
    game.current = g;
    setFailed(false);
    void g.start(SCENES[chapterId]).then(() => {
      if (!el.querySelector("canvas")) setFailed(true); // no WebGL: the note says why
      else { g.setQuality(live.current.quality); g.setTime(live.current.time); }
    });
    return () => {
      g.dispose(); game.current = null; el.replaceChildren();
      store.set({ objective: null, prompt: null, dialogue: null, note: null, loading: false });
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
      {screen === "start" && <StartScreen onPlay={() => play(loadProgress().lastChapter)} onSelect={() => setScreen("select")} />}
      {screen === "select" && <ChapterSelect onPick={play} onBack={() => setScreen("start")} />}
      {screen === "play" && ui.loading && <div className="screen loading" role="status">Loading the street…</div>}
      {screen === "play" && failed && (
        <main className="screen" role="alert">
          <p className="dv">{ui.note ?? "This browser can't show the 3D world."}</p>
          <a className="btn primary" href="index.html">Back to the website</a>
        </main>
      )}
      {screen === "play" && !failed && !ui.loading && (
        <Hud chapter={CHAPTERS[chapterId - 1]} subtitles={settings.subtitles} onTalk={() => game.current?.interact()} />
      )}
      {screen === "play" && paused && (
        <PauseMenu settings={settings} onSettings={change} onResume={resume} onSelect={() => setScreen("select")} />
      )}
    </>
  );
}
