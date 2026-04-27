
export class WorldManager {
    constructor(engine) {
        this.engine = engine;
        this.worlds = JSON.parse(localStorage.getItem('voxelforge_worlds') || '[]');
        this.currentWorld = null;
    }

    _hashSeed(seed) {
        if (!isNaN(seed) && !isNaN(parseFloat(seed))) return Math.floor(parseFloat(seed));
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    createWorld(name, seed) {
        // Use provided seed or generate a unique random string if empty
        const seedInput = seed && seed.trim() !== '' ? seed : (Math.random() * 1000000).toString() + Date.now();
        const numericSeed = this._hashSeed(seedInput);
        
        const newWorld = {
            id: Date.now().toString(),
            name: name || 'New World',
            seed: numericSeed,
            created: Date.now(),
            lastPlayed: Date.now()
        };
        this.worlds.push(newWorld);
        this.saveWorldsList();
        return newWorld;
    }

    deleteWorld(id) {
        this.worlds = this.worlds.filter(w => w.id !== id);
        this.saveWorldsList();
        // Clear chunk data for this world
        for (let key in localStorage) {
            if (key.startsWith(`vf_data_${id}_`)) {
                localStorage.removeItem(key);
            }
        }
    }

    saveWorldsList() {
        localStorage.setItem('voxelforge_worlds', JSON.stringify(this.worlds));
    }

    saveChunk(worldId, x, z, data) {
        // Compress data slightly by only saving non-air blocks if needed, 
        // but for now we'll save the whole buffer as a base64 string
        const key = `vf_data_${worldId}_${x}_${z}`;
        const str = btoa(String.fromCharCode.apply(null, data));
        localStorage.setItem(key, str);
    }

    loadChunk(worldId, x, z) {
        const key = `vf_data_${worldId}_${x}_${z}`;
        const str = localStorage.getItem(key);
        if (!str) return null;
        
        const bin = atob(str);
        const buf = new Uint16Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
            buf[i] = bin.charCodeAt(i);
        }
        return buf;
    }
}
