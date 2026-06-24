export type Objective =
  | 'collect-sample'
  | 'collect-fiber'
  | 'stabilize-beacon'
  | 'talk-to-settlement'
  | 'enter-ruin'
  | 'defeat-sentinel'
  | 'scan-archive'
  | 'return-to-settlement'
  | 'survive';

export interface CombatState {
  enemyName: string;
  enemyHp: number;
  enemyAttack: number;
}

export interface SaveData {
  scrap: number;
  inventory: Record<string, number>;
  equipment: {
    tool: string;
    suit: string;
  };
  discoveredSignals: string[];
  objective: Objective;
  questFlags: {
    resourceCollected: boolean;
    fiberCollected: boolean;
    beaconStabilized: boolean;
    npcSpokenTo: boolean;
    ruinEntered: boolean;
    sentinelDefeated: boolean;
    archiveScanned: boolean;
    settlementReturned: boolean;
  };
  party: string[];
  health: number;
  maxHealth: number;
  oxygen: number;
  maxOxygen: number;
  exploration: number;
  survival: number;
}

export interface GameState extends SaveData {
  locationName: string;
  currentDialogue: string;
  inCombat: boolean;
  combat: CombatState | null;
}

export const SAVE_KEY = 'strange-planet-rpg-save';

export function createInitialState(): GameState {
  return {
    scrap: 1,
    inventory: {
      sample: 0,
      fiber: 0,
      medgel: 1,
      archiveShard: 0,
    },
    equipment: {
      tool: 'Salvage Cutter',
      suit: 'Survey Suit Mk.I',
    },
    discoveredSignals: [],
    objective: 'collect-sample',
    questFlags: {
      resourceCollected: false,
      fiberCollected: false,
      beaconStabilized: false,
      npcSpokenTo: false,
      ruinEntered: false,
      sentinelDefeated: false,
      archiveScanned: false,
      settlementReturned: false,
    },
    party: ['Aryn', 'Vera', 'Kesh'],
    health: 12,
    maxHealth: 12,
    oxygen: 10,
    maxOxygen: 10,
    exploration: 0,
    survival: 0,
    locationName: 'Crash Site',
    currentDialogue:
      'Suit pressure stabilizing. The dark flats are breathable only in fragments. Click a nearby tile to move and find something useful.',
    inCombat: false,
    combat: null,
  };
}

export function collectSample(state: GameState): GameState {
  if (state.questFlags.resourceCollected) {
    return {
      ...state,
      currentDialogue: 'The pale growth has already been harvested. It still clicks softly in the wind.',
    };
  }

  return {
    ...state,
    scrap: state.scrap + 2,
    inventory: {
      ...state.inventory,
      sample: (state.inventory.sample ?? 0) + 1,
    },
    objective: state.questFlags.fiberCollected ? 'stabilize-beacon' : 'collect-fiber',
    survival: state.survival + 1,
    currentDialogue:
      'You cut loose a humming sample cluster. The scanner cannot parse it, but your party agrees it belongs in the field beacon.',
    questFlags: {
      ...state.questFlags,
      resourceCollected: true,
    },
  };
}

export function collectFiber(state: GameState): GameState {
  if (state.questFlags.fiberCollected) {
    return {
      ...state,
      currentDialogue: 'Only trimmed stalks remain. The rest of the reed bed folds away from your gloves.',
    };
  }

  return {
    ...state,
    scrap: state.scrap + 1,
    inventory: {
      ...state.inventory,
      fiber: (state.inventory.fiber ?? 0) + 3,
    },
    objective: state.questFlags.resourceCollected ? 'stabilize-beacon' : 'collect-sample',
    survival: state.survival + 1,
    currentDialogue:
      'You gather elastic sky-fiber from the reed bed. It should patch a relay coil or emergency shelter seam.',
    questFlags: {
      ...state.questFlags,
      fiberCollected: true,
    },
  };
}

export function stabilizeBeacon(state: GameState): GameState {
  if (state.questFlags.beaconStabilized) {
    return {
      ...state,
      oxygen: state.maxOxygen,
      currentDialogue: 'The field beacon hums steadily. Clean air pools around it for a moment before drifting thin again.',
    };
  }

  if (!state.questFlags.resourceCollected || !state.questFlags.fiberCollected) {
    return {
      ...state,
      currentDialogue: 'The beacon shell is dead. It needs both the humming sample and flexible fiber before it can hold an air pocket.',
    };
  }

  return {
    ...state,
    objective: 'talk-to-settlement',
    oxygen: state.maxOxygen + 2,
    maxOxygen: state.maxOxygen + 2,
    exploration: state.exploration + 1,
    survival: state.survival + 1,
    currentDialogue:
      'The repaired field beacon blooms blue and deepens your oxygen reserve. A thin trail of light points toward the settlement.',
    questFlags: {
      ...state.questFlags,
      beaconStabilized: true,
    },
  };
}

export function talkToSettlementGuide(state: GameState): GameState {
  if (!state.questFlags.beaconStabilized) {
    return {
      ...state,
      currentDialogue:
        'A settlement watcher studies your suit. Vera murmurs: "Show them you can keep a beacon alive out there first."',
    };
  }

  if (state.questFlags.npcSpokenTo) {
    return {
      ...state,
      currentDialogue:
        'The mixed-settlement guide rests a palm on the translator shard. "The ruin remembers pulse-glyph. The archive remembers everything else."',
    };
  }

  return {
    ...state,
    objective: 'enter-ruin',
    exploration: state.exploration + 1,
    discoveredSignals: [...state.discoveredSignals, 'pulse-glyph'],
    currentDialogue:
      'A human scout and an alien speaker share a cracked translator shard. You learn one fragile concept: pulse-glyph. It should open the ruin gate.',
    questFlags: {
      ...state.questFlags,
      npcSpokenTo: true,
    },
  };
}

export function enterRuin(state: GameState): GameState {
  if (!state.questFlags.npcSpokenTo) {
    return {
      ...state,
      currentDialogue: 'The ruin membrane recoils from your touch. Without context, the symbols mean nothing.',
    };
  }

  if (state.questFlags.ruinEntered) {
    return state;
  }

  return {
    ...state,
    objective: 'defeat-sentinel',
    locationName: 'Ruin Threshold',
    currentDialogue:
      'The pulse-glyph resonates through your gloves. A resin sentinel unfolds from the wall and bars the archive path.',
    inCombat: true,
    combat: {
      enemyName: 'Resin Sentinel',
      enemyHp: 10,
      enemyAttack: 2,
    },
    questFlags: {
      ...state.questFlags,
      ruinEntered: true,
    },
  };
}

export function attackTurn(state: GameState): GameState {
  if (!state.inCombat || !state.combat) {
    return state;
  }

  const nextEnemyHp = Math.max(0, state.combat.enemyHp - 3);

  if (nextEnemyHp === 0) {
    return {
      ...state,
      inCombat: false,
      combat: null,
      objective: 'scan-archive',
      scrap: state.scrap + 3,
      exploration: state.exploration + 1,
      currentDialogue:
        'The sentinel cracks into phosphor dust. The archive chamber beyond it pulses like a living memory organ.',
      questFlags: {
        ...state.questFlags,
        sentinelDefeated: true,
      },
    };
  }

  const nextHealth = Math.max(1, state.health - state.combat.enemyAttack);

  return {
    ...state,
    health: nextHealth,
    combat: {
      ...state.combat,
      enemyHp: nextEnemyHp,
    },
    currentDialogue: 'You strike first. The sentinel lashes back with barbed resin tendrils.',
  };
}

export function useMedgel(state: GameState): GameState {
  const medgelCount = state.inventory.medgel ?? 0;
  if (medgelCount <= 0) {
    return {
      ...state,
      currentDialogue: 'No medgel packs remain in the field kit.',
    };
  }

  if (state.health >= state.maxHealth) {
    return {
      ...state,
      currentDialogue: 'You are not injured enough to justify burning a medgel pack right now.',
    };
  }

  const healedHealth = Math.min(state.maxHealth, state.health + 4);
  const inventory = {
    ...state.inventory,
    medgel: medgelCount - 1,
  };

  if (!state.inCombat || !state.combat) {
    return {
      ...state,
      health: healedHealth,
      inventory,
      currentDialogue: 'You inject a medgel dose and your suit reports a quick surge of tissue repair.',
    };
  }

  const counteredHealth = Math.max(1, healedHealth - state.combat.enemyAttack);

  return {
    ...state,
    health: counteredHealth,
    inventory,
    currentDialogue: 'You trigger a medgel burst, but the sentinel lashes back before the sealant can fully set.',
  };
}

export function scanArchive(state: GameState): GameState {
  if (!state.questFlags.sentinelDefeated) {
    return {
      ...state,
      currentDialogue: 'The archive heart remains sealed behind the active sentinel.',
    };
  }

  if (state.questFlags.archiveScanned) {
    return {
      ...state,
      currentDialogue: 'You already copied the archive pulse. The shard in your pack still vibrates with half-translation.',
    };
  }

  return {
    ...state,
    objective: 'return-to-settlement',
    exploration: state.exploration + 1,
    inventory: {
      ...state.inventory,
      archiveShard: (state.inventory.archiveShard ?? 0) + 1,
      medgel: (state.inventory.medgel ?? 0) + 1,
    },
    discoveredSignals: [...state.discoveredSignals, 'archive-song'],
    currentDialogue:
      'The archive heart imprints a living shard into your suit memory. New patterns ripple through the translator. Bring it back to the settlement.',
    questFlags: {
      ...state.questFlags,
      archiveScanned: true,
    },
  };
}

export function returnToSettlement(state: GameState): GameState {
  if (!state.questFlags.archiveScanned) {
    return {
      ...state,
      currentDialogue: 'The guide waits for proof from the ruin. Right now you only have questions.',
    };
  }

  if (state.questFlags.settlementReturned) {
    return {
      ...state,
      currentDialogue:
        'The settlement already welcomed your return. The guide points you back into the wilds: "Now you can range farther."',
    };
  }

  return {
    ...state,
    objective: 'survive',
    scrap: state.scrap + 4,
    maxHealth: state.maxHealth + 2,
    health: state.maxHealth + 2,
    exploration: state.exploration + 1,
    survival: state.survival + 1,
    equipment: {
      ...state.equipment,
      suit: 'Survey Suit Mk.II',
    },
    currentDialogue:
      'The guide translates the archive shard and upgrades your seals. You are no longer just surviving Uberia — you are beginning to map it.',
    questFlags: {
      ...state.questFlags,
      settlementReturned: true,
    },
  };
}

export function applyOxygenTick(state: GameState, inSafeZone: boolean): GameState {
  if (inSafeZone) {
    if (state.oxygen >= state.maxOxygen) {
      return state;
    }

    const nextOxygen = Math.min(state.maxOxygen, state.oxygen + 1);

    return {
      ...state,
      oxygen: nextOxygen,
      currentDialogue:
        nextOxygen === state.maxOxygen
          ? 'Suit seals stabilize in the shelter of nearby structures.'
          : 'Your suit catches a cleaner pocket of air and rebuilds oxygen reserves.',
    };
  }

  if (state.oxygen > 0) {
    return {
      ...state,
      oxygen: Math.max(0, state.oxygen - 1),
      currentDialogue: 'The air turns sharp and unhelpful. Your suit burns through oxygen to keep the party moving.',
    };
  }

  return {
    ...state,
    health: Math.max(1, state.health - 1),
    currentDialogue: 'Oxygen reserves are empty. Your vision narrows as the suit strains to keep you alive.',
  };
}

export function setLocation(state: GameState, locationName: string): GameState {
  if (state.locationName === locationName) {
    return state;
  }

  return {
    ...state,
    locationName,
  };
}

export function exportSaveData(state: GameState): SaveData {
  return {
    scrap: state.scrap,
    inventory: state.inventory,
    equipment: state.equipment,
    discoveredSignals: state.discoveredSignals,
    objective: state.objective,
    questFlags: state.questFlags,
    party: state.party,
    health: state.health,
    maxHealth: state.maxHealth,
    oxygen: state.oxygen,
    maxOxygen: state.maxOxygen,
    exploration: state.exploration,
    survival: state.survival,
  };
}

export function hydrateState(saveData: Partial<SaveData>): GameState {
  return {
    ...createInitialState(),
    ...saveData,
    inventory: {
      ...createInitialState().inventory,
      ...(saveData.inventory ?? {}),
    },
    equipment: {
      ...createInitialState().equipment,
      ...(saveData.equipment ?? {}),
    },
    questFlags: {
      ...createInitialState().questFlags,
      ...(saveData.questFlags ?? {}),
    },
    discoveredSignals: saveData.discoveredSignals ?? [],
    party: saveData.party ?? createInitialState().party,
    currentDialogue: 'Save restored. The planet still watches.',
    inCombat: false,
    combat: null,
  };
}

export function saveState(state: GameState, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(SAVE_KEY, JSON.stringify(exportSaveData(state)));
}

export function loadState(storage: Pick<Storage, 'getItem'> = localStorage): GameState | null {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return hydrateState(JSON.parse(raw) as Partial<SaveData>);
  } catch {
    return null;
  }
}
