# MVP Scaffold Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Create the first runnable browser prototype of Strange Planet RPG with top-down movement and a tiny gated exploration loop.

**Architecture:** Use Vite + TypeScript for a lightweight browser app and Phaser 3 for rendering/input. Keep game state in a small pure TypeScript module so key progression logic is testable outside the renderer.

**Tech Stack:** TypeScript, Phaser 3, Vite, Vitest

---

### Task 1: Scaffold the web game project

**Objective:** Create a minimal TypeScript/Vite app with Phaser and a test runner.

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/game/config.ts`
- Create: `src/styles.css`

**Step 1: Write failing build expectation**
- Run: `npm run build`
- Expected: fail because the project does not exist yet

**Step 2: Write minimal scaffold**
- Add Vite scripts and dependencies
- Create a Phaser boot entry that mounts to `#app`

**Step 3: Run install**
- Run: `npm install`
- Expected: dependencies install cleanly

**Step 4: Run build**
- Run: `npm run build`
- Expected: Vite build succeeds

### Task 2: Add pure progression state with TDD

**Objective:** Model the first quest gate in a testable store.

**Files:**
- Create: `src/game/state/gameState.ts`
- Create: `src/game/state/gameState.test.ts`

**Step 1: Write failing tests**
- Test that collecting a sample updates scrap/resources
- Test that talking to the NPC advances the objective only after the sample is collected
- Test that entering the ruin marks the slice complete only after the NPC talk

**Step 2: Run test to verify failure**
- Run: `npm run test -- --runInBand`
- Expected: fail because the module is missing

**Step 3: Write minimal implementation**
- Add pure functions for collect/talk/enter transitions

**Step 4: Run tests to verify pass**
- Run: `npm run test -- --runInBand`
- Expected: tests pass

### Task 3: Build the playable scene

**Objective:** Render a simple top-down map with movement and three interactable points of interest.

**Files:**
- Create: `src/game/scenes/PrototypeScene.ts`
- Modify: `src/main.ts`
- Modify: `src/game/config.ts`

**Step 1: Add a failing smoke expectation**
- Run: `npm run build`
- Expected: fail until scene imports are wired correctly

**Step 2: Implement minimal playable content**
- Draw zones and props with Phaser graphics
- Add keyboard movement
- Add interaction prompt when near NPC/resource/ruin
- Reflect state changes in HUD text

**Step 3: Run tests/build**
- Run: `npm run test -- --runInBand && npm run build`
- Expected: both succeed

### Task 4: Document Windows usage and assumptions

**Objective:** Make the prototype easy for John to run immediately.

**Files:**
- Create: `README.md`

**Step 1: Add exact commands**
- Include `npm install`, `npm run dev`, and `npm run build`

**Step 2: Add gameplay instructions**
- Explain movement and the collect -> talk -> enter loop

**Step 3: Verification**
- Run: `npm run build`
- Expected: still passes after docs changes
