# Field Journal Overlay Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a toggleable in-game field journal that makes the current expedition state legible: objective, quest milestones, discovered signals, and party roles.

**Architecture:** Keep gameplay state authoritative in `gameState.ts`, then derive player-facing journal content through a small pure helper module. Render the journal as a scene overlay toggled with a single key so the prototype stays browser-playable without adding separate screens.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest

---

### Task 1: Add a pure journal formatter module

**Objective:** Create a reusable formatter that turns `GameState` into overlay-ready sections.

**Files:**
- Create: `src/game/ui/journal.ts`
- Test: `src/game/ui/journal.test.ts`

**Step 1: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { collectFiber, collectSample, createInitialState, stabilizeBeacon, talkToSettlementGuide } from '../state/gameState';
import { buildJournalSections } from './journal';

it('shows discovered pulse-glyph signal after talking to the guide', () => {
  const state = talkToSettlementGuide(stabilizeBeacon(collectFiber(collectSample(createInitialState()))));
  const journal = buildJournalSections(state);
  expect(journal.signals.join(' ')).toMatch(/pulse-glyph/i);
});
```

**Step 2: Run test to verify failure**

Run: `npm run test -- src/game/ui/journal.test.ts`
Expected: FAIL — module/function missing

**Step 3: Write minimal implementation**

Create a formatter that returns arrays for:
- current objective summary
- milestone checklist
- discovered signal notes
- party role notes

**Step 4: Run test to verify pass**

Run: `npm run test -- src/game/ui/journal.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/ui/journal.ts src/game/ui/journal.test.ts
git commit -m "feat: add field journal formatter"
```

### Task 2: Wire the journal overlay into the Phaser scene

**Objective:** Let players press `J` to open/close the field journal without disrupting the rest of the prototype loop.

**Files:**
- Modify: `src/game/scenes/PrototypeScene.ts`

**Step 1: Add the input key and overlay text objects**

Add `J` to the scene key map and create one or more text/rectangle objects for the overlay.

**Step 2: Toggle visibility from update/interaction flow**

Use `Phaser.Input.Keyboard.JustDown(this.wasd.J)` to toggle journal visibility.

**Step 3: Render formatted journal content**

Use `buildJournalSections(this.state)` to populate:
- objective header
- milestone list
- signal notes
- party notes

**Step 4: Keep controls discoverable**

Update prompt/help text so players know `J` opens the journal.

**Step 5: Verify manually**

Run: `npm run dev`
Expected: game boots; `J` shows/hides overlay; movement/combat/save/load still work

### Task 3: Update handoff docs

**Objective:** Document the new control and why it matters.

**Files:**
- Modify: `README.md`

**Step 1: Add control note**

Document `J = field journal` in the controls list.

**Step 2: Add one sentence to the playable slice**

Mention that the journal tracks decoded signals, party roles, and expedition milestones.

**Step 3: Verify docs match reality**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add README.md src/game/scenes/PrototypeScene.ts src/game/ui/journal.ts src/game/ui/journal.test.ts
git commit -m "feat: add in-game field journal overlay"
```