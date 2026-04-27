import { Entity } from "./Entity.js";
import { Vector3 } from "./math/Vector3.js";

export class SkySystem extends Entity {
    constructor(engine) {
        super(engine.renderer.context);
        this.engine = engine;
        this.sunPosition = new Vector3();
        this.moonPosition = new Vector3();
        
        this._buildModel();
        engine.scene.add(this);
    }

    _buildModel() {
        const gl = this.context;
        
        // Simple quad for Sun/Moon billboards
        const vertices = new Float32Array([
            -0.5, -0.5, 0,
             0.5, -0.5, 0,
             0.5,  0.5, 0,
            -0.5,  0.5, 0
        ]);
        
        const indices = new Uint32Array([0, 1, 2, 0, 2, 3]);

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        this.VAO = vao;
        this.length = indices.length;
    }

    update() {
        const dn = this.engine.dayNight;
        const playerPos = this.engine.camera.position;
        
        // Sun position (circular arc)
        const sunAngle = dn.time * Math.PI * 2 - Math.PI / 2;
        this.sunPosition.set(
            Math.cos(sunAngle) * 400 + playerPos.x,
            Math.sin(sunAngle) * 400 + playerPos.y,
            playerPos.z
        );

        // Moon position (opposite to sun)
        const moonAngle = sunAngle + Math.PI;
        this.moonPosition.set(
            Math.cos(moonAngle) * 400 + playerPos.x,
            Math.sin(moonAngle) * 400 + playerPos.y,
            playerPos.z
        );

        return super.update();
    }

    render(shader) {
        const gl = this.context;
        const camera = this.engine.camera;
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        gl.uniform1i(shader.uniforms.uColorOnly, 1);
        gl.bindVertexArray(this.VAO);

        // Render Sun
        this.position.copy(this.sunPosition);
        this.scale.set(60, 60, 60);
        // Face player (billboard-ish, but simplified for distant sky)
        this.rotation.y = -camera.rotation.y;
        this.rotation.x = -camera.rotation.x;
        
        gl.uniformMatrix4fv(shader.uniforms.entity, false, this.update().elements);
        gl.uniform4fv(shader.uniforms.uColor, [1, 1, 0.8, 1]); // Warm yellow sun
        gl.drawElements(gl.TRIANGLES, this.length, gl.UNSIGNED_INT, 0);

        // Render Moon
        this.position.copy(this.moonPosition);
        this.scale.set(40, 40, 40);
        gl.uniformMatrix4fv(shader.uniforms.entity, false, this.update().elements);
        gl.uniform4fv(shader.uniforms.uColor, [0.9, 0.9, 1.0, 0.8]); // Pale blue moon
        gl.drawElements(gl.TRIANGLES, this.length, gl.UNSIGNED_INT, 0);

        gl.uniform1i(shader.uniforms.uColorOnly, 0);
        gl.disable(gl.BLEND);
    }
}
