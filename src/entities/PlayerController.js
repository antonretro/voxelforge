import * as BABYLON from '@babylonjs/core';
import { settings } from '../core/Settings.js';

const WALK_SPEED   = 0.4;
const SPRINT_SPEED = 0.7;
const FLY_SPEED    = 1.0;
const JUMP_POWER   = 0.45;
const EYE_HEIGHT   = 1.62;

export class PlayerController {
  constructor(engine) {
    this.engine = engine;
    this.scene  = engine.scene;
    this.input  = engine.input;
    this.world  = engine.world;

    this.camera = null;
    this.isFlying   = false;
    this.isGrounded = false;

    this.yaw   = 0;
    this.pitch = 0;

    this.breakCooldown = 0;
    this.placeCooldown = 0;
    this.selectedSlot  = 0;
    this.hotbar        = new Array(9).fill(null);

    this._init();
  }

  _init() {
    this.camera = new BABYLON.UniversalCamera('playerCam', new BABYLON.Vector3(128, 70, 128), this.scene);
    this.camera.fov = (settings.get('fov') * Math.PI) / 180;
    this.camera.minZ = 0.05;
    this.camera.maxZ = 512;
    this.camera.rotation.order = 'YXZ';

    // Collision ellipsoid (width=0.8, height=1.8, depth=0.8 → half-extents)
    this.camera.ellipsoid = new BABYLON.Vector3(0.4, 0.9, 0.4);
    this.camera.applyGravity    = !this.isFlying;
    this.camera.checkCollisions = true;

    this.scene.activeCamera = this.camera;
    this.scene.gravity = new BABYLON.Vector3(0, -0.6, 0);
  }

  spawn(x = 128, z = 128) {
    const y = this.world.getHeight(x, z) + 2;
    this.camera.position.set(x + 0.5, y + EYE_HEIGHT, z + 0.5);
  }

  update(delta) {
    const inp = this.input;
    const sens = settings.get('mouseSensitivity');

    // --- Look ---
    this.yaw   += inp.lookDX * sens;
    this.pitch  = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.pitch + inp.lookDY * sens));
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // --- Move ---
    const speed = this.isFlying
      ? FLY_SPEED
      : inp.sprint ? SPRINT_SPEED : WALK_SPEED;

    const forward = new BABYLON.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right   = new BABYLON.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const move = new BABYLON.Vector3(0, 0, 0);
    if (inp.moveZ > 0.1)  move.addInPlace(forward.scale( inp.moveZ  * speed));
    if (inp.moveZ < -0.1) move.addInPlace(forward.scale( inp.moveZ  * speed));
    if (inp.moveX > 0.1)  move.addInPlace(right.scale(   inp.moveX  * speed));
    if (inp.moveX < -0.1) move.addInPlace(right.scale(   inp.moveX  * speed));

    if (this.isFlying) {
      if (inp.jump)  move.y += speed;
      if (inp.sneak) move.y -= speed;
    } else if (inp.jump && this.isGrounded) {
      this.camera.cameraDirection.y += JUMP_POWER;
    }

    this.camera.cameraDirection.addInPlace(move.scale(delta * 60));

    // --- Fly toggle (double-tap space) ---
    if (settings.get('gameMode') === 'creative' && this._doubleJump(inp)) {
      this.isFlying = !this.isFlying;
      this.camera.applyGravity = !this.isFlying;
    }

    // --- Block interaction ---
    this.breakCooldown = Math.max(0, this.breakCooldown - delta);
    this.placeCooldown = Math.max(0, this.placeCooldown - delta);

    if (inp.breakBlock && this.breakCooldown === 0) {
      this._breakBlock();
      this.breakCooldown = 0.25;
    }
    if (inp.placeBlock && this.placeCooldown === 0) {
      this._placeBlock();
      this.placeCooldown = 0.25;
    }

    // --- Hotbar scroll ---
    const scroll = inp.scrollDelta;
    if (scroll !== 0) {
      this.selectedSlot = (this.selectedSlot - Math.sign(scroll) + 9) % 9;
      this.engine.hud?.updateHotbar(this.selectedSlot);
    }

    // Hotbar number keys
    for (let i = 0; i < 9; i++) {
      if (inp.isDown(`Digit${i+1}`)) {
        this.selectedSlot = i;
        this.engine.hud?.updateHotbar(i);
      }
    }
  }

  _breakBlock() {
    const ray = this._getRay();
    const hit = this.world.raycast(this.camera.position, ray, 8);
    if (hit.hit && hit.y > 0) { // don't break bedrock at y=0
      this.world.setBlock(hit.x, hit.y, hit.z, 0);
    }
  }

  _placeBlock() {
    const held = this.hotbar[this.selectedSlot];
    if (!held) return;
    const ray = this._getRay();
    const hit = this.world.raycast(this.camera.position, ray, 8);
    if (!hit.hit) return;
    const { placeX, placeY, placeZ } = hit;
    if (placeX < 0 || placeY < 0 || placeZ < 0) return;
    const nameMap = this.world._nameToNumericId;
    const numId = nameMap?.get(held) ?? 0;
    if (numId > 0) this.world.setBlock(placeX, placeY, placeZ, numId);
  }

  _getRay() {
    return new BABYLON.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      -Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    );
  }

  _doubleJump(inp) {
    // Simple double-tap detection
    if (!inp.jump) { this._lastJumpTime = 0; return false; }
    const now = performance.now();
    if (this._lastJumpTime && now - this._lastJumpTime < 300) { this._lastJumpTime = 0; return true; }
    this._lastJumpTime = now;
    return false;
  }

  get position() { return this.camera.position; }
}
