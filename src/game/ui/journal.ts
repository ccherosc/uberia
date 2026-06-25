import type { GameState, Objective } from '../state/gameState';

export interface JournalSections {
  objective: string;
  milestones: string[];
  signals: string[];
  party: string[];
}

const OBJECTIVE_SUMMARIES: Record<Objective, string> = {
  'collect-sample': 'Recover an alien sample from the Whispering Flats.',
  'collect-fiber': 'Gather sky-fiber so the party can attempt field repairs.',
  'stabilize-beacon': 'Use the sample and fiber to restore the dead beacon air pocket.',
  'talk-to-settlement': 'Reach the mixed settlement and prove you can survive the wilds.',
  'enter-ruin': 'Carry the pulse-glyph to the resin ruin gate and gain entry.',
  'defeat-sentinel': 'Break the resin sentinel guarding the archive path.',
  'scan-archive': 'Touch the archive heart and take a living memory shard.',
  'return-to-settlement': 'Bring the archive shard back to the settlement guide.',
  survive: 'Range farther into Uberia and prepare for the next expedition slice.',
};

const PARTY_ROLE_NOTES: Record<string, string> = {
  Aryn: 'Aryn — expedition lead; keeps the salvage cutter and sets the pace in unknown terrain.',
  Vera: 'Vera — field xenobiologist; reads alien growth patterns and flags what might keep you alive.',
  Kesh: 'Kesh — translator scout; listens for repeated symbols, gestures, and signal-rhythm meaning.',
};

const SIGNAL_NOTES: Record<string, string> = {
  'pulse-glyph': 'pulse-glyph — a partial concept for permission, rhythm, and opening living structures.',
  'archive-song': 'archive-song — a deeper mnemonic pattern carried inside the archive shard.',
};

function checkbox(complete: boolean, label: string): string {
  return `${complete ? '[x]' : '[ ]'} ${label}`;
}

export function buildJournalSections(state: GameState): JournalSections {
  const milestones = [
    checkbox(state.questFlags.resourceCollected, 'Sample cluster harvested'),
    checkbox(state.questFlags.fiberCollected, 'Sky-fiber gathered'),
    checkbox(state.questFlags.beaconStabilized, 'Field beacon stabilized'),
    checkbox(state.questFlags.npcSpokenTo, 'Settlement guide consulted'),
    checkbox(state.questFlags.ruinEntered, 'Ruin gate opened'),
    checkbox(state.questFlags.sentinelDefeated, 'Resin sentinel defeated'),
    checkbox(state.questFlags.archiveScanned, 'Archive heart scanned'),
    checkbox(state.questFlags.settlementReturned, 'Archive shard returned to settlement'),
  ];

  const signals = state.discoveredSignals.length > 0
    ? state.discoveredSignals.map((signal) => SIGNAL_NOTES[signal] ?? `${signal} — recorded, but not yet annotated.`)
    : ['No stable translation yet. The party is still guessing which sounds, colors, and pulses carry meaning.'];

  const party = state.party.map(
    (member) => PARTY_ROLE_NOTES[member] ?? `${member} — expedition member; role notes not yet logged.`,
  );

  return {
    objective: OBJECTIVE_SUMMARIES[state.objective],
    milestones,
    signals,
    party,
  };
}
