# The Journey, Milestone 1 (Chapter 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old Island (`world.html`) with Chapter 1 of The Journey: a playable third-person Kathmandu street at golden hour. The player is Shrayash's own avatar; other people are Mesh2Motion characters. It ships with a start screen, chapter select, HUD, dialogue, objectives, touch controls and High/Lite quality.

**Architecture:**
- A third Vite entry (`web/world.html` → `web/src/world/main.tsx`) in the existing `web/` project.
- The game loop and the 3D are plain TypeScript modules under `web/src/world/engine/`, ported from the approved look test (`.claude/design/looktest/index.html`). The story logic (chapters, dialogue, objectives) is pure TypeScript under `web/src/world/story/`, with unit tests. Menus and the HUD are React under `web/src/world/ui/`, and they talk to the game through one small event store.
- Models and animation clips are meshopt-compressed `.glb` files in `web/public/journey/`.

**Tech Stack:** three.js 0.160.0 (npm), React 19, TypeScript 5.9, Vite 7, Vitest (new, for the pure logic), glTF-Transform CLI (already in `.claude/design/tools/`) for asset prep.

**Spec:** `docs/superpowers/specs/2026-11-27-the-journey-design.md`. Approved designs: canvas https://claude.ai/artifact/Bed4Y9JzS4fF3cFD8bGhKa, look test https://claude.ai/artifact/AjUUXcgazfr9bJBD9NkKNk.

## Global Constraints

- Third-person GTA-style camera behind the shoulder; stylized-realistic look exactly as in the look test. Not blocky, not childlike.
- Player avatar by era: `school` (Ch.1), `college` (Ch.2–4), `me` (Ch.5–7). Milestone 1 uses `school`.
- Retarget settings, copied from the look test and tuned with the user:
  - `DAMP = { spine_01: 0.7, spine_02: 0.45, spine_03: 0.35, neck_01: 0.4, head: 0.5, clavicle_l: 0.5, clavicle_r: 0.5 }`
  - `ARM_FORWARD_DEG = 6`
  - `SHOULDER_FORWARD_DEG = 20`
  - These bones keep the avatar's own rest pose: spine_01–03, neck_01, head, clavicle_l, clavicle_r.
- Assets must be original or properly licensed. Mesh2Motion art is CC0. Any Mesh2Motion character variation must be confirmed CC0, or credited, before it ships.
- Motion is on by default (site rule, `web/src/shared/motion.ts`). Cutscenes and title cards can be skipped.
- Every chapter can be reached from Chapter select. A recruiter reaches the games in at most two clicks; until Milestone 3 that means a "See the games" link to `portfolio.html#work`.
- No Rockstar or GTA names, logos or fonts.
- The site is served from `web/dist` on Cloudflare. `world.html` keeps its address.
- Git: commit or push only when the user asks. Each task ends with a checkpoint (tests and typecheck green), not a commit.
- npm and node run outside the Bash sandbox: `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" …` and `node node_modules/…` with `dangerouslyDisableSandbox: true`.

## Review Focus

1. **WebGL unavailable.** The page shows the hardware-acceleration help text, not a blank screen. Test: Task 3.
2. **An avatar or clip fails to load** (404 or bad file). The game still plays with the stand-in figure and shows "Couldn't load your avatar…". Test: Task 4.
3. **localStorage blocked** (private window, blocked site data). Saving and reading progress never throws, and the start screen still works. Test: Task 2.
4. **The tab is hidden for minutes, then shown again.** The frame step is capped, so the player can't jump through walls or off the map. Test: Task 5.
5. **Two-thumb play on a phone:** one finger on the stick and one dragging to look at the same time, then one lifts. The other keeps working, and nothing sticks. Keys held during a window blur are released. Test: Task 5.

---

## File structure (web/)

| File | Responsibility |
|---|---|
| `world.html` | Entry page (fonts, favicon, root div) |
| `src/world/main.tsx` | Mounts `<WorldApp/>` |
| `src/world/WorldApp.tsx` | Screen state: start, chapter select, playing, paused |
| `src/world/world.css` | All world UI styles (tokens from the look test) |
| `src/world/store.ts` | Tiny event store between game and UI (`objective`, `prompt`, `dialogue`, `note`, `loading`) |
| `src/world/story/types.ts` | `ChapterInfo`, `DialogueLine`, `Objective`, `Interactable` types |
| `src/world/story/chapters.ts` | Registry of the 7 chapters (titles, Devanagari, place, years, era, available) |
| `src/world/story/dialogue.ts` | Dialogue runner (pure) |
| `src/world/story/objectives.ts` | Objective tracker (pure) |
| `src/world/story/progress.ts` | Saved progress in localStorage, safe when blocked |
| `src/world/engine/renderer.ts` | Renderer, composer (GTAO + bloom), quality modes, WebGL check |
| `src/world/engine/sky.ts` | Sky, sun, hemisphere, fog, IBL, `TIMES` presets |
| `src/world/engine/build.ts` | Geometry buckets + `put`, `rbox`, merge helpers |
| `src/world/engine/input.ts` | Keyboard, mouse-drag look, touch stick and look, as `InputState` |
| `src/world/engine/camera.ts` | Third-person follow math |
| `src/world/engine/retarget.ts` | `MAP`, `CHILD`, `DAMP`, `retarget()` |
| `src/world/engine/characters.ts` | Load avatar or NPC glb, animation state machine, stand-in figure |
| `src/world/engine/game.ts` | The loop: step player, camera, NPCs, flags, interactions; dt cap |
| `src/world/chapters/ch1.ts` | Chapter 1 scene (street from the look test), NPCs, interactables, script |
| `src/world/ui/StartScreen.tsx`, `ChapterSelect.tsx`, `Hud.tsx`, `PauseMenu.tsx` | Menus and HUD |
| `public/journey/` | `school.glb`, `college.glb`, `me.glb`, `idle.glb`, `walk.glb`, `jog.glb`, `talk.glb`, NPC models |
| `vite.config.ts` | Add the `world` entry; drop `world.html` and `assets/kid-sprites.webp` from `LEGACY` |
| `src/home/Home.tsx`, `src/portfolio/Chrome.tsx` | Island card → "The Journey", link `world.html` (no `legacy()`) |

---

### Task 1: World entry page, test runner and assets

**Files:**
- Create: `web/world.html`, `web/src/world/main.tsx`, `web/src/world/WorldApp.tsx` (placeholder that renders "The Journey"), `web/public/journey/*`
- Modify: `web/vite.config.ts`, `web/package.json`
- Test: `web/src/world/story/chapters.test.ts` (smoke test that the runner works; filled in Task 2)

**Interfaces:**
- Produces:
  - Build entry `world`.
  - `npm test` (`vitest run`).
  - Asset URLs `journey/school.glb`, `journey/college.glb`, `journey/me.glb`, `journey/idle.glb`, `journey/walk.glb`, `journey/jog.glb`, `journey/talk.glb`.

- [ ] **Step 1: Install three.js and the test runner.**
  - Runtime: `three@0.160.0`.
  - Dev: `@types/three@0.160.0` and `vitest@3.2.4`.
  - Add `"test": "vitest run"` to `package.json`.
- [ ] **Step 2: Add the entry.**
  - Add `world: resolve(__dirname, "world.html")` to `rollupOptions.input` in `vite.config.ts`.
  - Remove `"world.html"` and `"assets/kid-sprites.webp"` from `LEGACY`, keeping `"pocket-wilds"`.
  - `world.html` copies `portfolio.html`'s head pattern, with the title `The Journey · Shrayash Pradhan` and fonts Teko, Inter, Noto Serif Devanagari and Press Start 2P.
- [ ] **Step 3: Copy the assets into `web/public/journey/`.**
  - Avatars: from `.claude/design/looktest/`, copy `school-opt.glb` → `school.glb`, `college-opt.glb` → `college.glb`, `me-opt.glb` → `me.glb`.
  - Clips: from `.claude/design/m2m/`, copy `idle-a.glb` → `idle.glb`, plus `walk.glb`.
  - Download these from `https://raw.githubusercontent.com/Mesh2Motion/mesh2motion-app/main/static/assets/human/animations/`:
    - `jog.glb`
    - `idle-talking.glb`, saved as `talk.glb`
  - Add `web/public/journey/CREDITS.txt`: "Animations and rig: Mesh2Motion (https://mesh2motion.org), CC0. Player avatars: Shrayash Pradhan (Avaturn)."
- [ ] **Step 4: Write a trivial smoke test** `chapters.test.ts`: `expect(1 + 1).toBe(2)`. Run `npm test` and expect PASS.
- [ ] **Step 5: Run the build.** `npm run build` should produce `dist/world.html` and `dist/journey/me.glb`, with no `dist/assets/kid-sprites.webp`.

### Task 2: Story data, dialogue, objectives, progress (pure logic)

**Files:**
- Create: `src/world/story/types.ts`, `chapters.ts`, `dialogue.ts`, `objectives.ts`, `progress.ts`
- Test: `src/world/story/chapters.test.ts`, `dialogue.test.ts`, `objectives.test.ts`, `progress.test.ts`

**Interfaces:**
- Produces:
  - `type Era = "school" | "college" | "me"`
  - `interface ChapterInfo { id: number; en: string; dv: string; place: string; years: string; era: Era; available: boolean }`
  - `CHAPTERS: ChapterInfo[]`
  - `interface DialogueLine { who: string; text: string }`
  - `class Dialogue { constructor(lines: DialogueLine[]); current(): DialogueLine | null; next(): DialogueLine | null; done: boolean }`
  - `interface Objective { id: string; text: string; optional?: boolean }`
  - `class Objectives { constructor(list: Objective[]); active(): Objective | null; complete(id: string): void; isDone(id: string): boolean; allRequiredDone(): boolean }`
  - `loadProgress(): { lastChapter: number; done: number[] }`
  - `saveProgress(p): void`

- [ ] **Step 1: Write the failing tests.**
  - `CHAPTERS` has 7 entries.
  - `CHAPTERS[0]` is `{ id: 1, en: "School days", dv: "बाल्यकाल", place: "Kathmandu", era: "school", available: true }`.
  - Chapters 2–7 have `available: false` and these titles: "Engineer in training", "First studio", "Team lead", "The yeti", "Take-off", "Now".
  - Their eras are college, college, college, me, me, me.
  - Their places are NCIT, Lalitpur; Neo Digital, Maitidevi; Danson, Gairidhara; DarkMatter, Baneshwor; Kathmandu → USA; Maryland.
  - `Dialogue` with two lines: `current()` is line 1; `next()` returns line 2; then `next()` returns `null` and `done === true`.
  - `Objectives` with `[walk-to-school, cyber-cafe(optional)]`: `active()` is walk-to-school; `complete("walk-to-school")` makes `allRequiredDone()` true; completing an unknown id is ignored.
  - `progress`: with `localStorage.getItem` and `setItem` throwing, `loadProgress()` returns `{ lastChapter: 1, done: [] }` and `saveProgress` doesn't throw (Review Focus 3).
- [ ] **Step 2: Run the tests and see them fail.** Run `npm test`.
- [ ] **Step 3: Implement the four modules** with the signatures above. `progress.ts` uses the key `"journey-progress"`, JSON, and try/catch on every access.
- [ ] **Step 4: Run the tests and see them pass.** Run `npm test` and `npm run typecheck`.

### Task 3: Renderer, sky and quality (port from the look test)

**Files:**
- Create: `src/world/engine/renderer.ts`, `sky.ts`
- Test: `src/world/engine/renderer.test.ts`

**Interfaces:**
- Produces:
  - `createRenderer(canvasHost: HTMLElement): { ok: true; renderer; composer; setQuality(q: Quality): void; render(scene, camera): void; resize(): void } | { ok: false; message: string }`
  - `type Quality = "high" | "lite"`
  - `defaultQuality(touch: boolean): Quality`
  - `createSky(scene, renderer): { setTime(name: TimeName): void; followShadow(target: Vector3): void; sunDir: Vector3 }`
  - `type TimeName = "morning" | "golden" | "dusk"`

- [ ] **Step 1: Write the failing tests.**
  - `defaultQuality(true) === "lite"` and `defaultQuality(false) === "high"`.
  - With `THREE.WebGLRenderer` mocked to throw on every attempt, `createRenderer` returns `{ ok: false }`. Its `message` contains "graphics acceleration" (Review Focus 1).
- [ ] **Step 2: Run and see them fail.**
- [ ] **Step 3: Port from the look test, copying values exactly:**
  - Renderer: the three fallback renderer options, ACES tone mapping, PCFSoft shadows, the GTAO pass (`blendIntensity 0.85`), bloom `(0.28, 0.6, 0.86)` and the OutputPass.
  - Sky: the `TIMES` presets as in the look test (`golden: elev 10, az 188, sun 0xffb46e, si 5.2, hemi .6, fog 0xeaa97c, dens .0022, exp .68`, and the others likewise), the shadow camera ±40 with `updateProjectionMatrix()`, and PMREM image-based light from the sky.
  - Lite mode: no shadows, no post-processing, pixel ratio 1.
- [ ] **Step 4: Run and see them pass,** plus typecheck.

### Task 4: Characters, retargeting, stand-in fallback

**Files:**
- Create: `src/world/engine/retarget.ts`, `characters.ts`
- Test: `src/world/engine/retarget.test.ts`, `characters.test.ts`

**Interfaces:**
- Consumes: asset URLs from Task 1.
- Produces:
  - `MAP: Record<string, string>`, `CHILD`, `DAMP`, `ARM_FORWARD_DEG`, `SHOULDER_FORWARD_DEG`
  - `retarget(target: Object3D, source: Object3D, clips: AnimationClip[], fps?: number): AnimationClip[]`
  - `interface Character { root: Group; setMotion(speed: number): void; play(name: "idle" | "walk" | "jog" | "talk"): void; update(dt: number): void }`
  - `loadPlayer(era: Era, onNote: (text: string) => void): Promise<Character>` (always resolves; the stand-in figure on failure)
  - `loadNpc(url: string): Promise<Character>`
  - `standIn(): Character`

- [ ] **Step 1: Write the failing tests.**
  - Every value in `MAP` is one of the 73 Avaturn bone names recorded from the avatar (fixture array in the test, copied from the look test's bone list: Hips, Spine, Spine1, Spine2, Neck, Head, HeadTop_End, Left/Right Shoulder, Arm, ForeArm, Hand, the HandThumb/Index/Middle/Ring/Pinky 1–4 bones, UpLeg, Leg, Foot, ToeBase, Toe_End).
  - Every key of `CHILD` and every value of `CHILD` is a key of `MAP`.
  - `retarget` on two tiny hand-built bone chains (source `pelvis → spine_01`, target `Hips → Spine`, same rest pose) with a clip rotating `spine_01` by 30° about X returns a clip with a quaternion track for the target `Spine`. At t = end, after applying `DAMP.spine_01 = 0.7`, the bone's angle is 21° ± 0.5°.
  - `loadPlayer` with the GLTF loader mocked to reject resolves to the stand-in, and calls `onNote` with text starting "Couldn't load your avatar" (Review Focus 2).
- [ ] **Step 2: Run and see them fail.**
- [ ] **Step 3: Implement.**
  - `retarget` moves verbatim from the look test (`retarget()`, `KEEP_OWN`, the collarbone roll with the upper-arm undo, `ARM_FORWARD_DEG`, the hip-height `ratio`).
  - `characters.ts` uses `GLTFLoader` with `MeshoptDecoder`, retargets the clips once per avatar, and caches by URL.
  - The animation state comes from speed: below 0.25 idle, below 3 walk, else jog. The walk's `timeScale` is speed / 1.6, with a 0.25 s crossfade.
  - The model is turned `rotation.y = π`.
  - NPCs share the Mesh2Motion rig, so their clips play without retargeting.
- [ ] **Step 4: Run and see them pass,** plus typecheck.

### Task 5: Input, camera, game loop

**Files:**
- Create: `src/world/engine/input.ts`, `camera.ts`, `game.ts`, `build.ts`
- Test: `src/world/engine/input.test.ts`, `camera.test.ts`, `game.test.ts`

**Interfaces:**
- Produces:
  - `interface InputState { move: { x: number; y: number }; run: boolean; lookDX: number; lookDY: number; interact: boolean; pause: boolean }`
  - `createInput(el: HTMLElement): { state(): InputState; consumeLook(): void; dispose(): void }`
  - `stickVector(dx: number, dy: number, radius = 50): { x: number; y: number }`
  - `followCamera(player: Vector3, yaw: number, pitch: number, dist: number): { pos: Vector3; look: Vector3 }`
  - `clampDt(dt: number): number` (max 0.05)
  - `class Game { constructor(opts); start(chapter: ChapterScene): void; pause(): void; resume(): void; dispose(): void }`
  - `put`, `rbox`, `mergeBuckets(scene)` in `build.ts` (from the look test)

- [ ] **Step 1: Write the failing tests.**
  - `stickVector(100, 0)` returns `{ x: 1, y: 0 }` (clamped); `stickVector(25, 0)` returns `{ x: 0.5, y: 0 }`.
  - `clampDt(300) === 0.05` (Review Focus 4).
  - `followCamera(origin, 0, 0, 4.4).pos.z ≈ 4.4` (behind a player facing -z), and its `pos.x` carries the 0.45 shoulder offset.
  - Input on a jsdom element:
    - Keydown `w`, then a `blur` event, leaves `move.y === 0` (keys released, Review Focus 5).
    - Two touch pointers, the left starting at x < width/2 (stick) and the right at x > width/2 (look). Lifting the stick pointer leaves look deltas still arriving from the other (Review Focus 5).
- [ ] **Step 2: Run and see them fail.**
- [ ] **Step 3: Implement.**
  - Port movement, clamping to the street bounds, turning toward the velocity and the camera smoothing from the look test's `step()`.
  - The `Game` loop calls `clampDt` every frame and pauses when `document.hidden`.
  - Interactables: the nearest within 2.2 m sets `store.prompt`, and E or the Talk button triggers it.
- [ ] **Step 4: Run and see them pass,** plus typecheck.

### Task 6: Chapter 1 scene and script

**Files:**
- Create: `src/world/chapters/ch1.ts`
- Test: `src/world/chapters/ch1.test.ts`

**Interfaces:**
- Consumes: `build.ts`, `characters.ts`, `Objectives`, `Dialogue`, `store`.
- Produces:
  - `interface ChapterScene { id: number; time: TimeName; build(scene: Scene): Promise<void>; spawn: Vector3; bounds: { minX; maxX; minZ; maxZ }; interactables: Interactable[]; objectives: Objective[]; npcs: NpcSpec[] }`
  - `chapter1: ChapterScene`

- [ ] **Step 1: Write the failing tests.**
  - `chapter1.objectives` are `walk-to-school` ("Walk to school") and `cyber-cafe` ("Optional: the cyber café is open early today", optional).
  - There are 3 interactables: `tea-shop` (dialogue from "Tea-shop owner": "Running late again? Go on, but they say the cyber café got a new game this week…"), `cyber-cafe` and `school-gate`.
  - Triggering `school-gate` completes `walk-to-school`.
  - `chapter1.time === "golden"`.
- [ ] **Step 2: Run and see them fail.**
- [ ] **Step 3: Implement.**
  - Move the street, stupa, mountains, poles, wires, lamps, trees, prayer flags (instanced, fluttering), cow and motorbikes from the look test into `build()`, with the same seed of 7 so it looks identical.
  - Add a school gate at the far end (z ≈ -140), in front of the stupa.
  - The cyber café's glowing doorway is its interactable.
  - Place 4 NPCs:
    - Tea-shop owner, using the Mesh2Motion `base` variation (CC0), playing `talk`.
    - Two pedestrians, using the Mesh2Motion `base` and `mannequin-female` variations, walking back and forth on the sidewalks.
    - One person by the motorbikes, playing `idle`.
  - Their files go in `public/journey/npcs/`.
  - Confirm each variation's license in the Mesh2Motion manifest or repo before adding it, and note it in `CREDITS.txt`.
- [ ] **Step 4: Run and see them pass,** plus typecheck.

### Task 7: UI (start screen, chapter select, HUD, pause), wiring and links

**Files:**
- Create: `src/world/store.ts`, `src/world/ui/StartScreen.tsx`, `ChapterSelect.tsx`, `Hud.tsx`, `PauseMenu.tsx`, `src/world/world.css`
- Modify: `src/world/WorldApp.tsx`, `src/home/Home.tsx` (lines 26, 29, 30, 397), `src/portfolio/Chrome.tsx` (lines 74, 82, 133)
- Test: `src/world/store.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `store`: `{ get(): UiState; set(p: Partial<UiState>): void; subscribe(fn): () => void }`, where `UiState = { objective: string | null; prompt: string | null; dialogue: DialogueLine | null; note: string | null; loading: boolean }`

- [ ] **Step 1: Write the failing test.** `store.set({ prompt: "Talk" })` notifies subscribers once with the merged state, and an unsubscribed listener isn't called.
- [ ] **Step 2: Run and see it fail.**
- [ ] **Step 3: Implement the store and the screens, matching the canvas boards "8 · Game screens" and "9 · On a phone".**
  - **Start screen:** "The Journey", "यात्रा · a playable story by Shrayash Pradhan", and three choices:
    - "▶ Play the story" (Chapter 1, or the last chapter played)
    - "Chapter select"
    - "Jump to the games →", linking to `portfolio.html#work`
  - **Chapter select:** 7 tiles. Unavailable ones show "Coming soon" and are disabled buttons.
  - **HUD:**
    - Chapter title card: CHAPTER 1, "School days", "बाल्यकाल · Kathmandu", fading out after 4 s.
    - Objective panel, interaction prompt pill and dialogue box.
    - Controls hint: keyboard, or touch on `(hover: none)` devices.
    - Touch buttons: Talk and Jump, at least 44 px.
  - **Pause (Esc):** Resume, Chapter select, Back to the website (`index.html`), and settings for Quality (High/Lite), Time of day and Subtitles.
  - **Home page:** the handheld card for "island" is labelled "The Journey" (Devanagari "यात्रा") and links `"world.html"` without `legacy()`. Do the same for the portfolio's dock and handheld.
- [ ] **Step 4: Run the tests and typecheck.**
- [ ] **Step 5: Check it in the browser.** Use the `web` preview server at `http://localhost:5173/world.html`, both desktop and the mobile preset.
  - Start → Chapter 1 loads the school avatar.
  - Walking works, and the tea-shop dialogue and the school-gate objective work.
  - Esc → Pause → Lite turns shadows off.
  - The phone stick works, and the page doesn't scroll sideways.
  - Home handheld → The Journey opens `world.html`.
  - The browser pane runs no animation frames, so expose a dev-only `window.__world.step(dt)` (as the look test's `window.__look.render`) and call it by hand to advance frames before checking or taking screenshots.

### Task 8: Build, docs, handoff

**Files:**
- Modify: `PROJECT-MEMORY.md`, `docs/superpowers/specs/2026-11-27-the-journey-design.md` (Milestone 1 marked done)

- [ ] **Step 1: Build and serve.** Run `npm test && npm run build`, then serve `dist` with the `dist` preview server (port 4173). Check that `world.html` loads with all assets returning 200 and no console errors.
- [ ] **Step 2: Update the docs.** Add the new world entry, the assets folder and the test command to `PROJECT-MEMORY.md`.
- [ ] **Step 3: Hand off.** Report to the user and offer to commit and push to `new_Design-site`, which Cloudflare builds. Only commit if they say yes.
