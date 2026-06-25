import { describe, expect, it } from 'vitest';
import {
  attackTurn,
  collectFiber,
  collectSample,
  createInitialState,
  scanArchive,
  stabilizeBeacon,
  talkToSettlementGuide,
  enterRuin,
} from '../state/gameState';
import { buildJournalSections } from './journal';

describe('buildJournalSections', () => {
  it('describes the opening expedition state', () => {
    const journal = buildJournalSections(createInitialState());

    expect(journal.objective).toMatch(/alien sample/i);
    expect(journal.milestones[0]).toBe('[ ] Sample cluster harvested');
    expect(journal.signals[0]).toMatch(/No stable translation yet/i);
    expect(journal.party.join(' ')).toMatch(/xenobiologist/i);
  });

  it('shows pulse-glyph after the settlement guide shares the first concept', () => {
    const state = talkToSettlementGuide(stabilizeBeacon(collectFiber(collectSample(createInitialState()))));
    const journal = buildJournalSections(state);

    expect(journal.objective).toMatch(/resin ruin gate/i);
    expect(journal.milestones).toContain('[x] Settlement guide consulted');
    expect(journal.signals.join(' ')).toMatch(/pulse-glyph/i);
  });

  it('shows archive-song after the archive has been scanned', () => {
    let state = enterRuin(talkToSettlementGuide(stabilizeBeacon(collectFiber(collectSample(createInitialState())))));
    state = attackTurn(attackTurn(attackTurn(attackTurn(state))));
    state = scanArchive(state);

    const journal = buildJournalSections(state);

    expect(journal.objective).toMatch(/archive shard back/i);
    expect(journal.milestones).toContain('[x] Archive heart scanned');
    expect(journal.signals.join(' ')).toMatch(/archive-song/i);
  });
});
