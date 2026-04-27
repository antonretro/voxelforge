import * as BABYLON from '@babylonjs/core';

const CS = 32;

// Face definitions: [dx,dy,dz, normal index, uv rotation]
const FACES = [
  { dir: [0, 1, 0], corners: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]], name: 'top'    },
  { dir: [0,-1, 0], corners: [[0,0,1],[0,0,0],[1,0,0],[1,0,1]], name: 'bottom' },
  { dir: [ 1, 0, 0], corners: [[1,0,1],[1,1,1],[1,1,0],[1,0,0]], name: 'right'  },
  { dir: [-1, 0, 0], corners: [[0,0,0],[0,1,0],[0,1,1],[0,0,1]], name: 'left'   },
  { dir: [0, 0, 1],  corners: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]], name: 'front'  },
  { dir: [0, 0,-1],  corners: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], name: 'back'   },
];

export class ChunkMesher {
  constructor(world, chunk) {
    this.world = world;
    this.chunk = chunk;
    this.registry = world.blockRegistry;
  }

  build() {
    const oPositions = [], oNormals = [], oUVs = [], oIndices = [];
    const tPositions = [], tNormals = [], tUVs = [], tIndices = [];
    let oIdx = 0, tIdx = 0;

    const { ox, oy, oz } = this.chunk;

    for (let lz = 0; lz < CS; lz++) {
      for (let ly = 0; ly < CS; ly++) {
        for (let lx = 0; lx < CS; lx++) {
          const id = this.chunk.getLocal(lx, ly, lz);
          if (id === 0) continue;

          const blockId = this._numericToId(id);
          const def = this.registry.getBlock(blockId);
          if (!def || def.id === 'air') continue;

          const wx = ox + lx, wy = oy + ly, wz = oz + lz;
          const isTransparent = def.renderType === 'transparent_cube' ||
                                def.renderType === 'liquid' ||
                                (def.renderType === 'cross') ||
                                def.id.includes('glass') || def.id.includes('water') || def.id.includes('leaves');

          const pos  = isTransparent ? tPositions : oPositions;
          const nrm  = isTransparent ? tNormals   : oNormals;
          const uvs  = isTransparent ? tUVs        : oUVs;
          const idx  = isTransparent ? tIndices    : oIndices;
          const base = isTransparent ? tIdx : oIdx;

          if (def.renderType === 'cross') {
            this._addCross(lx, ly, lz, def, pos, nrm, uvs, idx, base);
            if (isTransparent) tIdx += 8; else oIdx += 8;
            continue;
          }

          let facesAdded = 0;
          for (const face of FACES) {
            const [dx, dy, dz] = face.dir;
            const nx = wx + dx, ny = wy + dy, nz = wz + dz;
            const neighbor = this.world.getBlock(nx, ny, nz);
            if (neighbor !== 0 && !this._shouldShowFace(id, neighbor)) continue;

            const texName = this._getFaceTex(def, face.name);
            const uv = this.registry.getUV(texName);

            for (const [cx, cy, cz] of face.corners) {
              pos.push(lx + cx, ly + cy, lz + cz);
              nrm.push(dx, dy, dz);
              uvs.push(
                cx === 0 && cz === 0 ? uv.u0 : cx === 0 ? uv.u0 : uv.u1,
                cy === 0 && cz === 0 ? uv.v0 : cy === 0 ? uv.v0 : uv.v1,
              );
            }
            const b = base + facesAdded * 4;
            idx.push(b, b+1, b+2, b, b+2, b+3);
            facesAdded++;
          }

          if (isTransparent) tIdx += facesAdded * 4;
          else               oIdx += facesAdded * 4;
        }
      }
    }

    return {
      opaque:      oPositions.length > 0 ? this._makeVertexData(oPositions, oNormals, oUVs, oIndices) : null,
      transparent: tPositions.length > 0 ? this._makeVertexData(tPositions, tNormals, tUVs, tIndices) : null,
    };
  }

  _makeVertexData(pos, nrm, uvs, idx) {
    const vd = new BABYLON.VertexData();
    vd.positions = pos;
    vd.indices   = idx;
    vd.uvs       = uvs;
    if (nrm.length === 0) {
      const n = [];
      BABYLON.VertexData.ComputeNormals(pos, idx, n);
      vd.normals = n;
    } else {
      vd.normals = nrm;
    }
    return vd;
  }

  _shouldShowFace(blockId, neighborId) {
    if (neighborId === 0) return true; // neighbor is air
    const bDef = this.registry.getBlock(this._numericToId(blockId));
    const nDef = this.registry.getBlock(this._numericToId(neighborId));
    if (!nDef || !nDef.solid) return true;
    if (bDef?.renderType === 'transparent_cube' && nDef?.renderType === 'transparent_cube') return false;
    return !nDef.solid;
  }

  _getFaceTex(def, faceName) {
    const t = def.textures;
    if (!t) return 'stone';
    if (faceName === 'top')    return t.top    ?? t.all ?? t.side ?? 'stone';
    if (faceName === 'bottom') return t.bottom ?? t.all ?? t.side ?? 'stone';
    return t.side ?? t.all ?? 'stone';
  }

  _addCross(lx, ly, lz, def, pos, nrm, uvs, idx, base) {
    const texName = def.textures?.all ?? def.textures?.side ?? 'dandelion';
    const uv = this.registry.getUV(texName);
    // Two diagonal quads
    const quads = [
      [[0,0,0],[0,1,0],[1,1,1],[1,0,1]],
      [[1,0,0],[1,1,0],[0,1,1],[0,0,1]],
    ];
    quads.forEach((quad, qi) => {
      quad.forEach(([cx,cy,cz]) => {
        pos.push(lx+cx, ly+cy, lz+cz);
        nrm.push(0, 0, 0);
      });
      uvs.push(uv.u0,uv.v0, uv.u0,uv.v1, uv.u1,uv.v1, uv.u1,uv.v0);
      const b = base + qi * 4;
      idx.push(b,b+1,b+2, b,b+2,b+3);
    });
  }

  _numericToId(numericId) {
    // Mapping built during world generation
    return this.world._numericIdMap?.get(numericId) ?? 'stone';
  }
}
