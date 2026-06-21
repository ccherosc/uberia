import Phaser from 'phaser';
import {
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
};

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;
const MOVEMENT_SPEED = 180;
const INTERACT_DISTANCE = 38;

const POINTS_OF_INTEREST: PointOfInterest[] = [
  { id: 'resource', x: 240, y: 224, radius: 18, label: 'sample cluster', locationName: 'Whispering Flats' },
  { id: 'npc', x: 496, y: 208, radius: 18, label: 'settlement guide', locationName: 'Mixed Settlement' },
  { id: 'ruin', x: 752, y: 208, radius: 22, label: 'resin ruin', locationName: 'Ruin Threshold' },
];

export class PrototypeScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D' | 'E' | 'SPACE' | 'K' | 'L', Phaser.Input.Keyboard.Key>;
  private player!: Phaser.GameObjects.Rectangle;
  private state: GameState = createInitialState();
  private hudText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private combatText!: Phaser.GameObjects.Text;

  constructor() {
    super('PrototypeScene');
  }

  create(): void {
    const restored = loadState();
    if (restored) {
      this.state = restored;
    }

    this.drawWorld();
    this.player = this.add.rectangle(96, 320, 20, 20, 0x88f7ff).setStrokeStyle(2, 0xffffff);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE,K,L') as typeof this.wasd;

    this.hudText = this.add.text(16, 16, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#d6f7ff',
      wordWrap: { width: 300 },
    });

    this.dialogueText = this.add.text(16, GAME_HEIGHT - 132, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#d4f7df',
      wordWrap: { width: GAME_WIDTH - 32 },
    });

    this.promptText = this.add.text(GAME_WIDTH - 292, 16, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffe39c',
      wordWrap: { width: 276 },
      align: 'right',
    }).setOrigin(0, 0);

    this.combatText = this.add.text(GAME_WIDTH - 292, 168, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffb5a8',
      wordWrap: { width: 276 },
      align: 'right',
    }).setOrigin(0, 0);

    this.refreshUi();
  }

  update(_time: number, delta: number): void {
    const speed = (MOVEMENT_SPEED * delta) / 1000;

    if (!this.state.inCombat) {
      this.updateMovement(speed);
    }

    this.updateLocationFromPosition();
    this.handleActions();
    this.refreshUi();
  }

  private drawWorld(): void {
    const graphics = this.add.graphics();

    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        let color = 0x0d2228;

        if (x < 8) {
          color = 0x20353b;
        } else if (x < 17) {
          color = 0x173f36;
        } else {
          color = 0x2b1834;
        }

        graphics.fillStyle(color, 1);
        graphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }

    graphics.fillStyle(0x4b5d66, 1);
    graphics.fillRect(48, 128, 96, 96);
    graphics.fillStyle(0x7f6a39, 1);
    graphics.fillRect(416, 128, 160, 128);
    graphics.fillStyle(0x482253, 1);
    graphics.fillRect(688, 96, 128, 192);

    graphics.fillStyle(0x6df7c1, 1);
    graphics.fillCircle(240, 224, 18);
    graphics.fillStyle(0xfff1c1, 1);
    graphics.fillCircle(496, 208, 18);
    graphics.fillStyle(0xff8cb5, 1);
    graphics.fillCircle(752, 208, 22);

    this.add.text(56, 96, 'Crash Site', { fontFamily: 'monospace', fontSize: '14px', color: '#d6f7ff' });
    this.add.text(420, 96, 'Mixed Settlement', { fontFamily: 'monospace', fontSize: '14px', color: '#d6f7ff' });
    this.add.text(704, 64, 'Ruin', { fontFamily: 'monospace', fontSize: '14px', color: '#d6f7ff' });
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
    this.player.y = Phaser.Math.Clamp(this.player.y + dy * speed, 18, GAME_HEIGHT - 150);
  }

  private updateLocationFromPosition(): void {
    let location = 'Crash Site';

    if (this.player.x >= 640) {
      location = 'Ruin Approach';
    } else if (this.player.x >= 352) {
      location = 'Mixed Settlement';
    } else if (this.player.x >= 160) {
      location = 'Whispering Flats';
    }

    this.state = setLocation(this.state, location);
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
        ? [`Nearby: ${nearby.label}`, 'Press E or SPACE to interact', 'Press K to save, L to load'].join('\n')
        : 'Move with WASD or arrows\nPress K to save, L to load',
    );

    this.combatText.setText(
      this.state.inCombat && this.state.combat
        ? [`Combat: ${this.state.combat.enemyName}`, `Enemy HP: ${this.state.combat.enemyHp}`, 'Press E or SPACE to attack'].join('\n')
        : 'Quest loop:\n1. collect sample\n2. talk to settlement\n3. enter ruin\n4. defeat sentinel',
    );
  }
}
