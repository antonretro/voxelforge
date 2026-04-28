export const RECIPE_BOOK = [
  // ── Basic materials ────────────────────────────────────────────────────────
  {
    id: 'oak_planks', name: 'Oak Planks', type: 'shapeless',
    ingredients: ['oak_log'],
    result: { id: 'oak_planks', count: 4, kind: 'block' },
  },
  {
    id: 'stick', name: 'Sticks', type: 'shaped',
    pattern: ['W', 'W'],
    key: { W: 'oak_planks' },
    result: { id: 'stick', count: 4, kind: 'item' },
  },
  {
    id: 'crafting_table', name: 'Crafting Table', type: 'shaped',
    pattern: ['WW', 'WW'],
    key: { W: 'oak_planks' },
    result: { id: 'crafting_table', count: 1, kind: 'block' },
  },
  {
    id: 'furnace', name: 'Furnace', type: 'shaped',
    pattern: ['CCC', 'C C', 'CCC'],
    key: { C: 'cobblestone' },
    result: { id: 'furnace', count: 1, kind: 'block' },
  },
  {
    id: 'torch', name: 'Torch', type: 'shaped',
    pattern: ['C', 'S'],
    key: { C: 'coal', S: 'stick' },
    result: { id: 'torch', count: 4, kind: 'block' },
  },
  {
    id: 'torch_charcoal', name: 'Torch', type: 'shaped',
    pattern: ['C', 'S'],
    key: { C: 'charcoal', S: 'stick' },
    result: { id: 'torch', count: 4, kind: 'block' },
  },

  // ── Pickaxes ───────────────────────────────────────────────────────────────
  {
    id: 'wooden_pickaxe', name: 'Wooden Pickaxe', type: 'shaped',
    pattern: ['WWW', ' S ', ' S '],
    key: { W: 'oak_planks', S: 'stick' },
    result: { id: 'wooden_pickaxe', count: 1, kind: 'tool' },
  },
  {
    id: 'stone_pickaxe', name: 'Stone Pickaxe', type: 'shaped',
    pattern: ['CCC', ' S ', ' S '],
    key: { C: 'cobblestone', S: 'stick' },
    result: { id: 'stone_pickaxe', count: 1, kind: 'tool' },
  },
  {
    id: 'iron_pickaxe', name: 'Iron Pickaxe', type: 'shaped',
    pattern: ['III', ' S ', ' S '],
    key: { I: 'iron_ingot', S: 'stick' },
    result: { id: 'iron_pickaxe', count: 1, kind: 'tool' },
  },
  {
    id: 'diamond_pickaxe', name: 'Diamond Pickaxe', type: 'shaped',
    pattern: ['DDD', ' S ', ' S '],
    key: { D: 'diamond', S: 'stick' },
    result: { id: 'diamond_pickaxe', count: 1, kind: 'tool' },
  },

  // ── Axes ───────────────────────────────────────────────────────────────────
  {
    id: 'wooden_axe', name: 'Wooden Axe', type: 'shaped',
    pattern: ['WW', 'WS', ' S'],
    key: { W: 'oak_planks', S: 'stick' },
    result: { id: 'wooden_axe', count: 1, kind: 'tool' },
  },
  {
    id: 'stone_axe', name: 'Stone Axe', type: 'shaped',
    pattern: ['CC', 'CS', ' S'],
    key: { C: 'cobblestone', S: 'stick' },
    result: { id: 'stone_axe', count: 1, kind: 'tool' },
  },
  {
    id: 'iron_axe', name: 'Iron Axe', type: 'shaped',
    pattern: ['II', 'IS', ' S'],
    key: { I: 'iron_ingot', S: 'stick' },
    result: { id: 'iron_axe', count: 1, kind: 'tool' },
  },
  {
    id: 'diamond_axe', name: 'Diamond Axe', type: 'shaped',
    pattern: ['DD', 'DS', ' S'],
    key: { D: 'diamond', S: 'stick' },
    result: { id: 'diamond_axe', count: 1, kind: 'tool' },
  },

  // ── Shovels ────────────────────────────────────────────────────────────────
  {
    id: 'wooden_shovel', name: 'Wooden Shovel', type: 'shaped',
    pattern: ['W', 'S', 'S'],
    key: { W: 'oak_planks', S: 'stick' },
    result: { id: 'wooden_shovel', count: 1, kind: 'tool' },
  },
  {
    id: 'stone_shovel', name: 'Stone Shovel', type: 'shaped',
    pattern: ['C', 'S', 'S'],
    key: { C: 'cobblestone', S: 'stick' },
    result: { id: 'stone_shovel', count: 1, kind: 'tool' },
  },
  {
    id: 'iron_shovel', name: 'Iron Shovel', type: 'shaped',
    pattern: ['I', 'S', 'S'],
    key: { I: 'iron_ingot', S: 'stick' },
    result: { id: 'iron_shovel', count: 1, kind: 'tool' },
  },
  {
    id: 'diamond_shovel', name: 'Diamond Shovel', type: 'shaped',
    pattern: ['D', 'S', 'S'],
    key: { D: 'diamond', S: 'stick' },
    result: { id: 'diamond_shovel', count: 1, kind: 'tool' },
  },

  // ── Swords ────────────────────────────────────────────────────────────────
  {
    id: 'wooden_sword', name: 'Wooden Sword', type: 'shaped',
    pattern: ['W', 'W', 'S'],
    key: { W: 'oak_planks', S: 'stick' },
    result: { id: 'wooden_sword', count: 1, kind: 'tool' },
  },
  {
    id: 'stone_sword', name: 'Stone Sword', type: 'shaped',
    pattern: ['C', 'C', 'S'],
    key: { C: 'cobblestone', S: 'stick' },
    result: { id: 'stone_sword', count: 1, kind: 'tool' },
  },
  {
    id: 'iron_sword', name: 'Iron Sword', type: 'shaped',
    pattern: ['I', 'I', 'S'],
    key: { I: 'iron_ingot', S: 'stick' },
    result: { id: 'iron_sword', count: 1, kind: 'tool' },
  },
  {
    id: 'diamond_sword', name: 'Diamond Sword', type: 'shaped',
    pattern: ['D', 'D', 'S'],
    key: { D: 'diamond', S: 'stick' },
    result: { id: 'diamond_sword', count: 1, kind: 'tool' },
  },
];
