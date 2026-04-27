import { Block } from "../engine/Block.js";

export class RedstoneSystem {
    constructor(engine) {
        this.engine = engine;
        this.powerMap = new Map(); // Key: "x,y,z", Value: powerLevel (0-15)
        this.updateQueue = [];
    }

    update() {
        if (this.updateQueue.length === 0) return;

        const nextQueue = [];
        const affected = new Set();

        while (this.updateQueue.length > 0) {
            const pos = this.updateQueue.shift();
            const key = `${pos.x},${pos.y},${pos.z}`;
            
            const oldPower = this.powerMap.get(key) || 0;
            const newPower = this.calculatePowerAt(pos.x, pos.y, pos.z);

            if (oldPower !== newPower) {
                this.powerMap.set(key, newPower);
                affected.add(key);
                
                // Notify neighbors
                this.getNeighbors(pos).forEach(n => {
                    nextQueue.push(n);
                });

                // Update block visuals (e.g. Lamp)
                this.updateVisuals(pos, newPower);
            }
        }

        this.updateQueue = nextQueue;
    }

    calculatePowerAt(x, y, z) {
        const blockId = this.engine.world.getBlock(x, y, z);
        
        // Power Sources
        if (blockId === 230) return 15; // Redstone Block
        if (blockId === 231) return 15; // Redstone Torch

        // Wires take power from neighbors
        if (blockId === 233) {
            let maxN = 0;
            this.getNeighbors({x,y,z}).forEach(n => {
                const p = this.powerMap.get(`${n.x},${n.y},${n.z}`) || 0;
                maxN = Math.max(maxN, p);
            });
            return Math.max(0, maxN - 1);
        }

        return 0;
    }

    getNeighbors(pos) {
        return [
            {x: pos.x+1, y: pos.y, z: pos.z},
            {x: pos.x-1, y: pos.y, z: pos.z},
            {x: pos.x, y: pos.y+1, z: pos.z},
            {x: pos.x, y: pos.y-1, z: pos.z},
            {x: pos.x, y: pos.y, z: pos.z+1},
            {x: pos.x, y: pos.y, z: pos.z-1},
        ];
    }

    updateVisuals(pos, power) {
        const blockId = this.engine.world.getBlock(pos.x, pos.y, pos.z);
        if (blockId === 232) { // Redstone Lamp
            // In a real engine we'd swap the block or update a uniform
            // For now, let's just log it or handle it via a dirty flag if possible
            if (power > 0) {
                // Glow effect could be handled here
            }
        }
    }

    notify(x, y, z) {
        this.updateQueue.push({x, y, z});
        this.getNeighbors({x,y,z}).forEach(n => this.updateQueue.push(n));
    }
}
