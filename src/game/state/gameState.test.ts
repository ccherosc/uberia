import { describe, expect, it } from 'vitest';
import {
  attackTurn,
  collectSample,
  createInitialState,
  enterRuin,
  exportSaveData,
  hydrateState,
  talkToSettlementGuide,
} from './gameState';

describe('game state progression', () => {
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

  it('save data can be hydrated back into state', () => {
    const progressed = talkToSettlementGuide(collectSample(createInitialState()));

    const restored = hydrateState(exportSaveData(progressed));

    expect(restored.questFlags.npcSpokenTo).toBe(true);
    expect(restored.inventory.sample).toBe(1);
    expect(restored.currentDialogue).toMatch(/Save restored/);
  });
});
