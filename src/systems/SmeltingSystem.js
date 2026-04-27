
export const SMELTING_RECIPES = {
    'raw_iron':   { result: 'iron_ingot',   time: 10000 },
    'raw_gold':   { result: 'gold_ingot',   time: 10000 },
    'raw_copper': { result: 'copper_ingot', time: 10000 },
    'cobblestone': { result: 'stone',        time: 10000 },
    'sand':        { result: 'glass',        time: 10000 },
    'oak_log':     { result: 'charcoal',     time: 10000 }
};

export class SmeltingSystem {
    constructor(engine) {
        this.engine = engine;
    }

    canSmelt(itemId) {
        return !!SMELTING_RECIPES[itemId];
    }

    getSmeltResult(itemId) {
        return SMELTING_RECIPES[itemId]?.result || null;
    }
}
