import { Entity } from "./Entity.js";
import { Block } from "./Block.js";
import { Vector3 } from "./math/Vector3.js";
import { Noise } from "./math/Noise.js";
import { LootSystem } from "../systems/LootSystem.js";

function randomSeed () {
	return (Date.now() % 65535) + 1
}
let terrainNoise = new Noise(12345);

export class Chunk {
	constructor (gl, width, height, manager) {
		this.manager = manager;
		this.engine = manager.game;
		this.width = width;
		this.height = height;
		this.size = width;
		
		// Update noise if seed changed
		const worldSeed = this.engine.currentWorld?.seed || 12345;
		if (terrainNoise._seed !== worldSeed) {
			terrainNoise = new Noise(worldSeed);
			terrainNoise._seed = worldSeed;
		}
		
		// Use a flat TypedArray for performance and memory efficiency
		this.data = new Uint16Array(width * width * height);
		
		this.stats = {
			faces: 0,
			triangles: 0,
			vertices: 0
		};

		this.entity = new Entity(gl);
		this.secondaryEntity = new Entity(gl);
		this.secondaryEntity.transparent = true;

        this.blockEntities = new Map(); // Store inventories/metadata for specific blocks (Chests, Furnaces)
	}

    _getLootTableForBiome(biome) {
        if (biome === 1) return 'desert_pyramid';
        if (biome === 4) return 'jungle_temple';
        if (biome === 3) return 'village_temple';
        return 'village_weaponsmith';
    }

	get ox() { return this.entity.position.x; }
	get oz() { return this.entity.position.z; }

	getIndex(x, y, z) {
		return y * this.width * this.width + z * this.width + x;
	}

	setLocal(lx, ly, lz, id) {
		if (lx < 0 || lx >= this.width || ly < 0 || ly >= this.height || lz < 0 || lz >= this.width) return;
		this.data[this.getIndex(lx, ly, lz)] = id ?? 0;
	}

	getLocal(lx, ly, lz) {
		if (lx < 0 || lx >= this.width || ly < 0 || ly >= this.height || lz < 0 || lz >= this.width) return 0;
		return this.data[this.getIndex(lx, ly, lz)];
	}

	release () {
		this.entity.release();
		this.secondaryEntity.release();
	}

	setPosition (v) {
		this.entity.setPosition(v);
		this.secondaryEntity.setPosition(v);
	}

	getPosition () {
		return this.entity.position;
	}

	setBlockAt (x, y, z, blockId) {
		if (y < 0 || y >= this.height) return;
		
		const w = this.width;
		x = ((x % w) + w) % w;
		z = ((z % w) + w) % w;

		const index = this.getIndex(x, y, z);
		this.data[index] = blockId;
		
        const posKey = `${x},${y},${z}`;
        // Handle Block Entities (Chests, etc)
        if (blockId === 42) { // Chest
            if (!this.blockEntities.has(posKey)) {
                // Determine loot table based on biome or depth
                const table = y < 30 ? 'dungeon' : 'village_weaponsmith';
                const loot = LootSystem.generateLoot(table);
                const inventory = new Array(27).fill(null);
                loot.forEach(l => {
                    if (l.slot < 27) inventory[l.slot] = l.item;
                });
                this.blockEntities.set(posKey, { type: 'chest', inventory });
            }
        } else if (this.blockEntities.has(posKey)) {
            this.blockEntities.delete(posKey);
        }

		this.render();
		
		// Re-render neighbours if block is on edge
		const pos = this.getPosition();
		const kx = pos.x / w;
		const kz = pos.z / w;

		if (x === 0) this.manager.get(`${kx-1}_${kz}`)?.render();
		if (x === w - 1) this.manager.get(`${kx+1}_${kz}`)?.render();
		if (z === 0) this.manager.get(`${kx}_${kz-1}`)?.render();
		if (z === w - 1) this.manager.get(`${kx}_${kz+1}`)?.render();
	}

	getBlockAt(x, y, z) {
		if (y < 0 || y >= this.height) return 0;
		const w = this.width;
		
		// If outside this chunk, ask manager
		if (x < 0 || x >= w || z < 0 || z >= w) {
			const pos = this.getPosition();
			return this.manager.getBlockAt(pos.x + x, y, pos.z + z);
		}

		return this.data[this.getIndex(x, y, z)];
	}

	generate () {
		const pos = this.getPosition();
		const w = this.width;
		const h = this.height;
		const worldType = this.engine.currentWorld?.type || 'infinite';

		// Handle Special World Types
		if (worldType === 'flat') {
			for (let x = 0; x < w; x++) {
				for (let z = 0; z < w; z++) {
					for (let y = 0; y < 4; y++) {
						const idx = this.getIndex(x, y, z);
						if (y === 0) this.data[idx] = 9; // Bedrock
						else if (y < 3) this.data[idx] = 2; // Dirt
						else this.data[idx] = 5; // Grass
					}
					// Air for the rest
					for (let y = 4; y < h; y++) {
						this.data[this.getIndex(x, y, z)] = 1;
					}
				}
			}
			this.render();
			return;
		}

		if (worldType === 'void') {
			this.data.fill(1); // All air
			// Place a single starting block at (128, 70, 128) if this is the spawn chunk
			if (pos.x <= 128 && pos.x + w > 128 && pos.z <= 128 && pos.z + w > 128) {
				const lx = 128 - pos.x;
				const lz = 128 - pos.z;
				this.data[this.getIndex(lx, 70, lz)] = 40; // Crafting Table as a starting platform
			}
			this.render();
			return;
		}

		this.manager.getWorldGen().fillChunk(this);
		this.render();
	}

	render () {
		const primaryFaces = [];
		const secondaryFaces = [];
		const w = this.width;
		const h = this.height;

        // 1. Pre-calculate Sunlight Heightmap
        const heightMap = new Int16Array(w * w);
        heightMap.fill(0);
        for (let x = 0; x < w; x++) {
            for (let z = 0; z < w; z++) {
                for (let y = h - 1; y >= 0; y--) {
                    const blockId = this.data[this.getIndex(x, y, z)];
                    const block = Block.get(blockId);
                    if (block && block.solid && !block.transparent) {
                        heightMap[x * w + z] = y;
                        break;
                    }
                }
            }
        }

		// 2. Optimized Lighting & AO Helpers (Hoisted)
		const getL = (lx, ly, lz) => {
			if (lx < 0 || lx >= w || lz < 0 || lz >= w) return 1.0; 
			const skyY = heightMap[lx * w + lz];
			if (ly >= skyY) return 1.0;
			if (ly >= skyY - 8) return 0.8; // Bright surface ambient
			return 0.2; // Deep caves
		};

		const getAO = (o1, o2, o12) => (o1 + o2 + o12 > 1) ? 0.75 : (o1 + o2 + o12 > 0 ? 0.88 : 1.0);

		for (let y = 0; y < h; y++) {
			for (let z = 0; z < w; z++) {
				for (let x = 0; x < w; x++) {
					const blockId = this.data[this.getIndex(x, y, z)];
					if (blockId <= 1) continue; // Air or invalid

					const block = Block.get(blockId);
					if (!block) continue;

					const pos = [x, y, z];
					
					// Sunlight check (pre-loop)
					const lightLevel = getL(x, y, z);
					const lights = [lightLevel, lightLevel, lightLevel, lightLevel];
					
					// Special Foliage/Individual Rendering (Cross-Mesh)
					if (block.individual) {
						const tex = block.getTexture("top") || block.getTexture("front");
						const cross1 = [new Vector3(1, 1, 1), new Vector3(0, 1, 0), new Vector3(0, 0, 0), new Vector3(1, 0, 1)];
						const cross2 = [new Vector3(1, 1, 0), new Vector3(0, 1, 1), new Vector3(0, 0, 1), new Vector3(1, 0, 0)];
						const cross1Back = [cross1[1], cross1[0], cross1[3], cross1[2]];
						const cross2Back = [cross2[1], cross2[0], cross2[3], cross2[2]];
						const fNorms = [Vector3.UP, Vector3.UP, Vector3.UP, Vector3.UP];
                        
                        const tintFlag = block.tintable ? 10.0 : 0.0;
                        const tLights = lights.map(l => l + tintFlag);

						secondaryFaces.push([cross1, pos, tex, fNorms, tLights]);
						secondaryFaces.push([cross1Back, pos, tex, fNorms, tLights]);
						secondaryFaces.push([cross2, pos, tex, fNorms, tLights]);
						secondaryFaces.push([cross2Back, pos, tex, fNorms, tLights]);
						continue;
					}

					if (!block.solid) continue;

					const neighbors = [
						this.getBlockAt(x, y + 1, z), // TOP
						this.getBlockAt(x, y - 1, z), // BOTTOM
						this.getBlockAt(x, y, z + 1), // FRONT
						this.getBlockAt(x, y, z - 1), // BACK
						this.getBlockAt(x - 1, y, z), // LEFT
						this.getBlockAt(x + 1, y, z)  // RIGHT
					];

					const targetFaces = (block.individual || block.transparent) ? secondaryFaces : primaryFaces;
					const sides = ["top", "bottom", "front", "back", "left", "right"];
					const vectors = [Block.TOP, Block.BOTTOM, Block.FRONT, Block.BACK, Block.LEFT, Block.RIGHT];
					const normals = [
						[Vector3.UP, Vector3.UP, Vector3.UP, Vector3.UP],
						[Vector3.DOWN, Vector3.DOWN, Vector3.DOWN, Vector3.DOWN],
						[Vector3.FORWARD, Vector3.FORWARD, Vector3.FORWARD, Vector3.FORWARD],
						[Vector3.BACKWARD, Vector3.BACKWARD, Vector3.BACKWARD, Vector3.BACKWARD],
						[Vector3.LEFT, Vector3.LEFT, Vector3.LEFT, Vector3.LEFT],
						[Vector3.RIGHT, Vector3.RIGHT, Vector3.RIGHT, Vector3.RIGHT]
					];

					// Universal side offsets for AO sampling
					const sideOffsets = [
						[[1,1,0],[0,1,1],[1,1,1], [-1,1,0],[0,1,1],[-1,1,1], [-1,1,0],[0,1,-1],[-1,1,-1], [1,1,0],[0,1,-1],[1,1,-1]], // TOP
						[[1,-1,0],[0,-1,1],[1,-1,1], [-1,-1,0],[0,-1,1],[-1,-1,1], [-1,-1,0],[0,-1,-1],[-1,-1,-1], [1,-1,0],[0,-1,-1],[1,-1,-1]], // BOTTOM
						[[1,0,1],[0,1,1],[1,1,1], [-1,0,1],[0,1,1],[-1,1,1], [-1,0,1],[0,-1,1],[-1,-1,1], [1,0,1],[0,-1,1],[1,-1,1]], // FRONT
						[[-1,0,-1],[0,1,-1],[-1,1,-1], [1,0,-1],[0,1,-1],[1,1,-1], [1,0,-1],[0,-1,-1],[1,-1,-1], [-1,0,-1],[0,-1,-1],[-1,-1,-1]], // BACK
						[[-1,0,1],[-1,1,0],[-1,1,1], [-1,0,-1],[-1,1,0],[-1,1,-1], [-1,0,-1],[-1,-1,0],[-1,-1,-1], [-1,0,1],[-1,-1,0],[-1,-1,1]], // LEFT
						[[1,0,-1],[1,1,0],[1,1,-1], [1,0,1],[1,1,0],[1,1,1], [1,0,1],[1,-1,0],[1,-1,1], [1,0,-1],[1,-1,0],[1,-1,-1]]  // RIGHT
					];

					for (let s = 0; s < 6; s++) {
						const neighborRes = neighbors[s];
						const neighbor = (typeof neighborRes === 'number') ? Block.get(neighborRes) : neighborRes;
						
						if (!neighbor || !neighbor.solid || (neighbor.transparent && !block.transparent)) {
							let tintFlag = 0.0;
							if (block.tintable) {
                                // For grass blocks, only tint the top face
                                if (block.id === 5) {
                                    if (s === 0) tintFlag = 10.0;
                                } else {
                                    tintFlag = 10.0;
                                }
							}

							const vLights = new Float32Array(4);
							const l0 = getL(x, y, z);
							const offsets = sideOffsets[s];

							for (let v = 0; v < 4; v++) {
								const o = offsets[v];
								const b1 = this.getBlockAt(x + o[0][0], y + o[0][1], z + o[0][2]);
								const b2 = this.getBlockAt(x + o[1][0], y + o[1][1], z + o[1][2]);
								const b12 = this.getBlockAt(x + o[2][0], y + o[2][1], z + o[2][2]);
								
								const occ1 = (b1 && (typeof b1 === 'object' ? b1.solid : b1 > 1)) ? 1 : 0;
								const occ2 = (b2 && (typeof b2 === 'object' ? b2.solid : b2 > 1)) ? 1 : 0;
								const occ12 = (b12 && (typeof b12 === 'object' ? b12.solid : b12 > 1)) ? 1 : 0;

								const l1 = getL(x + o[0][0], y + o[0][1], z + o[0][2]);
								const l2 = getL(x + o[1][0], y + o[1][1], z + o[1][2]);
								const l12 = getL(x + o[2][0], y + o[2][1], z + o[2][2]);
								
								vLights[v] = ((l0 + l1 + l2 + l12) / 4) * getAO(occ1, occ2, occ12) + tintFlag;
							}

                            // Bushy Leaves jitter logic
                            let finalVertices = vectors[s];
                            if (block.name.includes('leaves')) {
                                const hash = (val) => (Math.sin(val * 12.9898) * 43758.5453) % 1;
                                finalVertices = vectors[s].map((vtx) => {
                                    // Use absolute vertex position for the seed so neighbors match
                                    const vx = x + vtx.x;
                                    const vy = y + vtx.y;
                                    const vz = z + vtx.z;
                                    const seed = vx * 1331 + vy * 73 + vz * 47;
                                    
                                    const jx = (hash(seed) * 0.12) - 0.06;
                                    const jy = (hash(seed + 1) * 0.12) - 0.06;
                                    const jz = (hash(seed + 2) * 0.12) - 0.06;
                                    return new Vector3(vtx.x + jx, vtx.y + jy, vtx.z + jz);
                                });
                            }

							targetFaces.push([finalVertices, pos, block.getTexture(sides[s]), normals[s], vLights]);
						}
					}
				}
			}
		}

		this.entity.generateFromFaces(primaryFaces);
		this.secondaryEntity.generateFromFaces(secondaryFaces);

		const count = primaryFaces.length + secondaryFaces.length;
		this.stats = { faces: count, triangles: count * 2, vertices: count * 4 };
	}
	save () {
		return new Uint16Array(this.data);
	}

	load (data) {
		this.data.set(data);
	}
}
