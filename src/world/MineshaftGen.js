// Mineshaft generator — carves underground corridor networks into chunks.
// Uses a deterministic grid so adjacent chunks independently agree on the layout.

const SHAFT_GRID   = 48;  // one possible shaft node per 48×48 XZ area
const SHAFT_CHANCE = 0.55;
const SHAFT_Y      = 22;  // corridor floor Y
const CORRIDOR_LEN = 44;  // max half-length in each direction

export class MineshaftGen {
  constructor(seed) {
    this._seed = seed;
  }

  // ── Public entry point ─────────────────────────────────────────────────────
  fill(chunk, ox, oy, oz, getId, getHeight) {
    // Only process chunks that contain the shaft Y level
    if (oz > SHAFT_Y + 2 || oy + 32 < SHAFT_Y - 1) return;

    const OAK_LOG  = getId('oak_log');
    const OAK_PLAN = getId('oak_planks');
    const CHEST    = getId('chest');
    const COBWEB   = getId('cobweb');
    const TORCH    = getId('torch');
    const GRAVEL   = getId('gravel');
    const AIR      = 0;

    // Check all shaft nodes that could have corridors reaching this chunk
    const margin = CORRIDOR_LEN + 2;
    const minGx = Math.floor((ox - margin) / SHAFT_GRID);
    const maxGx = Math.ceil( (ox + 32 + margin) / SHAFT_GRID);
    const minGz = Math.floor((oz - margin) / SHAFT_GRID);
    const maxGz = Math.ceil( (oz + 32 + margin) / SHAFT_GRID);

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gz = minGz; gz <= maxGz; gz++) {
        if (this._hash(gx * 7 + 1, gz * 11 + 3) >= SHAFT_CHANCE) continue;

        const nx = gx * SHAFT_GRID + Math.floor(this._hash(gx, gz + 100) * (SHAFT_GRID - 8) + 4);
        const nz = gz * SHAFT_GRID + Math.floor(this._hash(gx + 100, gz) * (SHAFT_GRID - 8) + 4);
        const ny = SHAFT_Y + (this._hash(gx * 3, gz * 5) < 0.3 ? -4 : 0);

        const len = Math.floor(this._hash(gx * 5, gz * 9) * (CORRIDOR_LEN - 16) + 16);

        // Four corridors from node: +X, -X, +Z, -Z
        const dirs = [
          [1, 0, this._hash(gx+1, gz)   < 0.8],
          [-1, 0, this._hash(gx-1, gz)  < 0.7],
          [0, 1, this._hash(gx, gz+1)   < 0.8],
          [0, -1, this._hash(gx, gz-1)  < 0.7],
        ];

        for (const [dx, dz, active] of dirs) {
          if (!active) continue;
          const corrLen = Math.floor(len * (0.6 + this._hash(gx + dx * 3, gz + dz * 3) * 0.4));
          this._carveCorridor(chunk, ox, oy, oz, nx, ny, nz, dx, dz, corrLen,
            OAK_LOG, OAK_PLAN, COBWEB, TORCH, CHEST, GRAVEL);
        }
      }
    }
  }

  // ── Corridor carving ───────────────────────────────────────────────────────
  _carveCorridor(chunk, ox, oy, oz, sx, sy, sz, dx, dz, len, LOG, PLAN, COBWEB, TORCH, CHEST, GRAVEL) {
    for (let step = 0; step < len; step++) {
      const wx = sx + dx * step;
      const wz = sz + dz * step;
      const wy = sy;

      // Carve 1×2 tunnel (floor + ceiling clearance)
      this._set(chunk, ox, oy, oz, wx, wy,     wz, GRAVEL); // floor
      this._set(chunk, ox, oy, oz, wx, wy + 1, wz, 0);     // corridor lower
      this._set(chunk, ox, oy, oz, wx, wy + 2, wz, 0);     // corridor upper

      // Oak support beam every 4 steps
      if (step % 4 === 0 && step > 0) {
        // Cross supports on sides
        const sx2 = dx === 0 ? 1 : 0;
        const sz2 = dz === 0 ? 1 : 0;
        for (const sign of [-1, 1]) {
          this._set(chunk, ox, oy, oz, wx + sx2 * sign, wy + 2, wz + sz2 * sign, LOG);
          this._set(chunk, ox, oy, oz, wx + sx2 * sign, wy + 1, wz + sz2 * sign, LOG);
        }
        // Ceiling plank
        this._set(chunk, ox, oy, oz, wx, wy + 3, wz, PLAN);
      }

      // Torch every 8 steps on alternating walls
      if (step % 8 === 4) {
        const sx2 = dx === 0 ? 1 : 0;
        const sz2 = dz === 0 ? 1 : 0;
        const sign = (step % 16 < 8) ? 1 : -1;
        this._set(chunk, ox, oy, oz, wx + sx2 * sign, wy + 2, wz + sz2 * sign, TORCH);
      }

      // Cobweb scatter on ceiling
      if (this._hash(wx * 3 + step, wz * 7) > 0.82) {
        this._set(chunk, ox, oy, oz, wx, wy + 2, wz, COBWEB);
      }

      // Chest at dead end
      if (step === len - 1) {
        this._set(chunk, ox, oy, oz, wx, wy + 1, wz, CHEST);
      }
    }
  }

  // ── Utility ────────────────────────────────────────────────────────────────
  _set(chunk, ox, oy, oz, wx, wy, wz, id) {
    const lx = wx - ox, ly = wy - oy, lz = wz - oz;
    if (lx < 0 || lx >= 32 || ly < 0 || ly >= 32 || lz < 0 || lz >= 32) return;
    chunk.setLocal(lx, ly, lz, id);
  }

  _hash(a, b) {
    let x = Math.imul(((a ^ b) >>> 0) + this._seed, 0x9e3779b9) ^ (a >>> 0);
    x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
    x ^= x >>> 16;
    return ((x >>> 0) & 0xffff) / 0xffff;
  }
}
