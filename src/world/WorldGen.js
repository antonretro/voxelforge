import { createNoise2D, createNoise3D } from 'simplex-noise';
import { Block } from '../engine/Block.js';
import { VillageGen }   from './VillageGen.js';
import { MineshaftGen } from './MineshaftGen.js';

// ── Constants ──────────────────────────────────────────────────────────────
const SEA_LEVEL   = 64;
const DEEPSLATE_Y = 8;
const BEDROCK_MAX = 4;
const RIVER_WIDTH = 0.032; // half-width of river band in noise space

// ── Biome definitions ──────────────────────────────────────────────────────
// frozen: true  → surface water replaced with ice
// iceSpikes     → place packed_ice pillars above surface
// flowers       → array of block names scattered on surface
const BIOMES = {
  // Ocean
  ocean:           { surface:'sand',        sub:'gravel',    deep:'stone',      tree:null, treeR:0 },
  frozen_ocean:    { surface:'sand',        sub:'gravel',    deep:'stone',      tree:null, treeR:0, frozen:true },
  warm_ocean:      { surface:'sand',        sub:'sand',      deep:'sandstone',  tree:null, treeR:0 },
  // Coast
  beach:           { surface:'sand',        sub:'sand',      deep:'sandstone',  tree:null, treeR:0 },
  stony_shore:     { surface:'stone',       sub:'gravel',    deep:'stone',      tree:null, treeR:0 },
  // Flat / open
  plains:          { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'oak_log',      leaves:'oak_leaves',     h:4}, treeR:10 },
  sunflower_plains:{ surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'oak_log',      leaves:'oak_leaves',     h:4}, treeR:12, flowers:['dandelion','dandelion','dandelion','poppy'] },
  meadow:          { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'oak_log',      leaves:'oak_leaves',     h:5}, treeR:10, flowers:['poppy','dandelion','allium','cornflower','lily_of_the_valley'] },
  // Forest
  forest:          { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'oak_log',      leaves:'oak_leaves',     h:5}, treeR:8 },
  flower_forest:   { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'oak_log',      leaves:'oak_leaves',     h:5}, treeR:10,  flowers:['poppy','dandelion','allium','cornflower','lily_of_the_valley','blue_orchid'] },
  birch_forest:    { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'birch_log',    leaves:'birch_leaves',   h:6}, treeR:7 },
  dark_forest:     { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'dark_oak_log', leaves:'dark_oak_leaves',h:5}, treeR:5 },
  // Taiga / cold
  taiga:           { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'spruce_log',   leaves:'spruce_leaves',  h:7, spruce:true}, treeR:8 },
  grove:           { surface:'snow_block',  sub:'dirt',      deep:'stone',      tree:{log:'spruce_log',   leaves:'spruce_leaves',  h:6, spruce:true}, treeR:7 },
  snowy_plains:    { surface:'snow_block',  sub:'dirt',      deep:'stone',      tree:{log:'spruce_log',   leaves:'spruce_leaves',  h:6, spruce:true}, treeR:12 },
  snowy_taiga:     { surface:'snow_block',  sub:'dirt',      deep:'stone',      tree:{log:'spruce_log',   leaves:'spruce_leaves',  h:7, spruce:true}, treeR:10 },
  snowy_slopes:    { surface:'snow_block',  sub:'stone',     deep:'stone',      tree:{log:'spruce_log',   leaves:'spruce_leaves',  h:5, spruce:true}, treeR:10, frozen:true },
  ice_spikes:      { surface:'packed_ice',  sub:'packed_ice',deep:'stone',      tree:null, treeR:0, iceSpikes:true, frozen:true },
  // Dry / hot
  desert:          { surface:'sand',        sub:'sand',      deep:'sandstone',  tree:null, treeR:0 },
  badlands:        { surface:'red_sand',    sub:'red_sand',  deep:'stone',      tree:null, treeR:0 },
  wooded_badlands: { surface:'red_sand',    sub:'red_sand',  deep:'stone',      tree:{log:'oak_log',      leaves:'oak_leaves',     h:5}, treeR:10 },
  savanna:         { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'acacia_log',   leaves:'acacia_leaves',  h:5, acacia:true}, treeR:12 },
  // Jungle / wet
  jungle:          { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'jungle_log',   leaves:'jungle_leaves',  h:9, jungle:true}, treeR:6 },
  sparse_jungle:   { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'jungle_log',   leaves:'jungle_leaves',  h:8, jungle:true}, treeR:10 },
  swamp:           { surface:'grass_block', sub:'mud',       deep:'clay',       tree:{log:'oak_log',      leaves:'oak_leaves',     h:5}, treeR:12,  flowers:['blue_orchid'] },
  mangrove_swamp:  { surface:'mud',         sub:'mud',       deep:'clay',       tree:{log:'mangrove_log', leaves:'mangrove_leaves',h:5}, treeR:10,  flowers:['blue_orchid'] },
  lush_caves:      { surface:'moss_block',  sub:'moss_block',deep:'stone',      tree:{log:'oak_log',      leaves:'azalea_leaves',  h:4}, treeR:10,  flowers:['lily_of_the_valley'] },
  // Mountain
  cherry_grove:    { surface:'grass_block', sub:'dirt',      deep:'stone',      tree:{log:'cherry_log',   leaves:'cherry_leaves',  h:5}, treeR:8 },
  windswept_hills: { surface:'stone',       sub:'gravel',    deep:'stone',      tree:{log:'spruce_log',   leaves:'spruce_leaves',  h:5, spruce:true}, treeR:10 },
  mountains:       { surface:'stone',       sub:'stone',     deep:'stone',      tree:{log:'spruce_log',   leaves:'spruce_leaves',  h:6, spruce:true}, treeR:10 },
};

// Biomes where rivers freeze into ice
const FREEZING = new Set(['frozen_ocean','ice_spikes','snowy_taiga','snowy_plains','snowy_slopes','grove']);

// ── Ore table ──────────────────────────────────────────────────────────────
const ORES = [
  { block:'coal_ore',     deep:'deepslate_coal_ore',     minY:8,  maxY:100, rarity:0.29, scale:0.11 },
  { block:'iron_ore',     deep:'deepslate_iron_ore',     minY:0,  maxY:72,  rarity:0.24, scale:0.12 },
  { block:'copper_ore',   deep:'deepslate_copper_ore',   minY:20, maxY:80,  rarity:0.23, scale:0.10 },
  { block:'gold_ore',     deep:'deepslate_gold_ore',     minY:0,  maxY:32,  rarity:0.17, scale:0.13 },
  { block:'lapis_ore',    deep:'deepslate_lapis_ore',    minY:0,  maxY:64,  rarity:0.14, scale:0.13 },
  { block:'redstone_ore', deep:'deepslate_redstone_ore', minY:0,  maxY:20,  rarity:0.22, scale:0.09 },
  { block:'diamond_ore',  deep:'deepslate_diamond_ore',  minY:0,  maxY:16,  rarity:0.08, scale:0.08 },
  { block:'emerald_ore',  deep:'deepslate_emerald_ore',  minY:0,  maxY:100, rarity:0.06, scale:0.09, mountainOnly:true },
];

// ── Stone variety blobs ────────────────────────────────────────────────────
const STONE_BLOBS = [
  { block:'andesite', scale:0.09, threshold:0.72 },
  { block:'diorite',  scale:0.09, threshold:0.74 },
  { block:'granite',  scale:0.09, threshold:0.74 },
  { block:'tuff',     scale:0.08, threshold:0.76, maxY:32 },
  { block:'calcite',  scale:0.07, threshold:0.78, maxY:20 },
];

// ── WorldGen ───────────────────────────────────────────────────────────────
export class WorldGen {
  constructor(seed) {
    const rng = (n) => mulberry32(seed + n);
    this._heightNoise = createNoise2D(rng(0));
    this._biomeTemp   = createNoise2D(rng(1));
    this._biomeMoist  = createNoise2D(rng(2));
    this._oreNoise    = createNoise3D(rng(3));
    this._treeNoise   = createNoise2D(rng(4));
    this._detailNoise = createNoise2D(rng(5));
    this._caveNoise   = createNoise3D(rng(6));
    this._blobNoise   = createNoise3D(rng(7));
    this._grassNoise  = createNoise2D(rng(8));
    this._riverNoise  = createNoise2D(rng(9));
    this._cache       = new Map();
    this._villages    = new VillageGen(seed);
    this._mineshafts  = new MineshaftGen(seed);
  }

  fillChunk(chunk) {
    const ox = chunk.ox ?? chunk.getPosition?.().x ?? 0;
    const oy = chunk.oy ?? 0;
    const oz = chunk.oz ?? chunk.getPosition?.().z ?? 0;
    const W  = chunk.width  || 16;
    const H  = chunk.height || chunk.world?.height || 100;
    this._W  = W;
    this._H  = H;
    const engine = chunk.engine || chunk.manager?.game;

    const getId = (name) => {
      if (!name || name === 'air') return 0;
      const b = Block.getByName(name);
      if (!b) return 0;
      return b.id;
    };

    const BEDROCK   = getId('bedrock');
    const STONE     = getId('stone');
    const DEEPSLATE = getId('deepslate');
    const WATER     = getId('water');
    const ICE       = getId('ice');
    const GRAVEL    = getId('gravel');

    const oreIds  = ORES.map(o => ({ id: getId(o.block), deepId: getId(o.deep || o.block) }));
    const blobIds = STONE_BLOBS.map(b => getId(b.block));

    // Prevent unbounded height cache growth during long sessions
    if (this._cache.size > 80_000) this._cache.clear();

    for (let lz = 0; lz < chunk.width; lz++) {
      for (let lx = 0; lx < chunk.width; lx++) {
        const wx = ox + lx;
        const wz = oz + lz;

        const biomeKey = this._getBiome(wx, wz);
        const biome    = BIOMES[biomeKey];
        const baseH    = this._getHeight(wx, wz);
        const frozen   = FREEZING.has(biomeKey);

        // River carving: domain-warped 2D noise, curves through mid-altitude terrain
        const riverStr = this._getRiverStrength(wx, wz);
        const isRiver  = riverStr > 0
          && baseH >= SEA_LEVEL - 2
          && baseH <= SEA_LEVEL + 18
          && biomeKey !== 'ocean'
          && biomeKey !== 'frozen_ocean'
          && biomeKey !== 'warm_ocean'
          && biomeKey !== 'desert'
          && biomeKey !== 'badlands';
        const fillH = isRiver ? SEA_LEVEL - 2 : baseH;
        const RIVER_FILL = frozen ? ICE : WATER;

        const SURFACE = getId(biome.surface);
        const SUB     = getId(biome.sub);

        for (let ly = 0; ly < chunk.height; ly++) {
          const wy = oy + ly;
          if (wy < 0 || wy >= H) continue;

          let id = 0;

          if (wy === 0) {
            id = BEDROCK;

          } else if (wy < BEDROCK_MAX) {
            const r = (this._blobNoise(wx * 0.3, wy * 0.3, wz * 0.3) + 1) * 0.5;
            id = r > (0.35 + wy * 0.15) ? BEDROCK : (wy < DEEPSLATE_Y ? DEEPSLATE : STONE);

          } else if (wy < fillH) {
            const isDeep  = wy < DEEPSLATE_Y;
            const baseBlk = isDeep ? DEEPSLATE : STONE;

            if (isRiver) {
              // River channel floor: gravel
              id = wy === fillH - 1 ? GRAVEL : baseBlk;
            } else if (wy >= fillH - 4) {
              id = SUB;
            } else if (this._isCave(wx, wy, wz, fillH)) {
              // Caves below sea level flood with water
              id = wy < SEA_LEVEL ? WATER : 0;
            } else {
              id = baseBlk;

              // Dripstone block patches in stone
              const dripN = (this._blobNoise(wx * 0.04, wy * 0.04, wz * 0.04) + 1) * 0.5;
              const isDripstone = dripN > 0.82;
              if (isDripstone) id = getId('dripstone_block');

              // Stalactites/Stalagmites (if neighbor is cave)
              if (isDripstone) {
                 // Check below for stalactite
                 if (this._isCave(wx, wy - 1, wz, fillH)) {
                    const spikeH = 1 + Math.floor(this._treeFBM(wx * 11, wz * 11) * 3);
                    const DRIP_DOWN = getId('pointed_dripstone_down');
                    for (let i = 1; i <= spikeH && ly - i >= 0; i++) {
                        chunk.setLocal(lx, ly - i, lz, DRIP_DOWN);
                    }
                 }
                 // Check above for stalagmite
                 if (this._isCave(wx, wy + 1, wz, fillH)) {
                    const spikeH = 1 + Math.floor(this._treeFBM(wx * 13, wz * 13) * 3);
                    const DRIP_UP = getId('pointed_dripstone_up');
                    for (let i = 1; i <= spikeH && ly + i < H; i++) {
                        chunk.setLocal(lx, ly + i, lz, DRIP_UP);
                    }
                 }
              }

              // Stone variety blobs (non-deepslate only)
              if (!isDeep) {
                for (let bi = 0; bi < STONE_BLOBS.length; bi++) {
                  const b = STONE_BLOBS[bi];
                  if (b.maxY !== undefined && wy > b.maxY) continue;
                  const n = (this._blobNoise(wx * b.scale + bi * 17.3, wy * b.scale, wz * b.scale + bi * 11.7) + 1) * 0.5;
                  if (n > b.threshold) { id = blobIds[bi]; break; }
                }
              }

              // Ores
              for (let oi = 0; oi < ORES.length; oi++) {
                const ore = ORES[oi];
                if (wy < ore.minY || wy > ore.maxY) continue;
                if (ore.mountainOnly && biomeKey !== 'mountains' && biomeKey !== 'windswept_hills') continue;

                const peak  = (ore.minY + ore.maxY) * 0.5;
                const range = Math.max((ore.maxY - ore.minY) * 0.5, 1);
                const boost = 1 - Math.abs(wy - peak) / range * 0.5;

                const n      = (this._oreNoise(wx * ore.scale + oi * 13.1, wy * ore.scale, wz * ore.scale + oi * 7.9) + 1) * 0.5;
                const needed = 1 - ore.rarity * boost;
                if (n > needed) { id = isDeep ? oreIds[oi].deepId : oreIds[oi].id; break; }
              }
            }

          } else if (wy === fillH && fillH > 0) {
            id = isRiver ? RIVER_FILL : SURFACE;

          } else if (wy > fillH && wy <= SEA_LEVEL) {
            // Water / ice above submerged terrain
            if (fillH < SEA_LEVEL) {
              id = (frozen && wy === SEA_LEVEL) ? ICE : WATER;
            }
          }

          chunk.setLocal(lx, ly, lz, id);
        }

        // ── Surface decorations ──
        const sy = fillH - oy;
        if (sy >= 0 && sy < chunk.height) {

          // Desert Overhaul: Sandstone layers, Oasis, and Cactus
          if (biomeKey === 'desert') {
            // 1. Sandstone just under the surface
            const SANDSTONE = getId('sandstone');
            for (let i = 1; i < 6 && sy - i >= 0; i++) {
                chunk.setLocal(lx, sy - i, lz, SANDSTONE);
            }

            // 2. Oasis (Water + Grass)
            const oasisN = this._detailNoise(wx * 0.05, wz * 0.05);
            if (oasisN > 0.88) {
                if (sy >= 0 && sy < H) {
                    chunk.setLocal(lx, sy, lz, WATER);
                    if (sy + 1 < H) chunk.setLocal(lx, sy + 1, lz, getId('grass'));
                }
            }

            // 3. Cactus
            const cv = this._treeNoise(wx * 0.09, wz * 0.09);
            if (cv > 0.82 && oasisN <= 0.88) {
              const ch = 1 + (Math.abs(cv * 10) | 0) % 3;
              const CID = getId('cactus');
              for (let i = 1; i <= ch && sy + i < H; i++) chunk.setLocal(lx, sy + i, lz, CID);
            }

            // 4. Desert Structures (Pyramids & Wells)
            const structN = this._treeNoise(wx * 0.005, wz * 0.005);
            if (this._isLocalMax(wx, wz, 128, structN)) {
                if (sy >= 0 && sy < H) {
                    const type = (wx + wz) % 10 < 3 ? 'temple' : 'well';
                    // Access structures via engine
                    if (chunk.engine && chunk.engine.structures) {
                        chunk.engine.structures.spawn(type, chunk, lx, sy + 1, lz);
                    }
                }
            }
          }

          // Badlands: terracotta colour bands by Y
          if (biomeKey === 'badlands' || biomeKey === 'wooded_badlands') {
            const BANDS = ['red_terracotta','orange_terracotta','yellow_terracotta','white_terracotta','brown_terracotta','terracotta','light_gray_terracotta','brown_terracotta'];
            chunk.setLocal(lx, sy, lz, getId(BANDS[Math.floor(baseH * 0.35) % BANDS.length]));
          }

          // Grass foliage (various biomes) — mix of short and tall grass
          if (['plains','forest','birch_forest','jungle','sparse_jungle','savanna','cherry_grove','meadow','lush_caves'].includes(biomeKey)) {
            const gn = this._grassNoise(wx * 0.18, wz * 0.18);
            if (gn > 0.35 && sy + 1 < H && chunk.getLocal(lx, sy + 1, lz) === 0) {
              if (gn > 0.62 && sy + 2 < H) {
                // Tall grass (2-block)
                chunk.setLocal(lx, sy + 1, lz, getId('tall_grass_bottom'));
                chunk.setLocal(lx, sy + 2, lz, getId('tall_grass_top'));
              } else {
                // Short grass (1-block)
                chunk.setLocal(lx, sy + 1, lz, getId('grass'));
              }
            }
          }
          
          // Flowers
          if (biome.flowers && biome.flowers.length > 0 && !isRiver) {
            const fn = this._grassNoise(wx * 0.22, wz * 0.22);
            if (fn > 0.58 && sy + 1 < H) {
              const pick = biome.flowers[Math.abs(wx * 31 + wz * 17) % biome.flowers.length];
              const FID = getId(pick);
              if (FID && chunk.getLocal(lx, sy + 1, lz) === 0) {
                chunk.setLocal(lx, sy + 1, lz, FID);
              }
            }
          }

          // Swamp: surface water patches at low elevation
          if ((biomeKey === 'swamp' || biomeKey === 'mangrove_swamp') && baseH <= SEA_LEVEL) {
            if (this._grassNoise(wx * 0.06, wz * 0.06) > 0.52) chunk.setLocal(lx, sy, lz, WATER);
          }

          // Ice spikes: tall packed_ice pillars
          if (biome.iceSpikes) {
            const sv = this._treeNoise(wx * 0.08, wz * 0.08);
            if (this._isLocalMax(wx, wz, 4, sv)) {
              const spikeH = 4 + (Math.abs(sv * 100) | 0) % 14;
              const PICE = getId('packed_ice');
              for (let i = 1; i <= spikeH && sy + i < H; i++) chunk.setLocal(lx, sy + i, lz, PICE);
            }
          }
        }

        // ── Trees ──
        if (biome.tree && biome.treeR > 0 && !isRiver) {
          const tv = this._treeFBM(wx, wz);
          const oasisN = this._detailNoise(wx * 0.05, wz * 0.05);
          const isOasis = biomeKey === 'desert' && oasisN > 0.88;
          const treeRate = isOasis ? 12 : biome.treeR;
          
          if (this._isLocalMax(wx, wz, treeRate, tv)) {
            const treeY = fillH;
            if (treeY >= oy && treeY < oy + H) {
              const treeCfg = isOasis 
                ? {log:'jungle_log', leaves:'jungle_leaves', h:6, jungle:true} 
                : biome.tree;
              this._placeTree(chunk, lx, treeY - oy, lz, getId, treeCfg, engine, wx, wz);
            }
          }
        }
      }
    }

    // Flush pending cross-chunk leaves
    if (engine.pendingLeaves) {
      for (const [key, lid] of engine.pendingLeaves) {
        const [px, py, pz] = key.split(',').map(Number);
        const lx = px - ox, ly = py - oy, lz = pz - oz;
        if (lx >= 0 && lx < W && ly >= 0 && ly < H && lz >= 0 && lz < W) {
          if (chunk.getLocal(lx, ly, lz) === 0) chunk.setLocal(lx, ly, lz, lid);
        }
      }
    }

    // Structures (run after terrain so they overwrite it)
    const getH = (x, z) => this._getHeight(x, z);
    this._villages.fill(chunk, ox, oy, oz, getId, getH);
    this._mineshafts.fill(chunk, ox, oy, oz, getId, getH);
  }

  // ── River strength ─────────────────────────────────────────────────────────
  _getRiverStrength(x, z) {
    // Domain warp: bend the river path using the height noise
    const wx2 = x + this._heightNoise(x * 0.003, z * 0.003) * 50;
    const wz2 = z + this._heightNoise(x * 0.003 + 200, z * 0.003 + 200) * 50;
    const n = Math.abs(this._riverNoise(wx2 * 0.004, wz2 * 0.004));
    if (n > RIVER_WIDTH) return 0;
    return 1 - n / RIVER_WIDTH;
  }

  // ── Biome selection ────────────────────────────────────────────────────────
  _getBiome(x, z) {
    const temp  = (this._fbm2(this._biomeTemp,  x * 0.003, z * 0.003, 5) + 1) * 0.5;
    const moist = (this._fbm2(this._biomeMoist, x * 0.003 + 400, z * 0.003 + 400, 5) + 1) * 0.5;
    const h     = this._getHeight(x, z);

    // ── Ocean ──────────────────────────────────────────────────────────────
    if (h < SEA_LEVEL - 1) {
      if (temp < 0.28) return 'frozen_ocean';
      if (temp > 0.72) return 'warm_ocean';
      return 'ocean';
    }

    // ── Shoreline ──────────────────────────────────────────────────────────
    if (h <= SEA_LEVEL + 1) {
      if (temp < 0.25) return 'snowy_plains';
      if (temp > 0.75 && moist < 0.3) return 'desert';
      if (moist < 0.3 && temp > 0.4) return 'stony_shore';
      return 'beach';
    }

    // ── High mountains ─────────────────────────────────────────────────────
    if (h > 92) return 'mountains';

    // ── Mid mountains ──────────────────────────────────────────────────────
    if (h > 78) {
      if (temp < 0.35) return 'snowy_slopes';
      if (temp < 0.55) return 'grove';
      return 'windswept_hills';
    }

    // ── Cold zone ──────────────────────────────────────────────────────────
    if (temp < 0.18) return moist > 0.55 ? 'snowy_taiga' : (moist > 0.75 ? 'ice_spikes' : 'snowy_plains');
    if (temp < 0.30) return moist > 0.5  ? 'snowy_taiga' : 'snowy_plains';
    if (temp < 0.42) return moist > 0.55 ? 'taiga' : 'snowy_plains';

    // ── Hot / dry ──────────────────────────────────────────────────────────
    if (temp > 0.85 && moist < 0.15) return 'badlands';
    if (temp > 0.80 && moist < 0.22) return 'wooded_badlands';
    if (temp > 0.75 && moist < 0.32) return 'desert';
    if (temp > 0.65 && moist < 0.45) return 'savanna';

    // ── Hot / wet ──────────────────────────────────────────────────────────
    if (temp > 0.72 && moist > 0.65) return 'jungle';
    if (temp > 0.62 && moist > 0.58 && moist < 0.68) return 'sparse_jungle';
    if (temp > 0.65 && moist > 0.62 && h < SEA_LEVEL + 6)  return 'mangrove_swamp';
    if (temp > 0.60 && moist > 0.72 && h < SEA_LEVEL + 8)  return 'swamp';

    // ── Temperate ──────────────────────────────────────────────────────────
    if (temp > 0.48 && moist > 0.76) return 'lush_caves';
    if (moist > 0.72) return 'dark_forest';
    if (moist > 0.64) {
      if (temp > 0.55 && moist < 0.72) return 'cherry_grove';
      return 'birch_forest';
    }
    if (moist > 0.56) return moist > 0.66 ? 'flower_forest' : 'forest';
    if (moist > 0.42) return 'forest';
    if (moist > 0.30) return temp > 0.55 ? 'meadow' : 'plains';
    if (moist < 0.18 && temp > 0.50) return 'sunflower_plains';
    return 'plains';
  }

  // ── Terrain height ─────────────────────────────────────────────────────────
  _getHeight(x, z) {
    const key = `${x},${z}`;
    if (this._cache.has(key)) return this._cache.get(key);
    const base   = this._fbm2(this._heightNoise, x * 0.0012, z * 0.0012, 6);
    const detail = this._fbm2(this._detailNoise, x * 0.005,  z * 0.005,  4) * 0.2;
    const n = ((base + detail) * 0.75 + 1) * 0.5;
    const h = Math.floor(16 + n * 84);
    this._cache.set(key, h);
    return h;
  }

  // ── Cave carving ───────────────────────────────────────────────────────────
  _isCave(x, y, z, surfaceH) {
    if (y >= surfaceH - 3 || y < BEDROCK_MAX) return false;
    const biome = this._getBiome(x, z);
    const n = (this._caveNoise(x * 0.06, y * 0.06, z * 0.06) + 1) * 0.5;
    let threshold = 0.75;
    if (biome === 'desert' && y > surfaceH - 20) threshold = 0.85; // Less surface caves in desert
    return n > (y < 20 ? 0.72 : threshold);
  }

  // ── Tree helpers ───────────────────────────────────────────────────────────
  _treeFBM(x, z) { return this._fbm2(this._treeNoise, x * 0.012, z * 0.012, 4); }

  _isLocalMax(wx, wz, R, _val) {
    // Fast: use a deterministic hash to pick one tree per R×R cell
    const cx = Math.floor(wx / R), cz = Math.floor(wz / R);
    const h = Math.sin(cx * 127.1 + cz * 311.7) * 43758.5453;
    const px = cx * R + Math.floor((h - Math.floor(h)) * R);
    const pz = cz * R + Math.floor((Math.sin(cx * 269.5 + cz * 183.3) * 43758.5453 - Math.floor(Math.sin(cx * 269.5 + cz * 183.3) * 43758.5453)) * R);
    return wx === px && wz === pz;
  }

  _placeTree(chunk, lx, ly, lz, getId, cfg, engine, wx, wz) {
    const LOG    = getId(cfg.log);
    const LEAVES = getId(cfg.leaves);
    const h = cfg.h + (Math.abs(this._treeFBM(wx * 5.3, wz * 5.3) * 3) | 0);

    for (let i = 1; i <= h; i++)
      if (ly + i < this._H) chunk.setLocal(lx, ly + i, lz, LOG);

    const top     = ly + h;
    const pending = engine.pendingLeaves || (engine.pendingLeaves = new Map());

    const leaf = (nx, ny, nz) => {
      if (nx >= 0 && nx < this._W && ny >= 0 && ny < this._H && nz >= 0 && nz < this._W) {
        if (chunk.getLocal(nx, ny, nz) === 0) chunk.setLocal(nx, ny, nz, LEAVES);
      } else {
        const k = `${(chunk.ox??chunk.getPosition?.().x??0)+nx},${(chunk.oy??0)+ny},${(chunk.oz??chunk.getPosition?.().z??0)+nz}`;
        if (!pending.has(k)) pending.set(k, LEAVES);
      }
    };

    if (cfg.spruce) {
      for (let layer = 0; layer <= 3; layer++) {
        const r = 2 - Math.floor(layer * 0.6);
        const y = top - layer;
        for (let dx = -r; dx <= r; dx++)
          for (let dz = -r; dz <= r; dz++)
            if (Math.abs(dx) + Math.abs(dz) <= r + 1) leaf(lx+dx, y, lz+dz);
      }
      leaf(lx, top + 1, lz);
    } else if (cfg.jungle) {
      for (let dx = -3; dx <= 3; dx++)
        for (let dz = -3; dz <= 3; dz++)
          for (let dy = -2; dy <= 2; dy++)
            if (dx*dx + dy*dy + dz*dz <= 12) leaf(lx+dx, top+dy, lz+dz);
    } else if (cfg.acacia) {
      for (let dx = -2; dx <= 3; dx++)
        for (let dz = -2; dz <= 3; dz++)
          if (Math.abs(dx) + Math.abs(dz) <= 4) { leaf(lx+dx, top, lz+dz); leaf(lx+dx, top+1, lz+dz); }
    } else {
      const isLarge = cfg.log === 'oak_log' && (Math.abs(wx * 11 + wz * 7) % 10 < 2);
      if (isLarge) {
        // Large branched oak
        const trunkH = h + 2;
        for (let i = 1; i <= trunkH; i++) if (ly + i < this._H) chunk.setLocal(lx, ly + i, lz, LOG);
        
        // Branches
        for (const [bx, by, bz] of [[1,3,1],[-1,4,0],[0,5,-1],[1,6,0]]) {
            const blx = lx + bx, bly = ly + by, blz = lz + bz;
            if (blx>=0&&blx<this._W && bly>=0&&bly<this._H && blz>=0&&blz<this._W) chunk.setLocal(blx, bly, blz, LOG);
            // Leaf ball at branch end
            for (let dx = -2; dx <= 2; dx++)
                for (let dy = -1; dy <= 2; dy++)
                    for (let dz = -2; dz <= 2; dz++)
                        if (dx*dx + dy*dy + dz*dz <= 5) leaf(blx+dx, bly+dy, blz+dz);
        }
      } else {
        const r = cfg.log === 'dark_oak_log' ? 3 : 2;
        for (let dx = -r; dx <= r; dx++)
          for (let dz = -r; dz <= r; dz++)
            for (let dy = -1; dy <= 2; dy++)
              if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) <= r + 1) leaf(lx+dx, top+dy, lz+dz);
      }
    }
  }

  _fbm2(fn, x, z, octaves) {
    let val = 0, amp = 1, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
      val += fn(x * freq, z * freq) * amp;
      max += amp; amp *= 0.5; freq *= 2;
    }
    return val / max;
  }
}

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
