import Phaser from "phaser";
import { ART } from "@/game/art";
import type { EggId, Sprite } from "@/game/contracts";
import { guardianAt } from "@/game/climb";
import type { Facing, PathId } from "@/game/types";
import type { WorldBridge } from "@/game/world/bridge";
import {
  CHESTS,
  displayTile,
  ENEMY_SPOTS,
  inZone,
  MAP_H,
  MAP_W,
  NPC_SPOTS,
  OBJECTS,
  OFF_BY_ONE,
  onPondRing,
  POND_CENTER,
  SIGNS,
  solidTile,
  START,
  TILE,
  tileAt,
  WARDS,
  ANIMATED,
  type EnemySpot,
  type NpcSpot,
} from "@/game/world/map";

const STEP_MS = 210;
const TURN_MS = 110;
const DIRS: Record<Facing, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const LAPS = 3;

const spriteKeys = new WeakMap<Sprite, string>();
let serial = 0;

/** Texture keys are per sprite object, so two sprites that share an id never overwrite each other. */
function keyOf(sprite: Sprite): string {
  let key = spriteKeys.get(sprite);
  if (!key) {
    serial += 1;
    key = `${sprite.id}#${serial}`;
    spriteKeys.set(sprite, key);
  }
  return key;
}

const cellKey = (x: number, y: number) => `${x},${y}`;

export function zoomFor(width: number, height: number): number {
  const fit = Math.floor(Math.min(width / 320, height / 200));
  const cover = Math.ceil(Math.max(width / (MAP_W * TILE), height / (MAP_H * TILE)));
  return Math.max(cover, Math.min(4, Math.max(2, fit)));
}

type Enemy = { spot: EnemySpot; sprite: Sprite; image: Phaser.GameObjects.Image; zzz: Phaser.GameObjects.Image | null };
type Npc = { spot: NpcSpot; sprite: Sprite; image: Phaser.GameObjects.Image };
type Animated = { sprite: Sprite; image: Phaser.GameObjects.Image };

function paintCanvas(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  return canvas;
}

/** A tiny "!" bubble, painted pixel by pixel. */
function alertCanvas() {
  return paintCanvas(11, 13, (ctx) => {
    ctx.fillStyle = "#241c16";
    ctx.fillRect(1, 0, 9, 1);
    ctx.fillRect(0, 1, 11, 9);
    ctx.fillRect(1, 10, 9, 1);
    ctx.fillRect(4, 11, 3, 1);
    ctx.fillRect(5, 12, 1, 1);
    ctx.fillStyle = "#f4e7cf";
    ctx.fillRect(1, 1, 9, 9);
    ctx.fillRect(5, 10, 1, 1);
    ctx.fillStyle = "#c44949";
    ctx.fillRect(4, 2, 3, 4);
    ctx.fillRect(5, 6, 1, 1);
    ctx.fillRect(4, 8, 3, 1);
  });
}

function sleepCanvas() {
  return paintCanvas(6, 6, (ctx) => {
    ctx.fillStyle = "#cfe3ff";
    ctx.fillRect(0, 0, 6, 1);
    ctx.fillRect(3, 1, 2, 1);
    ctx.fillRect(2, 2, 2, 1);
    ctx.fillRect(1, 3, 2, 1);
    ctx.fillRect(0, 4, 2, 1);
    ctx.fillRect(0, 5, 6, 1);
  });
}

function sparkCanvas() {
  return paintCanvas(5, 5, (ctx) => {
    ctx.fillStyle = "#ffe08a";
    ctx.fillRect(2, 0, 1, 5);
    ctx.fillRect(0, 2, 5, 1);
    ctx.fillStyle = "#fff8e0";
    ctx.fillRect(2, 2, 1, 1);
  });
}

class WorldScene extends Phaser.Scene {
  private bridge: WorldBridge;
  private player!: Phaser.GameObjects.Image;
  private grassOver!: Phaser.GameObjects.Image;
  private groundAlt!: Phaser.GameObjects.Image;
  private gateCover!: Phaser.GameObjects.Graphics;
  private tx = START.x;
  private ty = START.y;
  private facing: Facing = START.facing;
  private moving = false;
  private parity = 0;
  private turnUntil = 0;
  private lastArrive = -1000;
  private locked = false;
  private awaitingDuel = false;
  private sawInactive = false;
  private wasActive = false;
  private climbId: string | null = null;
  private path: PathId | null = null;
  private bloodline = 0;
  private nodeIndex = -1;
  private staticSolid = new Set<string>();
  private enemies = new Map<number, Enemy>();
  private wards = new Map<number, Phaser.GameObjects.Graphics[]>();
  private chests = new Map<string, Phaser.GameObjects.Image>();
  private opened = new Set<string>();
  private npcs: Npc[] = [];
  private animated: Animated[] = [];
  private flip = false;
  private ring: { angle: number | null; total: number } = { angle: null, total: 0 };
  private waterAt = -10000;
  private unsubscribe: (() => void) | null = null;

  constructor(bridge: WorldBridge) {
    super("world");
    this.bridge = bridge;
  }

  private tex(sprite: Sprite, frame?: string): string {
    const name = frame && sprite.frames.includes(frame) ? frame : sprite.frames[0];
    const key = `${keyOf(sprite)}:${name}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, ART.renderSprite(sprite, name, 1));
    return key;
  }

  create() {
    this.buildGround();
    this.buildObjects();
    this.buildNpcs();
    this.textures.addCanvas("fx-alert", alertCanvas());
    this.textures.addCanvas("fx-sleep", sleepCanvas());
    this.textures.addCanvas("fx-spark", sparkCanvas());

    this.player = this.add.image(0, 0, this.tex(ART.playerOverworld, "up0")).setOrigin(0, 1);
    this.grassOver = this.add
      .image(0, 0, this.tex(ART.tiles.tallGrass))
      .setOrigin(0, 0)
      .setCrop(0, 9, TILE, TILE - 9)
      .setVisible(false);
    this.placePlayer(START.x, START.y, START.facing);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    camera.setZoom(zoomFor(this.scale.width, this.scale.height));
    camera.startFollow(this.player, true, 1, 1, -TILE / 2, TILE / 2);
    camera.setRoundPixels(true);
    this.scale.on(Phaser.Scale.Events.RESIZE, (size: Phaser.Structs.Size) => {
      camera.setZoom(zoomFor(size.width, size.height));
    });

    this.time.addEvent({ delay: 680, loop: true, callback: () => this.groundAlt.setVisible(!this.groundAlt.visible) });
    this.time.addEvent({ delay: 420, loop: true, callback: () => this.animate() });

    this.unsubscribe = this.bridge.subscribe(() => this.sync());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.unsubscribe?.());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
    this.sync();
    this.bridge.emit({ type: "ready" });
  }

  private buildGround() {
    const draw = (alt: boolean) =>
      paintCanvas(MAP_W * TILE, MAP_H * TILE, (ctx) => {
        for (let y = 0; y < MAP_H; y++) {
          for (let x = 0; x < MAP_W; x++) {
            const id = displayTile(x, y);
            const sprite = ART.tiles[id];
            const frame = alt && id === "water" && sprite.frames.includes("alt") ? "alt" : sprite.frames[0];
            ctx.drawImage(ART.renderSprite(sprite, frame, 1), x * TILE, y * TILE);
          }
        }
      });
    this.textures.addCanvas("ground-a", draw(false));
    this.textures.addCanvas("ground-b", draw(true));
    this.add.image(0, 0, "ground-a").setOrigin(0, 0).setDepth(-20);
    this.groundAlt = this.add.image(0, 0, "ground-b").setOrigin(0, 0).setDepth(-19).setVisible(false);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) if (solidTile(x, y)) this.staticSolid.add(cellKey(x, y));
    }
  }

  private buildObjects() {
    for (const placed of OBJECTS) {
      const sprite = ART.objects[placed.object];
      const frame = placed.object === "chest" ? "closed" : sprite.frames[0];
      const image = this.add
        .image(placed.x * TILE, (placed.y + 1) * TILE, this.tex(sprite, frame))
        .setOrigin(0, 1)
        .setDepth((placed.y + 1) * TILE);
      for (const cell of placed.solid) this.staticSolid.add(cellKey(cell.x, cell.y));
      if (placed.chest) this.chests.set(placed.chest, image);
      if (ANIMATED.includes(placed.object) && sprite.frames.length > 1) this.animated.push({ sprite, image });
      if (placed.object === "castleGate") this.buildGateCover(placed.x, placed.y);
    }
  }

  /** The portcullis lifts once the warden falls: the doorway behind the bars goes dark and open. */
  private buildGateCover(x: number, y: number) {
    const left = x * TILE;
    const top = (y + 1) * TILE - 48;
    const points: Phaser.Math.Vector2[] = [];
    const rightSide: Phaser.Math.Vector2[] = [];
    for (let row = 23; row <= 48; row += 1) {
      const t = (row - 40) / 18;
      const half = Math.max(9, 13 * Math.sqrt(Math.max(0, 1 - t * t)));
      points.push(new Phaser.Math.Vector2(left + 24 - half, top + row));
      rightSide.unshift(new Phaser.Math.Vector2(left + 24 + half, top + row));
    }
    this.gateCover = this.add.graphics();
    this.gateCover.fillStyle(0x100e0c, 1);
    this.gateCover.fillPoints([...points, ...rightSide], true);
    this.gateCover.setDepth((y + 1) * TILE + 0.1).setAlpha(0);
  }

  private buildNpcs() {
    for (const spot of NPC_SPOTS) {
      const sprite = ART.npcOverworld[spot.npc];
      const image = this.add
        .image(spot.x * TILE, (spot.y + 1) * TILE, this.tex(sprite))
        .setOrigin(0, 1)
        .setDepth((spot.y + 1) * TILE + 0.5);
      if (spot.npc === "ghost") {
        image.setAlpha(0.62);
        this.tweens.add({ targets: image, y: image.y - 2, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
      this.npcs.push({ spot, sprite, image });
    }
  }

  private animate() {
    this.flip = !this.flip;
    for (const item of this.animated) item.image.setTexture(this.tex(item.sprite, item.sprite.frames[this.flip ? 1 : 0]));
    for (const npc of this.npcs) npc.image.setTexture(this.tex(npc.sprite, this.flip ? "down1" : "down0"));
    const awake = this.enemies.get(this.nodeIndex);
    if (awake) awake.image.setTexture(this.tex(awake.sprite, this.flip ? "down1" : "down0"));
  }

  // ——— Syncing with the React side ———

  private sync() {
    const snap = this.bridge.snapshot;
    const moved =
      snap.climbId !== this.climbId ||
      snap.path !== this.path ||
      snap.bloodline !== this.bloodline ||
      snap.nodeIndex < this.nodeIndex;
    if (snap.climbId && moved) {
      this.resetClimb();
    } else if (snap.climbId && snap.nodeIndex > this.nodeIndex) {
      this.advance(snap.nodeIndex);
    }
    this.syncChests(snap.chests);

    if (snap.visible && !this.game.loop.running) this.game.loop.wake();
    else if (!snap.visible && this.game.loop.running) this.game.loop.sleep();

    if (!snap.active && this.awaitingDuel) this.sawInactive = true;
    if (snap.active && !this.wasActive && this.awaitingDuel && this.sawInactive) {
      this.awaitingDuel = false;
      this.sawInactive = false;
      this.locked = false;
    }
    this.wasActive = snap.active;
  }

  private resetClimb() {
    const snap = this.bridge.snapshot;
    this.climbId = snap.climbId;
    this.path = snap.path;
    this.bloodline = snap.bloodline;
    this.nodeIndex = snap.nodeIndex;
    this.locked = false;
    this.awaitingDuel = false;
    this.sawInactive = false;
    this.moving = false;
    this.tweens.killTweensOf(this.player);
    this.ring = { angle: null, total: 0 };

    for (const enemy of this.enemies.values()) {
      enemy.image.destroy();
      enemy.zzz?.destroy();
    }
    this.enemies.clear();
    for (const ward of this.wards.values()) for (const piece of ward) piece.destroy();
    this.wards.clear();

    for (const spot of ENEMY_SPOTS) {
      if (spot.node < this.nodeIndex) continue;
      const guardian = guardianAt({ path: this.path, bloodline: this.bloodline }, spot.node);
      const sprite = ART.enemyOverworldAt(guardian.look, guardian.age);
      const image = this.add
        .image(spot.x * TILE, (spot.y + 1) * TILE, this.tex(sprite, "down0"))
        .setOrigin(0, 1)
        .setDepth((spot.y + 1) * TILE + 0.5);
      this.enemies.set(spot.node, { spot, sprite, image, zzz: null });
    }
    for (const ward of WARDS) {
      if (ward.node < this.nodeIndex) continue;
      this.wards.set(
        ward.node,
        ward.cells.map((cell) => this.wardPiece(cell.x, cell.y)),
      );
    }
    this.refreshSleepers();
    this.gateCover.setAlpha(this.nodeIndex > 1 ? 1 : 0);

    const start = snap.start ?? START;
    const valid =
      start.x >= 0 && start.y >= 0 && start.x < MAP_W && start.y < MAP_H && !this.blocked(start.x, start.y);
    if (valid) this.placePlayer(start.x, start.y, start.facing);
    else this.placePlayer(START.x, START.y, START.facing);
  }

  private wardPiece(x: number, y: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const px = x * TILE;
    const py = y * TILE;
    g.fillStyle(0x6f4fd8, 0.32);
    g.fillRect(px, py - 6, TILE, TILE + 6);
    g.fillStyle(0xb9a4ff, 0.55);
    for (let i = 2; i < TILE; i += 4) g.fillRect(px + i, py - 4 + ((i * 7) % 5), 1, TILE + 2);
    g.lineStyle(1, 0xe2c07a, 0.95);
    g.strokeRect(px + 0.5, py - 5.5, TILE - 1, TILE + 5);
    g.fillStyle(0xfff4d0, 0.9);
    g.fillRect(px + 7, py + 2, 2, 2);
    g.fillRect(px + 3, py + 9, 1, 1);
    g.fillRect(px + 12, py + 6, 1, 1);
    g.setDepth((y + 1) * TILE);
    this.tweens.add({ targets: g, alpha: { from: 1, to: 0.55 }, duration: 760, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    return g;
  }

  /** Every guardian but the next one sleeps. */
  private refreshSleepers() {
    for (const [node, enemy] of this.enemies) {
      const asleep = node !== this.nodeIndex;
      if (asleep) {
        enemy.image.setTint(0x8f8fb8).setTexture(this.tex(enemy.sprite, "down0"));
        if (!enemy.zzz) {
          enemy.zzz = this.add
            .image(enemy.spot.x * TILE + 12, enemy.spot.y * TILE - 6, "fx-sleep")
            .setOrigin(0.5, 1)
            .setDepth(5000);
          this.tweens.add({
            targets: enemy.zzz,
            y: enemy.zzz.y - 5,
            alpha: { from: 1, to: 0.2 },
            duration: 1300,
            repeat: -1,
            ease: "Sine.easeOut",
          });
        }
      } else {
        enemy.image.clearTint();
        enemy.zzz?.destroy();
        enemy.zzz = null;
      }
    }
  }

  private advance(next: number) {
    for (let node = this.nodeIndex; node < next; node++) {
      const enemy = this.enemies.get(node);
      if (enemy) {
        this.enemies.delete(node);
        enemy.zzz?.destroy();
        this.tweens.add({
          targets: enemy.image,
          alpha: 0,
          y: enemy.image.y - 6,
          duration: 700,
          ease: "Quad.easeIn",
          onComplete: () => enemy.image.destroy(),
        });
      }
      const ward = this.wards.get(node);
      if (ward) {
        this.wards.delete(node);
        const cells = WARDS.find((item) => item.node === node)?.cells ?? [];
        ward.forEach((piece, index) => {
          this.tweens.killTweensOf(piece);
          this.tweens.add({
            targets: piece,
            alpha: 0,
            y: piece.y - 10,
            duration: 900,
            delay: 250,
            ease: "Cubic.easeIn",
            onComplete: () => piece.destroy(),
          });
          this.burst(cells[index]);
        });
      }
      if (node === 1) {
        this.tweens.add({ targets: this.gateCover, alpha: 1, duration: 900, delay: 400 });
        this.cameras.main.shake(380, 0.004);
      }
    }
    this.nodeIndex = next;
    this.refreshSleepers();
  }

  private syncChests(list: string[]) {
    const open = new Set(list);
    for (const chest of CHESTS) {
      const image = this.chests.get(chest.id);
      if (!image) continue;
      const isOpen = open.has(chest.id);
      if (isOpen !== this.opened.has(chest.id)) {
        image.setTexture(this.tex(ART.objects.chest, isOpen ? "open" : "closed"));
        if (isOpen) {
          this.opened.add(chest.id);
          this.burst(chest);
        } else this.opened.delete(chest.id);
      }
    }
  }

  private burst(cell?: { x: number; y: number }) {
    if (!cell) return;
    const cx = cell.x * TILE + TILE / 2;
    const cy = cell.y * TILE + TILE / 2;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const spark = this.add.image(cx, cy, "fx-spark").setDepth(6000);
      this.tweens.add({
        targets: spark,
        x: cx + Math.cos(angle) * 14,
        y: cy + Math.sin(angle) * 14 - 4,
        alpha: 0,
        duration: 650,
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  // ——— Movement ———

  private placePlayer(x: number, y: number, facing: Facing) {
    this.tx = x;
    this.ty = y;
    this.facing = facing;
    this.player.setPosition(x * TILE, (y + 1) * TILE);
    this.player.setDepth((y + 1) * TILE + 0.5);
    this.player.setTexture(this.tex(ART.playerOverworld, `${facing}0`));
    this.updateGrass();
  }

  private stand() {
    this.player.setTexture(this.tex(ART.playerOverworld, `${this.facing}0`));
  }

  private blocked(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
    if (this.staticSolid.has(cellKey(x, y))) return true;
    for (const npc of this.npcs) if (npc.spot.x === x && npc.spot.y === y) return true;
    for (const enemy of this.enemies.values()) if (enemy.spot.x === x && enemy.spot.y === y) return true;
    for (const ward of WARDS) {
      if (this.wards.has(ward.node) && ward.cells.some((cell) => cell.x === x && cell.y === y)) return true;
    }
    return false;
  }

  update() {
    if (!this.climbId || this.moving || this.locked) return;
    if (!this.bridge.snapshot.active) return;
    const now = this.time.now;
    if (this.bridge.input.takeConfirm()) {
      this.interact();
      return;
    }
    const dir = this.bridge.input.direction();
    if (!dir) {
      this.stand();
      return;
    }
    const chaining = now - this.lastArrive < 60;
    if (dir !== this.facing) {
      this.facing = dir;
      this.stand();
      if (!chaining) {
        this.turnUntil = now + TURN_MS;
        return;
      }
    }
    if (now < this.turnUntil) return;
    this.step(dir);
  }

  private step(dir: Facing) {
    const [dx, dy] = DIRS[dir];
    const nx = this.tx + dx;
    const ny = this.ty + dy;
    const awake = this.enemies.get(this.nodeIndex);
    if (awake && awake.spot.x === nx && awake.spot.y === ny) {
      this.stand();
      this.encounter(awake);
      return;
    }
    if (this.blocked(nx, ny)) {
      this.stand();
      if (tileAt(nx, ny) === "water" && this.time.now - this.waterAt > 1500) {
        this.waterAt = this.time.now;
        this.bridge.emit({ type: "water" });
      }
      return;
    }
    this.moving = true;
    this.parity ^= 1;
    this.grassOver.setVisible(false);
    this.player.setTexture(this.tex(ART.playerOverworld, `${dir}${this.parity ? 1 : 2}`));
    this.tx = nx;
    this.ty = ny;
    this.time.delayedCall(STEP_MS * 0.55, () => {
      if (this.moving) this.player.setTexture(this.tex(ART.playerOverworld, `${dir}0`));
    });
    this.tweens.add({
      targets: this.player,
      x: nx * TILE,
      y: (ny + 1) * TILE,
      duration: STEP_MS,
      onUpdate: () => this.player.setDepth(this.player.y + 0.5),
      onComplete: () => this.arrive(),
    });
  }

  private arrive() {
    this.moving = false;
    this.lastArrive = this.time.now;
    this.player.setDepth((this.ty + 1) * TILE + 0.5);
    this.updateGrass();
    this.bridge.emit({ type: "step", x: this.tx, y: this.ty, facing: this.facing });
    if (this.tx === OFF_BY_ONE.x && this.ty === OFF_BY_ONE.y) this.secret("off-by-one");
    this.trackPond();
    const awake = this.enemies.get(this.nodeIndex);
    if (awake && inZone(awake.spot.zone, this.tx, this.ty)) this.encounter(awake);
  }

  private updateGrass() {
    const inGrass = tileAt(this.tx, this.ty) === "tallGrass";
    this.grassOver.setVisible(inGrass);
    if (inGrass) {
      this.grassOver.setPosition(this.tx * TILE, this.ty * TILE);
      this.grassOver.setDepth((this.ty + 1) * TILE + 0.6);
    }
  }

  private trackPond() {
    if (!onPondRing(this.tx, this.ty)) {
      this.ring = { angle: null, total: 0 };
      return;
    }
    const angle = Math.atan2(this.ty - POND_CENTER.y, this.tx - POND_CENTER.x);
    if (this.ring.angle !== null) {
      let delta = angle - this.ring.angle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      this.ring.total += delta;
    }
    this.ring.angle = angle;
    if (Math.abs(this.ring.total) >= Math.PI * 2 * LAPS - 0.01) {
      this.ring.total = 0;
      this.secret("infinite-loop");
    }
  }

  private secret(egg: EggId) {
    this.burst({ x: this.tx, y: this.ty });
    this.bridge.emit({ type: "secret", egg });
  }

  private interact() {
    const [dx, dy] = DIRS[this.facing];
    const fx = this.tx + dx;
    const fy = this.ty + dy;
    for (const [node, enemy] of this.enemies) {
      if (enemy.spot.x !== fx || enemy.spot.y !== fy) continue;
      if (node === this.nodeIndex) this.encounter(enemy);
      else this.bridge.emit({ type: "asleep", node });
      return;
    }
    const npc = this.npcs.find((item) => item.spot.x === fx && item.spot.y === fy);
    if (npc) {
      this.bridge.emit({ type: "talk", npc: npc.spot.npc, spot: npc.spot.key, shop: Boolean(npc.spot.shop) });
      return;
    }
    const sign = SIGNS.find((item) => item.x === fx && item.y === fy);
    if (sign) {
      this.bridge.emit({ type: "sign", sign: sign.id });
      return;
    }
    const chest = CHESTS.find((item) => item.x === fx && item.y === fy);
    if (chest && !this.opened.has(chest.id)) this.bridge.emit({ type: "chest", chest: chest.id });
  }

  private encounter(enemy: Enemy) {
    if (this.locked) return;
    this.locked = true;
    this.awaitingDuel = true;
    this.sawInactive = false;
    this.bridge.input.clear();
    this.stand();
    const alert = this.add
      .image(enemy.spot.x * TILE + TILE / 2, enemy.spot.y * TILE - 6, "fx-alert")
      .setOrigin(0.5, 1)
      .setDepth(7000)
      .setScale(0.2);
    this.tweens.add({ targets: alert, scale: 1, duration: 160, ease: "Back.easeOut" });
    this.tweens.add({ targets: alert, y: alert.y - 3, duration: 120, yoyo: true, delay: 160 });
    this.time.delayedCall(720, () => {
      alert.destroy();
      this.bridge.emit({ type: "encounter", node: enemy.spot.node });
      this.time.delayedCall(1200, () => {
        if (this.awaitingDuel && !this.sawInactive) {
          this.awaitingDuel = false;
          this.locked = false;
        }
      });
    });
  }
}

export function createWorld(host: HTMLElement, bridge: WorldBridge): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    backgroundColor: "#0b1324",
    pixelArt: true,
    roundPixels: true,
    banner: false,
    disableContextMenu: true,
    audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: host.clientWidth || 640,
      height: host.clientHeight || 480,
    },
    scene: [new WorldScene(bridge)],
  });
}
