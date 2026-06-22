import Phaser from 'phaser';
import {
  applyOxygenTick,
  attackTurn,
  collectSample,
  createInitialState,
  enterRuin,
  loadState,
  saveState,
  setLocation,
  type GameState,
  talkToSettlementGuide,
} from '../state/gameState';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

type PointOfInterest = {
  id: 'resource' | 'npc' | 'ruin';
  x: number;
  y: number;
  radius: number;
  label: string;
  locationName: string;
  texture: 'sample-cluster' | 'settlement-guide' | 'ruin-gate';
  scale: number;
};

type TileKey = 'crash-ground' | 'flats-ground' | 'settlement-ground' | 'ruin-ground';

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;
const MOVEMENT_SPEED = 180;
const INTERACT_DISTANCE = 38;
const UI_FOOTER_HEIGHT = 150;
const OXYGEN_TICK_MS = 1000;

const POINTS_OF_INTEREST: PointOfInterest[] = [
  {
    id: 'resource',
    x: 240,
    y: 224,
    radius: 18,
    label: 'sample cluster',
    locationName: 'Whispering Flats',
    texture: 'sample-cluster',
    scale: 1.2,
  },
  {
    id: 'npc',
    x: 496,
    y: 208,
    radius: 18,
    label: 'settlement guide',
    locationName: 'Mixed Settlement',
    texture: 'settlement-guide',
    scale: 1.2,
  },
  {
    id: 'ruin',
    x: 752,
    y: 208,
    radius: 22,
    label: 'resin ruin',
    locationName: 'Ruin Threshold',
    texture: 'ruin-gate',
    scale: 1.5,
  },
];

export class PrototypeScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D' | 'E' | 'SPACE' | 'K' | 'L', Phaser.Input.Keyboard.Key>;
  private player!: Phaser.GameObjects.Image;
  private state: GameState = createInitialState();
  private hudText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private combatText!: Phaser.GameObjects.Text;
  private oxygenTickElapsed = 0;

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
    this.player = this.add.image(96, 320, 'player-party').setScale(1.5).setDepth(4);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE,K,L') as typeof this.wasd;

    this.hudText = this.add.text(16, 16, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#d6f7ff',
      wordWrap: { width: 300 },
    }).setDepth(10);

    this.dialogueText = this.add.text(16, GAME_HEIGHT - 132, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#d4f7df',
      wordWrap: { width: GAME_WIDTH - 32 },
    }).setDepth(10);

    this.promptText = this.add.text(GAME_WIDTH - 292, 16, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffe39c',
      wordWrap: { width: 276 },
      align: 'right',
    }).setOrigin(0, 0).setDepth(10);

    this.combatText = this.add.text(GAME_WIDTH - 292, 168, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffb5a8',
      wordWrap: { width: 276 },
      align: 'right',
    }).setOrigin(0, 0).setDepth(10);

    this.refreshUi();
  }

  update(_time: number, delta: number): void {
    const speed = (MOVEMENT_SPEED * delta) / 1000;

    if (!this.state.inCombat) {
      this.updateMovement(speed);
    }

    this.updateLocationFromPosition();
    this.applyOxygenPressure(delta);
    this.handleActions();
    this.refreshUi();
  }

  private drawWorld(): void {
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const worldX = x * TILE_SIZE + TILE_SIZE / 2;
        const worldY = y * TILE_SIZE + TILE_SIZE / 2;
        this.add.image(worldX, worldY, this.getTileKeyForColumn(x)).setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(0);
      }
    }

    this.drawZoneAccent(96, 176, 96, 96, 0x152126, 0x44626b);
    this.drawZoneAccent(496, 192, 160, 128, 0x54421f, 0xd3bf8f);
    this.drawZoneAccent(752, 192, 128, 192, 0x31163f, 0xb884e6);

    for (const poi of POINTS_OF_INTEREST) {
      this.add
        .image(poi.x, poi.y, poi.texture)
        .setScale(poi.scale)
        .setDepth(3)
        .setAlpha(0.98);
    }

    this.add.text(56, 96, 'Crash Site', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d6f7ff',
      backgroundColor: '#091318',
      padding: { x: 4, y: 2 },
    }).setDepth(5);
    this.add.text(420, 96, 'Mixed Settlement', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d6f7ff',
      backgroundColor: '#091318',
      padding: { x: 4, y: 2 },
    }).setDepth(5);
    this.add.text(704, 64, 'Ruin', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d6f7ff',
      backgroundColor: '#091318',
      padding: { x: 4, y: 2 },
    }).setDepth(5);
  }

  private getTileKeyForColumn(x: number): TileKey {
    if (x < 8) {
      return 'crash-ground';
    }

    if (x < 17) {
      return 'flats-ground';
    }

    if (x < 21) {
      return 'settlement-ground';
    }

    return 'ruin-ground';
  }

  private drawZoneAccent(centerX: number, centerY: number, width: number, height: number, fillColor: number, strokeColor: number): void {
    const graphics = this.add.graphics().setDepth(1);
    graphics.fillStyle(fillColor, 0.55);
    graphics.lineStyle(2, strokeColor, 0.8);
    graphics.fillRoundedRect(centerX - width / 2, centerY - height / 2, width, height, 10);
    graphics.strokeRoundedRect(centerX - width / 2, centerY - height / 2, width, height, 10);
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
      graphics.fillStyle(0x35505a, 1).fillRect(0, 0, 32, 1);
      graphics.fillStyle(0x0f1a1e, 1).fillRect(0, 31, 32, 1);
    });

    this.paintTexture('flats-ground', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x173f36, 1).fillRect(0, 0, 32, 32);
      graphics.fillStyle(0x0f2f28, 1).fillRect(0, 24, 32, 8);
      graphics.fillStyle(0x67dca8, 1).fillRect(5, 4, 4, 12);
      graphics.fillStyle(0x8ef0bd, 1).fillRect(3, 7, 8, 3);
      graphics.fillStyle(0x2b5d53, 1).fillRect(14, 9, 6, 10);
      graphics.fillStyle(0x59c98f, 1).fillRect(13, 12, 8, 3);
      graphics.fillStyle(0x84ffcf, 1).fillRect(23, 5, 4, 11);
      graphics.fillStyle(0x53b986, 1).fillRect(21, 7, 8, 3);
      graphics.fillStyle(0x235247, 1).fillRect(10, 20, 6, 4);
      graphics.fillStyle(0x296157, 1).fillRect(20, 20, 7, 4);
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
      graphics.fillStyle(0xf5e2af, 1).fillRect(27, 10, 3, 6);
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
      graphics.fillStyle(0x36b57c, 1).fillRect(11, 15, 10, 4);
      graphics.fillStyle(0x19c88b, 1).fillRect(10, 21, 12, 4);
      graphics.fillStyle(0xd5fff1, 1).fillRect(12, 24, 8, 5);
      graphics.fillStyle(0x68ffd1, 1).fillRect(14, 25, 4, 3);
    });

    this.paintTexture('settlement-guide', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0xffe6b4, 1).fillRect(13, 5, 6, 7);
      graphics.fillStyle(0xf0c87f, 1).fillRect(11, 12, 10, 8);
      graphics.fillStyle(0x6d5450, 1).fillRect(9, 20, 14, 8);
      graphics.fillStyle(0x8de5f2, 1).fillRect(8, 16, 4, 9);
      graphics.fillStyle(0x8de5f2, 1).fillRect(20, 16, 4, 9);
      graphics.fillStyle(0x403028, 1).fillRect(12, 12, 2, 2);
      graphics.fillStyle(0x403028, 1).fillRect(18, 12, 2, 2);
    });

    this.paintTexture('ruin-gate', TILE_SIZE, TILE_SIZE, (graphics) => {
      graphics.fillStyle(0x442251, 1).fillRect(8, 4, 16, 24);
      graphics.fillStyle(0x7b3f96, 1).fillRect(10, 6, 12, 20);
      graphics.fillStyle(0xffd6ff, 1).fillRect(13, 9, 6, 4);
      graphics.fillStyle(0xf58ebd, 1).fillRect(12, 16, 8, 7);
      graphics.fillStyle(0x1e0d25, 1).fillRect(7, 27, 18, 2);
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

  private updateMovement(speed: number): void {
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += 1;

    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.sqrt(2);
      dx *= inv;
      dy *= inv;
    }

    this.player.x = Phaser.Math.Clamp(this.player.x + dx * speed, 18, GAME_WIDTH - 18);
    this.player.y = Phaser.Math.Clamp(this.player.y + dy * speed, 18, GAME_HEIGHT - UI_FOOTER_HEIGHT);
  }

  private updateLocationFromPosition(): void {
    let location = 'Crash Site';

    if (this.player.x >= 640) {
      location = this.state.questFlags.ruinEntered ? 'Ruin Threshold' : 'Ruin Approach';
    } else if (this.player.x >= 352) {
      location = 'Mixed Settlement';
    } else if (this.player.x >= 160) {
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
    return this.state.locationName === 'Crash Site' || this.state.locationName === 'Mixed Settlement';
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
      } else {
        this.state = {
          ...this.state,
          currentDialogue: 'No save signal found.',
        };
      }
    }

    const interactPressed =
      Phaser.Input.Keyboard.JustDown(this.wasd.E) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.SPACE);

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

    if (poi.id === 'resource') {
      this.state = collectSample(this.state);
    }

    if (poi.id === 'npc') {
      this.state = talkToSettlementGuide(this.state);
    }

    if (poi.id === 'ruin') {
      this.state = enterRuin(this.state);
    }
  }

  private findNearbyPoint(): PointOfInterest | null {
    return (
      POINTS_OF_INTEREST.find((poi) => {
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, poi.x, poi.y);
        return distance <= INTERACT_DISTANCE + poi.radius;
      }) ?? null
    );
  }

  private refreshUi(): void {
    const nearby = this.findNearbyPoint();
    const sampleCount = this.state.inventory.sample ?? 0;
    const fiberCount = this.state.inventory.fiber ?? 0;

    this.hudText.setText([
      'STRANGE PLANET RPG // prototype',
      `Location: ${this.state.locationName}`,
      `HP: ${this.state.health}/${this.state.maxHealth}`,
      `O2: ${this.state.oxygen}/${this.state.maxOxygen}`,
      `Scrap: ${this.state.scrap}`,
      `Inventory: sample ${sampleCount}, fiber ${fiberCount}, medgel ${this.state.inventory.medgel ?? 0}`,
      `Equipped: ${this.state.equipment.tool}`,
      `Party: ${this.state.party.join(', ')}`,
      `Objective: ${this.state.objective}`,
      `Progress: exploration ${this.state.exploration} / survival ${this.state.survival}`,
    ]);

    this.dialogueText.setText(`Log: ${this.state.currentDialogue}`);

    this.promptText.setText(
      nearby
        ? [
            `Nearby: ${nearby.label}`,
            'Press E or SPACE to interact',
            this.isSafeOxygenZone() ? 'Safe air pocket: suit seals recover O2' : 'Hostile air: oxygen drains outside shelter',
            'Press K to save, L to load',
          ].join('\n')
        : [
            'Move with WASD or arrows',
            this.isSafeOxygenZone() ? 'Safe air pocket: suit seals recover O2' : 'Hostile air: oxygen drains outside shelter',
            'Press K to save, L to load',
          ].join('\n'),
    );

    this.combatText.setText(
      this.state.inCombat && this.state.combat
        ? [`Combat: ${this.state.combat.enemyName}`, `Enemy HP: ${this.state.combat.enemyHp}`, 'Press E or SPACE to attack'].join('\n')
        : 'Quest loop:\n1. collect sample\n2. talk to settlement\n3. enter ruin\n4. defeat sentinel',
    );
  }
}
