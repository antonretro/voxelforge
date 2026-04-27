
export const LOOT_TABLES = {
    village_weaponsmith: [
        { id: 'iron_ingot', min: 1, max: 5, chance: 0.8 },
        { id: 'gold_ingot', min: 1, max: 3, chance: 0.4 },
        { id: 'diamond', min: 1, max: 3, chance: 0.1 },
        { id: 'iron_sword', min: 1, max: 1, chance: 0.2 },
        { id: 'iron_pickaxe', min: 1, max: 1, chance: 0.2 },
        { id: 'obsidian', min: 3, max: 7, chance: 0.2 },
        { id: 'bread', min: 3, max: 6, chance: 0.6 }
    ],
    village_fletcher: [
        { id: 'arrow', min: 5, max: 20, chance: 0.9 },
        { id: 'flint', min: 1, max: 3, chance: 0.6 },
        { id: 'stick', min: 1, max: 5, chance: 0.5 },
        { id: 'feather', min: 1, max: 4, chance: 0.4 }
    ],
    village_temple: [
        { id: 'rotten_flesh', min: 1, max: 4, chance: 0.8 },
        { id: 'gold_ingot', min: 1, max: 3, chance: 0.5 },
        { id: 'emerald', min: 1, max: 4, chance: 0.3 },
        { id: 'diamond', min: 1, max: 1, chance: 0.05 }
    ],
    village_cartographer: [
        { id: 'paper', min: 2, max: 10, chance: 0.9 },
        { id: 'map', min: 1, max: 1, chance: 0.4 },
        { id: 'compass', min: 1, max: 1, chance: 0.2 },
        { id: 'bread', min: 1, max: 3, chance: 0.5 }
    ],
    dungeon: [
        { id: 'iron_ingot', min: 1, max: 4, chance: 0.8 },
        { id: 'gold_ingot', min: 1, max: 4, chance: 0.5 },
        { id: 'enchanted_book', min: 1, max: 1, chance: 0.2 },
        { id: 'name_tag', min: 1, max: 1, chance: 0.3 },
        { id: 'saddle', min: 1, max: 1, chance: 0.3 },
        { id: 'gunpowder', min: 1, max: 8, chance: 0.6 },
        { id: 'string', min: 1, max: 8, chance: 0.6 }
    ],
    desert_pyramid: [
        { id: 'gold_ingot', min: 2, max: 7, chance: 0.9 },
        { id: 'iron_ingot', min: 1, max: 5, chance: 0.7 },
        { id: 'diamond', min: 1, max: 3, chance: 0.2 },
        { id: 'emerald', min: 1, max: 5, chance: 0.3 },
        { id: 'tnt', min: 1, max: 4, chance: 0.4 },
        { id: 'rotten_flesh', min: 5, max: 15, chance: 0.8 },
        { id: 'bone', min: 5, max: 15, chance: 0.8 }
    ],
    jungle_temple: [
        { id: 'gold_ingot', min: 2, max: 7, chance: 0.9 },
        { id: 'iron_ingot', min: 1, max: 5, chance: 0.7 },
        { id: 'diamond', min: 1, max: 3, chance: 0.2 },
        { id: 'emerald', min: 1, max: 5, chance: 0.3 },
        { id: 'bamboo', min: 1, max: 5, chance: 0.5 }
    ],
    abandoned_mineshaft: [
        { id: 'rail', min: 4, max: 16, chance: 0.9 },
        { id: 'iron_ingot', min: 1, max: 5, chance: 0.6 },
        { id: 'gold_ingot', min: 1, max: 3, chance: 0.3 },
        { id: 'diamond', min: 1, max: 2, chance: 0.1 },
        { id: 'lapis_lazuli', min: 4, max: 9, chance: 0.2 },
        { id: 'bread', min: 1, max: 4, chance: 0.5 },
        { id: 'coal', min: 3, max: 8, chance: 0.7 }
    ],
    nether_bridge: [
        { id: 'gold_ingot', min: 2, max: 8, chance: 0.9 },
        { id: 'iron_ingot', min: 1, max: 5, chance: 0.6 },
        { id: 'diamond', min: 1, max: 3, chance: 0.2 },
        { id: 'nether_wart', min: 3, max: 7, chance: 0.5 },
        { id: 'blaze_rod', min: 1, max: 1, chance: 0.1 }
    ],
    bastion_treasure: [
        { id: 'ancient_debris', min: 1, max: 2, chance: 0.15 },
        { id: 'netherite_ingot', min: 1, max: 1, chance: 0.05 },
        { id: 'diamond_sword', min: 1, max: 1, chance: 0.2 },
        { id: 'diamond_pickaxe', min: 1, max: 1, chance: 0.2 },
        { id: 'gold_block', min: 1, max: 5, chance: 0.8 }
    ],
    end_city_treasure: [
        { id: 'diamond', min: 2, max: 7, chance: 0.9 },
        { id: 'emerald', min: 4, max: 12, chance: 0.8 },
        { id: 'diamond_chestplate', min: 1, max: 1, chance: 0.3 },
        { id: 'diamond_boots', min: 1, max: 1, chance: 0.3 },
        { id: 'gold_ingot', min: 5, max: 15, chance: 0.7 },
        { id: 'iron_ingot', min: 5, max: 15, chance: 0.7 }
    ],
    pillager_outpost: [
        { id: 'crossbow', min: 1, max: 1, chance: 0.3 },
        { id: 'arrow', min: 10, max: 30, chance: 0.9 },
        { id: 'iron_ingot', min: 1, max: 5, chance: 0.5 },
        { id: 'wheat', min: 3, max: 8, chance: 0.6 }
    ],
    shipwreck_treasure: [
        { id: 'emerald', min: 4, max: 12, chance: 0.9 },
        { id: 'gold_ingot', min: 5, max: 15, chance: 0.8 },
        { id: 'iron_ingot', min: 10, max: 25, chance: 0.8 },
        { id: 'diamond', min: 1, max: 1, chance: 0.1 }
    ],
    buried_treasure: [
        { id: 'heart_of_the_sea', min: 1, max: 1, chance: 1.0 },
        { id: 'diamond', min: 1, max: 4, chance: 0.6 },
        { id: 'emerald', min: 4, max: 12, chance: 0.7 },
        { id: 'gold_ingot', min: 5, max: 15, chance: 0.8 },
        { id: 'iron_ingot', min: 10, max: 25, chance: 0.8 }
    ],
    stronghold_library: [
        { id: 'book', min: 5, max: 15, chance: 0.9 },
        { id: 'paper', min: 2, max: 10, chance: 0.8 },
        { id: 'enchanted_book', min: 1, max: 3, chance: 0.5 },
        { id: 'compass', min: 1, max: 1, chance: 0.3 }
    ],
    stronghold_crossing: [
        { id: 'iron_ingot', min: 1, max: 5, chance: 0.6 },
        { id: 'gold_ingot', min: 1, max: 3, chance: 0.3 },
        { id: 'bread', min: 1, max: 3, chance: 0.5 },
        { id: 'apple', min: 1, max: 3, chance: 0.4 }
    ],
    village_mason: [
        { id: 'clay_ball', min: 1, max: 10, chance: 0.8 },
        { id: 'stone', min: 5, max: 20, chance: 0.7 },
        { id: 'brick', min: 1, max: 5, chance: 0.5 }
    ],
    bastion_bridge: [
        { id: 'gold_ingot', min: 5, max: 15, chance: 1.0 },
        { id: 'gold_block', min: 1, max: 3, chance: 0.4 },
        { id: 'iron_ingot', min: 2, max: 8, chance: 0.5 }
    ],
    bastion_other: [
        { id: 'gilded_blackstone', min: 1, max: 5, chance: 0.6 },
        { id: 'gold_nugget', min: 5, max: 20, chance: 0.9 },
        { id: 'magma_cream', min: 1, max: 4, chance: 0.4 }
    ],
    ancient_city: [
        { id: 'echo_shard', min: 1, max: 3, chance: 0.2 },
        { id: 'diamond_leggings', min: 1, max: 1, chance: 0.1 },
        { id: 'enchanted_golden_apple', min: 1, max: 1, chance: 0.05 },
        { id: 'music_disc_5', min: 1, max: 1, chance: 0.1 }
    ]
};

export class LootSystem {
    static generateLoot(tableName) {
        const table = LOOT_TABLES[tableName];
        if (!table) return [];

        const loot = [];
        const slots = 27;
        const usedSlots = new Set();

        for (const entry of table) {
            if (Math.random() < entry.chance) {
                const count = Math.floor(Math.random() * (entry.max - entry.min + 1)) + entry.min;
                let slot;
                do {
                    slot = Math.floor(Math.random() * slots);
                } while (usedSlots.has(slot));
                
                usedSlots.add(slot);
                loot.push({
                    slot,
                    item: { id: entry.id, count }
                });
            }
        }
        return loot;
    }
}
