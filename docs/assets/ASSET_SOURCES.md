# Asset Source Inventory

## Current run policy
- Runtime art in this run is generated with simple Phaser graphics primitives so the prototype stays runnable without waiting on downloaded art.
- External asset packs below are candidates for the next art pass and are **not yet imported into the repo**.
- Before importing any third-party files, verify the specific pack download terms again and preserve attribution files where required.

## Candidate packs

### Kenney — Tiny Dungeon
- URL: https://kenney.nl/assets/tiny-dungeon
- Observed availability: page fetched successfully on 2026-06-21 from this environment
- Observed license signal on page: `CC0`
- Likely fit: modular dungeon/interior tiles, props, UI pieces for ruins and settlement interiors
- Caution: confirm the exact download contents before wiring filenames into code

### OpenGameArt — Liberated Pixel Cup (LPC) Base Assets, Sprites, Map Tiles
- URL: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
- Observed availability: page fetched successfully on 2026-06-21 from this environment
- Observed license signal on page: `CC-BY-SA 3.0` and attribution instructions are present
- Likely fit: humanoid placeholders, settlement NPCs, base RPG tiles
- Caution: share-alike and attribution obligations likely apply; keep a license file if used

### OpenGameArt — Tiny 16: Basic
- URL: https://opengameart.org/content/tiny-16-basic
- Observed availability: page fetched successfully on 2026-06-21 from this environment
- Observed license signal on page: `CC-BY 4.0` and `CC-BY 3.0` with attribution instructions present
- Likely fit: minimalist overworld props, UI icons, low-resolution experiments
- Caution: attribution required; page appears to aggregate multiple related assets, so verify the exact subset used

## Import recommendation
1. Keep the current prototype on generated primitives until the room-to-room flow feels good.
2. Prefer Kenney Tiny Dungeon first because the page advertises CC0 and is low-friction for rapid iteration.
3. Use LPC only if we decide humanoid NPC readability matters more than strict alien-world uniqueness in the first playable slice.
