# Uberia Prototype

Live build: https://ccherosc.github.io/uberia/

A tiny browser-playable RPG prototype for Windows-first testing. It aims for an Ultima 4/5-style top-down feel, reimagined as a lonely alien survival world.

## Current playable slice
- top-down tile movement
- crash site, overworld path, mixed settlement, and ruin approach
- oxygen pressure that drains in exposed zones and recovers in shelter
- NPC interaction
- inventory/equipment counters
- turn-based combat prototype
- exploration + survival progression counters
- save/load using browser localStorage
- eerie placeholder retro presentation using Phaser shapes

## Run it

### Requirements
- Node.js 22+ recommended
- npm

### Commands
```bash
npm install
npm run dev
```

Then open the local Vite URL in your browser.

## Build test
```bash
npm run test
npm run build
```

## GitHub Pages deploy
Pushes to `main` automatically deploy to:

`https://ccherosc.github.io/uberia/`

## Controls
- Move: `WASD` or arrow keys
- Interact / attack: `E` or `Space`
- Save: `K`
- Load: `L`

## Prototype loop
1. Start near the crash site in a survey suit and note that safe zones refill oxygen.
2. Travel east to the glowing sample cluster before your oxygen reserve runs too low.
3. Continue to the mixed settlement to recover and speak to the guide.
4. Go to the ruin and use your partial communication clue.
5. Fight the resin sentinel in a simple turn-based exchange.

## Notes
- Visuals are currently generated placeholder graphics, not final tiles.
- Third-party asset candidates are tracked in `docs/assets/ASSET_SOURCES.md`.
- Early survival pressure currently defaults to oxygen first: crash site and settlement restore O2, while exposed flats and the ruin drain it.
- This scaffold is meant to stay easy to expand into towns, dungeons, dialogue trees, vehicles, and richer alien communication later.
