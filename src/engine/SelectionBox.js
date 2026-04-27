import { Entity } from "./Entity.js";
import { Vector3 } from "./math/Vector3.js";

export class SelectionBox extends Entity {
    constructor(engine) {
        super(engine.renderer.context);
        this.engine = engine;
        this.visible = false;
        
        // Selection box is slightly larger than a block to prevent Z-fighting
        this.scale.set(1.002, 1.002, 1.002);
        
        this._buildModel();
        engine.scene.add(this);
    }

    _buildModel() {
        const gl = this.context;
        
        // 12 edges of a cube
        const vertices = new Float32Array([
            // Bottom square
            0,0,0, 1,0,0,
            1,0,0, 1,0,1,
            1,0,1, 0,0,1,
            0,0,1, 0,0,0,
            // Top square
            0,1,0, 1,1,0,
            1,1,0, 1,1,1,
            1,1,1, 0,1,1,
            0,1,1, 0,1,0,
            // Pillars
            0,0,0, 0,1,0,
            1,0,0, 1,1,0,
            1,0,1, 1,1,1,
            0,0,1, 0,1,1
        ]);

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        this.VAO = vao;
        this.length = vertices.length / 3;
    }

    update() {
        const target = this.engine.targetedBlock;
        if (target && target.pos) {
            this.visible = true;
            this.position.set(target.pos.x, target.pos.y, target.pos.z);
        } else {
            this.visible = false;
        }
        return super.update();
    }

    render(shader) {
        if (!this.visible) return;
        
        const gl = this.context;
        gl.uniformMatrix4fv(shader.uniforms.entity, false, this.update().elements);
        gl.uniform1i(shader.uniforms.uUse2D, 0); // No textures
        gl.uniform1i(shader.uniforms.uColorOnly, 1); // We need a way to draw single color
        gl.uniform4fv(shader.uniforms.uColor, [0, 0, 0, 0.4]); // Black semi-transparent outline
        
        gl.bindVertexArray(this.VAO);
        gl.drawArrays(gl.LINES, 0, this.length);
        gl.uniform1i(shader.uniforms.uColorOnly, 0);
    }
}
