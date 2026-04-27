
import { Entity } from "../engine/Entity.js";
import { Vector3 } from "../engine/math/Vector3.js";
import { Block } from "../engine/Block.js";
import { ITEMS } from "../data/items.js";

export class Viewmodel {
    constructor(engine) {
        this.engine = engine;
        this.arm = new Entity(engine.renderer.context);
        this.item = new Entity(engine.renderer.context);
        
        this.arm.transparent = true;
        this.item.transparent = true;
        this.arm.culling = false;
        this.item.culling = false;
        
        this.engine.transparentScene.add(this.arm);
        this.engine.transparentScene.add(this.item);
        
        this.bobTime = 0;
        this.swingProgress = 0;
        this.isSwinging = false;
        
        this._buildArm();
        this._loadSkin();
        this.itemTextures = new Map();
    }

    async _loadSkin() {
        const gl = this.engine.renderer.context;
        const img = new Image();
        img.src = '/textures/entities/steve.png';
        await new Promise(r => img.onload = r);
        
        this.skinTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.skinTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        this.arm.texture = this.skinTexture;
    }

    _buildArm() {
        const fw = 1/64, fh = 1/64;
        
        // Correct Minecraft Right Arm UVs (64x64)
        const uvTop    = [44*fw, 16*fh, 48*fw, 16*fh, 48*fw, 20*fh, 44*fw, 20*fh];
        const uvBottom = [48*fw, 16*fh, 52*fw, 16*fh, 52*fw, 20*fh, 48*fw, 20*fh];
        const uvFront  = [44*fw, 20*fh, 48*fw, 20*fh, 48*fw, 32*fh, 44*fw, 32*fh];
        const uvBack   = [52*fw, 20*fh, 56*fw, 20*fh, 56*fw, 32*fh, 52*fw, 32*fh];
        const uvLeft   = [40*fw, 20*fh, 44*fw, 20*fh, 44*fw, 32*fh, 40*fw, 32*fh];
        const uvRight  = [48*fw, 20*fh, 52*fw, 20*fh, 52*fw, 32*fh, 48*fw, 32*fh];
        
        const armFaces = [
            [Block.TOP,    [0,0,0], uvTop,    Block.NORMAL.TOP],
            [Block.BOTTOM, [0,0,0], uvBottom, Block.NORMAL.BOTTOM],
            [Block.FRONT,  [0,0,0], uvFront,  Block.NORMAL.FRONT],
            [Block.BACK,   [0,0,0], uvBack,   Block.NORMAL.BACK],
            [Block.LEFT,   [0,0,0], uvLeft,   Block.NORMAL.LEFT],
            [Block.RIGHT,  [0,0,0], uvRight,  Block.NORMAL.RIGHT]
        ];
        
        this.arm.generateFromFaces(armFaces);
        this.arm.scale.set(0.12, 0.12, 0.45);
        this.item.scale.set(0.2, 0.2, 0.2);
    }

    async updateItem(itemName) {
        if (!itemName) {
            this.item.length = 0;
            return;
        }

        const block = this.engine.blocks.find(b => b.name === itemName || b.id === itemName);
        const itemData = ITEMS.find(i => i.id === itemName || i.name === itemName);

        if (block) {
            // Restore block atlas for the block entity
            this.item.texture = this.engine.renderer.atlas;
            const faces = [
                [Block.TOP,    [0,0,0], block.textures.top,    Block.NORMAL.TOP],
                [Block.BOTTOM, [0,0,0], block.textures.bottom, Block.NORMAL.BOTTOM],
                [Block.FRONT,  [0,0,0], block.textures.front,  Block.NORMAL.FRONT],
                [Block.BACK,   [0,0,0], block.textures.back,   Block.NORMAL.BACK],
                [Block.LEFT,   [0,0,0], block.textures.left,   Block.NORMAL.LEFT],
                [Block.RIGHT,  [0,0,0], block.textures.right,  Block.NORMAL.RIGHT]
            ];
            this.item.generateFromFaces(faces);
            this.item.scale.set(0.15, 0.15, 0.15);
        } else if (itemData) {
            // Load individual item texture to avoid atlas 'corruption'
            const gl = this.engine.renderer.context;
            const tex = await this._getItemTexture(gl, itemData);
            
            this.item.texture = tex;
            const uv = [0,0,0, 1,0,0, 1,1,0, 0,1,0];
            const faces = [
                [Block.FRONT, [0,0,0], uv, Block.NORMAL.FRONT],
                [Block.BACK,  [0,0,0], uv, Block.NORMAL.BACK]
            ];
            this.item.generateFromFaces(faces);
            this.item.scale.set(0.25, 0.25, 0.01);
        }
    }

    async _getItemTexture(gl, itemData) {
        if (this.itemTextures.has(itemData.id)) {
            return this.itemTextures.get(itemData.id);
        }

        const img = new Image();
        img.src = `/textures/items/${itemData.texture}.png`;
        
        img.onerror = () => {
            img.src = `/textures/packs/igneous/blocks/${itemData.texture}.png`;
        };

        await new Promise(r => img.onload = r);
        
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        this.itemTextures.set(itemData.id, tex);
        return tex;
    }

    swing() {
        if (this.isSwinging) return;
        this.isSwinging = true;
        this.swingProgress = 0;
    }

    update(dt) {
        if (!this.engine.gameActive) return;

        const cam = this.engine.camera;
        const camMatrix = cam.update(); // Get camera world matrix
        
        // Bobbing
        const speed = this.engine.controls?.velocity?.length() || 0;
        if (speed > 0.05 && this.engine.controls?.onGround) {
            this.bobTime += dt * 0.005;
        } else {
            this.bobTime *= 0.95;
        }
        
        const bobX = Math.sin(this.bobTime * 15) * 0.01;
        const bobY = Math.abs(Math.cos(this.bobTime * 15)) * 0.01;

        // Swing Animation
        if (this.isSwinging) {
            this.swingProgress += dt * 0.01;
            if (this.swingProgress >= Math.PI) {
                this.isSwinging = false;
                this.swingProgress = 0;
            }
        }
        const swingZ = Math.sin(this.swingProgress) * 0.15;
        const swingY = Math.sin(this.swingProgress) * 0.05;

        // Subtle Sway (interpolated delta)
        // Smoothing and Sway
        const mouseX = this.engine.controls?.mouseDeltaX || 0;
        const mouseY = this.engine.controls?.mouseDeltaY || 0;
        
        // Local space offsets
        const armLocal = new Vector3(0.35 + bobX - (mouseX * 0.0004), -0.3 + bobY + (mouseY * 0.0004), -0.5);
        const itemLocal = new Vector3(0.45 + bobX - (mouseX * 0.0004), -0.25 + bobY - swingY + (mouseY * 0.0004), -0.7 + swingZ);

        // Transform local offsets to world space using camera matrix
        const armWorld = camMatrix.clone().multiplyVector3(armLocal);
        const itemWorld = camMatrix.clone().multiplyVector3(itemLocal);

        // Initialize Euler trackers if they don't exist
        if (!this.armEuler) this.armEuler = new Vector3();
        if (!this.itemEuler) this.itemEuler = new Vector3();

        // Smoothly lerp position
        this.arm.position.lerp(armWorld, 0.3);
        this.item.position.lerp(itemWorld, 0.3);
        
        // Calculate target rotation with base tilt
        const controls = this.engine.controls;
        if (!controls) return;
        
        const targetRot = controls.rotation.clone();
        
        // Hand/Arm smoothing (using Eulers for the lerp calculation)
        this.armEuler.x += (targetRot.x - this.armEuler.x) * 0.4;
        this.armEuler.y += (targetRot.y - this.armEuler.y) * 0.4;
        this.armEuler.z += (targetRot.z - this.armEuler.z) * 0.4;
        this.arm.rotation.setEuler(this.armEuler.x, this.armEuler.y, this.armEuler.z);

        // Item base rotation (e.g. blocks should be tilted 45 degrees)
        const isBlock = this.item.scale.z > 0.1;
        const baseRotY = isBlock ? 0.6 : 0.2; // ~35deg or ~12deg
        const baseRotX = isBlock ? -0.2 : 0;
        
        this.itemEuler.x += (targetRot.x + baseRotX - this.itemEuler.x) * 0.3;
        this.itemEuler.y += (targetRot.y + baseRotY - this.itemEuler.y) * 0.3;
        this.itemEuler.z += (targetRot.z - this.itemEuler.z) * 0.3;
        this.item.rotation.setEuler(this.itemEuler.x, this.itemEuler.y, this.itemEuler.z);
    }
}
