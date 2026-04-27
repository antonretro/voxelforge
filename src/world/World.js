import * as BABYLON from '@babylonjs/core';
import { Chunk } from './Chunk.js';
import { WorldGen } from './WorldGen.js';
import { LightEngine } from './LightEngine.js';

const WORLD_WIDTH  = 256; // X blocks
const WORLD_DEPTH  = 256; // Z blocks
const WORLD_HEIGHT = 128; // Y blocks
const CHUNK_SIZE   = 32;

const CX = WORLD_WIDTH  / CHUNK_SIZE; // 8
const CY = WORLD_HEIGHT / CHUNK_SIZE; // 4
const CZ = WORLD_DEPTH  / CHUNK_SIZE; // 8

export class World {
  constructor(engine, options = {}) {
    this.engine = engine;
    this.scene = engine.scene;
    this.blockRegistry = engine.blockRegistry;
    this.seed = options.seed ?? 12345;
    this.active = false;

    /** Flat array of Chunk objects, indexed by cx + CX*(cy + CY*cz) */
    this.chunks = new Array(CX * CY * CZ).fill(null);
    this.gen = new WorldGen(this.seed);
    this.lightEngine = new LightEngine(this);

    // Changed-blocks store for saves & multiplayer sync
    this.changedBlocks = new Map(); // "x,y,z" -> blockId

    this._buildInProgress = false;
  }

  reset(seed) {
    this.seed = seed;
    this.gen = new WorldGen(seed);
    this.changedBlocks.clear();
    for (let i = 0; i < this.chunks.length; i++) {
      this.chunks[i]?.dispose();
      this.chunks[i] = null;
    }
  }

  async generate() {
    this._buildInProgress = true;
    for (let cy = 0; cy < CY; cy++) {
      for (let cz = 0; cz < CZ; cz++) {
        for (let cx = 0; cx < CX; cx++) {
          const chunk = new Chunk(this, cx, cy, cz);
          this.chunks[this._idx(cx, cy, cz)] = chunk;
          this.gen.fillChunk(chunk);
        }
      }
    }
    this._buildInProgress = false;

    // Rebuild all meshes
    for (const chunk of this.chunks) chunk?.buildMesh();
  }

  // --- Block access ---

  getBlock(x, y, z) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= WORLD_DEPTH) return 0;
    const chunk = this.getChunkAt(x, y, z);
    if (!chunk) return 0;
    return chunk.getLocal(x & 31, y & 31, z & 31);
  }

  setBlock(x, y, z, id, { remote = false } = {}) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= WORLD_DEPTH) return;
    const chunk = this.getChunkAt(x, y, z);
    if (!chunk) return;

    chunk.setLocal(x & 31, y & 31, z & 31, id);
    this.changedBlocks.set(`${x},${y},${z}`, id);

    if (!remote) {
      chunk.buildMesh();
      this._rebuildNeighborFaces(x, y, z);
      this.engine.network.broadcastBlockSet(x, y, z, id);
    } else {
      chunk.buildMesh();
    }
  }

  getChunkAt(x, y, z) {
    const cx = x >> 5, cy = y >> 5, cz = z >> 5;
    return this.chunks[this._idx(cx, cy, cz)] ?? null;
  }

  _idx(cx, cy, cz) { return cx + CX * (cy + CY * cz); }

  _rebuildNeighborFaces(x, y, z) {
    const neighbors = [
      [x-1,y,z],[x+1,y,z],[x,y-1,z],[x,y+1,z],[x,y,z-1],[x,y,z+1]
    ];
    const rebuilt = new Set();
    for (const [nx,ny,nz] of neighbors) {
      const chunk = this.getChunkAt(nx,ny,nz);
      if (chunk && !rebuilt.has(chunk)) {
        chunk.buildMesh();
        rebuilt.add(chunk);
      }
    }
  }

  // --- Raycasting ---

  raycast(origin, direction, maxDist = 8) {
    const step = 0.05;
    let px = origin.x, py = origin.y, pz = origin.z;
    let lastBx = null, lastBy = null, lastBz = null;

    for (let d = 0; d < maxDist; d += step) {
      const bx = Math.floor(px), by = Math.floor(py), bz = Math.floor(pz);
      if (bx !== lastBx || by !== lastBy || bz !== lastBz) {
        const id = this.getBlock(bx, by, bz);
        if (id !== 0) {
          return {
            hit: true, x: bx, y: by, z: bz, id,
            face: { x: lastBx - bx, y: lastBy - by, z: lastBz - bz },
            placeX: lastBx, placeY: lastBy, placeZ: lastBz,
          };
        }
        lastBx = bx; lastBy = by; lastBz = bz;
      }
      px += direction.x * step;
      py += direction.y * step;
      pz += direction.z * step;
    }
    return { hit: false };
  }

  isOpaque(x, y, z) {
    const id = this.getBlock(x, y, z);
    if (id === 0) return false;
    const block = this.blockRegistry.getBlock(this._idToString(id));
    return block?.solid ?? true;
  }

  _idToString(numericId) {
    // Placeholder — BlockRegistry will map numeric IDs once fully built
    return numericId > 0 ? 'stone' : 'air';
  }

  // Utility: column height (highest solid block)
  getHeight(x, z) {
    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
      if (this.getBlock(x, y, z) !== 0) return y + 1;
    }
    return 0;
  }

  // Constants exposed for other systems
  get width()  { return WORLD_WIDTH; }
  get height() { return WORLD_HEIGHT; }
  get depth()  { return WORLD_DEPTH; }
  get chunkSize() { return CHUNK_SIZE; }
  get chunksX() { return CX; }
  get chunksY() { return CY; }
  get chunksZ() { return CZ; }
}
