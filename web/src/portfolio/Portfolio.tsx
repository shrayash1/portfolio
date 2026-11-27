import { useEffect, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { NepalSkyline } from "../shared/NepalSkyline";
import { MOTION, TOUCH } from "../shared/motion";
import { scrollToY, setSmoothScroller } from "../shared/scroll";
import { Boot, CornerHandheld, Dock, TopBarAndRail } from "./Chrome";
import { About, Achievements, Contact, Experience, Gameplay, Hero, Stack } from "./sections";
import { Games } from "./Games";
import { Art } from "./Art";

gsap.registerPlugin(ScrollTrigger);
// dev only: lets tests step the animation clock by hand (gsap.ticker.tick()) in browsers that pause frames
if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger });

// A gust of prayer flags that sweeps up the screen as the hero scrolls away.
const FLAG_COLORS = ["#1e5bb8", "#f5f1e6", "#d8262e", "#2f9e44", "#f4c20d"];
const STORM = Array.from({ length: 46 }, (_, i) => {
  const w = 30 + (i % 5) * 12;
  return { left: `${(i * 23.7) % 100}%`, top: 0, width: w, height: Math.round(w * 1.25), "--c": FLAG_COLORS[i % 5], "--rot": `${((i * 41) % 60) - 30}deg`, "--d": `${(i % 7) * -0.3}s` } as CSSProperties;
});

export function Portfolio() {
  const [booting, setBooting] = useState(MOTION.on);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {});
    let lenis: Lenis | null = null, raf = 0, safety = 0, done = false;
    let lean: ((e: PointerEvent) => void) | null = null;
    let cancelled = false; // set on cleanup, so a stale run can't start the hero intro
    const listeners = new AbortController();

    // smooth scrolling, like tenztan.in
    if (MOTION.on) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      const l = lenis;
      setSmoothScroller({ scrollTo: (y) => l.scrollTo(y) });
      l.on("scroll", ScrollTrigger.update);
      const loop = (t: number) => { l.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    // in-page links go through the smooth scroller
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      const id = a?.getAttribute("href");
      const target = id && id !== "#" ? document.querySelector(id) : null;
      if (!target) return;
      e.preventDefault();
      scrollToY(target.getBoundingClientRect().top + scrollY);
    };
    document.addEventListener("click", onClick);

    const intro = () => {
      setPainted(true); // the colour paints over the pencil sketch
      if (!MOTION.on) return;
      ctx.add(() => {
        gsap.from("#hName > *", { y: 50, opacity: 0, stagger: 0.12, duration: 1, ease: "power4.out" });
        gsap.from(".hero-garland .flag", { y: -40, opacity: 0, stagger: 0.03, duration: 0.8, ease: "back.out(1.6)" });
        gsap.from(".h-dv", { x: 40, opacity: 0, duration: 1.1, ease: "power3.out", delay: 0.2 });
      });
    };

    if (MOTION.on) {
      ctx.add(() => {
        // hero: the portrait sinks, the name lifts away, and the layers lean with the mouse
        const hero = { trigger: "#hero", start: "top top", end: "bottom top", scrub: true };
        gsap.to("#hArt", { yPercent: 10, scale: 1.05, ease: "none", scrollTrigger: hero });
        gsap.to("#hName", { y: -90, opacity: 0.2, ease: "none", scrollTrigger: hero });
        if (!TOUCH) {
          const qa = gsap.quickTo("#hArt", "x", { duration: 1.2 }), qm = gsap.quickTo("#mtn", "x", { duration: 1.2 }), qc = gsap.quickTo("#city", "x", { duration: 1 });
          lean = (e) => { const m = e.clientX / innerWidth - 0.5; qa(m * -12); qm(m * -16); qc(m * -30); };
          addEventListener("pointermove", lean, { passive: true });
        }
        // the handheld grows into the bottom-right corner as the hero scrolls away
        gsap.set("#hcorner", { autoAlpha: 0, scale: 0.4, y: 30 });
        gsap.timeline({ scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom 35%", scrub: true } })
          .to("#hcorner", { autoAlpha: 1, scale: 1, y: 0, ease: "none" }, 0.35);
        // prayer-flag gust after the hero
        gsap.set(".storm .flag", { y: () => innerHeight * 1.2 });
        gsap.timeline({ scrollTrigger: { trigger: "#hero", start: "bottom 90%", end: "bottom -30%", scrub: 1 } })
          .to(".storm .flag", { y: () => -innerHeight * 1.4, rotation: "+=200", ease: "none", stagger: { each: 0.02, from: "random" } });
        // the sun sets and the sky turns from golden hour to dusk to night
        const max = () => ScrollTrigger.maxScroll(window);
        gsap.to("#sun", { y: () => innerHeight * 0.34, ease: "none", scrollTrigger: { start: 0, end: () => max() * 0.8, scrub: true } });
        gsap.to("#skyDusk", { opacity: 1, ease: "none", scrollTrigger: { start: () => max() * 0.15, end: () => max() * 0.5, scrub: true } });
        gsap.to("#skyNight, #stars", { opacity: 1, ease: "none", scrollTrigger: { start: () => max() * 0.55, end: () => max() * 0.9, scrub: true } });
        gsap.to("#mtn", { y: () => innerHeight * 0.05, ease: "none", scrollTrigger: { start: 0, end: () => max(), scrub: true } });
        // chapter titles: the line draws, the word rises out of a blur, the Nepali name fades in
        gsap.utils.toArray<HTMLElement>(".ch").forEach((ch) => {
          gsap.timeline({ scrollTrigger: { trigger: ch, start: "top 82%" } })
            .from(ch.querySelector(".ch-line"), { scaleY: 0, duration: 0.7, ease: "power2.out" })
            .from(ch.querySelector(".ch-dv"), { y: 50, opacity: 0, filter: "blur(10px)", duration: 1, ease: "power3.out" }, "-=.3")
            .from(ch.querySelector(".ch-en"), { opacity: 0, letterSpacing: "0.05em", duration: 0.9, ease: "power2.out" }, "-=.6");
        });
        gsap.utils.toArray<HTMLElement>(".rv").forEach((el) => gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
        gsap.to("#sl1", { xPercent: -18, ease: "none", scrollTrigger: { trigger: ".slashes", start: "top bottom", end: "bottom top", scrub: true } });
        gsap.to("#sl2", { xPercent: 14, ease: "none", scrollTrigger: { trigger: ".slashes", start: "top bottom", end: "bottom top", scrub: true } });
        gsap.fromTo("#tlFill", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#tl", start: "top 70%", end: "bottom 60%", scrub: true } });
        gsap.from(".contact-h", { y: 80, opacity: 0, duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: ".contact-h", start: "top 85%" } });

        // boot: the cartridge goes in, the screen counts to 100%, then zooms into the hero
        lenis?.stop();
        const finish = () => { if (done || cancelled) return; done = true; setBooting(false); lenis?.start(); intro(); };
        const pct = { v: 0 };
        const tl = gsap.timeline({ onComplete: finish });
        tl.from("#brig", { y: 40, opacity: 0, duration: 0.6, ease: "power3.out" })
          .from("#bcart", { y: -160, duration: 0.55, ease: "power2.in" }, "-=.1")
          .add(() => document.getElementById("boot")?.classList.add("on"))
          .to(pct, { v: 100, duration: 1.5, ease: "power1.inOut", onUpdate: () => {
            const p = document.getElementById("bpct"), f = document.getElementById("bfill");
            if (p) p.textContent = Math.round(pct.v) + "%";
            if (f) f.style.width = pct.v + "%";
          } })
          .to("#btext", { opacity: 0, duration: 0.2 })
          .add(() => {
            // zoom the rig so the monitor screen fills the window, centred, then fade into the hero
            const rig = document.getElementById("brig"), scr = document.getElementById("bscreen");
            if (!rig || !scr) return;
            const r = scr.getBoundingClientRect(), rr = rig.getBoundingClientRect();
            const s = Math.max(innerWidth / r.width, innerHeight / r.height) * 1.15;
            gsap.set(rig, { transformOrigin: `${r.left + r.width / 2 - rr.left}px ${r.top + r.height / 2 - rr.top}px` });
            tl.to(rig, { x: innerWidth / 2 - (r.left + r.width / 2), y: innerHeight / 2 - (r.top + r.height / 2), scale: s, duration: 0.85, ease: "power3.in" }, ">")
              .to(scr, { backgroundColor: "#c2406e", duration: 0.4 }, "<.2")
              .to("#boot", { autoAlpha: 0, duration: 0.35 });
          });
        document.getElementById("bootSkip")?.addEventListener("click", () => { tl.kill(); finish(); }, { signal: listeners.signal });
        // safety net: never leave the boot screen up if the browser pauses animation frames
        safety = window.setTimeout(() => { tl.kill(); finish(); }, 7000);
      });
    } else intro();

    return () => {
      cancelled = true;
      listeners.abort();
      ctx.revert();
      lenis?.destroy();
      cancelAnimationFrame(raf);
      clearTimeout(safety);
      setSmoothScroller(null);
      document.removeEventListener("click", onClick);
      if (lean) removeEventListener("pointermove", lean);
    };
  }, []);

  return (
    <>
      <div className="scene" aria-hidden="true">
        <NepalSkyline ids />
        <div className="shade" />
      </div>
      {MOTION.on && (
        <div className="storm" aria-hidden="true">
          {STORM.map((s, i) => <span key={i} className="flag" style={s} />)}
        </div>
      )}
      {booting && <Boot />}
      <TopBarAndRail />
      <Dock />
      <CornerHandheld />
      <main>
        <Hero painted={painted} />
        <About />
        <Experience />
        <Games />
        <Gameplay />
        <Art />
        <Stack />
        <Achievements />
        <Contact />
      </main>
    </>
  );
}
