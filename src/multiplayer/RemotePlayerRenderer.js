/**
 * RemotePlayerRenderer
 * Renders a simple two-part humanoid (head + torso) for each remote peer using
 * the existing WebGL Entity system.  Name-tag HTML elements are projected into
 * screen space each frame via manual perspective math.
 */
import { Entity }           from '../engine/Entity.js';
import { Block }            from '../engine/Block.js';
import { getTextureCoords } from '../engine/loadTexture.js';
import { Vector3 }          from '../engine/math/Vector3.js';

export class RemotePlayerRenderer {
    constructor(engine) {
        this.engine  = engine;
        /** @type {Map<string, {entity: Entity, nameEl: HTMLDivElement, x,y,z,yaw: number}>} */
        this.players = new Map();

        engine.on('tick', () => this._updateNameTags());
    }

    // ── Public API called by NetworkManager ──────────────────────────────

    addPlayer(peerId, username) {
        if (this.players.has(peerId)) return;

        const gl     = this.engine.renderer.context;
        const entity = new Entity(gl);
        entity.transparent = false;
        this._buildGeometry(entity);
        this.engine.solidScene.add(entity);

        const nameEl = this._createNameTag(username);

        this.players.set(peerId, { entity, nameEl, username, x: 0, y: 0, z: 0, yaw: 0 });
    }

    removePlayer(peerId) {
        const p = this.players.get(peerId);
        if (!p) return;
        this.engine.solidScene.remove(p.entity);
        p.entity.release();
        p.nameEl.remove();
        this.players.delete(peerId);
    }

    updatePosition(peerId, x, y, z, yaw) {
        const p = this.players.get(peerId);
        if (!p) return;
        p.x = x; p.y = y; p.z = z; p.yaw = yaw;
        // Place entity feet at y - eyeHeight so the model stands on ground
        p.entity.setPosition(new Vector3(x - 0.3, y - 1.62, z - 0.15));
        p.entity.shouldUpdate = true;
    }

    dispose() {
        for (const peerId of this.players.keys()) this.removePlayer(peerId);
    }

    // ── Internal ─────────────────────────────────────────────────────────

    /** Build a head (0.6×0.6×0.6) + torso (0.6×0.75×0.3) combined mesh. */
    _buildGeometry(entity) {
        const headTex  = getTextureCoords('grass_block_top') ?? new Float32Array(12);
        const bodyTex  = getTextureCoords('oak_planks')      ?? new Float32Array(12);
        const legTex   = getTextureCoords('oak_log_side')    ?? new Float32Array(12);

        const faces = [
            ...this._boxFaces(0.6, 0.6, 0.6, 0, 1.3, 0, headTex),   // head
            ...this._boxFaces(0.6, 0.75, 0.3, 0, 0.55, 0.15, bodyTex), // torso
            ...this._boxFaces(0.25, 0.7, 0.25, 0,    -0.15, 0.025, legTex), // left leg
            ...this._boxFaces(0.25, 0.7, 0.25, 0.35, -0.15, 0.025, legTex), // right leg
        ];
        entity.generateFromFaces(faces);
    }

    /**
     * Build 6 faces for an axis-aligned box of size (w×h×d) with its
     * bottom-left-front corner at (ox, oy, oz) relative to entity origin.
     */
    _boxFaces(w, h, d, ox, oy, oz, tex) {
        const S = (verts) => verts.map(v => new Vector3(v[0], v[1], v[2]));
        const pos = [ox, oy, oz];

        return [
            // Top
            [S([[0,h,0],[0,h,d],[w,h,d],[w,h,0]]),         pos, tex, Block.NORMAL.TOP],
            // Bottom
            [S([[0,0,d],[w,0,d],[w,0,0],[0,0,0]]),          pos, tex, Block.NORMAL.BOTTOM],
            // Front  (z = d)
            [S([[0,0,d],[w,0,d],[w,h,d],[0,h,d]]),          pos, tex, Block.NORMAL.FRONT],
            // Back   (z = 0)
            [S([[w,0,0],[0,0,0],[0,h,0],[w,h,0]]),          pos, tex, Block.NORMAL.BACK],
            // Right  (x = w)
            [S([[w,0,d],[w,0,0],[w,h,0],[w,h,d]]),          pos, tex, Block.NORMAL.RIGHT],
            // Left   (x = 0)
            [S([[0,0,0],[0,0,d],[0,h,d],[0,h,0]]),          pos, tex, Block.NORMAL.LEFT],
        ];
    }

    _createNameTag(username) {
        const el = document.createElement('div');
        Object.assign(el.style, {
            position:       'fixed',
            background:     'rgba(0,0,0,0.55)',
            color:          '#fff',
            fontSize:       '11px',
            fontFamily:     'monospace, sans-serif',
            fontWeight:     'bold',
            padding:        '2px 8px',
            borderRadius:   '4px',
            pointerEvents:  'none',
            zIndex:         '55',
            display:        'none',
            whiteSpace:     'nowrap',
            backdropFilter: 'blur(4px)',
            border:         '1px solid rgba(255,255,255,0.15)',
        });
        el.textContent = username;
        document.body.appendChild(el);
        return el;
    }

    _updateNameTags() {
        const cam = this.engine.camera;
        const ctrl = this.engine.controls;
        if (!cam || !ctrl) return;

        for (const p of this.players.values()) {
            // Project the point 2.2 units above the player's feet
            const screenPos = this._worldToScreen(p.x, p.y + 0.6, p.z, cam, ctrl);
            if (screenPos) {
                p.nameEl.style.display = 'block';
                p.nameEl.style.left    = `${screenPos.x - p.nameEl.offsetWidth / 2}px`;
                p.nameEl.style.top     = `${screenPos.y - 20}px`;
            } else {
                p.nameEl.style.display = 'none';
            }
        }
    }

    /**
     * Manual perspective projection using the camera's position/rotation.
     * Returns {x, y} in screen pixels or null if behind the camera.
     */
    _worldToScreen(wx, wy, wz, cam, ctrl) {
        const yaw   = ctrl.rotation.y;
        const pitch = ctrl.rotation.x;

        // Translate to camera space
        const dx = wx - cam.position.x;
        const dy = wy - cam.position.y;
        const dz = wz - cam.position.z;

        // Apply yaw (rotate around Y)
        const cy = Math.cos(-yaw), sy = Math.sin(-yaw);
        const vx =  dx * cy + dz * sy;
        const vz = -dx * sy + dz * cy;

        // Apply pitch (rotate around X)
        const cp = Math.cos(-pitch), sp = Math.sin(-pitch);
        const vy =  dy * cp - vz * sp;
        const vd =  dy * sp + vz * cp;

        if (vd <= 0.5) return null; // behind or too close

        const fovRad   = ((cam.fov ?? 75) * Math.PI) / 180;
        const halfTan  = Math.tan(fovRad * 0.5);
        const aspect   = window.innerWidth / window.innerHeight;

        const ndcX =  vx / (vd * halfTan * aspect);
        const ndcY = -vy / (vd * halfTan);

        if (ndcX < -1.1 || ndcX > 1.1 || ndcY < -1.1 || ndcY > 1.1) return null;

        return {
            x: (ndcX * 0.5 + 0.5) * window.innerWidth,
            y: (ndcY * 0.5 + 0.5) * window.innerHeight,
        };
    }
}
