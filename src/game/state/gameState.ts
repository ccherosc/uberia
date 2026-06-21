export type Objective =
  | 'collect-sample'
  | 'talk-to-settlement'
  | 'enter-ruin'
  | 'defeat-sentinel'
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
    npcSpokenTo: boolean;
    ruinEntered: boolean;
    sentinelDefeated: boolean;
  };
  party: string[];
  health: number;
  maxHealth: number;
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
    scrap: 0,
    inventory: {
      sample: 0,
      medgel: 1,
    },
    equipment: {
      tool: 'Salvage Cutter',
      suit: 'Survey Suit Mk.I',
    },
    discoveredSignals: [],
    objective: 'collect-sample',
    questFlags: {
      resourceCollected: false,
      npcSpokenTo: false,
      ruinEntered: false,
      sentinelDefeated: false,
    },
    party: ['Aryn', 'Vera', 'Kesh'],
    health: 12,
    maxHealth: 12,
    exploration: 0,
    survival: 0,
    locationName: 'Crash Site',
    currentDialogue:
      'Suit pressure stabilizing. The air tastes metallic through the filters. Find something useful before the dark moves closer.',
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
      fiber: (state.inventory.fiber ?? 0) + 2,
    },
    objective: 'talk-to-settlement',
    survival: state.survival + 1,
    currentDialogue:
      'You cut loose a humming sample cluster. Your scanner translates nothing, but your party marks it as useful.',
    questFlags: {
      ...state.questFlags,
      resourceCollected: true,
    },
  };
}

export function talkToSettlementGuide(state: GameState): GameState {
  if (!state.questFlags.resourceCollected) {
    return {
      ...state,
      currentDialogue:
        'A settlement watcher studies your suit. A companion whispers: "Bring them proof you can survive this place first."',
    };
  }

  if (state.questFlags.npcSpokenTo) {
    return {
      ...state,
      currentDialogue:
        'The mixed settlement guide presses two fingers to a glowing membrane: "The ruin listens now. Go carefully."',
    };
  }

  return {
    ...state,
    objective: 'enter-ruin',
    exploration: state.exploration + 1,
    discoveredSignals: [...state.discoveredSignals, 'pulse-glyph'],
    currentDialogue:
      'A human scout and an alien speaker share a cracked translator shard. You learn one fragile concept: pulse-glyph. It may open the ruin.',
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
      currentDialogue:
        'The ruin membrane recoils from your touch. Without context, the symbols mean nothing.',
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
      'The pulse-glyph resonates through your gloves. A sentinel shape unfolds from the wall and blocks the path.',
    inCombat: true,
    combat: {
      enemyName: 'Resin Sentinel',
      enemyHp: 8,
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
      objective: 'survive',
      scrap: state.scrap + 3,
      exploration: state.exploration + 1,
      currentDialogue:
        'The sentinel cracks apart into phosphor dust. Beyond it, the ruin begins to answer in half-formed meanings.',
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
    currentDialogue:
      'You strike first. The sentinel lashes back with barbed resin tendrils.',
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
