
import { Block } from "../engine/Block.js";

export class StructureManager {
    constructor(engine) {
        this.engine = engine;
    }

    spawn(type, chunk, x, y, z) {
        switch(type) {
            case 'house': this._buildHouse(chunk, x, y, z); break;
            case 'well': this._buildWell(chunk, x, y, z); break;
            case 'watchtower': this._buildWatchtower(chunk, x, y, z); break;
            case 'igloo': this._buildIgloo(chunk, x, y, z); break;
            case 'shrine': this._buildShrine(chunk, x, y, z); break;
            case 'ruined_portal': this._buildRuinedPortal(chunk, x, y, z); break;
            case 'temple': this._buildTemple(chunk, x, y, z); break;
            case 'dungeon': this._buildDungeon(chunk, x, y, z); break;
            case 'shipwreck': this._buildShipwreck(chunk, x, y, z); break;
            case 'witch_hut': this._buildWitchHut(chunk, x, y, z); break;
            case 'fossil': this._buildFossil(chunk, x, y, z); break;
            case 'tavern': this._buildTavern(chunk, x, y, z); break;
            case 'tent': this._buildTent(chunk, x, y, z); break;
            case 'lighthouse': this._buildLighthouse(chunk, x, y, z); break;
            case 'bridge': this._buildBridge(chunk, x, y, z); break;
            case 'farm': this._buildFarm(chunk, x, y, z); break;
            case 'graveyard': this._buildGraveyard(chunk, x, y, z); break;
            case 'statue': this._buildStatue(chunk, x, y, z); break;
            case 'garden': this._buildGarden(chunk, x, y, z); break;
            case 'stable': this._buildStable(chunk, x, y, z); break;
            case 'blacksmith': this._buildBlacksmith(chunk, x, y, z); break;
            case 'market_stall': this._buildMarketStall(chunk, x, y, z); break;
            case 'windmill': this._buildWindmill(chunk, x, y, z); break;
            case 'mine_entrance': this._buildMineEntrance(chunk, x, y, z); break;
            case 'wall_segment': this._buildWallSegment(chunk, x, y, z); break;
            case 'gatehouse': this._buildGatehouse(chunk, x, y, z); break;
            case 'gazebo': this._buildGazebo(chunk, x, y, z); break;
            case 'treehouse': this._buildTreehouse(chunk, x, y, z); break;
            case 'cactus_garden': this._buildCactusGarden(chunk, x, y, z); break;
            case 'ice_spikes': this._buildIceSpikes(chunk, x, y, z); break;
            case 'bunker': this._buildBunker(chunk, x, y, z); break;
        }
    }

    _setBlock(chunk, x, y, z, id) {
        // Use global setBlockAt to support multi-chunk structures
        this.engine.chunkManager.setBlockAt(x, y, z, id);
    }

    _buildHouse(chunk, x, y, z) {
        for (let dy = 0; dy < 4; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                    const isWall = Math.abs(dx) === 2 || Math.abs(dz) === 2;
                    const isCorner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
                    if (isCorner) this._setBlock(chunk, x + dx, y + dy, z + dz, 4); // Log
                    else if (isWall) this._setBlock(chunk, x + dx, y + dy, z + dz, 23); // Planks
                    else if (dy === 3) this._setBlock(chunk, x + dx, y + dy, z + dz, 23);
                }
            }
        }
    }

    _buildWell(chunk, x, y, z) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const isCenter = dx === 0 && dz === 0;
                if (!isCenter) this._setBlock(chunk, x + dx, y, z + dz, 22);
                else this._setBlock(chunk, x + dx, y, z + dz, 6);
            }
        }
    }

    _buildWatchtower(chunk, x, y, z) {
        for (let dy = 0; dy < 8; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const isWall = Math.abs(dx) === 1 || Math.abs(dz) === 1;
                    if (isWall) this._setBlock(chunk, x + dx, y + dy, z + dz, 22);
                    else if (dy === 7) this._setBlock(chunk, x + dx, y + dy, z + dz, 23);
                }
            }
        }
    }

    _buildTemple(chunk, x, y, z) {
        for (let dy = 0; dy < 8; dy++) {
            const r = 7 - dy;
            for (let dx = -r; dx <= r; dx++) {
                for (let dz = -r; dz <= r; dz++) {
                    this._setBlock(chunk, x + dx, y + dy, z + dz, 11);
                }
            }
        }
    }

    _buildTent(chunk, x, y, z) {
        for (let dy = 0; dy < 3; dy++) {
            for (let dx = -dy; dx <= dy; dx++) {
                this._setBlock(chunk, x + dx, y + (2-dy), z - 2, 79); // White wool
                this._setBlock(chunk, x + dx, y + (2-dy), z + 2, 79);
            }
        }
        for (let dz = -2; dz <= 2; dz++) {
            this._setBlock(chunk, x - 2, y, z + dz, 79);
            this._setBlock(chunk, x + 2, y, z + dz, 79);
            this._setBlock(chunk, x, y + 2, z + dz, 79);
        }
    }

    _buildLighthouse(chunk, x, y, z) {
        for (let dy = 0; dy < 15; dy++) {
            const color = (Math.floor(dy / 3) % 2 === 0) ? 154 : 79; // Red/White wool
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (Math.abs(dx) === 2 || Math.abs(dz) === 2) this._setBlock(chunk, x + dx, y + dy, z + dz, color);
                }
            }
        }
        this._setBlock(chunk, x, y + 15, z, 50); // Glowstone lamp
    }

    _buildBridge(chunk, x, y, z) {
        for (let dz = -5; dz <= 5; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
                this._setBlock(chunk, x + dx, y, z + dz, 22); // Stone path
            }
            this._setBlock(chunk, x - 2, y + 1, z + dz, 112); // Fence
            this._setBlock(chunk, x + 2, y + 1, z + dz, 112);
        }
    }

    _buildFarm(chunk, x, y, z) {
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                if (dx === 0 && dz === 0) this._setBlock(chunk, x + dx, y, z + dz, 6); // Water
                else {
                    this._setBlock(chunk, x + dx, y, z + dz, 5); // Farmland/Grass
                    this._setBlock(chunk, x + dx, y + 1, z + dz, 126); // Wheat/Grass
                }
            }
        }
    }

    _buildGraveyard(chunk, x, y, z) {
        for (let i = 0; i < 5; i++) {
            const rx = (Math.random() - 0.5) * 8;
            const rz = (Math.random() - 0.5) * 8;
            this._setBlock(chunk, x + rx, y, z + rz, 22); // Grave
            this._setBlock(chunk, x + rx, y + 1, z + rz, 22);
        }
    }

    _buildStatue(chunk, x, y, z) {
        for (let dy = 0; dy < 3; dy++) this._setBlock(chunk, x, y + dy, z, 3); // Stone pillar
        this._setBlock(chunk, x - 1, y + 2, z, 3); // Arms
        this._setBlock(chunk, x + 1, y + 2, z, 3);
        this._setBlock(chunk, x, y + 3, z, 22); // Head
    }

    _buildGarden(chunk, x, y, z) {
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                if (Math.random() > 0.7) this._setBlock(chunk, x + dx, y, z + dz, 102); // Flowers
                if (Math.random() > 0.9) this._setBlock(chunk, x + dx, y, z + dz, 8); // Leaves
            }
        }
    }

    _buildStable(chunk, x, y, z) {
        for (let dz = -3; dz <= 3; dz++) {
            this._setBlock(chunk, x - 2, y, z, 4);
            this._setBlock(chunk, x + 2, y, z, 4);
            if (Math.abs(dz) === 3) {
                for (let dx = -2; dx <= 2; dx++) this._setBlock(chunk, x + dx, y + 3, z + dz, 23);
            }
        }
    }

    _buildBlacksmith(chunk, x, y, z) {
        this._buildHouse(chunk, x, y, z);
        this._setBlock(chunk, x + 3, y, z, 10); // Lava pit
        this._setBlock(chunk, x + 3, y, z + 1, 10);
        this._setBlock(chunk, x + 2, y, z, 40); // Anvil placeholder (crafting table)
    }

    _buildMarketStall(chunk, x, y, z) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                this._setBlock(chunk, x + dx, y + 3, z + dz, 154); // Red wool roof
            }
        }
        this._setBlock(chunk, x - 1, y, z - 1, 112); // Fences
        this._setBlock(chunk, x + 1, y, z - 1, 112);
        this._setBlock(chunk, x - 1, y, z + 1, 112);
        this._setBlock(chunk, x + 1, y, z + 1, 112);
    }

    _buildWindmill(chunk, x, y, z) {
        for (let dy = 0; dy < 10; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) this._setBlock(chunk, x + dx, y + dy, z + dz, 4);
            }
        }
        // Sails
        for (let i = -3; i <= 3; i++) {
            this._setBlock(chunk, x + i, y + 8, z + 2, 79);
            this._setBlock(chunk, x, y + 8 + i, z + 2, 79);
        }
    }

    _buildMineEntrance(chunk, x, y, z) {
        for (let dy = 0; dy < 3; dy++) {
            this._setBlock(chunk, x - 2, y + dy, z, 4);
            this._setBlock(chunk, x + 2, y + dy, z, 4);
        }
        for (let dx = -2; dx <= 2; dx++) this._setBlock(chunk, x + dx, y + 3, z, 4);
    }

    _buildWallSegment(chunk, x, y, z) {
        for (let dy = 0; dy < 5; dy++) {
            for (let dx = -3; dx <= 3; dx++) this._setBlock(chunk, x + dx, y + dy, z, 22);
        }
        for (let dx = -3; dx <= 3; dx += 2) this._setBlock(chunk, x + dx, y + 5, z, 22); // Battlements
    }

    _buildGatehouse(chunk, x, y, z) {
        this._buildWallSegment(chunk, x - 4, y, z);
        this._buildWallSegment(chunk, x + 4, y, z);
        this._buildWatchtower(chunk, x, y, z + 2);
    }

    _buildGazebo(chunk, x, y, z) {
        for (let dx = -2; dx <= 2; dx += 4) {
            for (let dz = -2; dz <= 2; dz += 4) {
                for (let dy = 0; dy < 3; dy++) this._setBlock(chunk, x + dx, y + dy, z + dz, 112);
            }
        }
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) this._setBlock(chunk, x + dx, y + 3, z + dz, 8);
        }
    }

    _buildTreehouse(chunk, x, y, z) {
        for (let dy = 0; dy < 8; dy++) this._setBlock(chunk, x, y + dy, z, 4); // Trunk
        this._buildHouse(chunk, x, y + 8, z);
    }

    _buildCactusGarden(chunk, x, y, z) {
        for (let i = 0; i < 5; i++) {
            const rx = (Math.random() - 0.5) * 6;
            const rz = (Math.random() - 0.5) * 6;
            for (let dy = 0; dy < 3; dy++) this._setBlock(chunk, x + rx, y + dy, z + rz, 43); // Cactus
        }
    }

    _buildIceSpikes(chunk, x, y, z) {
        for (let i = 0; i < 3; i++) {
            const rx = (Math.random() - 0.5) * 10;
            const rz = (Math.random() - 0.5) * 10;
            const h = 5 + Math.random() * 10;
            for (let dy = 0; dy < h; dy++) this._setBlock(chunk, x + rx, y + dy, z + rz, 148); // Packed Ice
        }
    }

    _buildBunker(chunk, x, y, z) {
        for (let dy = -3; dy < 0; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                for (let dz = -3; dz <= 3; dz++) this._setBlock(chunk, x + dx, y + dy, z + dz, 22);
            }
        }
        this._setBlock(chunk, x, y, z, 149); // Iron trapdoor entrance
    }

    _buildIgloo(chunk, x, y, z) {
        // Snow Dome (3x3x2)
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    this._setBlock(chunk, x + dx, y + dy, z + dz, 12); // Snow
                }
            }
        }
        // Chest inside
        this._setBlock(chunk, x, y, z, 42);
    }

    _buildShrine(chunk, x, y, z) {
        // Mossy Stone Shrine
        this._setBlock(chunk, x, y, z, 45); // Mossy Cobblestone
        this._setBlock(chunk, x, y + 1, z, 102); // Poppy on top
    }

    _buildRuinedPortal(chunk, x, y, z) {
        // Obsidian Frame
        for (let dy = 0; dy < 5; dy++) {
            this._setBlock(chunk, x, y + dy, z, 46); // Obsidian
            this._setBlock(chunk, x + 3, y + dy, z, 46);
        }
        for (let dx = 0; dx <= 3; dx++) {
            this._setBlock(chunk, x + dx, y, z, 46);
            this._setBlock(chunk, x + dx, y + 4, z, 46);
        }
    }

    _buildShipwreck(chunk, x, y, z) {
        // Simple Oak Hull
        for (let dz = 0; dz < 6; dz++) {
            this._setBlock(chunk, x, y, z + dz, 4); // Oak Log
            this._setBlock(chunk, x - 1, y + 1, z + dz, 23); // Planks
            this.this._setBlock(chunk, x + 1, y + 1, z + dz, 23);
        }
        // Chest in hull
        this._setBlock(chunk, x, y + 1, z + 2, 42);
    }

    _buildWitchHut(chunk, x, y, z) {
        // Dark Oak Hut on stilts
        for (let dy = 0; dy < 3; dy++) this._setBlock(chunk, x, y + dy, z, 34); // Stilt
        this._buildHouse(chunk, x, y + 3, z); // House on top (simplified)
    }

    _buildFossil(chunk, x, y, z) {
        // Bone block rib
        for (let dx = -2; dx <= 2; dx++) {
            this._setBlock(chunk, x + dx, y + 2, z, 89); // Bone block
        }
        this._setBlock(chunk, x - 2, y + 1, z, 89);
        this._setBlock(chunk, x + 2, y + 1, z, 89);
    }

    _buildDungeon(chunk, x, y, z) {
        // Cobblestone room
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                for (let dy = 0; dy < 4; dy++) {
                    const isWall = Math.abs(dx) === 3 || Math.abs(dz) === 3;
                    if (isWall) this._setBlock(chunk, x + dx, y + dy, z + dz, 22);
                }
            }
        }
    }

    _buildTavern(chunk, x, y, z) {
        // Larger House
        this._buildHouse(chunk, x, y, z);
        this._buildHouse(chunk, x + 4, y, z);
    }
}
