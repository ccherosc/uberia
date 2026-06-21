# Strange Planet RPG — Run Brief (2026-06-21)

## Source of truth
- Primary brief: `/root/projects/alien-ultima-prototype/PROJECT_BRIEF.md`
- This run's deliverable: scaffold a runnable Phaser 3 + TypeScript + Vite browser prototype with one bounded gameplay slice.

## Reference inventory
- `/root/projects/alien-ultima-prototype/PROJECT_BRIEF.md` — mechanic and architecture source of truth
- `/root/projects/alien-ultima-prototype/docs/assets/ASSET_SOURCES.md` — candidate third-party packs and observed license notes

## Asset constraints
- No third-party sprite/tile files are present in the repo yet.
- Do not attempt to invent or download opaque asset packs into runtime code in this run.
- Use generated placeholder visuals via Phaser graphics primitives and text labels.
- External packs listed in `docs/assets/ASSET_SOURCES.md` are inspiration / future runtime candidates only.

## Engine and target
- Engine/framework: Phaser 3 + TypeScript + Vite
- Target platforms now: browser-playable on Windows desktop
- Packaging later: Windows wrapper after gameplay loop proves out

## Exact gameplay loop for this run
Build one tiny playable overworld slice with:
1. top-down movement on a small tile grid
2. one crash site spawn area
3. one settlement area with at least one NPC interaction prompt
4. one hazardous ruin area with at least one enemy encounter trigger
5. one harvestable resource node
6. a minimal HUD that shows biome/location, HP, scrap, and quest hint
7. a simple state transition proving progression: collect resource -> talk to NPC -> enter ruin

## Required screens/state
- Game boot directly into playable scene for now
- In-scene instructional overlay is sufficient for MVP scaffold
- No separate title/pause/game-over screens required in this run

## Required files to create/update
- Project scaffold files for Vite + TypeScript
- Phaser entry point and game config
- One scene or minimal scene set implementing the above loop
- Lightweight state/store module for player progress
- Basic automated tests for pure game-state logic
- README instructions for Windows testing

## Verification required before completion
- `npm install`
- `npm run test`
- `npm run build`

## Boundedness rule
Keep scope to a first runnable prototype slice. Avoid combat systems, save/load, inventory UI, and content pipelines beyond what is needed for this proof-of-concept.
