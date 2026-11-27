# The Journey, Milestone 2 (Chapters 2–5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Chapters 2–5 playable after Chapter 1, each with its own place, people, objectives, dialogue, inner thoughts and a closing "moment":
- Ch.2: NCIT, Lalitpur
- Ch.3: Neo Digital, Maitidevi
- Ch.4: Danson, Gairidhara
- Ch.5: DarkMatter, Baneshwor

Ch.1 also gets its real school: Galaxy Public School, Gyaneshwor.

**Architecture:**
- Reuse the Milestone 1 engine (`web/src/world/**`) as is. Add four general pieces:
  - an `onInteract` hook so a chapter can react to its own interactables
  - a "moment" overlay (a cinematic card)
  - a camera "sequence" player (rail camera, timed subtitles, optional REC overlay)
  - an interior kit (rooms, desks, monitors, posters)
- Each chapter is a `ChapterScene` in `chapters/chN.ts`, with its scenery in `chapters/chN-scene.ts`, following Ch.1's pattern.

**Tech Stack:** as Milestone 1 (three.js 0.160, React 19, TS, Vite 7, Vitest).

**Spec:** `docs/superpowers/specs/2026-11-27-the-journey-design.md` (story section, chapters 2–5). Milestone 1 plan: `docs/superpowers/plans/2026-11-27-the-journey-milestone-1.md`.

## Global Constraints

- All Milestone 1 Global Constraints still hold: the look, the third-person camera, original or licensed assets only, motion on by default, and Git rules (local branch journey-m1, never push).
- **Eras:**
  - Ch.2–4 use the `college` avatar.
  - Ch.5 uses `me`.
  - The player's avatar must come from `CHAPTERS[id].era`.
- **Places, years and Devanagari:** exactly as in `story/chapters.ts`. Ch.1's `place` becomes "Gyaneshwor, Kathmandu".
- **Ch.1 school:** the sign reads "Galaxy Public School". The gate label and the end-card copy use the same name.
- **Dialogue and thoughts:** use the lines in each task verbatim. Any extra lines are short, first-person, warm and a little funny, in the owner's voice; "dai"/"didi" are fine. No invented family members.
- **Images:** game images come from `web/public/img/` (super-world-saga.jpg, frog-jump.jpg, spell-splatter.jpg, kidsage.jpg, kidsage-colorbook.jpg). Games without an image get a canvas-drawn title poster.
- **Other characters:** Mesh2Motion `base` / `mannequin-female`, tinted per person, until the owner's extra Avaturn avatars arrive. The yeti is the `base` model scaled 1.35 and tinted snow-white, with a light-blue face accent if materials allow.
- **Every chapter ends with:**
  1. a moment card;
  2. the chapter-complete card with "Continue to Chapter N+1" (when that chapter is available), "See the games →" and "Chapter select".
- Chapters 6–7 stay "Coming soon".
- **Performance:** each chapter scene under about 150 draw calls on High; static scenery merged per material, as in Ch.1.

## Review Focus

1. **Jumping between chapters.** Moving 1 → 2 → 5 → select → 3 leaks no canvases, render loops or listeners. Each chapter starts with the right avatar and a fresh objective list. Test: Task 1.
2. **Skipping a sequence or moment.** Esc or tap partway through always lands in a playable state, with the camera returned and controls back. Test: Task 2.
3. **Pausing during a sequence.** The sequence freezes and resumes where it left off. Test: Task 2.
4. **Saved progress from Milestone 1** (`done: [1]`) still works. Chapter select shows Ch.1 Completed and Ch.2–5 available. Test: Task 1.
5. **Interiors and the camera.** In a room, camera collision keeps the camera inside the walls; it never ends up outside looking at a box. Test: Task 3.

---

## File structure (web/src/world/)

| File | Responsibility |
|---|---|
| `story/chapters.ts` | Ch.2–5 `available: true`; Ch.1 place "Gyaneshwor, Kathmandu" |
| `chapters/types.ts` | adds `onInteract?(id, api)`, `era` comes from CHAPTERS |
| `engine/game.ts` | calls `chapter.onInteract`, exposes `ChapterApi` (complete objective, play sequence, show moment, set flags, tint) |
| `engine/sequence.ts` | rail camera sequence player (pure timing logic + three camera driver) |
| `engine/kit.ts` | interior kit: `room`, `desk`, `monitor`, `chair`, `poster`, `shelf`, `plant`, `windowLight` using `put/rbox` buckets |
| `store.ts` | adds `moment`, `subtitle`, `rec`, `cinema` |
| `ui/Moment.tsx`, `ui/Cinema.tsx` | moment card; letterbox + subtitle + ● REC overlay |
| `WorldApp.tsx` | SCENES 1–5, era per chapter, "Continue to Chapter N+1" |
| `chapters/ch1-street.ts`, `ch1.ts` | Galaxy Public School rename |
| `chapters/ch2.ts`, `ch2-scene.ts` | NCIT campus, lab, gate, Simba Falls ride, graduation |
| `chapters/ch3.ts`, `ch3-scene.ts` | Neo Digital office, four stations, the billboard outside at dusk |
| `chapters/ch4.ts`, `ch4-scene.ts` | Danson office, three interns, the poster wall |
| `chapters/ch5.ts`, `ch5-scene.ts` | DarkMatter office, the yeti, three shapes, the colour launch |

---

### Task 1: Chapter flow, eras, Galaxy Public School, interaction hook

**Files:** `story/chapters.ts`, `chapters/types.ts`, `engine/game.ts`, `WorldApp.tsx`, `ui/ChapterSelect.tsx`, `chapters/ch1-street.ts`, `chapters/ch1.ts` (+ tests)

**Interfaces:**
- Produces:
  - `interface ChapterApi { complete(objectiveId: string): void; moment(m: Moment): Promise<void>; sequence(s: SequenceSpec): Promise<void>; thought(text: string): void; dialogue(lines: DialogueLine[]): Promise<void> }`
  - `ChapterScene.onInteract?(id: string, api: ChapterApi): boolean | void` (return true = handled, skips the default dialogue/complete)
  - `type Moment = { title: string; sub?: string; image?: string; kind?: "graduation" | "launch" | "billboard" | "wall" }`
  - `SCENES: Record<number, ChapterScene>` (Task 1 registers 1 only; each chapter task adds its own)
- `moment` and `sequence` may be stubs that resolve immediately until Task 2 fills them. `dialogue()` resolves when the last line is closed.

- [ ] **Step 1: Write failing tests.**
  - `CHAPTERS` 2–5 have `available: true` and 6–7 `false`. Ch.1's place is "Gyaneshwor, Kathmandu".
  - `Game.start` loads `loadPlayer(CHAPTERS[chapter.id-1].era)`.
  - `onInteract` returning true suppresses the default dialogue.
  - `api.complete` marks the objective and fires `onComplete` once when all required objectives are done.
  - `api.dialogue` resolves after the last line.
  - WorldApp's "Continue to Chapter 2" appears when chapter 2 is registered and available. Unit-test the pure `nextChapter(id, SCENES, CHAPTERS)` helper.
  - With progress `{ lastChapter: 1, done: [1] }`, chapter select marks 1 Completed and 2–5 enabled. (Review Focus 4)
- [ ] **Step 2: Run and see them fail.**
- [ ] **Step 3: Implement.** Rename the Ch.1 sign, gate label and end card to "Galaxy Public School".
- [ ] **Step 4: Run green,** plus tsc and build, then commit.

### Task 2: Moments, sequences, cinema overlay

**Files:** `engine/sequence.ts`, `store.ts`, `ui/Moment.tsx`, `ui/Cinema.tsx`, `engine/game.ts`, `world.css` (+ `sequence.test.ts`)

**Interfaces:**
- Produces:
  - `type SequenceSpec = { points: [number, number, number][]; look: [number, number, number][]; duration: number; rec?: boolean; title?: string; lines?: { at: number; who: string; text: string }[]; onFrame?(t01: number): void }`
  - `sampleSequence(spec, t: number): { pos; look; line: {who, text} | null; t01 }` (pure)
  - `api.sequence(spec)`: freezes player input, drives the camera along a CatmullRom curve through `points` (look target along `look`), shows letterbox bars and timed subtitles (and "● REC" plus the title when `rec`), calls `onFrame`, and resolves at the end or on skip.
  - `api.moment(m)`: shows a full-screen cinematic card (title in Teko, sub in Inter, optional image, a "kind" accent such as confetti caps for graduation or a colour wash for launch) and resolves on "Continue".
- Esc or tap skips a sequence. Pausing freezes a sequence (it uses the game clock).

- [ ] **Step 1: Write failing tests.**
  - `sampleSequence` at t = 0 and t = duration returns the first and last points.
  - The line active at a time is the latest line with `at <= t`.
  - A skipped sequence resolves and restores input (Game test with a stub).
  - A paused game doesn't advance the sequence time. (Review Focus 2 and 3)
- [ ] **Step 2: Run and see them fail.**
- [ ] **Step 3: Implement.** Use the look-test fonts and colours. The REC dot is red `#ff3b3b`, and the moment card uses the start-screen sunset gradient.
- [ ] **Step 4: Run green,** plus tsc and build, then commit.

### Task 3: Interior kit + Chapter 2 (NCIT, Lalitpur)

**Files:** `engine/kit.ts`, `chapters/ch2.ts`, `chapters/ch2-scene.ts` (+ `ch2.test.ts`, `kit.test.ts` for pure sizing helpers)

**Scene:**
- Afternoon (`time: "morning"`).
- **Campus:** a paved path from spawn to a modern 3-storey college block with glass bands and an "NCIT" sign (canvas), lawn and trees.
- **Lab:** an interior room off the path, entered through an open doorway, with rows of desks, monitors and chairs, and one glowing monitor.
- **The gate:** to one side, with 5 parked motorbikes and 2 friends (tinted mannequins).
- **Simba Falls:** a separate small area far off-map (e.g. x = 400). A winding hill road ends at a waterfall clearing: a cliff, a white falling-water plane with scrolling UVs, rocks and trees. Only the ride sequence's camera sees it.
- **Camera colliders:** the lab walls (Review Focus 5; test that a camera ray from inside the lab hits a wall box).

**Objectives:** `lab` "Build your first game in the lab", `ride` "Meet your friends at the gate", optional `classmate` "Say hi to a classmate".

**Lines (verbatim):**
- Auto thought at spawn: "NCIT. Four years of code, deadlines and too much chiya start here."
- Auto thought at the lab door: "The lab smells like warm computers."
- Lab computer (E):
  - You: "Okay… a square that jumps. That counts as a game, right?"
  - You: "It works. It actually works!"
  - Completes `lab`.
- Classmate (E):
  - Classmate: "Did you sleep at all? Your eyes are the same colour as the error messages."
  - You: "Sleep is a feature for version two."
- Friend at the gate (E, after `lab`):
  - Friend: "Lockdown's finally over! Six of us, Simba Falls, today."
  - Friend: "You're bringing the camera for the vlog, right?"
  - You: "Already charged. Let's go."
  - Then the ride sequence.
- **Ride sequence** (`rec: true`, title "Shrayash's Vlogs · Way to Simba Falls", about 14 s): the camera follows three bikes moving along the hill road (`onFrame` moves the bikes and riders along the same curve). Lines:
  - at 1 s, You: "Hey everyone, welcome back to the channel!"
  - at 5 s, Friend: "Wave for the camera!"
  - at 10 s, You: "Worth every bump on that road."
  - The sequence ends at the falls. Completes `ride`.
- **Moment:** title "Graduation day", sub "B.E. Software Engineering · First Class Honors · NCIT", kind "graduation".
- Thought after the moment: "Five years ago it was a square that jumped. Now it's a degree."
- Then the chapter-complete card.

- [ ] **Steps:** failing ch2 tests (objectives, interactables, the gate gated on `lab`, the sequence spec duration ≥ 12 s with rec true, the lab colliders) → red → implement → green, plus tsc and build, then commit. Register `2: chapter2` in SCENES.

### Task 4: Chapter 3 (Neo Digital, Maitidevi)

**Scene:**
- Golden hour (`time: "golden"`).
- **Office:** a bright open-plan room with big windows, 6 desks with monitors, a whiteboard with level sketches, a test-device table with phones, a server rack corner with blinking LEDs, a lead developer NPC, and a "NEO DIGITAL" sign.
- **Outside:** a door leads out to a short Maitidevi street with a big billboard showing `img/super-world-saga.jpg`.
- `setLamps`: the billboard glows at dusk.

**Objectives:**
- `design` "Sketch the levels", `build` "Build it in Unity", `test` "Test on the phones", `deploy` "Ship it" (any order)
- then `outside` "Step outside" (appears after all four)

**Lines:**
- Auto thought at spawn: "Maitidevi. My first real desk at a real studio."
- Lead dev (E): Lead: "Welcome to Neo Digital. Your desk's by the window. Coffee's wherever you find it."
- Whiteboard (design): You: "Levels on paper first. Always."
- Monitor (build): You: "Unity open, chiya on the left. Let's build."
- Phones table (test):
  - You: "Found a bug. Then three more. Classic."
  - You: "Fixed. Probably."
- Server rack (deploy): You: "Uploading to the Play Store… and… live!"
- Door (outside): starts a sequence (about 8 s). The camera rises from the door to the billboard as the sky shifts to dusk (call `api` → `setTime('dusk')` at the start).
- Thought: "Super World Saga. My game, lit up over Maitidevi."
- **Moment:** title "Shipped", sub "Super World Saga · 2 Player Football · Nimble Noggins · Ludo Super", image `img/super-world-saga.jpg`, kind "billboard".

- [ ] **Steps:** failing tests (5 objectives, outside gated on the other four, dusk on the outside sequence, billboard texture path) → implement → green, plus tsc and build, then commit. Register `3: chapter3`.

### Task 5: Chapter 4 (Danson, Gairidhara)

**Scene:**
- Morning (`time: "morning"`).
- **Office:** a team room with a long table, laptops, bean bags, a kettle corner, and three intern NPCs at desks, each with a small "?" bubble sprite that disappears once helped.
- **Poster wall:** a long wall with 7 empty frames that fill one by one at the end, with posters from images or canvas titles: Arithmetica, Wack-a-Rat, Spell-Splatter (img), Frog Jump (img), Vidhya's Adventure, Rhythm Game, Multi-Brawl.
- **Sign:** "DANSON SOLUTIONS · Gairidhara".

**Objectives:** `intern1`, `intern2`, `intern3` ("Help the interns: 0/3" — the objective text updates with the count), then `wall` "See what the team shipped".

**Lines:**
- Auto thought at spawn: "Gairidhara. My first time leading a team. No pressure."
- Intern 1:
  - Intern: "My frog keeps falling through the floor!"
  - You: "Check the collider, and the physics layer. Gravity's not the bug."
- Intern 2:
  - Intern: "The spelling words come out in the same order every time."
  - You: "Shuffle once at the start. Fisher–Yates. You'll love it."
- Intern 3:
  - Intern: "It runs fine on my PC but lags on the phone."
  - You: "Profile it first. Then batch those draw calls."
- Wall (after all three): a sequence (about 8 s) pans along the wall as each poster fills (`onFrame` reveals the frames in order).
- Thought: "Leading isn't knowing everything. It's helping everyone get unstuck."
- **Moment:** title "Seven games, one team", sub "Arithmetica · Wack-a-Rat · Spell-Splatter · Frog Jump · Vidhya's Adventure · Rhythm Game · Multi-Brawl", kind "wall".

- [ ] **Steps:** failing tests (3 interns plus a gated wall, the counter text, 7 posters with the 2 image paths) → implement → green, plus tsc and build, then commit. Register `4: chapter4`.

### Task 6: Chapter 5 (DarkMatter, Baneshwor)

**Scene:**
- Golden hour.
- **Office:** a modern studio with a large wall screen, desks, plants, a "DARKMATTER PRODUCTION" sign, and a slightly grey and desaturated palette (materials start desaturated).
- **The yeti:** steps out of the big screen when the player first comes near (a short sequence, about 5 s, with the yeti walking forward from the screen).
- **Shapes:** three glowing shape blocks (circle, triangle, square, each a distinct colour) are hidden around the office: under a desk, on a shelf, by the plants.
- **Launch:** saturation and colour return over about 3 s.

**Objectives:** `yeti` "Meet the visitor from the screen", then `shapes` "Find the shapes: 0/3", then `launch` "Launch KidSage Colorbook" (the big screen).

**Lines:**
- Auto thought at spawn: "Baneshwor. New studio, bigger dreams."
- Yeti (after the sequence):
  - Yeti: "Namaste! My village lost all its colours."
  - Yeti: "Can you find my three shapes? They're hiding in your office."
  - You: "A yeti. In the office. Sure, why not."
- Each shape (E): a thought, in order:
  - "A circle, like the sun over the hills."
  - "A triangle, like the mountains back home."
  - "A square, like a page waiting for colour."
- Big screen (launch, after the shapes): a sequence (about 6 s) as colour floods back. `onFrame` lerps material colours from desaturated to full, plus a bloom pulse.
- Yeti: "My village has colours again! Thank you, friend."
- **Moment:** title "KidSage Colorbook launches", sub "Led development · DarkMatter Production · 2024", image `img/kidsage-colorbook.jpg`, kind "launch".
- Thought: "Next stop… somewhere far from home."
- Then the complete card. "Continue" is absent because Ch.6 isn't available.

- [ ] **Steps:** failing tests (gating yeti → shapes → launch, the shape counter, the yeti is `base` with scale 1.35 and a white tint, the launch sequence restores colour at t01 = 1) → implement → green, plus tsc and build, then commit. Register `5: chapter5`.

### Task 7: Integration checks and docs

- [ ] **Step 1: Run** the full tests, tsc and build.
- [ ] **Step 2: Spec.** Mark Milestone 2 done in the spec.
- [ ] **Step 3: Checks.** The manager runs the designer and player checks on the dev server ("journey", port 5174) and routes the fixes.
