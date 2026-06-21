# Asset Source Inventory

## Current run policy
- Runtime art now uses **original in-repo retro SVG placeholder tiles/sprites** so the prototype reads more like an actual 16-bit-era RPG instead of pure Phaser primitives.
- These placeholders were authored in-repo on 2026-06-21 and do not depend on any third-party asset license.
- They are intentionally temporary stand-ins for later replacement with a more distinctive alien tileset.

## Current in-repo placeholder set
- `src/assets/tiles/crash-ground.svg` — dark metallic crash-site floor tile
- `src/assets/tiles/flats-ground.svg` — alien meadow / whispering flats tile
- `src/assets/tiles/settlement-ground.svg` — mixed-settlement plaza tile
- `src/assets/tiles/ruin-ground.svg` — ruin-zone bio-tech floor tile
- `src/assets/sprites/player-party.svg` — party leader placeholder sprite
- `src/assets/sprites/sample-cluster.svg` — collectible sample marker
- `src/assets/sprites/settlement-guide.svg` — NPC placeholder sprite
- `src/assets/sprites/ruin-gate.svg` — ruin interaction marker

## Candidate packs for later replacement

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
1. Use the in-repo SVG set while tuning exploration/combat/dialogue feel.
2. Prefer Kenney Tiny Dungeon first if we want a fast third-party replacement pass with minimal licensing friction.
3. Use LPC only if humanoid readability matters more than keeping the early-world look abstract/alien.
4. When we import external packs, preserve license/attribution files in-repo immediately.
