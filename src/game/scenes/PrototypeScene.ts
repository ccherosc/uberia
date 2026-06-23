import Phaser from 'phaser';
import {
  applyOxygenTick,
  attackTurn,
  collectFiber,
  collectSample,
  createInitialState,
  enterRuin,
  loadState,
  returnToSettlement,
  saveState,
  scanArchive,
  setLocation,
  stabilizeBeacon,
  type GameState,
  talkToSettlementGuide,
} from '../state/gameState';
import { GAME_HEIGHT, GAME_WIDTH } from '../dimensions';

type PointOfInterestId = 'sample' | 'fiber' | 'beacon' | 'guide' | 'ruin' | 'archive';

type PointOfInterest = {
  id: PointOfInterestId;
  tileX: number;
  tileY: number;
  label: string;
  locationName: string;
  texture: string;
  scale?: number;
};

type TileKey = 'crash-ground' | 'flats-ground' | 'beacon-ground' | 'settlement-ground' | 'ruin-ground';

type TileCoord = { x: number; y: number };

const TILE_SIZE = 32;
const MAP_COLUMNS = 22;
const MAP_ROWS = 14;
const MAP_WIDTH = MAP_COLUMNS * TILE_SIZE;
const MAP_HEIGHT = MAP_ROWS * TILE_SIZE;
const SIDEBAR_X = MAP_WIDTH + 16;
const SIDEBAR_WIDTH = GAME_WIDTH - MAP_WIDTH - 32;
const FOOTER_Y = MAP_HEIGHT + 12;
const FOOTER_HEIGHT = GAME_HEIGHT - FOOTER_Y - 12;
const STEP_SPEED = 180;
const INTERACT_DISTANCE = 1.25;
const OXYGEN_TICK_MS = 1000;
const START_TILE: TileCoord = { x: 2, y: 10 };

const OBJECTIVE_TEXT: Record<GameState['objective'], string> = {
  'collect-sample': 'Harvest a humming sample cluster in the flats.',
  'collect-fiber': 'Cut sky-fiber from the reed bed for field repairs.',
  'stabilize-beacon': 'Use the sample and fiber at the dead field beacon.',
  'talk-to-settlement': 'Reach the mixed settlement and speak to the guide.',
  'enter-ruin': 'Carry the pulse-glyph east to open the ruin gate.',
  'defeat-sentinel': 'Defeat the resin sentinel blocking the archive path.',
  'scan-archive': 'Touch the archive heart and copy its living memory.',
  'return-to-settlement': 'Return the archive shard to the settlement guide.',
  survive: 'Range farther, save often, and keep exploring Uberia.',
};

const POINTS_OF_INTEREST: PointOfInterest[] = [
  {
    id: 'sample',
    tileX: 5,
    tileY: 6,
    label: 'sample cluster',
    locationName: 'Whispering Flats',
    texture: 'sample-cluster',
    scale: 1.2,
  },
  {
    id: 'fiber',
    tileX: 8,
    tileY: 10,
    label: 'sky-fiber reed bed',
    locationName: 'Whispering Flats',
    texture: 'fiber-reeds',
    scale: 1.15,
  },
  {
    id: 'beacon',
    tileX: 10,
    tileY: 5,
    label: 'field beacon',
    locationName: 'Beacon Shelf',
    texture: 'field-beacon',
    scale: 1.25,
  },
  {
    id: 'guide',
    tileX: 14,
    tileY: 8,
    label: 'settlement guide',
    locationName: 'Mixed Settlement',
    texture: 'settlement-guide',
    scale: 1.2,
  },
  {
    id: 'ruin',
    tileX: 18,
    tileY: 7,
    label: 'resin ruin gate',
    locationName: 'Ruin Threshold',
    texture: 'ruin-gate',
    scale: 1.5,
  },
  {
    id: 'archive',
    tileX: 20,
    tileY: 4,
    label: 'archive heart',
    locationName: 'Archive Chamber',
    texture: 'archive-heart',
    scale: 1.25,
  },
];

const BLOCKED_TILES = new Set<string>([
  '0,0',
  '1,0',
  '2,0',
  '3,0',
  '0,1',
  '1,1',
  '0,2',
  '17,3',
  '18,3',
  '19,3',
  '17,4',
  '19,4',
  '17,5',
  '18,5',
  '19,5',
  '12,6',
  '13,6',
  '14,6',
  '15,6',
  '12,7',
  '15,7',
  '12,8',
  '15,8',
  '12,9',
  '13,9',
  '15,9',
]);

export class PrototypeScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D' | 'E' | 'SPACE' | 'K' | 'L', Phaser.Input.Keyboard.Key>;
  private player!: Phaser.GameObjects.Image;
  private state: GameState = createInitialState();
  private hudText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private combatText!: Phaser.GameObjects.Text;
  private moveText!: Phaser.GameObjects.Text;
  private oxygenTickElapsed = 0;
  private moveQueue: TileCoord[] = [];
  private activeTarget: TileCoord | null = null;

  constructor() {
    super('PrototypeScene');
  }

  create(): void {
    this.buildPlaceholderTextures();
    const restored = loadState();
    if (restored) {
      this.state = restored;
    }

    this.drawWorld();
    this.player = this.add.image(this.tileCenterX(START_TILE.x), this.tileCenterY(START_TILE.y), 'player-party').setScale(1.5).setDepth(5);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE,K,L') as typeof this.wasd;

    this.hudText = this.add.text(16, 16, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#d6f7ff',
      wordWrap: { width: 320 },
    }).setDepth(10);

    this.promptText = this.add.text(SIDEBAR_X, 16, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffe39c',
      wordWrap: { width: SIDEBAR_WIDTH },
    }).setDepth(10);

    this.combatText = this.add.text(SIDEBAR_X, 286, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffb5a8',
      wordWrap: { width: SIDEBAR_WIDTH },
    }).setDepth(10);

    this.moveText = this.add.text(620, FOOTER_Y, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#a9f7ff',
      wordWrap: { width: 300 },
    }).setDepth(10);

    this.dialogueText = this.add.text(16, FOOTER_Y, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#d4f7df',
      wordWrap: { width: 580 },
    }).setDepth(10);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.worldX < 0 || pointer.worldY < 0 || pointer.worldX >= MAP_WIDTH || pointer.worldY >= MAP_HEIGHT) {
        return;
      }

      const target = this.snapPointerToTile(pointer.worldX, pointer.worldY);
      this.setMovePathTo(target);
    });

    if (restored) {
      const restoredTile = this.findSpawnTileForLocation(restored.locationName);
      this.player.setPosition(this.tileCenterX(restoredTile.x), this.tileCenterY(restoredTile.y));
    }

    this.refreshUi();
  }

  update(_time: number, delta: number): void {
    if (!this.state.inCombat) {
      this.handleKeyboardStepInput();
      this.updateQueuedMovement(delta);
    }

    this.updateLocationFromPosition();
    this.applyOxygenPressure(delta);
    this.handleActions();
    this.refreshUi();
  }

  private drawWorld(): void {
    this.add.rectangle(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, 0x081218).setStrokeStyle(2, 0x22404f, 1).setDepth(-2);
    this.add.rectangle(SIDEBAR_X - 8 + SIDEBAR_WIDTH / 2, GAME_HEIGHT / 2, SIDEBAR_WIDTH + 16, GAME_HEIGHT - 24, 0x071117)
      .setStrokeStyle(2, 0x2f5563, 1)
      .setDepth(-2);
    this.add.rectangle(GAME_WIDTH / 2, FOOTER_Y + FOOTER_HEIGHT / 2, GAME_WIDTH - 24, FOOTER_HEIGHT, 0x071117)
      .setStrokeStyle(2, 0x2f5563, 1)
      .setDepth(-2);

    for (let y = 0; y < MAP_ROWS; y += 1) {
      for (let x = 0; x < MAP_COLUMNS; x += 1) {
        const worldX = this.tileCenterX(x);
        const worldY = this.tileCenterY(y);
        this.add.image(worldX, worldY, this.getTileKey(x, y)).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(0);
      }
    }

    this.drawBlockedStructures();
    this.drawZoneAccent(5, 10, 5, 3, 0x14232a, 0x4f7380);
    this.drawZoneAccent(10, 5, 3, 3, 0x0c2e31, 0x5fe2ef);
    this.drawZoneAccent(14, 8, 5, 4, 0x5e4b25, 0xd5c18f);
    this.drawZoneAccent(19, 5, 4, 5, 0x2a1436, 0xd0a3ff);

    for (const poi of POINTS_OF_INTEREST) {
      this.add
        .image(this.tileCenterX(poi.tileX), this.tileCenterY(poi.tileY), poi.texture)
        .setScale(poi.scale ?? 1)
        .setDepth(4)
        .setAlpha(0.98);
    }

    this.addLabel(1, 12, 'Crash Site');
    this.addLabel(4, 3, 'Whispering Flats');
    this.addLabel(9, 3, 'Beacon Shelf');
    this.addLabel(13, 4, 'Mixed Settlement');
    this.addLabel(17, 1, 'Resin Ruin');
    this.addLabel(19, 2, 'Archive');
  }

  private addLabel(tileX: number, tileY: number, text: string): void {
    this.add.text(this.tileCenterX(tileX) - 28, this.tileCenterY(tileY) - 22, text, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#d6f7ff',
      backgroundColor: '#091318',
      padding: { x: 4, y: 2 },
    }).setDepth(6);
  }

  private drawBlockedStructures(): void {
    const graphics = this.add.graphics().setDepth(2);
    graphics.fillStyle(0x0d1d23, 0.95);

    // Crash rubble.
    graphics.fillRect(0, 0, 128, 96);
    // Settlement walls.
    graphics.fillRect(this.tileCenterX(12) - 16, this.tileCenterY(6) - 16, 128, 128);
    graphics.fillRect(this.tileCenterX(13) - 16, this.tileCenterY(7) - 16, 64, 64);
    // Archive growth columns.
    graphics.fillRect(this.tileCenterX(17) - 16, this.tileCenterY(3) - 16, 96, 96);

    graphics.lineStyle(2, 0x81c6d6, 0.5);
    for (let x = 0; x <= MAP_COLUMNS; x += 1) {
      graphics.moveTo(x * TILE_SIZE, 0);
      graphics.lineTo(x * TILE_SIZE, MAP_HEIGHT);
    }
    for (let y = 0; y <= MAP_ROWS; y += 1) {
      graphics.moveTo(0, y * TILE_SIZE);
      graphics.lineTo(MAP_WIDTH, y * TILE_SIZE);
    }
    graphics.strokePath();
  }

  private getTileKey(tileX: number, tileY: number): TileKey {
    if (tileX <= 3 || tileY >= 11 && tileX <= 5) {
      return 'crash-ground';
    }

    if (tileX >= 17) {
      return 'ruin-ground';
    }

    if (tileX >= 12 && tileX <= 15 && tileY >= 5 && tileY <= 10) {
      return 'settlement-ground';
    }

    if (tileX >= 9 && tileX <= 11 && tileY >= 3 && tileY <= 7) {
      return 'beacon-ground';
    }

    return 'flats-ground';
  }

  private drawZoneAccent(tileX: number, tileY: number, widthTiles: number, heightTiles: number, fillColor: number, strokeColor: number): void {
    const graphics = this.add.graphics().setDepth(1);
    graphics.fillStyle(fillColor, 0.45);
    graphics.lineStyle(2, strokeColor, 0.8);
    graphics.fillRoundedRect(
      this.tileCenterX(tileX) - (widthTiles * TILE_SIZE) / 2,
      this.tileCenterY(tileY) - (heightTiles * TILE_SIZE) / 2,
      widthTiles * TILE_SIZE,
      heightTiles * TILE_SIZE,
      10,
    );
    graphics.strokeRoundedRect(
      this.tileCenterX(tileX) - (widthTiles * TILE_SIZE) / 2,
      this.tileCenterY(tileY) - (heightTiles * TILE_SIZE) / 2,
      widthTiles * TILE_SIZE,
      heightTiles * TILE_SIZE,
      10,
    );
  }

  private buildPlaceholderTextures(): void {
    this.paintTexture('crash-ground', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x20353b, 1).fillRect(0, 0, 32, 32);
      graphics.fillStyle(0x17292e, 1).fillRect(0, 24, 32, 8);
      graphics.fillStyle(0x46626b, 1).fillRect(3, 4, 6, 6);
      graphics.fillStyle(0x68858f, 1).fillRect(12, 8, 5, 5);
      graphics.fillStyle(0x324b53, 1).fillRect(20, 5, 7, 7);
      graphics.fillStyle(0x8fa7ad, 1).fillRect(6, 18, 5, 5);
      graphics.fillStyle(0x556c73, 1).fillRect(17, 19, 9, 4);
      graphics.fillStyle(0x9db4bb, 1).fillRect(27, 14, 3, 3);
    });

    this.paintTexture('flats-ground', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x173f36, 1).fillRect(0, 0, 32, 32);
      graphics.fillStyle(0x0f2f28, 1).fillRect(0, 24, 32, 8);
      graphics.fillStyle(0x67dca8, 1).fillRect(5, 4, 4, 12);
      graphics.fillStyle(0x8ef0bd, 1).fillRect(3, 7, 8, 3);
      graphics.fillStyle(0x2b5d53, 1).fillRect(14, 9, 6, 10);
      graphics.fillStyle(0x59c98f, 1).fillRect(13, 12, 8, 3);
      graphics.fillStyle(0x84ffcf, 1).fillRect(23, 5, 4, 11);
      graphics.fillStyle(0x235247, 1).fillRect(10, 20, 6, 4);
      graphics.fillStyle(0x296157, 1).fillRect(20, 20, 7, 4);
    });

    this.paintTexture('beacon-ground', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x123b40, 1).fillRect(0, 0, 32, 32);
      graphics.fillStyle(0x0b2428, 1).fillRect(0, 24, 32, 8);
      graphics.fillStyle(0x56dce8, 1).fillRect(5, 5, 5, 14);
      graphics.fillStyle(0x9cf9ff, 1).fillRect(12, 3, 8, 18);
      graphics.fillStyle(0x1b6870, 1).fillRect(22, 7, 5, 12);
      graphics.fillStyle(0x6cecf5, 1).fillRect(4, 22, 24, 3);
    });

    this.paintTexture('settlement-ground', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x7f6a39, 1).fillRect(0, 0, 32, 32);
      graphics.fillStyle(0x5d4b28, 1).fillRect(0, 24, 32, 8);
      graphics.fillStyle(0xd6c18f, 1).fillRect(2, 6, 10, 10);
      graphics.fillStyle(0xa98d56, 1).fillRect(4, 8, 6, 6);
      graphics.fillStyle(0x4f8f96, 1).fillRect(15, 4, 13, 12);
      graphics.fillStyle(0xbdeff3, 1).fillRect(17, 6, 9, 8);
      graphics.fillStyle(0x8c7440, 1).fillRect(6, 20, 8, 4);
      graphics.fillStyle(0x3c2f18, 1).fillRect(19, 19, 7, 5);
    });

    this.paintTexture('ruin-ground', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x2b1834, 1).fillRect(0, 0, 32, 32);
      graphics.fillStyle(0x1a0e20, 1).fillRect(0, 24, 32, 8);
      graphics.fillStyle(0x6b3d79, 1).fillRect(4, 4, 8, 8);
      graphics.fillStyle(0x9f6dd2, 1).fillRect(16, 5, 10, 9);
      graphics.fillStyle(0x402047, 1).fillRect(7, 15, 5, 5);
      graphics.fillStyle(0x4d2559, 1).fillRect(15, 16, 12, 5);
      graphics.fillStyle(0xd59cff, 1).fillRect(3, 22, 6, 2);
      graphics.fillStyle(0xbf87f2, 1).fillRect(12, 22, 5, 2);
      graphics.fillStyle(0xefb5ff, 1).fillRect(22, 21, 6, 3);
    });

    this.paintTexture('sample-cluster', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x2f6d56, 1).fillRect(13, 3, 6, 20);
      graphics.fillStyle(0x63f1b0, 1).fillRect(9, 6, 14, 6);
      graphics.fillStyle(0x7ff7bf, 1).fillRect(7, 11, 18, 5);
      graphics.fillStyle(0xd5fff1, 1).fillRect(12, 24, 8, 5);
    });

    this.paintTexture('fiber-reeds', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x6ff2c0, 1).fillRect(6, 7, 2, 18);
      graphics.fillStyle(0x9dfdd5, 1).fillRect(11, 3, 2, 22);
      graphics.fillStyle(0x6ff2c0, 1).fillRect(16, 8, 2, 17);
      graphics.fillStyle(0xcffff1, 1).fillRect(20, 5, 2, 20);
      graphics.fillStyle(0x2b5d53, 1).fillRect(5, 24, 18, 3);
    });

    this.paintTexture('field-beacon', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x25464a, 1).fillRect(12, 5, 8, 21);
      graphics.fillStyle(0x72f3ff, 1).fillRect(9, 7, 14, 6);
      graphics.fillStyle(0xe4ffff, 1).fillRect(13, 3, 6, 4);
      graphics.fillStyle(0x7fe7f2, 1).fillRect(8, 18, 16, 5);
    });

    this.paintTexture('settlement-guide', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0xffe6b4, 1).fillRect(13, 5, 6, 7);
      graphics.fillStyle(0xf0c87f, 1).fillRect(11, 12, 10, 8);
      graphics.fillStyle(0x6d5450, 1).fillRect(9, 20, 14, 8);
      graphics.fillStyle(0x8de5f2, 1).fillRect(8, 16, 4, 9);
      graphics.fillStyle(0x8de5f2, 1).fillRect(20, 16, 4, 9);
    });

    this.paintTexture('ruin-gate', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x442251, 1).fillRect(8, 4, 16, 24);
      graphics.fillStyle(0x7b3f96, 1).fillRect(10, 6, 12, 20);
      graphics.fillStyle(0xffd6ff, 1).fillRect(13, 9, 6, 4);
      graphics.fillStyle(0xf58ebd, 1).fillRect(12, 16, 8, 7);
    });

    this.paintTexture('archive-heart', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x3e1c50, 1).fillRect(9, 4, 14, 22);
      graphics.fillStyle(0xc08cff, 1).fillRect(11, 7, 10, 16);
      graphics.fillStyle(0xf0d5ff, 1).fillRect(13, 10, 6, 10);
      graphics.fillStyle(0x79f4ff, 1).fillRect(7, 13, 4, 4);
      graphics.fillStyle(0x79f4ff, 1).fillRect(21, 13, 4, 4);
    });

    this.paintTexture('player-party', 24, 24, (graphics) => {
      graphics.fillStyle(0xcbf7ff, 1).fillRect(8, 2, 8, 5);
      graphics.fillStyle(0x57bfd8, 1).fillRect(6, 7, 12, 8);
      graphics.fillStyle(0x7ce9ff, 1).fillRect(4, 15, 6, 7);
      graphics.fillStyle(0x7ce9ff, 1).fillRect(14, 15, 6, 7);
      graphics.fillStyle(0x0a2c35, 1).fillRect(8, 8, 2, 2);
      graphics.fillStyle(0x0a2c35, 1).fillRect(14, 8, 2, 2);
    });
  }

  private paintTexture(
    key: string,
    width: number,
    height: number,
    painter: (graphics: Phaser.GameObjects.Graphics) => void,
  ): void {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    painter(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private handleKeyboardStepInput(): void {
    if (this.activeTarget || this.moveQueue.length > 0) {
      return;
    }

    const current = this.getCurrentTile();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasd.A)) {
      this.setMovePathTo({ x: current.x - 1, y: current.y });
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasd.D)) {
      this.setMovePathTo({ x: current.x + 1, y: current.y });
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.W)) {
      this.setMovePathTo({ x: current.x, y: current.y - 1 });
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasd.S)) {
      this.setMovePathTo({ x: current.x, y: current.y + 1 });
    }
  }

  private setMovePathTo(target: TileCoord): void {
    if (!this.isWalkable(target.x, target.y)) {
      this.state = {
        ...this.state,
        currentDialogue: 'That tile is blocked by wreckage, settlement walls, or living ruin growth.',
      };
      return;
    }

    const current = this.getCurrentTile();
    const path = this.buildPath(current, target);
    if (path.length === 0) {
      return;
    }

    this.moveQueue = path;
    this.activeTarget = this.moveQueue.shift() ?? null;
  }

  private buildPath(start: TileCoord, end: TileCoord): TileCoord[] {
    const path: TileCoord[] = [];
    let cursor = { ...start };

    while (cursor.x !== end.x) {
      cursor = { ...cursor, x: cursor.x + Math.sign(end.x - cursor.x) };
      if (!this.isWalkable(cursor.x, cursor.y)) {
        return [];
      }
      path.push({ ...cursor });
    }

    while (cursor.y !== end.y) {
      cursor = { ...cursor, y: cursor.y + Math.sign(end.y - cursor.y) };
      if (!this.isWalkable(cursor.x, cursor.y)) {
        return [];
      }
      path.push({ ...cursor });
    }

    return path;
  }

  private updateQueuedMovement(delta: number): void {
    if (!this.activeTarget) {
      return;
    }

    const targetX = this.tileCenterX(this.activeTarget.x);
    const targetY = this.tileCenterY(this.activeTarget.y);
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    const step = (STEP_SPEED * delta) / 1000;

    if (distance <= step) {
      this.player.setPosition(targetX, targetY);
      this.activeTarget = this.moveQueue.shift() ?? null;
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    this.player.x += Math.cos(angle) * step;
    this.player.y += Math.sin(angle) * step;
  }

  private updateLocationFromPosition(): void {
    const tile = this.getCurrentTile();
    let location = 'Crash Site';

    if (tile.x >= 19 && tile.y <= 6) {
      location = 'Archive Chamber';
    } else if (tile.x >= 17) {
      location = this.state.questFlags.ruinEntered ? 'Ruin Threshold' : 'Ruin Approach';
    } else if (tile.x >= 12 && tile.x <= 15 && tile.y >= 5 && tile.y <= 10) {
      location = 'Mixed Settlement';
    } else if (tile.x >= 9 && tile.x <= 11 && tile.y >= 3 && tile.y <= 7) {
      location = 'Beacon Shelf';
    } else if (tile.x >= 4) {
      location = 'Whispering Flats';
    }

    this.state = setLocation(this.state, location);
  }

  private applyOxygenPressure(delta: number): void {
    this.oxygenTickElapsed += delta;

    while (this.oxygenTickElapsed >= OXYGEN_TICK_MS) {
      this.oxygenTickElapsed -= OXYGEN_TICK_MS;
      this.state = applyOxygenTick(this.state, this.isSafeOxygenZone());
    }
  }

  private isSafeOxygenZone(): boolean {
    const tile = this.getCurrentTile();
    const inBeaconPocket = this.state.questFlags.beaconStabilized && Phaser.Math.Distance.Between(tile.x, tile.y, 10, 5) <= 1.5;
    return this.state.locationName === 'Crash Site' || this.state.locationName === 'Mixed Settlement' || inBeaconPocket;
  }

  private handleActions(): void {
    if (Phaser.Input.Keyboard.JustDown(this.wasd.K)) {
      saveState(this.state);
      this.state = {
        ...this.state,
        currentDialogue: 'Suit log saved. The planet will remember where you stood.',
      };
    }

    if (Phaser.Input.Keyboard.JustDown(this.wasd.L)) {
      const restored = loadState();
      if (restored) {
        this.state = restored;
        const restoredTile = this.findSpawnTileForLocation(restored.locationName);
        this.player.setPosition(this.tileCenterX(restoredTile.x), this.tileCenterY(restoredTile.y));
        this.moveQueue = [];
        this.activeTarget = null;
      } else {
        this.state = {
          ...this.state,
          currentDialogue: 'No save signal found.',
        };
      }
    }

    const interactPressed = Phaser.Input.Keyboard.JustDown(this.wasd.E) || Phaser.Input.Keyboard.JustDown(this.wasd.SPACE);

    if (!interactPressed) {
      return;
    }

    if (this.state.inCombat) {
      this.state = attackTurn(this.state);
      return;
    }

    const poi = this.findNearbyPoint();
    if (!poi) {
      this.state = {
        ...this.state,
        currentDialogue: 'Only the suit fans answer. Nothing here reacts to you.',
      };
      return;
    }

    switch (poi.id) {
      case 'sample':
        this.state = collectSample(this.state);
        break;
      case 'fiber':
        this.state = collectFiber(this.state);
        break;
      case 'beacon':
        this.state = stabilizeBeacon(this.state);
        break;
      case 'guide':
        this.state = this.state.questFlags.archiveScanned ? returnToSettlement(this.state) : talkToSettlementGuide(this.state);
        break;
      case 'ruin':
        this.state = enterRuin(this.state);
        break;
      case 'archive':
        this.state = scanArchive(this.state);
        break;
    }
  }

  private findNearbyPoint(): PointOfInterest | null {
    const tile = this.getCurrentTile();
    return (
      POINTS_OF_INTEREST.find((poi) => Phaser.Math.Distance.Between(tile.x, tile.y, poi.tileX, poi.tileY) <= INTERACT_DISTANCE) ?? null
    );
  }

  private refreshUi(): void {
    const nearby = this.findNearbyPoint();
    const tile = this.getCurrentTile();
    const sampleCount = this.state.inventory.sample ?? 0;
    const fiberCount = this.state.inventory.fiber ?? 0;
    const archiveShardCount = this.state.inventory.archiveShard ?? 0;

    this.hudText.setText([
      'UBERIA // survival prototype',
      `Location: ${this.state.locationName}`,
      `Tile: ${tile.x}, ${tile.y}`,
      `HP: ${this.state.health}/${this.state.maxHealth}`,
      `O2: ${this.state.oxygen}/${this.state.maxOxygen}`,
      `Scrap: ${this.state.scrap}`,
      `Inventory: sample ${sampleCount}, fiber ${fiberCount}, medgel ${this.state.inventory.medgel ?? 0}, shard ${archiveShardCount}`,
      `Suit: ${this.state.equipment.suit}`,
      `Tool: ${this.state.equipment.tool}`,
      `Party: ${this.state.party.join(', ')}`,
      `Signals: ${this.state.discoveredSignals.length > 0 ? this.state.discoveredSignals.join(', ') : 'none'}`,
      `Progress: exploration ${this.state.exploration} / survival ${this.state.survival}`,
    ]);

    this.promptText.setText([
      'Mission',
      OBJECTIVE_TEXT[this.state.objective],
      '',
      nearby ? `Nearby: ${nearby.label}` : 'Nearby: nothing interactable',
      nearby ? 'E / SPACE = interact' : 'Click a tile or tap a key to move one grid step',
      this.isSafeOxygenZone() ? 'Air pocket: oxygen refills here' : 'Hostile air: oxygen drains here',
      'K = save, L = load',
    ]);

    this.combatText.setText(
      this.state.inCombat && this.state.combat
        ? [
            `Combat: ${this.state.combat.enemyName}`,
            `Enemy HP: ${this.state.combat.enemyHp}`,
            'Press E or SPACE to strike',
            'The fight is turn-based: one hit for you, one for it.',
          ].join('\n')
        : [
            'Quest route',
            '1. harvest sample',
            '2. gather fiber',
            '3. stabilize beacon',
            '4. speak to guide',
            '5. open ruin',
            '6. defeat sentinel',
            '7. scan archive',
            '8. return to settlement',
          ].join('\n'),
    );

    this.moveText.setText([
      'What you can do now',
      '- click tiles to move one square at a time',
      '- WASD / arrows = single-tile nudges',
      '- gather sample + fiber',
      '- repair the beacon for safe air',
      '- talk to the settlement guide',
      '- fight the ruin sentinel',
      '- save/load your run',
    ].join('\n'));

    this.dialogueText.setText(`Log: ${this.state.currentDialogue}`);
  }

  private getCurrentTile(): TileCoord {
    return {
      x: Phaser.Math.Clamp(Math.round((this.player.x - TILE_SIZE / 2) / TILE_SIZE), 0, MAP_COLUMNS - 1),
      y: Phaser.Math.Clamp(Math.round((this.player.y - TILE_SIZE / 2) / TILE_SIZE), 0, MAP_ROWS - 1),
    };
  }

  private snapPointerToTile(worldX: number, worldY: number): TileCoord {
    return {
      x: Phaser.Math.Clamp(Math.floor(worldX / TILE_SIZE), 0, MAP_COLUMNS - 1),
      y: Phaser.Math.Clamp(Math.floor(worldY / TILE_SIZE), 0, MAP_ROWS - 1),
    };
  }

  private isWalkable(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileY < 0 || tileX >= MAP_COLUMNS || tileY >= MAP_ROWS) {
      return false;
    }

    return !BLOCKED_TILES.has(`${tileX},${tileY}`);
  }

  private tileCenterX(tileX: number): number {
    return tileX * TILE_SIZE + TILE_SIZE / 2;
  }

  private tileCenterY(tileY: number): number {
    return tileY * TILE_SIZE + TILE_SIZE / 2;
  }

  private findSpawnTileForLocation(locationName: string): TileCoord {
    if (locationName === 'Archive Chamber') {
      return { x: 20, y: 4 };
    }
    if (locationName === 'Ruin Threshold' || locationName === 'Ruin Approach') {
      return { x: 18, y: 7 };
    }
    if (locationName === 'Mixed Settlement') {
      return { x: 14, y: 8 };
    }
    if (locationName === 'Beacon Shelf') {
      return { x: 10, y: 5 };
    }
    if (locationName === 'Whispering Flats') {
      return { x: 6, y: 8 };
    }
    return START_TILE;
  }
}
