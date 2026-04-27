/**
 * LightEngine — BFS flood-fill block light propagation.
 * Phase 1: simple placeholder (block luminance stored but not yet rendered as vertex colors).
 * Phase 2: propagate to neighbors and bake into mesh vertex colors.
 */
export class LightEngine {
  constructor(world) {
    this.world = world;
    // lightMap[x + W*(y + H*z)] = light level 0-15
    this.lightMap = null;
  }

  init() {
    const { width, height, depth } = this.world;
    this.lightMap = new Uint8Array(width * height * depth);
  }

  getLight(x, y, z) {
    if (!this.lightMap) return 15;
    const { width, height, depth } = this.world;
    if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) return 0;
    return this.lightMap[x + width * (y + height * z)];
  }

  setLight(x, y, z, level) {
    if (!this.lightMap) return;
    const { width, height, depth } = this.world;
    if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) return;
    this.lightMap[x + width * (y + height * z)] = level;
  }

  // Full BFS recalculation (call after world gen)
  recalculate() {
    // TODO: Phase 2 — propagate sunlight top-down, then block light from sources
  }
}
