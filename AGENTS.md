# Notes for AI coding agents (Cursor etc.)

The game you should edit is the repository root (`index.html`, `css/styles.css`, `js/game.js`). `prototype/` is the original Claude prototype. Leave it unchanged.

## Shape of the code
Everything runs inside `boot()` in `js/game.js`, a single closure. There are no modules and no build step. `THREE` and `CANNON` are globals from CDN script tags in `index.html`. Keep the CDN versions pinned (three r128, cannon 0.6.2). The code relies on their exact APIs, e.g. `CANNON.Cylinder` points along Z and is rotated with `qUp`/`qSide`.

### Section map (search for `/* ---------- name`)
| Section | What lives there |
|---|---|
| pixel icons | 10×10 pixel-art tool icons drawn to data URLs |
| three | Renderer, materials (`mats`), geometry caches, `buildIsland(h)` (square island per stage), lights |
| physics | cannon world, contact materials (`def`, `bounce`, `ice`, `grip`). Domino-to-domino friction must stay 0 or chains stall |
| kinds | Every placeable part: `def(id,{...})`, `boxKind`, `ballKind`. A kind has `mesh(s,mm)`, `body(s)` (or `build` for composites, `nobody` for tornado/black hole), `bottom`, `hr`, `half`, `dens`, `cat`, `tip` |
| objects | `addObj`, `removeObj`, `setFrozen`, dormant bricks (`makeDormant`/`wakeDormant`) |
| sound | WebAudio synth: `tone`, `noise`, `sfx.*`. All procedural, no audio files |
| collisions & explosions | `onCollide`, `blast`, `explode`, pig floor-impact kill rule |
| simulation step | `simStep(h)`: buoyancy, fans, conveyors, black holes, tornadoes, balloons, rockets, hen/duck AI, pig topple checks, timers |
| camera | Ortho camera, `sizeView`. Elevation `camEl`, yaw `camT`/`camAng`, `pan`/`panT`, `zoomT`, `lookY` |
| UI / ghost & picking / input | Toolbar, parts tray with rendered 3D thumbnails (`thumb()`), ghost preview, raycasting, pointer handlers, place/rotate-hold (`spin`), tray drag-and-drop (`trayDrag`) |
| aim & power (poke) | Golf-style aim arrow that follows surfaces (`surfaceY`) and arcs off ledges, power meter, `shoot()` |
| scenes | Creative presets (`SCENES`) |
| clock | Radial countdown and tick sounds |
| campaign | `LEVELS` array (layout helpers `tower`, `pedestal`, `castle`), zone, progress, briefing/win/lose modals, stage 1 tour (`TOUR`), pig taunt cinematic (`playTaunt`), near-miss reactions (`reactPig`), drama cam and slow motion (`tickDrama`), place-tool pulse |
| save / HUD / intro / loop | localStorage save, HUD, creative intro cards, main `frame()` loop |

## Difficulty mechanics
- **Pokes budget:** each level has `pokes` (0 means poking is banned). `usePoke()`/`pokeLeft()` handle it; aim shots, TNT, rocket and balloon pokes and domino taps all count. A `×N` badge on the Poke tool (`pokeBadge()`, called from `hud()`) shows how many are left.
- **Par and stars:** each level has `par` (number of parts). Stars: 1 for toppling, +1 for using par parts or fewer, +1 for clearing with at least half the time left.
- **Steel** (`steel`): immovable, can't be unfrozen, and shields blasts (`shielded()` raycast cuts the impulse to 10%; stone cuts it to 45%).
- **Glass** (`glass`): fixed in place, shatters on impact over 3.2 m/s or anywhere inside a blast radius. It also shields until broken.
- **Nerfs:** TNT radius is 3.8. In campaign, pigs are blast-proof: something has to physically hit them. Poke lift is `m*(.3+1.4*power)`, so shots stay low unless launched from height. Fans have a 7-unit range with quadratic falloff, and force scales down on anything over 0.35 kg. Campaign cannons fire 3 shots.
- **Puzzle stages:** design each stage around one intended chain of parts (e.g. Bunker buster: TNT smashes the glass, crate in the near corner, ball on the crate, full-power poke). Test the intended solution and the lazy ones (TNT only, ground shots) in a headless script.
- **Ideas not built yet:** pressure plates and gates, moats and bridges, armoured and decoy pigs, moving platforms, wind zones, magnets, nets.

## Rules of thumb
- **Pig topple rule:** a pig pops when it hits the ground, drops 0.8 below its perch, or is knocked more than about 1 unit sideways and settles. Stages run 150 physics steps before showing (presettle) and record each pig's `startY`, `sx`, `sz`.
- **New stages:** keep every pig raised on something. Then check stability by running `startLevel(i,true)` followed by `simStep(900)` in the console; no pigs should pop.
- **Stacking vs rotating (place tool):** top face of a placed part (`topHit()`, world normal y > .6) shows the ghost; a click places on top, snapped to the part's centre. Click-and-drag on the top, or any press on a side, rotates. Tray drops always stack.
- **Poke arrow:** `surfaceY()` casts down from just above the previous arrow height (not from high above), skips pigs, and goes ballistic off any drop over .12. Points are lerped between frames to stop flicker.
- **Scenery bricks** start static (dormant) and wake on impact or blast. This stops walls collapsing on their own.
- **Fonts:** UI text uses `--f-ui` (IBM Plex Mono). The pixel font `--f-display` is for big headers only. Never use it for numbers (counts, badges): its 3 reads as an 8.
- **Design preferences:** no one-sided accent borders on UI items, minimal text, generous spacing in dialogues, playful copy.
