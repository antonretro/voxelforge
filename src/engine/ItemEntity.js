import { Entity } from "./Entity.js";
import { Vector3 } from "./math/Vector3.js";
import { getTextureCoords } from "./loadTexture.js";

export class ItemEntity extends Entity {
    constructor(engine, block, pos) {
        super(engine.renderer.context);
        this.engine = engine;
        this.block = block;
        this.setPosition(pos);
        this.scale.set(0.3, 0.3, 0.3);
        
        // Random initial pop
        this.velocity = new Vector3(
            (Math.random() - 0.5) * 0.12,
            0.18,
            (Math.random() - 0.5) * 0.12
        );
        this.age = 0;
        this.pickedUp = false;

        this._buildModel();
        engine.scene.add(this);
    }

    _buildModel() {
        const tex = this.block.texture || this.block.side || 'grass_block_side';
        const coords = getTextureCoords(tex) || [0,0,0, 1,0,0, 1,1,0, 0,1,0];
        
        const v = [
            [new Vector3(0,1,1), new Vector3(1,1,1), new Vector3(1,1,0), new Vector3(0,1,0)], // TOP
            [new Vector3(0,0,0), new Vector3(1,0,0), new Vector3(1,0,1), new Vector3(0,0,1)], // BOTTOM
            [new Vector3(1,1,1), new Vector3(0,1,1), new Vector3(0,0,1), new Vector3(1,0,1)], // FRONT
            [new Vector3(0,1,0), new Vector3(1,1,0), new Vector3(1,0,0), new Vector3(0,0,0)], // BACK
            [new Vector3(0,1,1), new Vector3(0,1,0), new Vector3(0,0,0), new Vector3(0,0,1)], // LEFT
            [new Vector3(1,1,0), new Vector3(1,1,1), new Vector3(1,0,1), new Vector3(1,0,0)]  // RIGHT
        ];
        
        const faces = [];
        const norms = [Vector3.UP, Vector3.DOWN, Vector3.FORWARD, Vector3.BACKWARD, Vector3.LEFT, Vector3.RIGHT];
        for(let i=0; i<6; i++) {
            // Need 4 normals per face (one per vertex)
            const n4 = [norms[i], norms[i], norms[i], norms[i]];
            faces.push([v[i], [-0.5, -0.5, -0.5], coords, n4]);
        }
        this.generateFromFaces(faces);
    }

    update(dt) {
        this.age += dt;
        const t = dt / 16.6;
        
        // Physics
        this.velocity.y -= 0.008 * t; // Gravity
        this.position.add(this.velocity.clone().multiply(t));
        
        // Friction
        this.velocity.x *= Math.pow(0.98, t);
        this.velocity.z *= Math.pow(0.98, t);

        // Ground bounce
        const groundY = Math.floor(this.position.y);
        const bUnder = this.engine.chunkManager.getBlockAt(this.position.x, this.position.y - 0.1, this.position.z);
        if (bUnder && bUnder.solid && this.position.y < groundY + 1.2) {
            this.position.y = groundY + 1.1;
            this.velocity.y *= -0.3;
            if (Math.abs(this.velocity.y) < 0.01) this.velocity.y = 0;
        }

        // Spin
        this.rotation.fromEuler(this.age * 0.001, this.age * 0.002, 0);

        // Attraction to player (Magnetism)
        const playerPos = this.engine.player.position;
        // Check distance to player's feet (approx playerPos.y - 1.6)
        const feetPos = playerPos.clone();
        feetPos.y -= 1.2; 
        
        const dist = this.position.distanceTo(playerPos);
        const feetDist = this.position.distanceTo(feetPos);
        
        // Use the closer of eyes or feet for pickup detection
        const effectiveDist = Math.min(dist, feetDist);

        if (effectiveDist < 5.0 && !this.pickedUp) {
            const dir = playerPos.clone().subtract(this.position).normalise();
            const pull = (5.0 - effectiveDist) * 0.025 * t;
            this.velocity.add(dir.multiply(pull));
            
            if (effectiveDist < 1.5) {
                const dropId = this.block.drop || this.block.name;
                if (this.engine.player.addItem({ id: dropId, count: 1 })) {
                    this.pickedUp = true;
                    this.destroy();
                    return true;
                }
            }
        }
        
        this.shouldUpdate = true;
        return false;
    }

    destroy() {
        this.engine.scene.remove(this);
        this.dead = true;
    }
}
