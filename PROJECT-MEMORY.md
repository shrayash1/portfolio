# Project memory: shrayash-portfolio + Pocket Wilds

Read this first in a new chat instead of the whole codebase. Last updated 4 November 2026 (recruit challenges, hills, dash).

## Who and rules
- Shrayash Pradhan, Unity game developer (Dark Matter: KidSage Colorbook, Super World Saga, Spell Splatter, Frog Jump).
- Commit or push only when asked. Commit messages end with a Co-Authored-By line for Claude.
- **Original designs only.** Never bundle ripped Nintendo assets: the Pokémon SFX zip (1.15 GB) and the Red/Leaf trainer sheets stay out of the site. The game uses its own WebAudio synth sounds.
- Move names (Ember, Water Gun, Vine Whip and so on) are Pokémon names. Pocket Wilds is now public on the site, so **renaming them is still an open item** (the user's own spreadsheet says to rename before publishing).
- Mons 24 sprite pack ("Free ver 2.zip", itch.io, no license file): check its license page before wide sharing.
- UI: keep the game's own cream-plate pixel style. Reference screenshots are for features, not looks.

## Repo and deploy
- `E:\shrayash-portfolio`, GitHub `shrayash1/portfolio` (branch `main`). Static site, no build step. Cloudflare Pages through git or `shrayash-portfolio-site.zip`.
- Git isn't on PATH: use `"$LOCALAPPDATA/GitHubDesktop/app-3.6.6/resources/app/git/cmd/git.exe"`, and push with `GCM_INTERACTIVE=auto` (the user signs in to GitHub in the popup).
- Zip: rebuild from its own file list (27 files: html pages, assets/*, pocket-wilds/index.html, pocket-wilds/mons24.png). `.gitignore` excludes backups, `3D-model-Three.js/`, `.claude/`, `*.zip`, `manuel.js`.
- Local preview: `python -m http.server 8080 --bind 127.0.0.1` in the repo root, then open http://localhost:8080/.

## Site pages
- `index.html`: game-dev title screen (canvas grid background, mode select, achievements).
- `portfolio.html`: main portfolio. Manuel avatar (three.js r160 import map, `assets/manuel.glb`, packed `assets/manuel-data.js` for file://, sprite fallback `assets/manuel-sprites.webp`), liquid-glass CSS (`.lg`), PAR parallax, Instagram art gallery (`assets/art/art-01..12.jpg`, FLIP filter), project carousel `P` array (newest first, `i:` images in `assets/apps/`), `#gameplay` YouTube section (file:// falls back to opening YouTube), small paw icon in `.social` linking to `pocket-wilds/`.
- `world.html`: island game. Procedural `buildKid`, custom TOON WebGL renderer (GLR) plus a 2D canvas painter fallback, a billboard looping a 60 s Super World Saga clip (YouTube API, distance-based volume, punch-through hole for occlusion), test hooks on `window.__world`.

## Pocket Wilds (`pocket-wilds/index.html`, ~2750 lines, three.js r128 from cdnjs)
HD-2D survivor game: pixel sprites in a 3D meadow, camera behind the player, auto-firing type-locked moves, 10-minute runs, hordes and bosses.

**Run rules.** Max level 50: picking the last reward ends the run on "Max level reached!". Evolve at Lv 12 and 27 (`EVOLVE_AT`), each giving +30 HP, +20% damage and +5% speed. A boss arrives every 2:00 (`BOSS_ORDER`: Bramblegore, Boulderback, Tidehorn, Magmaw), or press E to summon one. Restart and Quit fully reset the scene.

**Recruiting.** No auto-unlock. Each recruit has a challenge (`DEX[k].ch` = [counter, target, text]; counters `PROG.kills`, `PROG.st` (status applied, stones broken), `PROG.fast` (boss beaten within 60 s)). Finishing it adds the monster to `PROG.ready`, and next run it spawns as a rare (`spawnRare`) with a golden ring from 0:25. Below 25% HP it can't faint (`holdRare`); stand in the ring 2.5 s to capture it (`tickCapture`). Bosses are Legendary; capturing one unlocks a power-up trait for everyone (`TRAITS` with `req`, `LEGEND_TRAIT`).

**Partners (16).** 3 starters plus 13 recruits (`RECRUIT_NEED` is now just the list order). `DEX` holds each partner's number, role, rarity, ability, move-art style, evolved names and blurb. Rock monsters play as Ground.

| # | Partner | Type | Ability | Move-art style |
|---|---|---|---|---|
| 1 | Embkit > Pyrovix > Infernyx | fire | Overheat (heat bar, 5 s faster moves with guaranteed burn, then a steam cool-down) | drawn |
| 2 | Ripplet > Torrotter > Tidalisk | water | Torrent (below 40% HP: +40% damage, double chill) | drawn |
| 3 | Sproutle > Thicketail > Verdrake | grass | Green Heart (poison ticks heal, max 3 HP/s) | drawn |
| 4 | Kindlit > Kindlash > Kindrake | fire | Flash Fire (burning monsters explode when they faint) | spark (gold) |
| 5 | Puplash > Frostpup > Glaciound | water | Snow Cloak (2 chills freeze; frozen monsters shatter) | snow (snowflakes, snowballs) |
| 6 | Sprigcub > Spriggrowl > Grovemaul | grass | Spore Burst (poisoned monsters spread poison when they faint) | blossom (petals) |
| 7 | Cinderpaw > Cinderclaw > Ashenfang | fire | Ember Trail (burning footprints) | ash |
| 8 | Rippig > Ripboar > Torrentusk | water | Soak (chilled or frozen monsters take +30%) | marsh (teal) |
| 9 | Mossaur > Mossodon > Mossaurex | grass | Moss Coat (standing still: -40% damage, +2.5 HP/s) | moss |
| 10 | Pebblion > Cobblion > Monolion | ground | Sturdy (survive one knockout per run) | drawn |
| 11 | Blazemane > Sapphimane > Azuremane | fire | Blue Blaze (burn ×2 damage, +2 s) | blue fire |
| 12 | Gloomhog > Duskhog > Umbraboar | ground | Shadow Tremor (daze +50% longer; dazed take +40%) | shadow |
| 13 | Bramblegore > Briargore > Thornwarden | grass | Thorn Hide (monsters that touch it get poisoned) | bramble (thorn vines) |
| 14 | Boulderback > Cragback > Titanback | ground | Rock Shell (a shell every 8 s blocks one hit) | sand |
| 15 | Tidehorn > Surgehorn > Maelhorn | water | Riptide (+60% water knockback; Tidal Wave freezes) | abyss |
| 16 | Magmaw > Lavamaw > Calderamaw | fire | Magma Armor (+2 armor; touching monsters catch fire) | magma |

**Status effects** are per partner (`partnerStatus`: `DEX.status` or the type default `EL_STATUS`): Soak (water default), Chill/Freeze (Puplash), Scald (Rippig), Vapour/mist (Tidehorn), Melt (Magmaw), Seeded (Sproutle, Mossaur), Burn, Poison, Daze. Abilities changed: Rippig Boiling Point, Mossaur Healing Bloom, Pebblion Smasher, Gloomhog Digger (dash tunnels), Magmaw Molten Core (+35% damage, 20% slower).

**World.** Hills come from `groundH(x, z)` (HILLS list), and the ground has baked vertex shading. Game logic stays flat: `frame()` lifts every scene object by `groundH` just for the draw (`userData.flat` opts out: ground, sky, vine ribbon). Trees block movement (`TREES`). Stones are per-run solid `obj` entities (`spawnStone`, rock type, breakable). Dash: Shift or the touch Dash button (`dash()`, 1.4 s cooldown, untouchable).

**Old status notes** (`STATUS`, `inflict`, `tickStatus`). Each move has a status chance `st`, and ultimates always apply theirs: fire Burn (DoT), water Chill (slow; 3 chills = Freeze, which stops the monster, adds +25% damage taken and shows ice shards), grass Poison (DoT, stacks ×3), ground Daze (stun). Bosses shake off freeze and daze faster. Monsters get tinted per status (`TINTS`, `matSet(c, true)`).

**Moves.** 5 per type, max level 6 (`MOVES`). `stat(l)` is the single source of numbers, used by both `tickMoves` and the Wild Dex. Water Gun was rebalanced to 6 droplets × 3.5 damage, pierce 1, 1.5 s cooldown: about 14 DPS, matching Ember. Vine Whip is a camera-facing ribbon mesh (`makeVine`, `layVine`) with alternating leaves and a curled tip.

**Art pipeline.** Small canvases, then `finish()` hard-edges the alpha and outlines. `SRC` keeps source canvases. `STYLES` and `restyle()` swing hues per partner, and `artFor(style)` builds that partner's sprite set. Use `PS(k)` for sprite materials, `PV(k)` for frame effects and `PT(k)` for textures. Recruit evolutions: `evoFrames()` takes the sheet sprite, then `deepen`, `silhouette` anchors, `SHAPES` features per `EVO_PLAN` (flame, fin, leaf, spike, crystal, thorn), and a glow rim at stage 2 (36 px frames). The results land in `EVO_MATS[kind][stage]`.

**Wild Dex** (`#dex` screen, opened from Title, Select and Pause; `renderDex`, `renderDexList`, `renderDexCard`). It has type filters, search, a roster grid (open, seen, or unseen silhouette with recruit progress) and an entry card: evolution line (click a form to see its stats), stat bars, ability, status, every type move with Lv 1 → Lv 6 numbers, ultimate, matchups and record. "Play as" from Title; "Use next run" from Pause.

**HUD.** `#abil` under the XP bar shows the ability name and its meter (`ab.meter()`).

**Phones.** Landscape only: in portrait a `#rotate` prompt covers the game and pauses it. Starting a run asks for full screen and a landscape lock (`goFullscreen`, Android; iPhone Safari ignores it). Touch-only HUD buttons: E (boss) and ⛶ (full screen). The camera swings toward a sideways push of the stick unless the right thumb is looking. The `(pointer: coarse) and (max-height: 500px)` CSS compacts the HUD.

**Portfolio link.** A `#paw` "Pocket Wilds · Experimental" glass button sits above the fixed PLAY ISLAND button in `portfolio.html`, as well as the paw in `.social`.

**Code map.** `newRun`, `clearRun`, `update` (enemy loop: statuses, contact, tints), `hitEnemy(en, dmg, el, kx, kz, fx, st)`, `killEnemy`, `hurt`, `shock(..., st)`, `tickMoves`, `tickOrbit`, `tickUlts`, `tickExtras` (Ember Trail patches, queued faint bursts), `bossBrain`, `ABILITIES` hooks (init, tick, rate, power, dmgTo, stMul, hit, kill, hurt, endure, touch, poisonTick, meter), `boot()`.

**Saves.** localStorage keys `pocketwilds-settings`, `-progress` (kills, unlocked, flags), `-best`, `-partner`, `-trainer`. The trainer UI stays hidden while `TRAINERS` is empty (the sheet loader was removed).

**Testing trick.** The preview pane is often hidden, so requestAnimationFrame never fires. Set `window.requestAnimationFrame = () => 0`, keep a fake clock `t`, and call `frame(t += 16.7)` by hand. Set `last` to the same clock before stepping. `saveProg` is a top-level const, so overriding `window.saveProg` does nothing: always clear `pocketwilds*` localStorage keys after tests.

**Fixed bugs worth remembering.** The rAF loop queues the next frame first, and WebGL context loss pauses the game. dt is clamped to ≥ 0 (a negative dt once gave a negative animation frame index and a crash). An old Tidal Wave's sprites are removed when a new one starts.

**Map and UI pass (ideas from PokéBonk-style screenshots, own look kept).** Terraced hills (`TERRACE` 2 m steps in `groundH`) with brown banded cliff faces from vertex colours; 7 ponds (`PONDS`, they block like trees); blossom trees, mushrooms, ferns and sunflowers in `DECOR`. HUD: kill streak (`#streak`, chain within 2.5 s), floating damage numbers (`popText(..., 'dmg')`, capped), move slots with cooldown sweep (`#slots`, desktop only; phones keep `#kit` chips). Level-up cards have a type-coloured header, NEW tag and before → after numbers (`levelNums`), plus Reroll (R) and Skip (X), 2 each per run. Pause shows a run summary and move cards (`renderPauseInfo`). Tab or the pause button opens the big map (`#bigmap`, `drawBigMap`, terrain cached in `MAP_BG`). Starter cards show only a short blurb: details live in the Wild Dex.

**Drops, balance, pause (latest).** XP curve is about 1.7x slower (`S.need = 10 + 5.6L + 0.32L²`). Drops: crates, stones and bosses roll consumables (`ITEMS`), held boost items (`HELD`: Power Band, Swift Feather, Quick Claw, Status Charm, Venom Fang, Leftover Leaf, Guard Plate, Lucky Coin, Shiny Stone; they stack to `max` and last the run; `S.held`, `S.dotMul`, `S.xpMul`, `S.stBonus`) and move scrolls (`'scroll'`: teach a new own-type move or level one). Pickups go through `usePickup`. Balance: Legendary recruits +25 HP and ×1.12 damage, Molten Core +20%, Smasher ×1.5. The pause screen has a header (portrait, HP/EXP, tiles) and Moves / Items / Stats columns (`renderPauseInfo`). The camera sits back at distance 11.5.

**Settings, HUD, minimap (latest).** Settings is a tabbed panel (`SET_TABS`, `renderSettings`, `applySettings`) with sections Sound (master, music, effects, mute in background), Graphics (quality = pixel ratio, FPS limit 30/60, shake + intensity, damage numbers, FPS counter), Controls (sensitivity, invert, camera distance (wheel too), field of view, auto ultimate), Keys (rebindable `SET.keys`; movement is fixed) and Interface (minimap, streak, move slots, hints). HUD: round portrait `#avatar` with an XP ring and level pill, next to a plate with name, type and status. Minimap (`drawRadar`, 180 px canvas): `MAP_BG` terrain turned with the camera, N/E/S/W letters, item icons, and boss/rare portraits in rings. Help scrolls inside the sheet with Back pinned.

**Simple HUD and interact (latest).** The HUD is a round portrait (XP ring, level pill), then a dark plate with name, types, the next-evolution silhouette with its level, and a slim HP bar (no XP bar). The ability is a small ring icon in the type colour that fills with its meter (`#abil`, `--m`). Keys: R = ultimate, E = interact, F = reroll (key settings version 2 resets old saved keys once). There is no free boss summon: each run places 3 boss altars (red crystal; E calls that boss, who drops 2 extra boost items) and 4 shrines (gold; E gives a boost item, sometimes a scroll), each usable once (`S.altars`, `interact`, `nearAltar`, `#prompt`). They show on the minimap and big map. The timed boss every 2:00 is still on.

**Big world, economy, capture rework (latest; supersedes older notes where they conflict).**
- World: `WORLD_R` 160, `MAP_SPAN`. Seven regions (`BIOMES`, `biomeAt`) with their own tint, decor and favourite monsters; region name in `#zone`. Decor is baked once (`DECOR_OBJS`) and distance-culled (`cullDecor`, `CULL_D` follows Quality). Trees and ponds use a grid (`addTree`, `treesAt`, `pushOut`). `MAP_BG` is painted in `buildWorld`.
- Enemies: `hpScale` and `dmgScale` are gentle early, steep late. Elites (`makeElite`), hordes every 75 s (`S.nextHorde`). A simple bot lasted 4-5.5 min with no dash or dodging.
- Economy: monsters drop XP or a wild coin (`dropCoin`, 14%), never items. Chests are in `S.altars` (kind `chest` costs `chestPrice()`, kind `free` is blue; bosses leave one). `HELD` items have rarity (`RAR_W`, `pickHeld(luck)`); 20% of chests give a move scroll. Crates give coins, berry, magnet, bomb or shield. Star Candy only from bosses.
- Recruiting: one rare per run at most (`rollRare`, `RARE_CHANCE` by rarity). It roams from 45-70 m away (`rareMove`), never does contact damage, fires when you are within 11 m, then flees. Under 25% HP it is `weak`: slow walk, ring appears. Stay in ring `CAP_NEED` 12 s; out for `CAP_GRACE` 5 s resets and it runs. UI: `#rarept` pointer, `#capui` overhead (`updateRareUI`).
- Capture animation: `state === 'capture'`, `beginCapture`, `tickCaptureAnim`, `captureCamera`, card `#capcard`. Beats follow the catching sequence (throw, absorb, three shakes, click, stars) with our own original Wild Orb (`SM.orb`), not a copied ball.
- Sizes: `partnerSize` keeps partners near wild monster size; wild bosses at 85%.
- World map: `#bigmap`, north up, `drawBigMap`, zoom and drag (`MV`), fog of war (`S.fog`, `S.seen`, `revealFog`), fits any screen (side list wide, below when tall).
- Testing warning: bot or test runs write to the real localStorage. Back up to sessionStorage first; a window variable dies on reload.

**Physics and jump.** Partner height is `S.py` with gravity (`S.pv`); Space jumps (1.9 m, clears contact and low shots), and walking off a ledge falls. The player sprite, shots, enemy shots, orbits, vine parts and moving flames are `userData.flat` and use world height, so they do not follow the terrain. `shoot` aims at the target's height via `aimTarget` and lobs over ledges by raising gravity and launch speed; hills stop shots. Start area is flat (inside `groundH`).

**Patching warning.** A block replace by "start marker to next marker" once deleted the Settings and Help CSS, because other rules sat between the markers. Check what a cut removes (compare CSS selectors against git HEAD) before trusting it.

## Ideas not done yet
- Rename moves to original names (see rules).
- More types (electric, ice), real playtesting on the hosted site.
- From the reference screenshots, not done: currency and shop, altars, cages, gold rocks, bouncy mushrooms, map markers.
- The Mons 24 zip also has Nyx8/Zughy32 palette sheets and head/body part sheets (unused).
