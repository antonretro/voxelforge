import { Renderer } from '../engine/Renderer.js';
import { Vector3 } from '../engine/math/Vector3.js';
import { Block } from '../engine/Block.js';
import { ChunkManager } from '../engine/ChunkManager.js';
import { FirstPersonControls } from '../engine/FirstPersonControls.js';
import { Dispatcher } from '../engine/events/Dispatcher.js';
import { settings } from './Settings.js';
import { setLoadingProgress, hideLoadingScreen } from './LoadingScreen.js';
import { setTexturePack } from '../engine/loadTexture.js';
import { NetworkManager } from '../multiplayer/NetworkManager.js';
import { CommandSystem } from '../systems/CommandSystem.js';
import { SoundSystem } from '../systems/SoundSystem.js';
import { EntityManager } from '../entities/EntityManager.js';
import { ITEM_MAP } from '../data/items.js';
import { WorldManager } from './WorldManager.js';
import { StructureManager } from '../world/StructureManager.js';
import { SurvivalSystem } from '../systems/SurvivalSystem.js';
import { Viewmodel } from '../ui/Viewmodel.js';
import { ParticleSystem } from '../engine/ParticleSystem.js';
import { DayNight } from '../engine/DayNight.js';
import { RedstoneSystem } from '../systems/RedstoneSystem.js';
import { SelectionBox } from '../engine/SelectionBox.js';
import { SkySystem } from '../engine/SkySystem.js';

export class Engine extends Dispatcher {
  constructor() {
    super();
    this.renderer    = null;
    this.camera      = null;
    this.scene       = null;
    this.solidScene  = null;
    this.transparentScene = null;
    this.chunkManager = null;
    this.controls    = null;

    this.settings  = settings;
    this.hud       = null;
    this.menu      = null;
    this.network   = null;
    this.commands  = null;
    this.sound     = null;
    this.entities  = null;
    this.items     = ITEM_MAP;
    this.selectionBox = null;
    this.sky = null;

    this.running    = false;
    this.gameActive = false;
    this.paused     = false;
    this._lastTime  = performance.now();
    this._fpsTime   = 0;
    this._fpsFrames = 0;
    this._fps       = 0;
    this._hotbar    = new Array(9).fill(null);
    this._inventory = new Array(27).fill(null);
    this._hotbar[0] = { id: 'diamond_pickaxe', count: 1 };
    this._hotbar[1] = { id: 'diamond_axe',     count: 1 };
    this._hotbar[2] = { id: 'diamond_shovel',  count: 1 };
    this._hotbar[3] = { id: 'grass_block',     count: 64 };
    this._hotbar[4] = { id: 'oak_log',         count: 64 };
    this._hotbar[5] = { id: 'cobblestone',     count: 64 };
    this._hotbar[6] = { id: 'torch',           count: 64 };

    this.worldManager = new WorldManager(this);
    this.structures   = new StructureManager(this);
    this.survival     = new SurvivalSystem(this);
    this.currentWorld = null;

    this.activeContainer = null; 
    this.worldContainers = new Map(); // Key: "x,y,z", Value: { type, items, title }

    this.redstone = new RedstoneSystem(this);
    this.dayNight = new DayNight(this);
    this._itemEntities = [];
  }

  // Voxelcraft ChunkManager calls game.getCameraPosition()
  getCameraPosition() {
    return this.camera.position.clone();
  }

  // Compatibility shim — systems reference engine.player
  get player() {
    const self = this;
    return {
      get position() { return self.camera?.position || {x:0, y:0, z:0}; },
      get yaw()      { return self.controls?.rotation?.y ?? 0; },
      get pitch()    { return self.controls?.rotation?.x ?? 0; },
      hotbar: this._hotbar,
      inventory: this._inventory,
      setHotbarItem: (name) => {
        const selected = this.controls?.selectedSlot ?? 0;
        this._hotbar[selected] = name;
        this.hud?.updateHotbar(selected);
      },
      spawn: () => this._spawnPlayer(),
      setHotbarItemAt: (index, name) => {
        this._hotbar[index] = name;
        this.emit('hotbarUpdate', index);
      },
      setInventoryItemAt: (index, item) => {
        this._inventory[index] = item;
        this.emit('inventoryUpdate', index);
      },
      addItem: (item) => {
        if (!item || !item.id) return false;
        let remaining = item.count || 1;
        
        // 1. Fill existing stacks in hotbar
        for (let i = 0; i < 9; i++) {
            const slot = this._hotbar[i];
            if (slot && slot.id === item.id && slot.count < 64) {
                const take = Math.min(remaining, 64 - slot.count);
                slot.count += take;
                remaining -= take;
                this.emit('hotbarUpdate', i);
                this.sound?.play('pickup');
                if (remaining <= 0) return true;
            }
        }
        // 2. Fill existing stacks in inventory
        for (let i = 0; i < 27; i++) {
            const slot = this._inventory[i];
            if (slot && slot.id === item.id && slot.count < 64) {
                const take = Math.min(remaining, 64 - slot.count);
                slot.count += take;
                remaining -= take;
                this.emit('inventoryUpdate', i);
                this.sound?.play('pickup');
                if (remaining <= 0) return true;
            }
        }
        // 3. New stacks in hotbar
        for (let i = 0; i < 9; i++) {
            if (this._hotbar[i] === null) {
                const take = Math.min(remaining, 64);
                this._hotbar[i] = { ...item, count: take };
                remaining -= take;
                this.emit('hotbarUpdate', i);
                this.sound?.play('pickup');
                if (remaining <= 0) return true;
            }
        }
        // 4. New stacks in inventory
        for (let i = 0; i < 27; i++) {
            if (this._inventory[i] === null) {
                const take = Math.min(remaining, 64);
                this._inventory[i] = { ...item, count: take };
                remaining -= take;
                this.emit('inventoryUpdate', i);
                this.sound?.play('pickup');
                if (remaining <= 0) return true;
            }
        }
        return remaining < (item.count || 1);
      },
      addItemToHotbar: (item) => {
        for (let i = 0; i < 9; i++) {
          if (this._hotbar[i] === null) {
            this._hotbar[i] = item;
            this.emit('hotbarUpdate', i);
            return true;
          }
        }
        return false;
      },
      addItemToInventory: (item) => {
        for (let i = 0; i < 27; i++) {
          if (this._inventory[i] === null) {
            this._inventory[i] = item;
            this.emit('inventoryUpdate', i);
            return true;
          }
        }
        return false;
      },
      sortInventory: () => {
        const slots = [...this._inventory];
        const items = slots.filter(s => s !== null);
        
        // 1. Group and stack
        const grouped = new Map();
        for (const item of items) {
            if (grouped.has(item.id)) {
                grouped.get(item.id).count += item.count;
            } else {
                grouped.set(item.id, { ...item });
            }
        }
        
        // 2. Expand into stacks of 64
        const result = [];
        for (const item of grouped.values()) {
            let remaining = item.count;
            const stackSize = item.stackSize || 64;
            while (remaining > 0) {
                const take = Math.min(remaining, stackSize);
                result.push({ ...item, count: take });
                remaining -= take;
            }
        }
        
        // 3. Fill back into inventory
        this._inventory.fill(null);
        for (let i = 0; i < Math.min(result.length, 27); i++) {
            this._inventory[i] = result[i];
        }
        
        // 4. Emit update
        for (let i = 0; i < 27; i++) {
            this.emit('inventoryUpdate', i);
        }
      }
    };
  }

  get blocks() {
    return Block.getAll();
  }

  // Compatibility — HUD checks engine.babylon?.getFps()
  getFps() { return this._fps; }
  get babylon() { return { getFps: () => this._fps }; }
  get canvas()  { return this.renderer?.element; }

  // Compatibility — world references for commands / multiplayer
  get world() {
    const mgr = this.chunkManager;
    if (!mgr) return null;
    return {
      getBlock: (x, y, z) => {
        const b = mgr.getBlockAt(x, y, z);
        return b ? b.id : 0;
      },
      setBlock: (x, y, z, id) => {
        const block = Block.get(id);
        if (block) {
            mgr.setBlockAt(x, y, z, block);
            this.redstone?.notify(x, y, z);
        }
      },
      active: this.gameActive,
      seed: 0,
      changedBlocks: new Map(),
    };
  }

  async init() {
    setTexturePack(settings.get('texturePack') || 'igneous');
    setLoadingProgress(10, 'Starting renderer...');

    // Create Voxelcraft WebGL2 renderer and insert into page
    this.renderer = new Renderer();
    this.renderer.setResolutionScale(settings.get('resolutionScale') || 1.0);
    const el = this.renderer.element;
    el.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;';
    document.body.prepend(el);

    // Hide the old placeholder canvas
    const old = document.getElementById('game-canvas');
    if (old) old.style.display = 'none';

    // Camera + scenes
    this.camera = this.renderer.createCamera(
      window.innerWidth / window.innerHeight,
      settings.get('fov') || 70,
      0.1, 1000
    );
    this.scene = this.renderer.createScene();
    this.solidScene = this.renderer.createScene();
    this.transparentScene = this.renderer.createScene();
    this.scene.add(this.solidScene);
    this.scene.add(this.transparentScene);
    this.renderer.setCamera(this.camera);
    this.renderer.setScene(this.scene);
    this.renderer.createDefaultShader();

    // Load blocks + build texture atlas
    setLoadingProgress(30, 'Loading blocks...');
    const atlas = await Block.parseDefinitions(this.renderer.context, '/blocks.json');
    this.renderer.setAtlas(atlas);

    setLoadingProgress(60, 'Creating world...');
    // ChunkManager(game, chunkWidth, chunkHeight, viewRange)
    this.chunkManager = new ChunkManager(this, 16, 100, 8);

    // Systems
    this.network  = new NetworkManager(this);
    this.commands = new CommandSystem(this);
    this.sound    = new SoundSystem(this);
    this.entities = new EntityManager(this);
    this.selectionBox = new SelectionBox(this);
    this.sky = new SkySystem(this);
    this.dayNight = new DayNight(this);

    // UI Handling (Handled by React, but engine needs to signal ready)
    this.viewmodel = new Viewmodel(this);
    this.particles = new ParticleSystem(this);

    setLoadingProgress(100, 'Ready!');
    setTimeout(() => {
      hideLoadingScreen();
      this.emit('stateChange', 'menu');
    }, 300);

    // Resize
    window.addEventListener('resize', () => {
      const ratio = window.innerWidth / window.innerHeight;
      this.camera.change(ratio);
    });

    // Render loop
    this.running = true;
    this._renderAccum = 0;
    const tick = () => {
      if (!this.running) return;
      requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(now - this._lastTime, 100);
      this._lastTime = now;

      // FPS counter (counts render frames)
      this._fpsTime += dt;

      // Always run game logic at native refresh rate
      this.emit('tick', dt);
      this._tick(dt);

      // Frame-rate cap: only render when enough time has elapsed
      const frameSkip  = settings.get('frameSkip') !== false;
      const fpsCap     = settings.get('fpsCap') || 0;
      const targetMs   = fpsCap > 0 ? 1000 / fpsCap : 0;

      this._renderAccum += dt;
      const shouldRender = !frameSkip || targetMs === 0 || this._renderAccum >= targetMs;
      if (shouldRender) {
        if (frameSkip && targetMs > 0) this._renderAccum %= targetMs;
        this._fpsFrames++;
        if (this._fpsTime >= 500) {
          this._fps = Math.round(this._fpsFrames * 1000 / this._fpsTime);
          this._fpsFrames = 0;
          this._fpsTime = 0;
        }
        this.renderer.render();
      }
    };
    requestAnimationFrame(tick);
  }

  _tick(dt) {
    this.viewmodel?.update(dt / 1000);
    this.particles?.update(dt / 1000);
    
    // Update Day/Night and Lighting
    if (this.dayNight) {
        this.dayNight.update(dt / 1000);
        this.renderer.setDayNight(this.dayNight.lightDirection, this.dayNight.skyColor, this.dayNight.intensity);
    }
    
    this.selectionBox?.update();

    this.redstone?.update();

    if (this.gameActive && !this.paused) {
      this.network.update(dt / 1000);
      this.entities.update(dt / 1000);

      // Update Item Entities (drops)
      for (let i = this._itemEntities.length - 1; i >= 0; i--) {
        const item = this._itemEntities[i];
        if (item.update(dt)) {
            this._itemEntities.splice(i, 1);
        }
      }
    }
  }

  _spawnPlayer() {
    this.camera.setPosition(new Vector3(128, 75, 128));
  }

  startGame(params = {}) {
    this.currentWorld = this.worldManager.createWorld(params.name || 'New World');
    this.currentWorld._startTime = Date.now();

    // Apply world creation params
    if (params.gameMode)   this.settings.set('gameMode',   params.gameMode);
    if (params.difficulty) this.settings.set('difficulty', params.difficulty);
    if (params.seed)       this.currentWorld.seed = params.seed;
    if (params.type)       this.currentWorld.type = params.type;

    this.gameActive = true;
    this.emit('stateChange', 'playing');
    this._spawnPlayer();

    if (!this.controls) {
      this.controls = new FirstPersonControls(document, this);
    } else {
      // Re-sync gameMode on the existing controls instance
      this.controls.gameMode = this.settings.get('gameMode') || 'survival';
    }

    // Disable gravity / enable flight for creative/spectator
    const mode = this.settings.get('gameMode');
    if (mode === 'creative' || mode === 'spectator') {
      if (this.controls) this.controls.isFlying = true;
    }

    // Peaceful: disable survival hunger/damage
    if (params.difficulty === 'peaceful' && this.survival) {
      this.survival._peaceful = true;
    }

    setTimeout(() => this._spawnInitialMobs(), 3000);
  }

  _spawnInitialMobs() {
    if (!this.entities || !this.gameActive) return;
    const cx = 128, cz = 128;
    const spread = 30;
    const mobTypes = ['sheep', 'pig'];
    for (let i = 0; i < 12; i++) {
      const type = mobTypes[Math.floor(Math.random() * mobTypes.length)];
      const x = cx + (Math.random() - 0.5) * spread * 2;
      const z = cz + (Math.random() - 0.5) * spread * 2;
      // Find ground Y
      let y = 80;
      for (let scanY = 80; scanY > 40; scanY--) {
        const b = this.chunkManager?.getBlockAt(Math.floor(x), scanY, Math.floor(z));
        if (b?.solid) { y = scanY + 1; break; }
      }
      this.entities.spawn(type, x, y + 0.5, z);
    }
  }

  toggleInventory(containerData = null) {
    if (!this.gameActive) return;
    
    if (containerData && containerData.type === 'chest') {
        // Opening a specific world container (Chest)
        const { x, y, z } = containerData;
        const chunk = this.chunkManager.getChunkAt(x, y, z);
        if (chunk) {
            // Local chunk coords
            const lx = ((Math.floor(x) % 16) + 16) % 16;
            const lz = ((Math.floor(z) % 16) + 16) % 16;
            const key = `${lx},${Math.floor(y)},${lz}`;
            const entity = chunk.blockEntities.get(key);
            if (entity) {
                this.activeContainer = { ...entity, title: containerData.title || 'Chest', x, y, z };
            }
        }
    } else if (containerData) {
        // Fallback for other types
        this.activeContainer = containerData;
    } else {
        this.activeContainer = null;
    }

    const showing = !this.controls.inventoryOpen;
    this.controls.inventoryOpen = showing;
    
    if (showing) {
        this.controls.unlock();
    } else {
        this.controls.lock();
        this.activeContainer = null;
    }
    
    this.emit('inventoryToggle', showing);
  }

  pause() {
    if (!this.gameActive || this.paused) return;
    this.paused = true;
    this.controls?.unlock?.();
    this.emit('stateChange', 'paused');
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.controls?.lock?.();
    this.emit('stateChange', 'playing');
  }

  backToMenu() {
    this.paused     = false;
    this.gameActive = false;
    this.controls?.unlock?.();
    this.emit('stateChange', 'menu');
  }

  async reloadTexturePack(packName, zipOverrides = null) {
    setTexturePack(packName);
    const atlas = await Block.parseDefinitions(
      this.renderer.context, '/blocks.json', zipOverrides
    );
    this.renderer.setAtlas(atlas);
    for (const chunk of this.chunkManager.loadedChunks.values()) {
      chunk.render();
    }
  }

  destroy() {
    this.running = false;
  }
}
