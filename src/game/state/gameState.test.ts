import { describe, expect, it } from 'vitest';
import {
  applyOxygenTick,
  attackTurn,
  collectSample,
  createInitialState,
  enterRuin,
  exportSaveData,
  hydrateState,
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

    expect(next.scrap).toBe(2);
    expect(next.inventory.sample).toBe(1);
    expect(next.questFlags.resourceCollected).toBe(true);
    expect(next.objective).toBe('talk-to-settlement');
  });

  it('talking to the settlement guide is gated on the sample', () => {
    const state = createInitialState();

    const blocked = talkToSettlementGuide(state);
    expect(blocked.questFlags.npcSpokenTo).toBe(false);

    const progressed = talkToSettlementGuide(collectSample(state));
    expect(progressed.questFlags.npcSpokenTo).toBe(true);
    expect(progressed.objective).toBe('enter-ruin');
    expect(progressed.discoveredSignals).toContain('pulse-glyph');
  });

  it('entering the ruin starts combat only after the guide is spoken to', () => {
    const state = createInitialState();

    const blocked = enterRuin(state);
    expect(blocked.inCombat).toBe(false);

    const progressed = enterRuin(talkToSettlementGuide(collectSample(state)));
    expect(progressed.inCombat).toBe(true);
    expect(progressed.combat?.enemyName).toBe('Resin Sentinel');
    expect(progressed.objective).toBe('defeat-sentinel');
  });

  it('combat resolves after repeated attacks', () => {
    let state = enterRuin(talkToSettlementGuide(collectSample(createInitialState())));

    state = attackTurn(state);
    state = attackTurn(state);
    state = attackTurn(state);

    expect(state.inCombat).toBe(false);
    expect(state.questFlags.sentinelDefeated).toBe(true);
    expect(state.objective).toBe('survive');
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
    const progressed = talkToSettlementGuide(collectSample(createInitialState()));
    const lowOxygen = {
      ...progressed,
      oxygen: 4,
      maxOxygen: 10,
    };

    const restored = hydrateState(exportSaveData(lowOxygen));

    expect(restored.oxygen).toBe(4);
    expect(restored.maxOxygen).toBe(10);
  });

  it('save data can be hydrated back into state', () => {
    const progressed = talkToSettlementGuide(collectSample(createInitialState()));

    const restored = hydrateState(exportSaveData(progressed));

    expect(restored.questFlags.npcSpokenTo).toBe(true);
    expect(restored.inventory.sample).toBe(1);
    expect(restored.currentDialogue).toMatch(/Save restored/);
  });
});
