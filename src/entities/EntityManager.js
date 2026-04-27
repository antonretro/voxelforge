import { MOBS, MOB_MAP } from '../data/mobs.js';
import { Mob } from './Mob.js';

export class EntityManager {
  constructor(engine) {
    this.engine = engine;
    this.scene  = engine.scene;
    this.entities = [];
    this.mobRegistry = MOB_MAP;
  }

  spawn(typeId, x, y, z) {
    const def = this.mobRegistry.get(typeId);
    if (!def) { console.warn(`[EntityManager] Unknown mob: ${typeId}`); return null; }
    
    const mob = new Mob(this.engine, def, x, y, z);
    this.entities.push(mob);
    return mob;
  }

  remove(entity) {
    entity.dead = true;
    entity.mesh?.dispose();
    this.entities = this.entities.filter(e => !e.dead);
  }

  update(delta) {
    for (const entity of this.entities) {
      if (entity.dead) continue;
      if (entity.update) entity.update(delta);
    }
  }
}
