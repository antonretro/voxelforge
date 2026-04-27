// Village generator — places Minecraft-style villages into chunks deterministically.
// Each chunk independently checks which village centers are nearby and places any
// buildings that overlap its 32x32 footprint. No cross-chunk state needed.

const VILLAGE_GRID   = 256; // one possible village per 256×256 block area
const VILLAGE_CHANCE = 0.45;
const VILLAGE_RADIUS = 72;  // how far buildings spread from center

export class VillageGen {
  constructor(seed) {
    this._seed = seed;
  }

  // ── Public entry point ─────────────────────────────────────────────────────
  fill(chunk, ox, oy, oz, getId, getHeight) {
    const centers = this._nearbyCenters(ox, oz);
    for (const [vcx, vcz] of centers) {
      const vcy = getHeight(vcx, vcz);
      this._buildVillage(chunk, ox, oy, oz, vcx, vcy, vcz, getId, getHeight);
    }
  }

  // ── Village layout ─────────────────────────────────────────────────────────
  _buildVillage(chunk, ox, oy, oz, cx, cy, cz, getId, getHeight) {
    const P = getId('oak_planks');
    const L = getId('oak_log');
    const C = getId('cobblestone');
    const G = getId('glass');
    const GR= getId('gravel');
    const W = getId('water');
    const S = getId('stone');
    const CH= getId('chest');
    const FN= getId('furnace');
    const CR= getId('crafting_table');
    const BK= getId('bookshelf');
    const DR= getId('dirt');
    const FM= getId('farmland');
    const WH= getId('wheat_stage7');
    const FC= getId('oak_fence');
    const LN= getId('lantern');
    const BL= getId('bell');
    const MS= getId('mossy_cobblestone');
    const AV= getId('anvil');

    // Gravel paths in a cross (40 blocks in each direction)
    for (let r = 1; r < 40; r++) {
      for (const [px, pz] of [[cx+r,cz],[cx-r,cz],[cx,cz+r],[cx,cz-r]]) {
        const ph = getHeight(px, pz);
        this._set(chunk, ox, oy, oz, px, ph, pz, GR);
      }
    }

    // Well at center
    this._buildWell(chunk, ox, oy, oz, cx, cy, cz, C, W, L, LN);

    // Bell post
    this._set(chunk, ox, oy, oz, cx + 2, cy + 1, cz, L);
    this._set(chunk, ox, oy, oz, cx + 2, cy + 2, cz, L);
    this._set(chunk, ox, oy, oz, cx + 2, cy + 3, cz, BL || LN);

    // Houses: N / S / E / W at ~22 blocks from center
    const hashes = [
      this._hash(cx,     cz + 1),
      this._hash(cx,     cz - 1),
      this._hash(cx + 1, cz),
      this._hash(cx - 1, cz),
    ];
    const offsets = [[0,22],[0,-22],[22,0],[-22,0]];
    for (let i = 0; i < 4; i++) {
      const [dx, dz] = offsets[i];
      const bx = cx + dx, bz = cz + dz;
      const by = getHeight(bx, bz);
      if (hashes[i] < 0.5) {
        this._buildSmallHouse(chunk, ox, oy, oz, bx, by, bz, P, L, G, LN);
      } else {
        this._buildLargeHouse(chunk, ox, oy, oz, bx, by, bz, P, L, G, LN, CR);
      }
    }

    // Blacksmith SE
    {
      const bx = cx + 30, bz = cz + 10;
      const by = getHeight(bx, bz);
      this._buildBlacksmith(chunk, ox, oy, oz, bx, by, bz, C, MS, FN, CH, AV, L);
    }

    // Library NW
    {
      const bx = cx - 28, bz = cz - 10;
      const by = getHeight(bx, bz);
      this._buildLibrary(chunk, ox, oy, oz, bx, by, bz, P, L, G, BK, LN);
    }

    // Farm SW
    {
      const bx = cx - 20, bz = cz + 30;
      const by = getHeight(bx, bz);
      this._buildFarm(chunk, ox, oy, oz, bx, by, bz, DR, FM, WH, FC, W);
    }

    // Second farm NE
    {
      const bx = cx + 20, bz = cz - 30;
      const by = getHeight(bx, bz);
      this._buildFarm(chunk, ox, oy, oz, bx, by, bz, DR, FM, WH, FC, W);
    }
  }

  // ── Building helpers ───────────────────────────────────────────────────────
  _buildWell(chunk, ox, oy, oz, cx, cy, cz, C, W, L, LN) {
    // 3×3 cobble base, water center
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this._set(chunk, ox, oy, oz, cx+dx, cy,   cz+dz, (dx===0&&dz===0) ? W : C);
        this._set(chunk, ox, oy, oz, cx+dx, cy-1,  cz+dz, C);
      }
    }
    // Four log corner pillars
    for (const [dx, dz] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      this._set(chunk, ox, oy, oz, cx+dx, cy+1, cz+dz, L);
      this._set(chunk, ox, oy, oz, cx+dx, cy+2, cz+dz, L);
    }
    // Cross beam top
    for (let dx = -1; dx <= 1; dx++) this._set(chunk, ox, oy, oz, cx+dx, cy+3, cz, L);
    for (let dz = -1; dz <= 1; dz++) this._set(chunk, ox, oy, oz, cx, cy+3, cz+dz, L);
    this._set(chunk, ox, oy, oz, cx, cy+4, cz, LN);
  }

  _buildSmallHouse(chunk, ox, oy, oz, cx, cy, cz, P, L, G, LN) {
    // 5×5 footprint, 3 walls high
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
        const corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
        this._set(chunk, ox, oy, oz, cx+dx, cy, cz+dz, P); // floor
        for (let dy = 1; dy <= 3; dy++) {
          if (dy === 3) { this._set(chunk, ox, oy, oz, cx+dx, cy+dy, cz+dz, P); continue; }
          if (!edge) continue;
          const isDoor = dx === 0 && dz === 2 && dy <= 2;
          const isWin  = dy === 2 && !corner && !isDoor;
          const id = isDoor ? 0 : isWin ? G : (corner ? L : P);
          this._set(chunk, ox, oy, oz, cx+dx, cy+dy, cz+dz, id);
        }
      }
    }
    // Gable roof
    for (let r = 0; r < 3; r++) {
      for (let dx = -(2+r); dx <= (2+r); dx++) {
        this._set(chunk, ox, oy, oz, cx+dx, cy+4+r, cz, P);
      }
    }
    // Interior lantern
    this._set(chunk, ox, oy, oz, cx, cy+3, cz-1, LN);
  }

  _buildLargeHouse(chunk, ox, oy, oz, cx, cy, cz, P, L, G, LN, CR) {
    // 7×5 footprint, 4 walls high
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const edge = Math.abs(dx) === 3 || Math.abs(dz) === 2;
        const corner = Math.abs(dx) === 3 && Math.abs(dz) === 2;
        this._set(chunk, ox, oy, oz, cx+dx, cy, cz+dz, P); // floor
        for (let dy = 1; dy <= 4; dy++) {
          if (dy === 4) { this._set(chunk, ox, oy, oz, cx+dx, cy+dy, cz+dz, P); continue; }
          if (!edge) continue;
          const isDoor = dx === 0 && dz === 2 && dy <= 2;
          const isWin  = dy === 2 && !corner && !isDoor;
          const id = isDoor ? 0 : isWin ? G : (corner ? L : P);
          this._set(chunk, ox, oy, oz, cx+dx, cy+dy, cz+dz, id);
        }
      }
    }
    // Crafting table inside
    this._set(chunk, ox, oy, oz, cx + 2, cy + 1, cz - 1, CR);
    // Lanterns
    this._set(chunk, ox, oy, oz, cx, cy + 4, cz - 1, LN);
    this._set(chunk, ox, oy, oz, cx, cy + 4, cz + 1, LN);
    // Gable roof
    for (let r = 0; r < 4; r++) {
      for (let dx = -(3+r); dx <= (3+r); dx++) {
        this._set(chunk, ox, oy, oz, cx+dx, cy+5+r, cz, P);
      }
    }
  }

  _buildBlacksmith(chunk, ox, oy, oz, cx, cy, cz, C, MS, FN, CH, AV, L) {
    // 6×5 cobblestone structure
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const edge = Math.abs(dx) === 3 || Math.abs(dz) === 2;
        const corner = Math.abs(dx) === 3 && Math.abs(dz) === 2;
        this._set(chunk, ox, oy, oz, cx+dx, cy, cz+dz, C);
        for (let dy = 1; dy <= 3; dy++) {
          if (dy === 3) { this._set(chunk, ox, oy, oz, cx+dx, cy+dy, cz+dz, C); continue; }
          if (!edge) continue;
          const isDoor = dx === 0 && dz === 2 && dy <= 2;
          this._set(chunk, ox, oy, oz, cx+dx, cy+dy, cz+dz, isDoor ? 0 : (corner ? L : (dy===2 ? MS : C)));
        }
      }
    }
    // Interior: furnace, chest, anvil
    this._set(chunk, ox, oy, oz, cx - 2, cy + 1, cz - 1, FN);
    this._set(chunk, ox, oy, oz, cx + 2, cy + 1, cz - 1, CH);
    this._set(chunk, ox, oy, oz, cx,     cy + 1, cz - 1, AV);
  }

  _buildLibrary(chunk, ox, oy, oz, cx, cy, cz, P, L, G, BK, LN) {
    // 5×4 footprint, 4 walls high
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const edge = Math.abs(dx) === 2 || Math.abs(dz) === 1;
        const corner = Math.abs(dx) === 2 && Math.abs(dz) === 1;
        this._set(chunk, ox, oy, oz, cx+dx, cy, cz+dz, P);
        for (let dy = 1; dy <= 4; dy++) {
          if (dy === 4) { this._set(chunk, ox, oy, oz, cx+dx, cy+dy, cz+dz, P); continue; }
          if (!edge) continue;
          const isDoor = dx === 0 && dz === 1 && dy <= 2;
          const isBK   = (Math.abs(dx) === 2) && dy >= 1 && dy <= 2;
          const id = isDoor ? 0 : isBK ? BK : (corner ? L : P);
          this._set(chunk, ox, oy, oz, cx+dx, cy+dy, cz+dz, id);
        }
      }
    }
    this._set(chunk, ox, oy, oz, cx, cy + 4, cz, LN);
  }

  _buildFarm(chunk, ox, oy, oz, cx, cy, cz, DR, FM, WH, FC, W) {
    // 9×5 farm with fence border and water irrigation channel
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const border = Math.abs(dx) === 4 || Math.abs(dz) === 2;
        const waterRow = dx === 0;
        if (border) {
          this._set(chunk, ox, oy, oz, cx+dx, cy, cz+dz, FC);
        } else if (waterRow) {
          this._set(chunk, ox, oy, oz, cx+dx, cy, cz+dz, W);
        } else {
          this._set(chunk, ox, oy, oz, cx+dx, cy,     cz+dz, FM);
          this._set(chunk, ox, oy, oz, cx+dx, cy + 1, cz+dz, WH);
        }
      }
    }
  }

  // ── Utility ────────────────────────────────────────────────────────────────
  _set(chunk, ox, oy, oz, wx, wy, wz, id) {
    const lx = wx - ox, ly = wy - oy, lz = wz - oz;
    if (lx < 0 || lx >= 32 || ly < 0 || ly >= 32 || lz < 0 || lz >= 32) return;
    chunk.setLocal(lx, ly, lz, id);
  }

  _nearbyCenters(ox, oz) {
    const out = [];
    const minGx = Math.floor((ox - VILLAGE_RADIUS) / VILLAGE_GRID);
    const maxGx = Math.ceil( (ox + 32 + VILLAGE_RADIUS) / VILLAGE_GRID);
    const minGz = Math.floor((oz - VILLAGE_RADIUS) / VILLAGE_GRID);
    const maxGz = Math.ceil( (oz + 32 + VILLAGE_RADIUS) / VILLAGE_GRID);

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gz = minGz; gz <= maxGz; gz++) {
        if (this._hash(gx * 7 + 3, gz * 13 + 5) >= VILLAGE_CHANCE) continue;
        const cx = gx * VILLAGE_GRID + Math.floor(this._hash(gx, gz * 3 + 1) * (VILLAGE_GRID - 40) + 20);
        const cz = gz * VILLAGE_GRID + Math.floor(this._hash(gx * 3 + 1, gz) * (VILLAGE_GRID - 40) + 20);
        out.push([cx, cz]);
      }
    }
    return out;
  }

  _hash(a, b) {
    let x = Math.imul((a ^ b) >>> 0, 0x9e3779b9) ^ (a >>> 0);
    x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
    x ^= x >>> 16;
    return ((x >>> 0) & 0xffff) / 0xffff;
  }
}
