import { Camera } from "./Camera.js";
import { Scene } from "./Scene.js";
import { Entity } from "./Entity.js";
// import { Dispatcher } from "./events/Dispatcher.js";
import { createShader, getFragmentSource, getVertexSource, getAttributes, getUniforms } from "./createShader.js";
import { Vector3 } from "./math/Vector3.js";

// Dynamic lighting values
let globalLightDirection = new Vector3(0.8, 0.4, 0.3).normalise();
let globalSkyColor = [0.5, 0.7, 1.0];
let globalIntensity = 1.0;

export class Renderer {
	constructor () {
		this.element = document.createElement('canvas');
		this.element.style.zIndex = 0;
		this.context = this.element.getContext("webgl2", { premultipliedAlpha: true, antialias: false } );
		this.pixelRatio = devicePixelRatio;
		this.camera = null;
		this.scene = null;
		this.shader = null;
		this.width = 0;
		this.height = 0;
		this.depthSort = true;
		this.intermediate = {
			framebuffer: null,
			albedo: null,
			normal: null,
			position: null
		};
		
		const gl = this.context;

		gl.clearColor(0x7F / 0xFF, 0xB1 / 0xFF, 0xFF / 0xFF, 1);
		gl.clearDepth(1);

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LESS);

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		gl.enable(gl.BLEND);
		gl.blendEquation( gl.FUNC_ADD );
		gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	}
	createCamera (aspect, fov, near, far) {
		return new Camera (aspect, fov, near, far);
	}
	createScene () {
		return new Scene ();
	}
	createShader (fragmentSource, vertexSource, attributes, uniforms) {
		return createShader(this.context, fragmentSource, vertexSource, attributes, uniforms);
	}
	createEntity () {
		return new Entity(this.context);
	}
	createDefaultShader () {
		const attributes = getAttributes();
		const uniforms = getUniforms();
		this.shader = this.createShader(getFragmentSource(), getVertexSource(), attributes, uniforms);
	}
	setCamera (c) {
		this.camera = c;
	}
	setScene (s) {
		this.scene = s;
	}
	setShader (p) {
		this.shader = p;
	}
	setAtlas (t) {
		this.atlas = t;
		const gl = this.context;
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.atlas);
	}
	setSize (width, height) {
		const correctedWidth = width * this.pixelRatio;
		const correctedHeight = height * this.pixelRatio;
		const ratio = width / height;
		this.width = width;
		this.height = height;
		this.element.style.width = `${width}px`;
		this.element.style.height = `${height}px`;
		this.element.width = correctedWidth;
		this.element.height = correctedHeight;
		this.camera.change(ratio);
		this.context.viewport(0, 0, correctedWidth, correctedHeight);
	}
	setResolutionScale (scale) {
		this.pixelRatio = (devicePixelRatio || 1) * Math.max(0.25, Math.min(2, scale || 1));
	}
	updateSize () {
		const w = innerWidth;
		const h = innerHeight;

		if (this.width != w || this.height != h)
			this.setSize(w, h);
	}
    setDayNight (lightDir, skyColor, intensity = 1.0) {
        globalLightDirection = lightDir;
        globalSkyColor = skyColor;
        globalIntensity = intensity;
    }
	render () {
		const gl = this.context;
		const shader = this.shader;

		shader.use();
		this.updateSize();

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		const viewMatrix = this.camera.update().clone().inverse();
		gl.uniformMatrix4fv(shader.uniforms.camera, false, viewMatrix.elements);
		gl.uniformMatrix4fv(shader.uniforms.perspective, false, this.camera.perspective.elements);
		gl.uniform3fv(shader.uniforms.lightDirection, [globalLightDirection.x, globalLightDirection.y, globalLightDirection.z]);
		gl.uniform3fv(shader.uniforms.uSkyColor, [globalSkyColor[0], globalSkyColor[1], globalSkyColor[2]]);
        gl.uniform1f(shader.uniforms.uGlobalIntensity, globalIntensity);
        gl.clearColor(globalSkyColor[0], globalSkyColor[1], globalSkyColor[2], 1);
        gl.uniform1i(shader.uniforms.uColorOnly, 0);

        // Texture Unit Assignment
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.atlas);
        gl.uniform1i(shader.uniforms.textureSampler, 0);
        
        // Ensure 2D sampler is ALWAYS assigned to a different unit than the array sampler
        // to prevent "Two textures of different types use the same sampler location" error.
        gl.uniform1i(shader.uniforms.uTexture2D, 1);

		let entities = Array.from(this.scene.entities(), entity => {
			return [ entity, entity.getDepth(viewMatrix) ] 
		});

		if (this.depthSort) {
			entities = entities.sort(([a, ad], [b, bd]) => {
				if (a.transparent !== b.transparent) {
					// draw opaque entities before transparent
					return a.transparent ? 1 : -1;
				}
				else {
					if (a.transparent) {
						// sort transparent object back to front
						return ad - bd;
					}
					else {
						// sort opaque object front to back
						return bd - ad;
					}
				}
			})
		}

		for (const [ entity, depth ] of entities) {
            // Camera Frustum Culling: Skip things behind the camera
            if (entity.culling) {
                const toEntity = entity.position.clone().sub(this.camera.position);
                const dot = toEntity.dot(this.camera.facing);
                // If it's more than 2 units behind the camera, skip it
                if (dot < -2 && depth < 0) continue;
            }

            // Custom Render path for specialized entities (like SelectionBox)
            if (entity.render) {
                entity.render(shader);
                continue;
            }

			gl.uniformMatrix4fv(shader.uniforms.entity, false, new Float32Array(entity.update().elements));
			
            if (entity.texture) {
                gl.uniform1i(shader.uniforms.uUse2D, 1);
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, entity.texture);
                gl.uniform1i(shader.uniforms.uTexture2D, 1);
            } else {
                gl.uniform1i(shader.uniforms.uUse2D, 0);
            }

			gl.bindVertexArray(entity.VAO);
			gl.drawElements(gl.TRIANGLES, entity.length, gl.UNSIGNED_INT, 0);
		}

		// gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);

		
	}
}
