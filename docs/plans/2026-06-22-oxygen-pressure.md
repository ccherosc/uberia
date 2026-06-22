# Oxygen Pressure Prototype Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a lightweight oxygen-pressure survival loop so the prototype has meaningful ambient danger before deeper combat/systems land.

**Architecture:** Keep oxygen as pure state in `gameState.ts` so it is testable without Phaser. The scene should derive a simple `isSafeOxygenZone` boolean from player position/location and call state helpers on a low-frequency timer, with settlement/crash-site areas passively stabilizing oxygen and the flats/ruin approach draining it.

**Tech Stack:** TypeScript, Phaser 3, Vite, Vitest

---

### Task 1: Add failing oxygen-state tests

**Objective:** Define the intended oxygen behavior in pure logic before touching gameplay code.

**Files:**
- Modify: `src/game/state/gameState.test.ts`
- Modify: `src/game/state/gameState.ts`

**Step 1: Write failing tests**

Add tests covering:
- initial state includes `oxygen` and `maxOxygen`
- a hazard tick outside safe zones lowers oxygen but not below zero
- a safe-zone recovery tick restores oxygen but not above max
- oxygen depletion damages health and updates dialogue/objective hints
- exported/hydrated save data preserves oxygen values

**Step 2: Run test to verify failure**

Run: `npm run test`
Expected: FAIL with missing oxygen fields/helpers.

**Step 3: Write minimal implementation**

Add pure helpers like:
- `applyOxygenTick(state, inSafeZone)`
- `restoreOxygen(state, amount)` only if needed internally

Keep behavior bounded:
- safe zone: +1 oxygen per tick until full
- unsafe zone: -1 oxygen per tick
- when oxygen is already zero in unsafe zone, lose 1 HP (min 1) and update dialogue

**Step 4: Run test to verify pass**

Run: `npm run test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/gameState.ts src/game/state/gameState.test.ts
git commit -m "feat: add oxygen survival state"
```

### Task 2: Wire oxygen into the playable scene

**Objective:** Make the survival pressure visible and active in the Phaser prototype.

**Files:**
- Modify: `src/game/scenes/PrototypeScene.ts`
- Modify: `src/game/state/gameState.ts`

**Step 1: Add scene integration**

Implement a repeating timer or delta accumulator that applies `applyOxygenTick` roughly once per second.

Safe/default zones:
- `Crash Site`
- `Mixed Settlement`

Unsafe/default zones:
- `Whispering Flats`
- `Ruin Approach`
- `Ruin Threshold`

**Step 2: Update HUD/prompt copy**

Add oxygen to the HUD and explain that safe zones stabilize the suit.

**Step 3: Keep scope tight**

Do not add new screens, inventory UI, or consumable oxygen items in this run.

**Step 4: Run verification**

Run:
- `npm run test`
- `npm run build`

Expected: PASS for both.

**Step 5: Commit**

```bash
git add src/game/scenes/PrototypeScene.ts src/game/state/gameState.ts
git commit -m "feat: add oxygen pressure to prototype scene"
```

### Task 3: Update handoff docs

**Objective:** Document the new loop so Windows testing is obvious.

**Files:**
- Modify: `README.md`
- Modify: `PROJECT_BRIEF.md`

**Step 1: Update README**

Document:
- oxygen meter in HUD
- safe vs unsafe zones
- how to observe the mechanic during local play

**Step 2: Update brief assumptions**

Record the conservative default that early survival pressure currently emphasizes oxygen first.

**Step 3: Run final verification**

Run:
- `npm run test`
- `npm run build`

Expected: PASS

**Step 4: Commit**

```bash
git add README.md PROJECT_BRIEF.md docs/plans/2026-06-22-oxygen-pressure.md
git commit -m "docs: record oxygen-first survival prototype"
```
