import { useEffect, useRef } from "react";
import { create, step, W, H, GROUND, PX, SIZE, GOAL, type Jumper } from "./minigame/jumper";

const JUMP_KEYS = [" ", "arrowup", "w"];

function draw(c: CanvasRenderingContext2D, s: Jumper) {
  const scroll = s.t * 150;
  const sky = c.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, "#0b1424"); sky.addColorStop(1, "#16284a");
  c.fillStyle = sky; c.fillRect(0, 0, W, GROUND);
  c.fillStyle = "rgba(130,170,255,.18)"; // far "code" lines drifting by, for depth
  for (let i = 0; i < 9; i++) { const x = ((i * 53 - scroll * 0.25) % (W + 60) + W + 60) % (W + 60) - 30; c.fillRect(x, 18 + ((i * 37) % 90), 22 + (i % 3) * 14, 3); }
  c.fillStyle = "#29d17a"; c.fillRect(0, GROUND, W, H - GROUND);
  c.fillStyle = "#1f9e5c"; for (let x = -(scroll % 32); x < W; x += 32) c.fillRect(x, GROUND, 16, 5);
  c.fillStyle = "#e8407e"; for (const b of s.blocks) c.fillRect(Math.round(b.x), GROUND - b.h, b.w, b.h);
  // the square, spinning while it is in the air
  c.save(); c.translate(PX + SIZE / 2, GROUND - s.y - SIZE / 2); c.rotate(s.y > 0 ? (s.t * 9) % (Math.PI * 2) : 0);
  c.fillStyle = "#ffd447"; c.fillRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE);
  c.fillStyle = "#1a1226"; c.fillRect(1, -4, 3, 3); c.fillRect(6, -4, 3, 3);
  c.restore();
  c.fillStyle = "#fff6e6"; c.font = "8px 'Press Start 2P', monospace"; c.textBaseline = "top";
  c.fillText(`SCORE ${s.score}/${GOAL}`, 8, 8);
  if (s.flash > 0) { c.fillStyle = `rgba(232,64,126,${s.flash * 0.6})`; c.fillRect(0, 0, W, H); c.fillStyle = "#fff6e6"; c.textAlign = "center"; c.fillText("OOPS! AGAIN", W / 2, 70); c.textAlign = "left"; }
  if (s.won) { c.fillStyle = "rgba(11,20,36,.7)"; c.fillRect(0, 0, W, H); c.fillStyle = "#ffb347"; c.font = "16px 'Press Start 2P', monospace"; c.textAlign = "center"; c.fillText("IT WORKS!", W / 2, 72); c.textAlign = "left"; }
}

/** The lab PC's screen: a 2D canvas game drawn with code. Space / ↑ / W / click / tap jumps; Esc (handled by the game) or Quit closes it. */
export function MiniGame({ onDone }: { onDone: (won: boolean) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => {
    const c = canvas.current!.getContext("2d");
    const s = create((Date.now() % 100000) + 1);
    let jump = false, raf = 0, last = performance.now(), wonAt = 0, closed = false;
    const finish = (won: boolean) => { if (!closed) { closed = true; done.current(won); } };
    const key = (e: KeyboardEvent) => { if (JUMP_KEYS.includes(e.key.toLowerCase())) { e.preventDefault(); jump = true; } };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) { last = now; return; } // paused while the page is hidden
      step(s, (now - last) / 1000, jump); jump = false; last = now;
      if (c) draw(c, s);
      if (s.won && !wonAt) wonAt = now;
      if (wonAt && now - wonAt > 1100) finish(true);
    };
    addEventListener("keydown", key);
    raf = requestAnimationFrame(loop);
    canvas.current!.onpointerdown = (e) => { e.preventDefault(); jump = true; };
    canvas.current!.focus();
    return () => { cancelAnimationFrame(raf); removeEventListener("keydown", key); };
  }, []);
  return (
    <div className="minigame" role="dialog" aria-label="The square that jumps">
      <div className="mg-monitor">
        <div className="mg-screen"><canvas ref={canvas} width={W} height={H} tabIndex={0} aria-label="Game screen: jump over the blocks" /></div>
        <div className="mg-bar">
          <span className="mg-hint">Space / tap to jump · clear {GOAL}</span>
          <button type="button" className="btn" onClick={() => done.current(false)}>Quit</button>
        </div>
      </div>
    </div>
  );
}
