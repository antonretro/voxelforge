function compile (gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw log;
	}
	return shader;
}

function createProgram (gl, vertex, fragment) {
	const shader = gl.createProgram();
	gl.attachShader(shader, fragment);
	gl.attachShader(shader, vertex);
	gl.linkProgram(shader);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(shader);
		gl.deleteProgram(shader);
		throw log;
	}
	gl.useProgram(shader);
	const log = gl.getProgramInfoLog(shader);
	if (log)
		console.info(log);
	return shader;
}

export function createShader (gl, fragmentSource, vertexSource, attributes, uniforms) {
	const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
	const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
	const program = createProgram(gl, vertex, fragment);

	const attributeMap = {};
	const uniformMap = {};

	for (const attribute of attributes) {
		attributeMap[attribute] = gl.getAttribLocation(program, attribute);
		gl.enableVertexAttribArray(attributeMap[attribute]);
	}

	for (const uniform of uniforms) {
		uniformMap[uniform] = gl.getUniformLocation(program, uniform);
	}

	return {
		use: () => gl.useProgram(program),
		// program: program,
		attributes: attributeMap,
		uniforms: uniformMap
	};
}

export function getAttributes () {
	return [
		"vertexBuffer",
		"normalBuffer",
		"textureBuffer",
		"lightBuffer"
	];
}

export function getUniforms () {
	return [
		"camera",
		"entity",
		"perspective",
		"lightDirection",
        "uSkyColor",
        "uGlobalIntensity",
		"textureSampler",
		"uTexture2D",
		"uUse2D",
        "uColorOnly",
        "uColor"
	];
}

export function getFragmentSource () {
	return `#version 300 es
		precision highp float;

		in vec3 texturePosition;
		in float vLightBuffer;
		in vec3 vNormal;

		uniform highp sampler2DArray textureSampler;
		uniform highp sampler2D uTexture2D;
		uniform bool uUse2D;
        uniform vec3 lightDirection;
        uniform vec3 uSkyColor;
        uniform float uGlobalIntensity;
        uniform bool uColorOnly;
        uniform vec4 uColor;

		out vec4 outColor;

		void main(void) {
            if (uColorOnly) {
                outColor = uColor;
                return;
            }

			vec4 texelColor;
			if (uUse2D) {
				texelColor = texture(uTexture2D, texturePosition.xy);
			} else {
				texelColor = texture(textureSampler, texturePosition);
			}
			
			if (texelColor.a < 0.1) {
				discard;
			}

            // Smooth Lighting & Selective Biome Tinting
            vec3 tint = vec3(1.0, 1.0, 1.0);
            float skyLight = vLightBuffer;
            if (vLightBuffer > 5.0) {
                skyLight = mod(vLightBuffer, 5.0);
                tint = vec3(0.5, 0.9, 0.4); // Lush Green Tint
            }

            // BOOSTED Radiance & Decoupled Sun
            // Increased base light so the world is NEVER pitch black on the surface
            vec3 sunColor = vec3(1.0, 0.98, 0.9);
            
            // Base ambient light (Sky-glow)
            vec3 ambient = vec3(0.15, 0.18, 0.25) + (uSkyColor * skyLight * 0.45);
            
            // Sunlight (Directional) - Partially decoupled from skyLight for visibility
            float directional = max(dot(vNormal, lightDirection), 0.0);
            vec3 sunLight = sunColor * directional * (skyLight * 0.7 + 0.3);

            // Final Pixel Color
            vec3 combinedLight = ambient + sunLight;
            vec3 finalColor = texelColor.rgb * combinedLight * tint;

            // Gamma Correction (Linear to SRGB approx)
            finalColor = pow(finalColor, vec3(0.85)); // Slightly boost mid-tones

            // Subtle Distance Fog
            float depth = gl_FragCoord.z / gl_FragCoord.w;
            float fogFactor = smoothstep(60.0, 180.0, depth);
            
            finalColor *= uGlobalIntensity;
			outColor = vec4(mix(finalColor, uSkyColor, fogFactor), texelColor.a);
		}
	`;
}

export function getVertexSource () {
	return `#version 300 es
		precision highp float;

		layout(location = 0) in vec3 vertexBuffer;
		layout(location = 1) in vec3 normalBuffer;
		layout(location = 2) in vec3 textureBuffer;
		layout(location = 3) in float lightBuffer;

		uniform mat4 camera;
		uniform mat4 entity;
		uniform mat4 perspective;

		out vec3 texturePosition;
		out float vLightBuffer;
        out vec3 vNormal;

		void main(void) {
			gl_Position = perspective * camera * entity * vec4(vertexBuffer, 1.0);
			texturePosition = textureBuffer;
            vLightBuffer = lightBuffer;
            vNormal = normalBuffer;
		}
	`;
}
