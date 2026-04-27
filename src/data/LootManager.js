
import { ITEMS } from './items.js';

export const LOOT_TABLES = {
    common: [
        { id: 'apple', min: 1, max: 3, weight: 10 },
        { id: 'bread', min: 1, max: 4, weight: 10 },
        { id: 'stick', min: 2, max: 8, weight: 15 },
        { id: 'wooden_pickaxe', min: 1, max: 1, weight: 5 },
        { id: 'coal', min: 1, max: 4, weight: 12 },
        { id: 'iron_nugget', min: 2, max: 5, weight: 8 },
        { id: 'rotten_flesh', min: 1, max: 2, weight: 10 },
    ],
    rare: [
        { id: 'iron_ingot', min: 1, max: 3, weight: 8 },
        { id: 'gold_ingot', min: 1, max: 2, weight: 6 },
        { id: 'iron_pickaxe', min: 1, max: 1, weight: 4 },
        { id: 'golden_apple', min: 1, max: 1, weight: 2 },
        { id: 'diamond', min: 1, max: 1, weight: 1 },
        { id: 'emerald', min: 1, max: 2, weight: 3 },
        { id: 'bucket', min: 1, max: 1, weight: 5 },
    ],
    legendary: [
        { id: 'diamond_sword', min: 1, max: 1, weight: 5 },
        { id: 'enchanted_golden_apple', min: 1, max: 1, weight: 2 },
        { id: 'diamond_chestplate', min: 1, max: 1, weight: 3 },
        { id: 'netherite_scrap', min: 1, max: 1, weight: 1 },
        { id: 'totem_of_undying', min: 1, max: 1, weight: 1 },
        { id: 'music_disc_cat', min: 1, max: 1, weight: 2 },
    ]
};

export class LootManager {
    static generate(type = 'common', slots = 27) {
        const table = LOOT_TABLES[type] || LOOT_TABLES.common;
        const items = Array(slots).fill(null);
        
        // Random number of items in the container (2-8 for common, 4-12 for rare)
        const itemCount = Math.floor(Math.random() * 5) + 2; 

        for (let i = 0; i < itemCount; i++) {
            const entry = this.getRandomEntry(table);
            const slotIndex = Math.floor(Math.random() * slots);
            
            if (!items[slotIndex]) {
                const count = Math.floor(Math.random() * (entry.max - entry.min + 1)) + entry.min;
                items[slotIndex] = { id: entry.id, count };
            }
        }

        return items;
    }

    static getRandomEntry(table) {
        const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const entry of table) {
            if (random < entry.weight) return entry;
            random -= entry.weight;
        }
        
        return table[0];
    }
}
