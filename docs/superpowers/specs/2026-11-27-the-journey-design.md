# The Journey: design

The Island (`world.html`) is rebuilt as a story-driven 3D game in the browser. You play through Shrayash Pradhan's life, from school in Kathmandu to a Master's in Maryland. His 11 published games are side quests once the story reaches today.

- Visual design (approved direction): https://claude.ai/artifact/Bed4Y9JzS4fF3cFD8bGhKa
- 3D look test (approved graphics): https://claude.ai/artifact/AjUUXcgazfr9bJBD9NkKNk, source in `.claude/design/looktest/index.html`

## Why

The portfolio already says what Shrayash has done. This game lets people live it, the way a game developer would tell their own story. It should feel immersive and cinematic, like the opening of Red Dead Redemption 2, and look as polished as bruno-simon.com. It should also still get a busy recruiter to the games quickly.

Success: someone who opens it remembers the journey (Nepal → studios → America) and finds at least one of the games, and Shrayash is proud to send the link.

## Goals

- A guided main story in 7 chapters, about 15–20 minutes, told through walking, talking, short scripted moments and cutscenes.
- A third-person camera like GTA, behind the shoulder.
- Stylized-realistic graphics: real proportions, golden-hour light, haze, shadows and soft contact shadows. Professional, not childlike.
- Real places and real moments: NCIT in Lalitpur, Neo Digital (Maitidevi), Danson (Gairidhara), DarkMatter (Baneshwor), and moments from Shrayash's Vlogs on YouTube.
- The 11 games are side quests in the final chapter, each showing real details and a link to play.
- Works on phones and laptops, with keyboard and mouse or touch controls.

## Non-goals

- A large seamless open world. Each chapter is a small, detailed place, and only Maryland is free roam.
- Combat, health, inventory, crafting or a fail state.
- Multiplayer or accounts.
- Recreating any real game's look, characters, logos or fonts. GTA and RDR2 are references for feel only.

## Anti-goals (would be a failure even if it works)

- Childlike or blocky look. The user rejected both.
- A recruiter needing more than two clicks to reach the games.
- A long download before anything moves. The first chapter must be playable fast.
- Ripped or unlicensed assets.

## Constraints

- It runs in the browser, served by the site on Cloudflare (Workers static assets from `web/dist`). It is not a claude.ai artifact, so `.glb` files are served normally.
- Built inside the existing `web/` Vite project as a third page (`world.html`), replacing the old island at the same address. The home page's handheld and the portfolio's dock already link to `world.html`.
- Assets must be original or properly licensed. Mesh2Motion's animations and rig are CC0. Each Mesh2Motion character variation is checked before use, and any that need attribution get it on a credits screen.
- Motion is on by default, matching the site. Cutscenes can be skipped and camera shake can be turned off.

## Approaches considered

| | What | Trade-off | Picked |
|---|---|---|---|
| A | 3D world in three.js, chapters as small detailed places | Most immersive; most work | **Yes** |
| B | Retro top-down pixel explorer | Fast and light; flat, not immersive | No |
| C | 3D with a fixed angled camera, walk only | Half the work of A; less immersive | No |
| D | Side-scrolling parallax journey | Story-driven by nature, great on phones; 2D, not open | No |

Within A, the user chose a **third-person camera** over an angled toy camera. They also chose **stylized realism** after rejecting blocky and then toy-like looks. The look test confirmed the graphics: "looks great, better than imagined".

## What the user decided

- **Story:** school → education → work → flight to America → now, with the games as side quests.
- **Camera:** third-person, GTA-style.
- **Look:** realistic in the way Bruno's site is polished, not cartoon. The look test is the reference.
- **Character:** Shrayash's own avatars, three eras: school, college, now. Other characters come from Mesh2Motion.
- **Places:** as listed under Goals.
- **YouTube:** the vlogs are part of the story.

## The story

Each chapter has a title card, a short walk with something to do, one scripted moment (the memory), then the road on. Every chapter can also be opened directly from Chapter select.

1. **School days, Kathmandu.** Walk to school down a prayer-flag street, talk to the tea-shop owner, and try the scooter. The cyber café is where the spark happens (suggested moment).
2. **Engineer in training, NCIT, Lalitpur, 2017–2022.** Build your first game in the lab. After lockdown, ride motorbikes to Simba Falls with friends, filming it for the channel (a real vlog). Graduation: B.E. Software Engineering, First Class Honors.
3. **First studio, Neo Digital, Maitidevi, 2022–23.** Design, build, test and deploy, then see Super World Saga play on a billboard at night. Also shipped: 2 Player Football, Nimble Noggins, Ludo Super.
4. **Team lead, Danson, Gairidhara, 2023.** Help three stuck interns. The team's wall fills with seven shipped games.
5. **The yeti, DarkMatter, Baneshwor, 2024.** The KidSage yeti steps out of a screen and sets a task. KidSage Colorbook launches and the office fills with colour.
6. **Take-off, Kathmandu → USA.** A goodbye at the airport, then a cutscene flight over the Himalayas and the ocean, shot like the "Crossing Continents" vlog, with a link to the real video.
7. **Now, Maryland.** Arrive for the Master's at WUST, get the car, and free roam. Find the side quests and take a trip to Times Square from the NYC vlog. The ending is a mailbox, "Next quest: your studio", which shows the contact email.

Side quests: the 11 games, placed as described on the design canvas (arcade cabinets, posters, people). Bonus: a Pocket Wilds portal and a camera on a tripod that opens the YouTube channel. Game details come from the same data as the portfolio page (`web/src/portfolio/data.ts`), so they never go out of date.

## How it is built

**Tech.**
- three.js from npm, in the `web/` Vite + TypeScript project, as a third entry page.
- Menus and the HUD are React, like the rest of the site. The game loop is plain TypeScript.
- glTF models with meshopt compression; `GLTFLoader` with `MeshoptDecoder`.

**Rendering (from the look test).**
- Sky shader with lighting taken from the sky, so surfaces pick up its colour.
- A directional sun with soft shadows that follow the player, plus fog for haze.
- Post-processing: soft contact shadows (GTAO) and bloom on High.
- Each chapter sets its own time of day.
- Static scenery is merged into one mesh per material, for few draw calls.

**Quality modes.**
- **High:** shadows, contact shadows, bloom, pixel ratio up to 2.
- **Lite:** no shadows or post-processing, pixel ratio 1. Picked automatically on phones and slow devices; switchable in settings.
- If 3D can't start, the page explains how to turn on hardware acceleration.

**Environments.**
- Built in code first, as in the look test: Newari brick buildings, carved windows, shops, power lines, prayer flags, the stupa.
- Any piece can later be replaced by a Blender-made glTF without changing the game code. This is the planned upgrade path to Bruno-level detail.

**Characters.**
- **The player is Shrayash's own Avaturn avatar,** in three versions by era:
  - `avatar.zip`: school, light-blue tee and jeans (Ch.1).
  - `avatar (1).zip`: college and early studio years, maroon hoodie (Ch.2–4).
  - `avatar (3).zip`: now, black suit (Ch.5–7).
- **Conversion pipeline (proven in the look test):**
  1. FBX → GLB in the browser with three.js `GLTFExporter`. Colour textures go to JPEG at 1024 px, and face morph targets are dropped.
  2. glTF-Transform `optimize --compress meshopt`.
  3. Result: about 1.6–3.5 MB per avatar.
- **Animation:** Mesh2Motion CC0 clips (idle, walk, jog, talking, texting-walk, sitting-writing, driving, and more) are retargeted at load from Mesh2Motion's Unreal-style bones to the avatar's Mixamo-style bones.
  - The rest poses are lined up bone by bone.
  - Each bone's world-rotation change is then copied frame by frame, and hip height is scaled.
  - Matching by bone name copes with the duplicated bones in two of the avatars.
- **Other characters** come from Mesh2Motion variations, each license checked first.

**Systems.**
- Input: keyboard and mouse, or touch with a left-thumb stick and right-thumb look.
- Third-person camera, with collision against walls.
- Interaction prompts (E or tap).
- Dialogue with subtitles.
- An objective tracker.
- A cutscene player for camera paths and timed lines, skippable.
- A loader for each chapter.
- Chapter select.
- Side-quest tracker with game cards.
- Settings: quality, sound, subtitles, camera shake.
- Progress saved in the browser (localStorage, optional).

**Loading.** The first chapter must be playable within a few seconds on a normal connection. Later chapters load in the background or on demand.

**Sound.** Ambient sound per place and a soft score, all original or licensed, starting after the first click. This comes in a later milestone.

## Milestones

1. **Vertical slice:** Chapter 1 complete, plus the start screen, Chapter select, HUD, dialogue, objective, touch controls and quality modes. Replaces `world.html`.
2. Chapters 2–5.
3. Chapter 6 cutscene, and Chapter 7 with free roam, side quests and the ending.
4. Polish: sound, phone tuning, the custom player model, credits.

## Left to the builder

- Exact layouts of each chapter's place, and the dialogue lines (in Shrayash's voice, short).
- Which Mesh2Motion variations to use for other characters, after checking each one's license.
- Collision approach: simple boxes are enough, with no physics engine unless props need to topple.

## Calls made while writing this (check these)

- The old island stays live until Milestone 1 is ready. At that point, `world.html` and `assets/kid-sprites.webp` come out of the build's legacy-copy list in `web/vite.config.ts`, and the new page takes the address.
- Models and clips live in `web/public/journey/` as `.glb` and are served with the site.
- The home page's handheld card keeps the name "Island" until the new game ships, then becomes "The Journey".

## Open items (Shrayash)

- Real moments to replace the ones still marked "suggested" (Chapter 1 spark, Chapter 3–5 details).
- Music preferences.
