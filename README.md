# Uberia Prototype

A tiny browser-playable RPG prototype for Windows-first testing. It aims for an Ultima 4/5-style top-down feel, reimagined as a lonely alien survival world.

## Current playable slice
- top-down tile movement
- crash site, overworld path, mixed settlement, and ruin approach
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

## Controls
- Move: `WASD` or arrow keys
- Interact / attack: `E` or `Space`
- Save: `K`
- Load: `L`

## Prototype loop
1. Start near the crash site in a survey suit.
2. Travel east to the glowing sample cluster and harvest it.
3. Continue to the mixed settlement and speak to the guide.
4. Go to the ruin and use your partial communication clue.
5. Fight the resin sentinel in a simple turn-based exchange.

## Notes
- Visuals are currently generated placeholder graphics, not final tiles.
- Third-party asset candidates are tracked in `docs/assets/ASSET_SOURCES.md`.
- This scaffold is meant to stay easy to expand into towns, dungeons, dialogue trees, vehicles, and richer alien communication later.
