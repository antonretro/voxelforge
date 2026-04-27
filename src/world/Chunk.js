import * as BABYLON from '@babylonjs/core';
import { ChunkMesher } from './ChunkMesher.js';

const CS = 32; // chunk size

export class Chunk {
  constructor(world, cx, cy, cz) {
    this.world = world;
    this.cx = cx;
    this.cy = cy;
    this.cz = cz;

    // World-space origin of this chunk
    this.ox = cx * CS;
    this.oy = cy * CS;
    this.oz = cz * CS;

    // Block storage: [x + CS*(y + CS*z)] = numeric block ID (0 = air)
    this.data = new Uint16Array(CS * CS * CS);

    this.mesh = null;
    this.alphaMesh = null;
    this.dirty = false;
  }

  getLocal(lx, ly, lz) {
    return this.data[lx + CS * (ly + CS * lz)];
  }

  setLocal(lx, ly, lz, id) {
    this.data[lx + CS * (ly + CS * lz)] = id;
    this.dirty = true;
  }

  buildMesh() {
    const mesher = new ChunkMesher(this.world, this);
    const { opaque, transparent } = mesher.build();

    const scene = this.world.scene;

    // Opaque mesh
    if (this.mesh) this.mesh.dispose();
    if (opaque) {
      this.mesh = new BABYLON.Mesh(`chunk_${this.cx}_${this.cy}_${this.cz}`, scene);
      opaque.applyToMesh(this.mesh, false);
      this.mesh.material = this.world.blockRegistry.opaqueMaterial;
      this.mesh.checkCollisions = true;
      this.mesh.receiveShadows = true;
      this.mesh.position.set(this.ox, this.oy, this.oz);
    } else {
      this.mesh = null;
    }

    // Transparent mesh (glass, water, leaves)
    if (this.alphaMesh) this.alphaMesh.dispose();
    if (transparent) {
      this.alphaMesh = new BABYLON.Mesh(`chunk_a_${this.cx}_${this.cy}_${this.cz}`, scene);
      transparent.applyToMesh(this.alphaMesh, false);
      this.alphaMesh.material = this.world.blockRegistry.alphaMaterial;
      this.alphaMesh.checkCollisions = false;
      this.alphaMesh.position.set(this.ox, this.oy, this.oz);
    } else {
      this.alphaMesh = null;
    }

    this.dirty = false;
  }

  dispose() {
    this.mesh?.dispose();
    this.alphaMesh?.dispose();
    this.mesh = null;
    this.alphaMesh = null;
  }
}
