import { Vector3 } from "./math/Vector3.js";

export class DayNight {
    constructor(engine) {
        this.engine = engine;
        this.time = 0.3; // 0 to 1
        this.dayDuration = 600; // 10 minutes per day
        this.lightDirection = new Vector3(0, 1, 0);
        this.skyColor = [0.5, 0.7, 1.0];
        this.intensity = 1.0;
        this.paused = false;
    }

    update(dt) {
        if (this.paused) return;

        // Progress time
        this.time = (this.time + dt / this.dayDuration) % 1.0;

        // Calculate sun position (circular arc)
        const angle = this.time * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        
        // Sun follows an arc over the XZ plane
        this.lightDirection.x = x;
        this.lightDirection.y = y;
        this.lightDirection.z = 0.5; // Offset for better shadows
        this.lightDirection.normalise();

        // Calculate sky color and intensity
        // Noon: y=1, Midnight: y=-1
        const sunHeight = y;
        
        if (sunHeight > 0) {
            // Day
            this.intensity = Math.max(0.1, sunHeight);
            // Sky goes from orange at sunrise to blue at noon
            const blend = Math.max(0, sunHeight);
            this.skyColor = [
                0.2 + 0.3 * blend, // R
                0.3 + 0.4 * blend, // G
                0.5 + 0.5 * blend  // B
            ];
        } else {
            // Night
            this.intensity = 0.1;
            // Dark blue/black sky
            const blend = Math.max(0, -sunHeight);
            this.skyColor = [
                0.02,
                0.03,
                0.1 * (1 - blend)
            ];
        }
    }

    getTimeString() {
        const totalMinutes = ((this.time + 0.25) % 1) * 1440;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        const mStr = minutes < 10 ? `0${minutes}` : minutes;
        return `${h12}:${mStr} ${ampm}`;
    }
}
