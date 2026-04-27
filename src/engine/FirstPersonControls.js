import { CompositeDisposable } from "./events/CompositeDisposable.js";
import { Disposable } from "./events/Disposable.js";
import { Vector3 } from "./math/Vector3.js";
import { raycast } from "./raycast.js";
import { Block } from "./Block.js";
import { Entity } from "./Entity.js";
import { getTextureCoords } from "./loadTexture.js";

const GRAVITY      = -0.008;
const JUMP_FORCE   =  0.14; // Corrected to match Minecraft's 1.25 block jump height
const EYE_HEIGHT   =  1.62;
const WALK_SPEED   =  0.10;
const SPRINT_SPEED =  0.15;

// Tool tier by item-id fragment: wood=1 stone=2 iron=3 diamond=4 netherite=5
const TOOL_TIER = { wooden: 1, wood: 1, stone: 2, iron: 3, diamond: 4, netherite: 5 };

// Minimum tool tier required to get a drop from a block (keyed by block numeric ID).
// Missing entry = no requirement (drops with bare fist).
const DROP_REQUIRES = {
    3:  1, // stone         → wood pickaxe
    13: 1, // coal ore      → wood pickaxe
    14: 2, // iron ore      → stone pickaxe
    15: 3, // gold ore      → iron pickaxe
    16: 3, // diamond ore   → iron pickaxe
    17: 2, // lapis ore     → stone pickaxe
    18: 2, // redstone ore  → stone pickaxe
    19: 2, // copper ore    → stone pickaxe
    20: 3, // emerald ore   → iron pickaxe
    46: 4, // obsidian      → diamond pickaxe
};

function getToolTier(itemId) {
    if (!itemId) return 0;
    for (const [frag, tier] of Object.entries(TOOL_TIER)) {
        if (itemId.includes(frag)) return tier;
    }
    return 0;
}

export class FirstPersonControls {
	constructor(_doc, game) {
		this.canvas = game.renderer.element;
		this.game   = game;

		this.subscribers = new CompositeDisposable();
		this.subscribers.add(Disposable.from(document, "keydown",           e => this.onKeyDown(e)));
		this.subscribers.add(Disposable.from(document, "keyup",             e => this.onKeyUp(e)));
		this.subscribers.add(Disposable.from(document, "pointerlockchange", () => this.onPointerLockChange()));
		this.subscribers.add(Disposable.from(document, "mousedown",         e => this.onMouseDown(e)));
		this.subscribers.add(Disposable.from(document, "mouseup",           e => this.onMouseUp(e)));
		this.subscribers.add(game.on("tick", dt => this.onTick(dt)));

		this.moveListener  = null;
		this.camera        = game.camera;
		this.rotation      = new Vector3(0, 0, 0);
		this.velocity      = new Vector3(0, 0, 0);
		this.keystate      = {};
		this.selectedSlot  = 0;
		this.onGround      = false;
		this.isSprinting   = false;
		this.inventoryOpen = false;
		this.chatOpen      = false;

		this.isMining      = false;
		this.isMouseDown   = false;
		this.miningTarget  = null;
		this.miningProgress = 0;

		this.gameMode      = this.game.settings?.get('gameMode') || 'survival';
		this.isFlying      = this.gameMode === 'spectator';
		this.lastSpaceTime = 0;

		this.miningOverlay = new Entity(game.renderer.context);
		this.miningOverlay.transparent = true;
		this.game.transparentScene.add(this.miningOverlay);

		window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
		this._updateViewmodel();
	}

	_updateViewmodel() {
		const item = this.game.player.hotbar[this.selectedSlot];
		this.game.viewmodel?.updateItem(item?.id || null);
	}

	onWheel(e) {
		if (this.inventoryOpen) return;
		e.preventDefault();
		const dir = e.deltaY > 0 ? 1 : -1;
		this.selectedSlot = (this.selectedSlot + dir + 9) % 9;
		this._updateViewmodel();
	}

	// --- Public API used by Engine.pause/resume ---
	lock()   { this.canvas.requestPointerLock(); }
	unlock() { document.exitPointerLock(); }

	// -----------------------------------------------

	getMiningSpeed(id) {
		switch (id) {
			case 2:  return  500;  // Dirt
			case 3:  return 1500;  // Stone
			case 5:  return  600;  // Grass
			case 4:  return 1000;  // Log
			case 8:  return  200;  // Leaves
			case 42: return 1200;  // Chest
			case 46: return 5000;  // Obsidian
			case 101: // Grass
			case 102: // Poppy
			case 103: // Dandelion
			case 104: // Blue Orchid
			case 115: // Tall Grass
			case 120: // Tall Grass
				return 0; // Instant
			default: return  800;
		}
	}

	onTick(dt) {
		// Suspend all movement when paused, in a menu, or chat is open
		if (this.game.paused || this.inventoryOpen || this.chatOpen) return;

		const ks     = this.keystate;
		const delta  = new Vector3();
		const start  = this.camera.position.clone();
		const t      = Math.min(dt, 64) / 16.6;

		// Input direction
		delta.z = (ks.KeyW ? -1 : 0) + (ks.KeyS ? 1 : 0);
		delta.x = (ks.KeyA ? -1 : 0) + (ks.KeyD ? 1 : 0);

		// Sprint
		this.isSprinting = !!ks.ControlLeft;
		const speed = this.isSprinting ? SPRINT_SPEED : WALK_SPEED;

		// Rotate input to camera orientation
        const input = new Vector3(delta.x, 0, delta.z);
        if (input.lengthSq() > 0) {
            input.normalise();
            // Project camera forward onto XZ plane for ground movement
            const forward = new Vector3(0, 0, -1).applyQuaternion(this.camera.rotation);
            const right   = new Vector3(1, 0, 0).applyQuaternion(this.camera.rotation);
            
            forward.y = 0;
            right.y = 0;
            forward.normalise();
            right.normalise();

            const moveDir = forward.multiply(delta.z * -1).add(right.multiply(delta.x));
            delta.copy(moveDir);
        }

		// FOV pulse during sprint
		const baseFov = this.game.settings.get('fov') || 75;
		if (this.isSprinting && delta.lengthSq() > 0) {
			this.camera.fov = Math.min(this.camera.fov + dt * 0.1, baseFov + 10);
		} else {
			this.camera.fov = Math.max(this.camera.fov - dt * 0.1, baseFov);
		}

		if (delta.lengthSq() > 0) delta.normalise().multiply(speed * t);

		// Flight vs Gravity
		const isSpectator = this.gameMode === 'spectator';
		if ((this.gameMode === 'creative' || isSpectator) && this.isFlying) {
			const up = (ks.Space ? 1 : 0) - (ks.ShiftLeft ? 1 : 0);
			this.velocity.y += up * 0.1 * t;
			this.velocity.y *= 0.8; // High friction for flight
		} else {
			this.velocity.y += isSpectator ? 0 : GRAVITY * t;
			const blockUnder = this.game.chunkManager.getBlockAt(start.x, start.y - EYE_HEIGHT - 0.1, start.z);
			const wasOnGround = this.onGround;
			this.onGround = !!(blockUnder?.solid);

			if (this.onGround && !isSpectator) {
				if (!wasOnGround && this.velocity.y < -0.3) this.velocity.y = 0;
				if (ks.Space) this.velocity.y = JUMP_FORCE;
			}
		}

		// Momentum
		const friction = this.onGround ? 0.25 : 0.05;
		this.velocity.x += (delta.x - this.velocity.x) * (isSpectator ? 0.2 : friction) * t;
		this.velocity.z += (delta.z - this.velocity.z) * (isSpectator ? 0.2 : friction) * t;

		const next = start.clone().add(this.velocity);

		// Collision — bypass if spectator
		if (this.gameMode !== 'spectator') {
			// Vertical collision — feet
			const bFeet = this.game.chunkManager.getBlockAt(next.x, next.y - EYE_HEIGHT, next.z);
			if (bFeet?.solid) {
				next.y = Math.floor(next.y - EYE_HEIGHT) + EYE_HEIGHT + 1.0;
				this.velocity.y = 0;
				this.onGround = true;
			}
		}
		// Vertical collision — head
		const bHead = this.game.chunkManager.getBlockAt(next.x, next.y + 0.2, next.z);
		if (bHead?.solid) { next.y = start.y; this.velocity.y = 0; }

		// Horizontal collision + auto-step
		const waistY = next.y - 1.0;
		const bWX = this.game.chunkManager.getBlockAt(next.x, waistY, start.z);
		if (bWX?.solid) {
			const above = this.game.chunkManager.getBlockAt(next.x, waistY + 1, start.z);
			if (this.onGround && !above?.solid) this.velocity.y = JUMP_FORCE;
			else next.x = start.x;
		}
		const bWZ = this.game.chunkManager.getBlockAt(start.x, waistY, next.z);
		if (bWZ?.solid) {
			const above = this.game.chunkManager.getBlockAt(start.x, waistY + 1, next.z);
			if (this.onGround && !above?.solid) this.velocity.y = JUMP_FORCE;
			else next.z = start.z;
		}

		this.camera.setPosition(next);

		// Sound: footstep
		if (this.onGround && delta.lengthSq() > 0) {
			this._footstepTimer = (this._footstepTimer || 0) + dt;
			if (this._footstepTimer > (this.isSprinting ? 320 : 450)) {
				this._footstepTimer = 0;
				this.game.sound?.play('step');
			}
		}

		// Mining
		this._tickMining(dt);
	}

	_tickMining(dt) {
		if (this.isMouseDown && this.isMining) {
			const ray = this.game.chunkManager.raycast(this.camera.position, this.camera.facing, 6);
			if (!ray.hitBlock) {
				this._stopMining();
				return;
			} else if (!this.miningTarget || ray.hitPos.x !== this.miningTarget.x || ray.hitPos.y !== this.miningTarget.y || ray.hitPos.z !== this.miningTarget.z) {
				this.miningTarget = ray.hitPos;
				this.miningProgress = 0;
			}
		}

		if (this.isMining && this.miningTarget) {
			const { x, y, z } = this.miningTarget;
			const block = this.game.chunkManager.getBlockAt(x, y, z);
			if (!block || (!block.solid && !block.texture && !block.top)) {
				this._stopMining();
				return;
			}

			// Mining speed multipliers
			let multiplier = (this.gameMode === 'creative') ? 50.0 : 1.0;
			const held = this.game.player?.hotbar[this.selectedSlot];
			
			if (this.gameMode === 'survival' && held) {
				const id = held.id.toLowerCase();
				const bName = block.name.toLowerCase();
				const tier = getToolTier(id);
				
				let isCorrectTool = false;
				if (id.includes('pickaxe') && (bName.includes('stone') || bName.includes('ore') || bName.includes('cobble') || bName.includes('deepslate') || bName.includes('brick'))) {
					isCorrectTool = true;
				} else if (id.includes('shovel') && (bName.includes('dirt') || bName.includes('sand') || bName.includes('gravel') || bName.includes('grass') || bName.includes('path') || bName.includes('clay'))) {
					isCorrectTool = true;
				} else if (id.includes('axe') && (bName.includes('log') || bName.includes('plank') || bName.includes('wood') || bName.includes('fence'))) {
					isCorrectTool = true;
				} else if (id.includes('hoe') && (bName.includes('leaves') || bName.includes('hay') || bName.includes('wheat') || bName.includes('wart'))) {
					isCorrectTool = true;
				}

				if (isCorrectTool && tier > 0) {
					// tier-based speeds
					const speeds = [1, 2, 4, 6, 12, 16]; // Default, Wood, Stone, Iron, Diamond, Netherite
					multiplier = speeds[tier] || 1;
				}
			}

			this.miningProgress += (dt / this.getMiningSpeed(block.id)) * multiplier;
			if (Math.random() < 0.2) this.game.particles?.spawn(new Vector3(x, y, z), block.id, 3);

			const stage = Math.floor(this.miningProgress * 10);
			if (stage < 10) {
				const damageTex = getTextureCoords(`destroy_stage_${stage}`);
				if (damageTex) {
					this.miningOverlay.setPosition(new Vector3(x, y, z));
					this.miningOverlay.scale.set(1.02, 1.02, 1.02);
					this.miningOverlay.generateFromFaces([
						[Block.TOP,    [0,0,0], damageTex, Block.NORMAL.TOP],
						[Block.BOTTOM, [0,0,0], damageTex, Block.NORMAL.BOTTOM],
						[Block.FRONT,  [0,0,0], damageTex, Block.NORMAL.FRONT],
						[Block.BACK,   [0,0,0], damageTex, Block.NORMAL.BACK],
						[Block.LEFT,   [0,0,0], damageTex, Block.NORMAL.LEFT],
						[Block.RIGHT,  [0,0,0], damageTex, Block.NORMAL.RIGHT],
					]);
				}
			}
			if (this.miningProgress >= 1) {
				const id = block.id;
				const pos = new Vector3(x, y, z);
				
				// 1. Break the main block
				this.game.chunkManager.setBlockAt(x, y, z, Block.get(1));
				this.game.network?.broadcastBlockSet(x, y, z, 1);
				this.game.particles?.spawn(pos, id, 20);
				this.game.sound?.play('break');

				// 2. Spawn the drop (Mini version)
				const dropId = block.drop || block.name;
				const required = DROP_REQUIRES[id] ?? 0;
				const held = this.game.player?.hotbar[this.selectedSlot];
				const tier = getToolTier(held?.id);
				
				if (this.gameMode === 'survival') {
					if (tier >= required) {
						// Create ItemEntity
						import('./ItemEntity.js').then(({ ItemEntity }) => {
							const item = new ItemEntity(this.game, block, pos.clone().add(new Vector3(0.5, 0.5, 0.5)));
							this.game._itemEntities.push(item);
						});
					}
					
					// Tool durability
					if (held && held.maxDurability) {
						held.durability = (held.durability ?? held.maxDurability) - 1;
						if (held.durability <= 0) {
							this.game.player.hotbar[this.selectedSlot] = null;
							this.game.sound?.play('break_tool');
						}
						this.game.emit('hotbarUpdate', this.selectedSlot);
					}
				} else if (this.gameMode === 'creative') {
					// Visual only drop in creative if you want, or nothing
				}

				// 3. Handle Dependencies (Foliage on top)
				const abovePos = new Vector3(x, y + 1, z);
				const aboveBlock = this.game.chunkManager.getBlockAt(abovePos.x, abovePos.y, abovePos.z);
				if (aboveBlock && !aboveBlock.solid && (aboveBlock.texture || aboveBlock.top)) {
					// It's a non-solid block (grass, flower, etc.) - break it!
					this.game.chunkManager.setBlockAt(abovePos.x, abovePos.y, abovePos.z, Block.get(1));
					this.game.network?.broadcastBlockSet(abovePos.x, abovePos.y, abovePos.z, 0);
					this.game.particles?.spawn(abovePos, aboveBlock.id, 10);
					
					if (this.gameMode === 'survival') {
						import('./ItemEntity.js').then(({ ItemEntity }) => {
							const item = new ItemEntity(this.game, aboveBlock, abovePos.clone().add(new Vector3(0.5, 0.1, 0.5)));
							this.game._itemEntities.push(item);
						});
					}
				}

				// Continuous mining: check if we should start the next block
				if (this.isMouseDown) {
					this._updateMiningRay(); 
				} else {
					this._stopMining();
				}
			}
		} else {
			this.miningProgress = 0;
			this.miningOverlay.length = 0;
		}
	}

	_updateMiningRay() {
		const { hitBlock, hitPos } = this.game.chunkManager.raycast(this.camera.position, this.camera.facing, 6);
		if (hitBlock) {
			this.miningTarget = hitPos;
			this.miningProgress = 0;
		} else {
			this._stopMining();
		}
	}

	_stopMining() {
		this.isMining      = false;
		this.miningTarget  = null;
		this.miningProgress = 0;
		this.miningOverlay.length = 0;
	}

	onPointerLockChange() {
		if (document.pointerLockElement === this.canvas) {
			this.moveListener = Disposable.from(document, "mousemove", e => this.onMouseMove(e));
		} else {
			this.moveListener?.dispose();
			this.moveListener = null;
		}
	}

	onMouseDown(e) {
		if (this.game.paused || this.inventoryOpen) return;
		if (document.pointerLockElement !== this.canvas) {
			this.canvas.requestPointerLock();
			return;
		}

		this.isMouseDown = true;
		if (this.gameMode === 'spectator' || this.gameMode === 'adventure') {
			if (e.button === 0) return; // Cannot break
		}
		const { button } = e;
		const { hitBlock, hitPos, face } = this.game.chunkManager.raycast(
			this.camera.position,
			this.camera.facing,
			6
		);

		if (button === 0 && hitBlock) {
			this.isMining    = true;
			this.miningTarget = hitPos;
			this.game.sound?.play('dig');
			this.game.viewmodel?.swing();
		}

		if (button === 2 && hitBlock) {
			// Interaction priority: containers first
			if (hitBlock.id === 40) { this.game.toggleInventory({ ...hitPos, type: 'crafting_table', title: 'Crafting Table'        }); return; }
			if (hitBlock.id === 41) { this.game.toggleInventory({ ...hitPos, type: 'furnace',        title: 'Furnace'               }); return; }
			if (hitBlock.id === 42) { this.game.toggleInventory({ ...hitPos, type: 'chest',          title: 'Chest',          size: 27 }); return; }

			const item = this.game.player.hotbar[this.selectedSlot];

			// Water bucket: pick up water
			if (item?.id === 'bucket' && hitBlock.name === 'water') {
				const WATER_BLOCK = Block.get('water') || this.game.blocks.find(b => b.name === 'water');
				if (WATER_BLOCK) {
					this.game.chunkManager.setBlockAt(hitPos.x, hitPos.y, hitPos.z, null);
					this.game.network?.broadcastBlockSet(hitPos.x, hitPos.y, hitPos.z, 0);
				}
				this.game.player.hotbar[this.selectedSlot] = { id: 'water_bucket', count: 1 };
				this.game.emit('hotbarUpdate', this.selectedSlot);
				this.game.sound?.play('splash');
				return;
			}

			// Water bucket: place water
			if (item?.id === 'water_bucket') {
				const waterBlock = this.game.blocks.find(b => b.name === 'water');
				if (waterBlock) {
					const { x, y, z } = hitPos;
					const ox = x + (face.x || 0), oy = y + (face.y || 0), oz = z + (face.z || 0);
					this.game.chunkManager.setBlockAt(ox, oy, oz, waterBlock);
					this.game.network?.broadcastBlockSet(ox, oy, oz, waterBlock.id);
					this.game.sound?.play('splash');
				}
				this.game.player.hotbar[this.selectedSlot] = { id: 'bucket', count: 1 };
				this.game.emit('hotbarUpdate', this.selectedSlot);
				return;
			}

			// Tool interactions (Stripping, Paths, Hoeing)
			if (item) {
				const { x, y, z } = hitPos;
				let transformed = false;

				// Axe -> Stripping
				if (item.id.includes('axe') && (hitBlock.id === 4 || hitBlock.name === 'oak_log')) {
					const strippedLog = this.game.blocks.find(b => b.name === 'stripped_oak_log');
					if (strippedLog) {
						this.game.chunkManager.setBlockAt(x, y, z, strippedLog);
						this.game.network?.broadcastBlockSet(x, y, z, strippedLog.id);
						this.game.sound?.play('strip');
						transformed = true;
					}
				}
				// Shovel -> Grass Path
				else if (item.id.includes('shovel') && (hitBlock.id === 5 || hitBlock.name === 'grass_block')) {
					const grassPath = this.game.blocks.find(b => b.name === 'grass_path');
					if (grassPath) {
						this.game.chunkManager.setBlockAt(x, y, z, grassPath);
						this.game.network?.broadcastBlockSet(x, y, z, grassPath.id);
						this.game.sound?.play('step'); // Or a specific path sound if available
						transformed = true;
					}
				}
				// Hoe -> Farmland
				else if (item.id.includes('hoe') && (hitBlock.id === 2 || hitBlock.id === 5 || hitBlock.name === 'dirt' || hitBlock.name === 'grass_block')) {
					const farmland = this.game.blocks.find(b => b.id === 316 || b.name === 'farmland');
					if (farmland) {
						this.game.chunkManager.setBlockAt(x, y, z, farmland);
						this.game.network?.broadcastBlockSet(x, y, z, farmland.id);
						this.game.sound?.play('hoe');
						transformed = true;
					}
				}

				if (transformed) {
					// Consume durability
					if (item.maxDurability) {
						item.durability = (item.durability ?? item.maxDurability) - 1;
						if (item.durability <= 0) {
							this.game.player.hotbar[this.selectedSlot] = null;
							this.game.sound?.play('break_tool');
						}
						this.game.emit('hotbarUpdate', this.selectedSlot);
					}
					this.game.viewmodel?.swing();
					return;
				}
			}

			// Place block or blueprint from hotbar
			if (item) {
                // 1. Blueprint Placement
                if (item.structure) {
                    const { x, y, z } = hitPos;
                    const ox = x + (face.x || 0), oy = y + (face.y || 0), oz = z + (face.z || 0);
                    
                    this.game.structures.spawn(item.structure, null, ox, oy, oz);
                    this.game.sound?.play('place');
                    this.game.viewmodel?.swing();

                    if (this.gameMode === 'survival') {
                        item.count--;
                        if (item.count <= 0) this.game.player.hotbar[this.selectedSlot] = null;
                        this.game.emit('hotbarUpdate', this.selectedSlot);
                    }
                    return;
                }

                // 2. Standard Block Placement
				const block = this.game.blocks.find(b => b.name === item.id);
				if (block) {
					const { x, y, z } = hitPos;
					const ox = x + (face.x || 0), oy = y + (face.y || 0), oz = z + (face.z || 0);
					this.game.chunkManager.setBlockAt(ox, oy, oz, block);
					this.game.network?.broadcastBlockSet(ox, oy, oz, block.id);
					this.game.sound?.play('place');
					this.game.viewmodel?.swing();

					// Consume item in survival
					if (this.gameMode === 'survival') {
						item.count--;
						if (item.count <= 0) {
							this.game.player.hotbar[this.selectedSlot] = null;
						}
						this.game.emit('hotbarUpdate', this.selectedSlot);
					}
				}
			}
		}
	}

	onMouseUp(e) {
		if (e.button === 0) {
			this.isMouseDown = false;
			this._stopMining();
		}
	}

	onKeyDown(e) {
		// Chat input takes priority
		if (this.chatOpen && e.code !== 'Escape') return;

		if (e.code.startsWith('Digit')) {
			const slot = parseInt(e.code.slice(5)) - 1;
			if (slot >= 0 && slot < 9) { 
				this.selectedSlot = slot; 
				this._updateViewmodel();
				return; 
			}
		}

		// Allow browser shortcuts
		if (!['KeyE', 'Escape', 'KeyT', 'F3', 'F11', 'F12'].includes(e.code)) e.preventDefault();

		switch (e.code) {
			case 'KeyW': case 'KeyA': case 'KeyS': case 'KeyD':
			case 'Space': case 'ShiftLeft': case 'ControlLeft':
				this.keystate[e.code] = true;
				break;
			case 'KeyE':
				if (!this.game.paused) this.game.toggleInventory();
				break;
			case 'KeyT':
				if (!this.game.paused && !this.inventoryOpen) this.game.emit('openChat');
				break;
			case 'F3':
				this.game.emit('toggleCoords');
				break;
			case 'Escape':
				if (this.inventoryOpen) { this.game.toggleInventory(); break; }
				if (this.chatOpen)      { this.game.emit('closeChat'); break; }
				this.game.paused ? this.game.resume() : this.game.pause();
				break;
		}
	}

	onKeyUp(e) {
		switch (e.code) {
			case 'KeyW': case 'KeyA': case 'KeyS': case 'KeyD':
			case 'Space': case 'ShiftLeft': case 'ControlLeft':
				this.keystate[e.code] = false;
				break;
		}
	}

	onMouseMove(e) {
		if (this.game.paused || this.inventoryOpen) return;
		const sensitivity = this.game.settings.get('mouseSensitivity') || 0.003;
		const max = Math.PI * 0.5;
		const rot = this.rotation;
		rot.y -= e.movementX * sensitivity;
		rot.x = Math.max(-max, Math.min(max, rot.x - e.movementY * sensitivity));
		this.camera.rotate(rot.x, rot.y, 0);
	}

	dispose() {
		this.subscribers.dispose();
	}
}
