import { useEffect } from "react";
import type { Quality } from "../engine/renderer";
import type { TimeName } from "../engine/sky";

export interface Settings { quality: Quality; time: TimeName; subtitles: boolean }

function Seg<T extends string | boolean>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="setting">
      <span className="label" id={"s-" + label}>{label}</span>
      <div className="seg" role="group" aria-labelledby={"s-" + label}>
        {options.map(([v, text]) => (
          <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>
        ))}
      </div>
    </div>
  );
}

export function PauseMenu({ settings, onSettings, onResume, onSelect }: { settings: Settings; onSettings: (s: Settings) => void; onResume: () => void; onSelect: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.repeat) onResume(); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [onResume]);
  const set = (p: Partial<Settings>) => onSettings({ ...settings, ...p });
  return (
    <div className="scrim">
      <div className="panel pause" role="dialog" aria-modal="true" aria-label="Paused">
        <h2 className="big small">Paused</h2>
        <button type="button" className="btn primary" onClick={onResume} autoFocus>Resume</button>
        <button type="button" className="btn" onClick={onSelect}>Chapter select</button>
        <a className="btn" href="portfolio.html#work">See the games →</a>
        <a className="btn" href="index.html">Back to the website</a>
        <Seg label="Quality" value={settings.quality} onChange={(quality) => set({ quality })} options={[["high", "High"], ["lite", "Lite"]]} />
        <Seg label="Time of day" value={settings.time} onChange={(time) => set({ time })} options={[["morning", "Morning"], ["golden", "Golden hour"], ["dusk", "Dusk"]]} />
        <Seg label="Subtitles" value={settings.subtitles} onChange={(subtitles) => set({ subtitles })} options={[[true, "On"], [false, "Off"]]} />
      </div>
    </div>
  );
}
