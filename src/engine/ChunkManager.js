import { Vector3 } from "./math/Vector3.js";
import { Block } from "./Block.js";
import { Chunk } from "./Chunk.js";
import { raycast } from "./raycast.js";
import { WorldGen } from "../world/WorldGen.js";

export class ChunkManager {
	constructor (game, width, height, range) {
		this.chunkWidth = width;
		this.chunkHeight = height;
		this.viewDistance = range;
		this.game = game;
		this.engine = game;

		this.chunkTable = new Map();
		this.loadedChunks = new Map();
		this.chunkLeafData = new Map();
		this.game.on("tick", dt => this.onTick(dt));
		this.user = new Vector3(Infinity, Infinity, Infinity);
		this.renderQueue = [];
		this.renderSet = new Set();
	}
	raycast (start, direction, radius) {
		let hitBlock = null;
		let hitPos = null;
		let face = null;

		let px = start.x, py = start.y, pz = start.z;

		raycast(start, direction, radius, (x, y, z) => {
			const block = this.getBlockAt(x, y, z);
            // Allow hitting solid blocks OR blocks with a visual presence (foliage)
			if (block && (block.solid || block.texture || block.top)) {
				hitBlock = block;
				hitPos = { x, y, z };
				// Simple face detection based on previous voxel
				face = new Vector3(
					Math.round(px) - x,
					Math.round(py) - y,
					Math.round(pz) - z
				);
				return true;
			}
			px = x; py = y; pz = z;
		});

		return { hitBlock, hitPos, face };
	}
	getChunkLeafData (x, y) {
		const key = `${x}_${y}`;
		return this.chunkLeafData.get(key);
	}
	createChunkLeafData (x, y) {
		const key = `${x}_${y}`;

		// if we already have the leafdata, return it
		if (this.chunkLeafData.has(key))
			return this.chunkLeafData.get(key);

		// if the chunk exists it shouldn't have leaf data
		if (this.loadedChunks.has(key) || this.chunkTable.has(key))
			return false;

		const size = this.chunkWidth ** 2;
		const chunk = Array(size);

		this.chunkLeafData.set(key, chunk);

		return chunk;
	}
	getBlockAt (x, y, z) {

		x = Math.floor(x);
		y = Math.floor(y);
		z = Math.floor(z);

		if (y >= this.chunkHeight || y < 0)
			return null;

		const w = this.chunkWidth;
		const d = 1 / w;

		const chunkX = Math.floor(x * d);
		const chunkZ = Math.floor(z * d);
		const key = `${chunkX}_${chunkZ}`;

		const chunk = this.get(key);
		if (!chunk) return null;

		const id = chunk.data[chunk.getIndex(x % w < 0 ? x % w + w : x % w, y, z % w < 0 ? z % w + w : z % w)];
		return Block.get(id);
	}
	setBlockAt (x, y, z, block) {
		x = Math.round(x);
		y = Math.round(y);
		z = Math.round(z);

		if (y >= this.chunkHeight || y < 0)
			return null;

		const w = this.chunkWidth;
		const d = 1 / w;

		const chunkX = Math.floor(x * d);
		const chunkZ = Math.floor(z * d);
		const key = `${chunkX}_${chunkZ}`;

		const chunk = this.get(key);

		if (!chunk)
			return null;

		chunk.setBlockAt(x, y, z, block.id);
	}

	removeBlockAt (x, y, z) {
		x = Math.floor(x);
		y = Math.floor(y);
		z = Math.floor(z);

		if (y >= this.chunkHeight || y < 0)
			return null;

		const w = this.chunkWidth;
		const d = 1 / w;

		const chunkX = Math.floor(x * d);
		const chunkZ = Math.floor(z * d);
		const key = `${chunkX}_${chunkZ}`;

		const chunk = this.get(key);

		if (!chunk)
			return null;

		chunk.setBlockAt(x, y, z, 1);

		if (y + 1 < this.chunkHeight) {
			const above = this.getBlockAt(x, y + 1, z);
			if (above && above.individual) {
				this.removeBlockAt(x, y + 1, z);
			}
		}
	}
	get (key) {
		return this.loadedChunks.get(key);
	}
	getWorldGen () {
		const seed = this.game.currentWorld?.seed || 12345;
		if (!this._worldGen || this._worldGenSeed !== seed) {
			this._worldGen = new WorldGen(seed);
			this._worldGenSeed = seed;
		}
		return this._worldGen;
	}
	onTick (_dt) {
		const user = this.game
			.getCameraPosition()
			.divide(this.chunkWidth)
			.floor();

		const hasMoved = !user.equals(this.user);

		if (hasMoved)
			this.user.copy(user);

		const shouldBeLoaded = new Map();

		const range = this.viewDistance;
		const rangeSq = range ** 2;
		const n = range * 2 + 1;
		for (let x = 0; x < n; x ++) {
			for (let y = 0; y < n; y++) {
				if ((x - range) ** 2 + (y - range) ** 2 < rangeSq)
				{
					const xn = user.x + x - range;
					const yn = user.z + y - range;
					const key = `${xn}_${yn}`;

					shouldBeLoaded.set(key, new Vector3(
						xn * this.chunkWidth,
						0,
						yn * this.chunkWidth
					));
				}
			}
		}

		for (const [key, chunk] of this.loadedChunks) {
			if (shouldBeLoaded.has(key)) {
				shouldBeLoaded.delete(key);
			}
			else {
				this.chunkTable.set(key, chunk.save());
				this.unloadChunk(chunk);
				this.loadedChunks.delete(key);
			}
		}

		const renderQueue = Array.from(shouldBeLoaded).sort(([ a ], [ b ]) => {
			const [ ax, ay ] = a.split("_");
			const [ bx, by ] = b.split("_");

			const x = Math.abs(bx - user.x) - Math.abs(ax - user.x);
			const y = Math.abs(by - user.z) - Math.abs(ay - user.z);

			return x + y;
		});

		if (renderQueue.length) {
			const [key, position] = renderQueue.pop();
			const chunk = this.createChunk(position);
			const [ x, y ] = key.split("_");

			this.loadedChunks.set(key, chunk);

			if (this.chunkTable.has(key)) {
				chunk.load(this.chunkTable.get(key));
			}
			else {
				chunk.generate();
				this.chunkLeafData.delete(key);
			}

			// Mark this chunk and neighbors for rebuild
			chunk.dirty = true;
			const nKeys = [`${+x - 1}_${y}`, `${+x + 1}_${y}`, `${x}_${+y - 1}`, `${x}_${+y + 1}`];
			for (const nk of nKeys) {
				const n = this.loadedChunks.get(nk);
				if (n) n.dirty = true;
			}

			let chunks = 0;
			let triangles = 0;
			let vertices = 0;
			let faces = 0;
			for (const chunk of this.loadedChunks.values()) {
				chunks ++;
				triangles += chunk.stats.triangles;
				faces += chunk.stats.faces;
				vertices += chunk.stats.vertices;
			}

			console.log(`Chunks: ${chunks} Triangles: ${triangles} Faces: ${faces} Vertices: ${vertices}`);
		}

		// BUILD ONLY ONE DIRTY CHUNK PER FRAME TO STABILIZE FPS
		let built = 0;
		for (const chunk of this.loadedChunks.values()) {
			if (chunk.dirty) {
				chunk.render();
				chunk.dirty = false;
				built++;
				if (built >= 1) break; // Hard limit for stability
			}
		}
	}
	unloadChunk (chunk) {
		this.game.solidScene.remove(chunk.entity);
		this.game.transparentScene.remove(chunk.secondaryEntity);
		chunk.release();
	}
	createChunk (pos) {
		const chunk = new Chunk(this.game.renderer.context, this.chunkWidth, this.chunkHeight, this);
		chunk.setPosition(pos);
		this.game.solidScene.add(chunk.entity);
		this.game.transparentScene.add(chunk.secondaryEntity);
		// this.loadedChunks.add(chunk);

		return chunk;
	}
}
