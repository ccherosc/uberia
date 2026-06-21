# Alien Planet RPG Prototype Brief

## Working title
Uberia

## Core fantasy
A top-down retro pixel-art survival RPG for Windows, mechanically inspired by Ultima 4/5 but set on a hostile alien world inspired by the emotional/biological strangeness of *Scavenger's Reign*.

## MVP goal
Build a tiny prototype that proves the core loop and art direction:
- top-down tile movement
- one small overworld
- one small town / settlement
- one small dungeon / dangerous site
- NPC dialogue
- inventory / equipment
- turn-based combat
- quests / virtue-style progression
- save / load
- retro pixel-art presentation
- existing placeholder player character for now

## Narrative frame
The player begins in a space suit with very limited resources after arriving or crash-landing on an alien planet. At first, the world is incomprehensible: language, behavior, biology, and social meaning are unclear. Through exploration, encounters, artifacts, and survival, the player begins to decode forms of communication and eventually leaves a lasting mark on the planet's history.

## Long-term pillars
1. Survival first, wonder second, power fantasy last.
2. Alien life should feel biologically and socially unfamiliar.
3. Friendly and hostile inhabitants both exist.
4. The player can eventually become god-like through powerful artifacts.
5. Vehicles, including spacecraft, are desired later.
6. Gameplay should carry much of the story, with light framing and NPC interaction.

## Recommended technical direction
Confirmed with John:
- Engine/framework: Phaser 3 + TypeScript + Vite
- Testing target: browser-playable on Windows for now
- Packaging later: Windows desktop wrapper once gameplay loop is solid
- Reason for choice: fastest iteration in this environment, easiest autonomous progress, easy asset swapping, easy long-term expansion

## Asset direction
- Prefer free/open or free-to-use retro tiles and sprites first
- If free sets are insufficient, identify cheap paid packs the user can buy
- Recolor / remix / combine only within license terms
- Aim for an alien-biome palette rather than standard fantasy grassland

## MVP content slice
- Area 1: crash site / harsh landing zone
- Area 2: nearby overworld path with harvestable resources
- Area 3: small mixed settlement with human and alien inhabitants
- Area 4: short dungeon / ruin / organism-interior zone
- 1-2 simple quests
- 2-3 enemy types
- 3-5 items / resources
- 1 beginner artifact that grants limited communication
- the player begins with a small party
- early tone should feel lonely / eerie despite not being fully alone

## Systems to defer until after MVP
- vehicles
- spaceship travel
- large world map
- party systems
- extensive faction diplomacy
- many language trees
- elaborate procedural ecosystem simulation

## Constraints for autonomous daily work
- Make bounded, testable progress each run.
- Prefer architecture that stays simple and expandable.
- Leave the game in a runnable state after each run when possible.
- Use placeholder content where needed, but document all assumptions.
- End each run with: what changed, how John can test, open questions, blockers, and next recommended step.

## Known open questions for John
Resolved on 2026-06-21:
1. Early testing should be browser-playable on Windows first.
2. Early tone should be lonely / eerie, but with a small party.
3. The first town should be mixed.
4. The first artifact should grant limited communication.
5. Initial virtue-style progression should emphasize exploration and survival.

Remaining future questions:
1. What should the small party composition be in the prototype?
2. Should the first alien dialogue feel symbolic, biological, or partially translated?
3. Should survival pressure focus more on health, oxygen, or scarce materials first?
