import { describe, expect, it } from 'vitest';
import {
  applyOxygenTick,
  attackTurn,
  collectFiber,
  collectSample,
  createInitialState,
  enterRuin,
  exportSaveData,
  hydrateState,
  returnToSettlement,
  scanArchive,
  stabilizeBeacon,
  talkToSettlementGuide,
} from './gameState';

describe('game state progression', () => {
  it('starts with a full oxygen reserve', () => {
    const state = createInitialState();

    expect(state.oxygen).toBe(10);
    expect(state.maxOxygen).toBe(10);
  });

  it('collecting a sample adds resources and advances the objective', () => {
    const state = createInitialState();

    const next = collectSample(state);

    expect(next.scrap).toBe(3);
    expect(next.inventory.sample).toBe(1);
    expect(next.questFlags.resourceCollected).toBe(true);
    expect(next.objective).toBe('collect-fiber');
  });

  it('collecting fiber advances the objective toward the beacon', () => {
    const state = collectSample(createInitialState());
    const next = collectFiber(state);

    expect(next.inventory.fiber).toBe(3);
    expect(next.questFlags.fiberCollected).toBe(true);
    expect(next.objective).toBe('stabilize-beacon');
  });

  it('the beacon is gated on both field resources and expands oxygen', () => {
    const blocked = stabilizeBeacon(createInitialState());
    expect(blocked.questFlags.beaconStabilized).toBe(false);

    const ready = stabilizeBeacon(collectFiber(collectSample(createInitialState())));
    expect(ready.questFlags.beaconStabilized).toBe(true);
    expect(ready.maxOxygen).toBe(12);
    expect(ready.objective).toBe('talk-to-settlement');
  });

  it('talking to the settlement guide is gated on the beacon', () => {
    const state = collectFiber(collectSample(createInitialState()));

    const blocked = talkToSettlementGuide(state);
    expect(blocked.questFlags.npcSpokenTo).toBe(false);

    const progressed = talkToSettlementGuide(stabilizeBeacon(state));
    expect(progressed.questFlags.npcSpokenTo).toBe(true);
    expect(progressed.objective).toBe('enter-ruin');
    expect(progressed.discoveredSignals).toContain('pulse-glyph');
  });

  it('entering the ruin starts combat only after the guide is spoken to', () => {
    const state = stabilizeBeacon(collectFiber(collectSample(createInitialState())));

    const blocked = enterRuin(state);
    expect(blocked.inCombat).toBe(false);

    const progressed = enterRuin(talkToSettlementGuide(state));
    expect(progressed.inCombat).toBe(true);
    expect(progressed.combat?.enemyName).toBe('Resin Sentinel');
    expect(progressed.objective).toBe('defeat-sentinel');
  });

  it('combat resolves into archive scanning after repeated attacks', () => {
    let state = enterRuin(talkToSettlementGuide(stabilizeBeacon(collectFiber(collectSample(createInitialState())))));

    state = attackTurn(state);
    state = attackTurn(state);
    state = attackTurn(state);
    state = attackTurn(state);

    expect(state.inCombat).toBe(false);
    expect(state.questFlags.sentinelDefeated).toBe(true);
    expect(state.objective).toBe('scan-archive');
  });

  it('archive scanning unlocks a return objective', () => {
    let state = enterRuin(talkToSettlementGuide(stabilizeBeacon(collectFiber(collectSample(createInitialState())))));
    state = attackTurn(attackTurn(attackTurn(attackTurn(state))));

    const scanned = scanArchive(state);

    expect(scanned.questFlags.archiveScanned).toBe(true);
    expect(scanned.inventory.archiveShard).toBe(1);
    expect(scanned.objective).toBe('return-to-settlement');
  });

  it('returning to the settlement upgrades the suit after scanning the archive', () => {
    let state = enterRuin(talkToSettlementGuide(stabilizeBeacon(collectFiber(collectSample(createInitialState())))));
    state = attackTurn(attackTurn(attackTurn(attackTurn(state))));
    state = scanArchive(state);

    const completed = returnToSettlement(state);

    expect(completed.questFlags.settlementReturned).toBe(true);
    expect(completed.objective).toBe('survive');
    expect(completed.equipment.suit).toBe('Survey Suit Mk.II');
  });

  it('unsafe zones drain oxygen without dropping below zero', () => {
    const drained = applyOxygenTick(
      {
        ...createInitialState(),
        oxygen: 1,
      },
      false,
    );

    expect(drained.oxygen).toBe(0);
    expect(drained.health).toBe(12);
  });

  it('safe zones restore oxygen without exceeding max', () => {
    const recovered = applyOxygenTick(
      {
        ...createInitialState(),
        oxygen: 8,
      },
      true,
    );

    const capped = applyOxygenTick(
      {
        ...createInitialState(),
        oxygen: 10,
      },
      true,
    );

    expect(recovered.oxygen).toBe(9);
    expect(capped.oxygen).toBe(10);
  });

  it('oxygen depletion damages health once reserves are empty', () => {
    const exhausted = applyOxygenTick(
      {
        ...createInitialState(),
        oxygen: 0,
        health: 5,
      },
      false,
    );

    expect(exhausted.oxygen).toBe(0);
    expect(exhausted.health).toBe(4);
    expect(exhausted.currentDialogue).toMatch(/Oxygen reserves are empty/i);
  });

  it('oxygen values survive save export and hydration', () => {
    const progressed = stabilizeBeacon(collectFiber(collectSample(createInitialState())));
    const lowOxygen = {
      ...progressed,
      oxygen: 4,
    };

    const restored = hydrateState(exportSaveData(lowOxygen));

    expect(restored.oxygen).toBe(4);
    expect(restored.maxOxygen).toBe(12);
  });

  it('save data can be hydrated back into state', () => {
    const progressed = talkToSettlementGuide(stabilizeBeacon(collectFiber(collectSample(createInitialState()))));

    const restored = hydrateState(exportSaveData(progressed));

    expect(restored.questFlags.npcSpokenTo).toBe(true);
    expect(restored.inventory.sample).toBe(1);
    expect(restored.currentDialogue).toMatch(/Save restored/);
  });
});
