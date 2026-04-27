/**
 * SkinLoader — resolves Minecraft skins via Crafatar (CORS-safe, username-direct).
 * Crafatar accepts usernames in all render endpoints so no UUID lookup is needed.
 */
const CRAFATAR = 'https://crafatar.com';

export class SkinLoader {
    constructor() {
        this.cache = new Map();
    }

    resolve(username) {
        if (!username) return this._fallback();
        if (this.cache.has(username)) return this.cache.get(username);
        const enc = encodeURIComponent(username);
        const result = {
            skinUrl:  `${CRAFATAR}/skins/${enc}`,
            headUrl:  `${CRAFATAR}/avatars/${enc}?size=64&overlay=true`,
            bodyUrl:  `${CRAFATAR}/renders/body/${enc}?scale=4&overlay=true`,
        };
        this.cache.set(username, result);
        return result;
    }

    loadTexture(username) {
        const { skinUrl } = this.resolve(username);
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload  = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = skinUrl;
        });
    }

    _fallback() {
        return {
            skinUrl: '/skins/steve.png',
            headUrl: '/skins/steve_head.png',
            bodyUrl: '/skins/steve_body.png',
        };
    }
}

export const skinLoader = new SkinLoader();
