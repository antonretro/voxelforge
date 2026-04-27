
import { Entity } from "./Entity.js";
import { Vector3 } from "./math/Vector3.js";
import { Block } from "./Block.js";

export class Particle {
    constructor(gl, textureCoords) {
        this.entity = new Entity(gl);
        this.entity.transparent = true;
        
        const size = 0.1 + Math.random() * 0.1;
        const faces = [
            [Block.FRONT, [0,0,0], textureCoords, Block.NORMAL.FRONT]
        ];
        this.entity.generateFromFaces(faces);
        this.entity.scale.set(size, size, size);
        
        this.velocity = new Vector3(
            (Math.random() - 0.5) * 4,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 4
        );
        this.life = 1.0;
        this.active = false;
    }

    reset(pos, tex) {
        this.entity.setPosition(pos);
        this.life = 1.0;
        this.active = true;
        // Ideally update texture here if needed, but for now we reuse the quad
    }

    update(dt) {
        if (!this.active) return;
        
        this.velocity.y -= 15 * dt; // Gravity
        const pos = this.entity.position.clone();
        pos.x += this.velocity.x * dt;
        pos.y += this.velocity.y * dt;
        pos.z += this.velocity.z * dt;
        
        this.entity.setPosition(pos);
        this.life -= dt * 1.5;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }
}

export class ParticleSystem {
    constructor(engine) {
        this.engine = engine;
        this.particles = [];
        this.poolSize = 100;
        
        for (let i = 0; i < this.poolSize; i++) {
            // Default dirt texture for pool init
            this.particles.push(new Particle(engine.renderer.context, Block.get(3).textures.top));
            this.engine.scene.add(this.particles[i].entity);
        }
    }

    spawn(pos, blockId, count = 10) {
        const block = Block.get(blockId);
        const tex = block.textures.top;
        
        let spawned = 0;
        for (const p of this.particles) {
            if (!p.active) {
                p.reset(pos.clone().add(new Vector3(Math.random(), Math.random(), Math.random())), tex);
                spawned++;
                if (spawned >= count) break;
            }
        }
    }

    update(dt) {
        for (const p of this.particles) {
            if (p.active) {
                p.update(dt);
            } else {
                p.entity.setPosition(new Vector3(0, -100, 0)); // Hide
            }
        }
    }
}
