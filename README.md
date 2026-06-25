# Uberia Prototype

Live build: https://ccherosc.github.io/uberia/

A browser-playable survival RPG prototype for Windows-first testing. It aims for an Ultima-style top-down feel, reimagined as a lonely alien world with click-to-tile movement, oxygen pressure, settlement contact, and ruin exploration.

## Current playable slice
- click-to-tile movement across a larger overworld slice
- crash site, whispering flats, beacon shelf, mixed settlement, ruin threshold, and archive chamber
- oxygen pressure that drains in exposed zones and recovers in shelter
- field-beacon repair that expands your oxygen capacity and creates a new safe pocket
- NPC interaction with the settlement guide
- inventory/equipment counters
- turn-based combat prototype
- field medgel healing with turn-cost pressure during combat
- exploration + survival progression counters
- save/load using browser localStorage
- toggleable field journal that tracks the current objective, quest milestones, decoded signals, and party roles
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
- Move: click a tile to route there one square at a time
- Keyboard movement: `WASD` or arrow keys for one-tile nudges
- Interact / attack: `E` or `Space`
- Use medgel: `H`
- Field journal: `J`
- Save: `K`
- Load: `L`

## What you can do in the game
1. Start at the crash site and move east into the flats.
2. Harvest the **sample cluster**.
3. Gather **sky-fiber** from the reed bed.
4. Repair the **field beacon** to expand your oxygen reserve and create another safe pocket.
5. Reach the **mixed settlement** and speak to the guide.
6. Carry the **pulse-glyph** to the **resin ruin gate**.
7. Fight the **resin sentinel** in a simple turn-based battle.
8. Spend a **medgel** with `H` when oxygen attrition or combat wears the party down.
9. Scan the **archive heart**.
10. Return to the settlement guide for a suit upgrade.
11. Save and reload your run whenever you want.

## Prototype loop
1. Resource the expedition by collecting both the sample and the fiber.
2. Stabilize the beacon so long trips feel safer.
3. Earn trust at the settlement.
4. Push into the ruin and survive the sentinel.
5. Recover the archive shard and bring it home.
6. Continue ranging farther with the upgraded suit.

## Notes
- Visuals are still generated placeholder graphics, not final tiles.
- Third-party asset candidates are tracked in `docs/assets/ASSET_SOURCES.md`.
- Oxygen is the first survival layer for now; later passes can add suit damage, hunger/material scarcity, vehicles, and deeper dialogue.
- This scaffold is meant to stay easy to expand into towns, dungeons, dialogue trees, vehicles, and richer alien communication later.
