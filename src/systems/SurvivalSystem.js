export class SurvivalSystem {
    constructor(engine) {
        this.engine     = engine;
        this.maxHealth  = 20;
        this.health     = 20;
        this.maxHunger  = 20;
        this.hunger     = 20;
        this.isDead     = false;

        this._lastDamageAt = 0;
        this._lastHealAt   = 0;
        this._hungerAccum  = 0;
        this._peaceful     = false;

        engine.on('tick', dt => this.update(dt));
    }

    takeDamage(amount) {
        if (this.isDead || this._peaceful) return;
        this.health = Math.max(0, this.health - amount);
        this._lastDamageAt = performance.now();
        if (this.health <= 0) this._die();
    }

    heal(amount) {
        if (this.isDead) return;
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    // Call with food value (1–10) when the player eats something
    eat(foodValue) {
        this.hunger = Math.min(this.maxHunger, this.hunger + foodValue);
    }

    respawn() {
        this.isDead        = false;
        this.health        = this.maxHealth;
        this.hunger        = this.maxHunger;
        this._hungerAccum  = 0;
        this._lastDamageAt = 0;
        this.engine.player.spawn();
        this.engine.emit('stateChange', 'playing');
    }

    update(dt) {
        if (!this.engine.gameActive || this.isDead) return;

        const now = performance.now();

        // Peaceful: fast regen, no hunger drain
        if (this._peaceful) {
            if (this.health < this.maxHealth && now - this._lastHealAt > 1_000) {
                this.heal(1);
                this._lastHealAt = now;
            }
            return;
        }

        // Drain hunger: lose 1 point every 30 s
        this._hungerAccum += dt;
        if (this._hungerAccum >= 30_000) {
            this._hungerAccum -= 30_000;
            this.hunger = Math.max(0, this.hunger - 1);
        }

        // Natural regen when hunger >= 18 and not recently damaged
        if (this.hunger >= 18 && this.health < this.maxHealth &&
                now - this._lastDamageAt > 5_000 && now - this._lastHealAt > 2_000) {
            this.heal(1);
            this._lastHealAt = now;
        }

        // Starvation: 1 damage per 4 s when fully hungry
        if (this.hunger <= 0 && now - this._lastDamageAt > 4_000) {
            this.takeDamage(1);
        }
    }

    _die() {
        this.isDead = true;
        this.engine.emit('playerDeath');
    }
}
