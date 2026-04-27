
import { Entity } from "../engine/Entity.js";
import { Vector3 } from "../engine/math/Vector3.js";
import { Block } from "../engine/Block.js";

export class Mob {
    constructor(engine, typeDef, x, y, z) {
        this.engine = engine;
        this.def = typeDef;
        this.position = new Vector3(x, y, z);
        this.velocity = new Vector3(0, 0, 0);
        this.rotation = 0;
        this.entity = new Entity(engine.renderer.context);
        this.eyeHeight = typeDef.height * 0.8;
        this.onGround = false;
        
        this.targetRotation = Math.random() * Math.PI * 2;
        this.nextWanderTime = 0;
        
        this._buildModel();
        engine.scene.add(this.entity);
    }

    _buildModel() {
        const faces = [];
        const w = this.def.width;
        const h = this.def.height;
        const color = this.def.color;
        
        // Simple cube model for the mob body
        const pos = [0, 0, 0];
        const tex = [0,0,0, 1,0,0, 1,1,0, 0,1,0]; // Placeholder UVs
        const norms = [Vector3.UP, Vector3.UP, Vector3.UP, Vector3.UP];
        
        // We'll use the 'white_wool' or similar texture for sheep, 'pink_concrete' for pig
        const blockTex = this.def.id === 'sheep' ? 'white_wool' : 'pink_concrete';
        
        // Build 6 faces for a boxy animal
        const box = (px, py, pz, bw, bh, bd) => {
            const v = [
                [new Vector3(0, bh, bd), new Vector3(bw, bh, bd), new Vector3(bw, bh, 0), new Vector3(0, bh, 0)], // TOP
                [new Vector3(0, 0, 0), new Vector3(bw, 0, 0), new Vector3(bw, 0, bd), new Vector3(0, 0, bd)], // BOTTOM
                [new Vector3(bw, bh, bd), new Vector3(0, bh, bd), new Vector3(0, 0, bd), new Vector3(bw, 0, bd)], // FRONT
                [new Vector3(0, bh, 0), new Vector3(bw, bh, 0), new Vector3(bw, 0, 0), new Vector3(0, 0, 0)], // BACK
                [new Vector3(0, bh, bd), new Vector3(0, bh, 0), new Vector3(0, 0, 0), new Vector3(0, 0, bd)], // LEFT
                [new Vector3(bw, bh, 0), new Vector3(bw, bh, bd), new Vector3(bw, 0, bd), new Vector3(bw, 0, 0)]  // RIGHT
            ];
            const p = [px, py, pz];
            for(let i=0; i<6; i++) faces.push([v[i], p, tex, norms]);
        };

        box(-w/2, 0, -w/2, w, h, w); // Main body
        
        this.entity.generateFromFaces(faces);
    }

    update(dt) {
        const t = dt / 16.6;
        
        // 1. AI: Wander
        const now = performance.now();
        if (now > this.nextWanderTime) {
            this.targetRotation = Math.random() * Math.PI * 2;
            this.nextWanderTime = now + 2000 + Math.random() * 5000;
        }

        // Smoothly rotate towards target
        this.rotation += (this.targetRotation - this.rotation) * 0.05 * t;

        // 2. Physics
        const speed = this.def.speed * t;
        const dirX = -Math.sin(this.rotation);
        const dirZ = -Math.cos(this.rotation);
        
        this.velocity.x = dirX * speed;
        this.velocity.z = dirZ * speed;
        this.velocity.y -= 0.015 * t; // Gravity

        const start = this.position.clone();
        const next = start.clone().add(this.velocity);

        // Ground check
        const bUnder = this.engine.chunkManager.getBlockAt(next.x, next.y - 0.1, next.z);
        if (bUnder && bUnder.solid) {
            this.velocity.y = 0;
            next.y = Math.floor(next.y) + 1.0;
            this.onGround = true;
            
            // Auto-jump if obstacle
            const bFront = this.engine.chunkManager.getBlockAt(next.x + dirX * 0.5, next.y, next.z + dirZ * 0.5);
            if (bFront && bFront.solid) {
                this.velocity.y = 0.3;
            }
        } else {
            this.onGround = false;
        }

        this.position.copy(next);
        this.entity.setPosition(this.position);
        this.entity.rotation.fromEuler(0, this.rotation, 0);
        this.entity.shouldUpdate = true;
    }
}
