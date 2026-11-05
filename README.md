# Topple the Pigs

A pixel-styled 3D physics game in the browser. Pigs are rude. Topple them.

- **Campaign mode:** 14 stages. Each has pigs on perches, a clock, a green placement zone and a limited set of parts. Clearing stages unlocks new parts.
- **Creative mode:** every part and machine, no clock, plus chaos tools (wind, earthquake, meteors, detonate) and ready-made scenes.

This is the project to iterate on. `prototype/` is the original Claude prototype, copied here unchanged, and should be left as it is.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/
npm run preview    # serve the production build on http://localhost:4173
```

## Project layout

```
index.html      Markup: canvas, HUD, toolbar, parts tray, menus, dialogues, overlays
css/styles.css  All styling (tokens at the top of :root)
js/game.js      All game logic, in one IIFE (see AGENTS.md for a map)
vite.config.js  Dev server and production build
prototype/      Frozen original. Do not edit.
```

## Libraries

| Library | Version | Global | Notes |
|---|---|---|---|
| Three.js | r128 | `THREE` | Rendering, orthographic isometric camera. Loaded from CDN in `index.html`. |
| cannon.js | 0.6.2 | `CANNON` | Physics (rigid bodies, hinge for the seesaw). Loaded from CDN in `index.html`. |
| Google Fonts | – | – | Pixelify Sans (headers), IBM Plex Mono (UI text) |
| Vite | 6 | – | Dev server and production bundle only. It does not change the game. |

Keep the CDN versions pinned. The game relies on their exact APIs.

## Saved data (localStorage)

| Key | Contents |
|---|---|
| `tinker-island-v1` | Creative-mode island and UI settings |
| `tinker-island-v1-progress` | Campaign progress: stages cleared and stars |
| `tinker-island-v1-intro` | Creative intro seen |

The keys still use the game's old working name. Rename them in `game.js` (`SAVE_KEY`) if you like, but that resets existing saves.

## Controls

| Action | Input |
|---|---|
| Pan | Pan tool, hold Space, or WASD |
| Rotate and tilt the view | Rotate tool or hold R, then drag left/right to turn and up/down to tilt |
| Zoom | Scroll |
| Place | Click, or drag a part out of the tray. Drag across the ground to lay a row |
| Turn a placed part | Hover it in Place mode, then hold and move the mouse |
| Stack | Click the top face of a placed part (sides rotate it) |
| Poke | Press on your part, drag to aim, release, then click to set power |
| Pause | P |

## Debug hook

`window.__tinker` exposes `objs()`, `addObj()`, `startLevel(i, quick)`, `getCamp()`, `simStep(n)`, `state`, `camera` and `world` for console testing. Remove it before shipping.
