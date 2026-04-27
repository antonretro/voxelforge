// Column-major 4×4 matrix backed by Float32Array for direct WebGL upload.
// Layout: elements[col * 4 + row]
export class Matrix4 {
	constructor() {
		this.elements = new Float32Array([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
		]);
	}

	// ── Factories ───────────────────────────────────────────────────────────
	static identity()          { return new Matrix4(); }
	static fromArray(a, o = 0) { return new Matrix4().setFromArray(a, o); }

	setFromArray(a, o = 0) {
		for (let i = 0; i < 16; i++) this.elements[i] = a[o + i];
		return this;
	}

	// ── Copy / clone ────────────────────────────────────────────────────────
	copy(m) {
		this.elements.set(m.elements);
		return this;
	}

	clone() { return new Matrix4().copy(this); }

	identity() {
		const e = this.elements;
		e[0]=1; e[1]=0; e[2]=0;  e[3]=0;
		e[4]=0; e[5]=1; e[6]=0;  e[7]=0;
		e[8]=0; e[9]=0; e[10]=1; e[11]=0;
		e[12]=0;e[13]=0;e[14]=0; e[15]=1;
		return this;
	}

	// ── Multiply ────────────────────────────────────────────────────────────
	multiply(m) {
		const a = this.elements, b = m.elements;
		const [a00,a10,a20,a30, a01,a11,a21,a31, a02,a12,a22,a32, a03,a13,a23,a33] = a;
		const [b00,b10,b20,b30, b01,b11,b21,b31, b02,b12,b22,b32, b03,b13,b23,b33] = b;

		a[0]  = a00*b00 + a01*b10 + a02*b20 + a03*b30;
		a[1]  = a10*b00 + a11*b10 + a12*b20 + a13*b30;
		a[2]  = a20*b00 + a21*b10 + a22*b20 + a23*b30;
		a[3]  = a30*b00 + a31*b10 + a32*b20 + a33*b30;
		a[4]  = a00*b01 + a01*b11 + a02*b21 + a03*b31;
		a[5]  = a10*b01 + a11*b11 + a12*b21 + a13*b31;
		a[6]  = a20*b01 + a21*b11 + a22*b21 + a23*b31;
		a[7]  = a30*b01 + a31*b11 + a32*b21 + a33*b31;
		a[8]  = a00*b02 + a01*b12 + a02*b22 + a03*b32;
		a[9]  = a10*b02 + a11*b12 + a12*b22 + a13*b32;
		a[10] = a20*b02 + a21*b12 + a22*b22 + a23*b32;
		a[11] = a30*b02 + a31*b12 + a32*b22 + a33*b32;
		a[12] = a00*b03 + a01*b13 + a02*b23 + a03*b33;
		a[13] = a10*b03 + a11*b13 + a12*b23 + a13*b33;
		a[14] = a20*b03 + a21*b13 + a22*b23 + a23*b33;
		a[15] = a30*b03 + a31*b13 + a32*b23 + a33*b33;
		return this;
	}

	// ── Compose from TRS ────────────────────────────────────────────────────
	compose(pos, quat, scale) {
		const { x: qx, y: qy, z: qz, w: qw } = quat;
		const x2 = qx+qx, y2 = qy+qy, z2 = qz+qz;
		const xx = qx*x2, xy = qx*y2, xz = qx*z2;
		const yy = qy*y2, yz = qy*z2, zz = qz*z2;
		const wx = qw*x2, wy = qw*y2, wz = qw*z2;
		const sx = scale.x, sy = scale.y, sz = scale.z;
		const e = this.elements;
		e[0]  = (1-(yy+zz))*sx; e[1]  = (xy+wz)*sx;   e[2]  = (xz-wy)*sx;   e[3]  = 0;
		e[4]  = (xy-wz)*sy;     e[5]  = (1-(xx+zz))*sy;e[6]  = (yz+wx)*sy;   e[7]  = 0;
		e[8]  = (xz+wy)*sz;     e[9]  = (yz-wx)*sz;    e[10] = (1-(xx+yy))*sz;e[11] = 0;
		e[12] = pos.x;           e[13] = pos.y;          e[14] = pos.z;         e[15] = 1;
		return this;
	}

	// ── Rotation-only from quaternion ────────────────────────────────────────
	rotate(q) {
		const { x, y, z, w } = q;
		const x2=x+x, y2=y+y, z2=z+z;
		const xx=x*x2, xy=x*y2, xz=x*z2;
		const yy=y*y2, yz=y*z2, zz=z*z2;
		const wx=w*x2, wy=w*y2, wz=w*z2;
		const e = this.elements;
		e[0]=1-(yy+zz); e[1]=xy+wz;     e[2]=xz-wy;     e[3]=0;
		e[4]=xy-wz;     e[5]=1-(xx+zz); e[6]=yz+wx;     e[7]=0;
		e[8]=xz+wy;     e[9]=yz-wx;     e[10]=1-(xx+yy);e[11]=0;
		e[12]=0;        e[13]=0;        e[14]=0;         e[15]=1;
		return this;
	}

	// ── Non-uniform scale ────────────────────────────────────────────────────
	scale(v) {
		const e = this.elements;
		e[0]*=v.x; e[1]*=v.x; e[2]*=v.x;  e[3]*=v.x;
		e[4]*=v.y; e[5]*=v.y; e[6]*=v.y;  e[7]*=v.y;
		e[8]*=v.z; e[9]*=v.z; e[10]*=v.z; e[11]*=v.z;
		return this;
	}

	// ── Perspective projection ──────────────────────────────────────────────
	perspective(left, right, top, bottom, near, far) {
		const rl = right - left, tb = top - bottom, nf = near - far;
		const e = this.elements;
		e[0]=2*near/rl; e[1]=0;         e[2]=0;               e[3]=0;
		e[4]=0;         e[5]=2*near/tb; e[6]=0;               e[7]=0;
		e[8]=(right+left)/rl; e[9]=(top+bottom)/tb; e[10]=(far+near)/nf; e[11]=-1;
		e[12]=0; e[13]=0; e[14]=2*far*near/nf; e[15]=0;
		return this;
	}

	// ── Inverse ─────────────────────────────────────────────────────────────
	inverse() {
		const e = this.elements;
		const [m00,m01,m02,m03, m04,m05,m06,m07, m08,m09,m10,m11, m12,m13,m14,m15] = e;

		const b00 = m00*m05 - m01*m04, b01 = m00*m06 - m02*m04;
		const b02 = m00*m07 - m03*m04, b03 = m01*m06 - m02*m05;
		const b04 = m01*m07 - m03*m05, b05 = m02*m07 - m03*m06;
		const b06 = m08*m13 - m09*m12, b07 = m08*m14 - m10*m12;
		const b08 = m08*m15 - m11*m12, b09 = m09*m14 - m10*m13;
		const b10 = m09*m15 - m11*m13, b11 = m10*m15 - m11*m14;

		const det = b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06;
		if (det === 0) return this.identity();
		const inv = 1 / det;

		e[0]  = ( m05*b11 - m06*b10 + m07*b09) * inv;
		e[1]  = (-m01*b11 + m02*b10 - m03*b09) * inv;
		e[2]  = ( m13*b05 - m14*b04 + m15*b03) * inv;
		e[3]  = (-m09*b05 + m10*b04 - m11*b03) * inv;
		e[4]  = (-m04*b11 + m06*b08 - m07*b07) * inv;
		e[5]  = ( m00*b11 - m02*b08 + m03*b07) * inv;
		e[6]  = (-m12*b05 + m14*b02 - m15*b01) * inv;
		e[7]  = ( m08*b05 - m10*b02 + m11*b01) * inv;
		e[8]  = ( m04*b10 - m05*b08 + m07*b06) * inv;
		e[9]  = (-m00*b10 + m01*b08 - m03*b06) * inv;
		e[10] = ( m12*b04 - m13*b02 + m15*b00) * inv;
		e[11] = (-m08*b04 + m09*b02 - m11*b00) * inv;
		e[12] = (-m04*b09 + m05*b07 - m06*b06) * inv;
		e[13] = ( m00*b09 - m01*b07 + m02*b06) * inv;
		e[14] = (-m12*b03 + m13*b01 - m14*b00) * inv;
		e[15] = ( m08*b03 - m09*b01 + m10*b00) * inv;
		return this;
	}

	// ── Transform a Vector3 (w=1, perspective divide) ────────────────────────
	multiplyVector3(v) {
		const e = this.elements;
		const w = 1 / (e[3]*v.x + e[7]*v.y + e[11]*v.z + e[15]);
		v.x = (e[0]*v.x + e[4]*v.y + e[8]*v.z  + e[12]) * w;
		v.y = (e[1]*v.x + e[5]*v.y + e[9]*v.z  + e[13]) * w;
		v.z = (e[2]*v.x + e[6]*v.y + e[10]*v.z + e[14]) * w;
		return v;
	}

	// ── LookAt (camera view matrix) ─────────────────────────────────────────
	lookAt(eye, target, up) {
		let fx = eye.x-target.x, fy = eye.y-target.y, fz = eye.z-target.z;
		let len = Math.sqrt(fx*fx+fy*fy+fz*fz);
		if (len > 0) { fx/=len; fy/=len; fz/=len; }

		let rx = up.y*fz - up.z*fy, ry = up.z*fx - up.x*fz, rz = up.x*fy - up.y*fx;
		len = Math.sqrt(rx*rx+ry*ry+rz*rz);
		if (len > 0) { rx/=len; ry/=len; rz/=len; }

		const ux = fy*rz - fz*ry, uy = fz*rx - fx*rz, uz = fx*ry - fy*rx;
		const e = this.elements;
		e[0]=rx; e[1]=ux; e[2]=fx;  e[3]=0;
		e[4]=ry; e[5]=uy; e[6]=fy;  e[7]=0;
		e[8]=rz; e[9]=uz; e[10]=fz; e[11]=0;
		e[12]=-(rx*eye.x+ry*eye.y+rz*eye.z);
		e[13]=-(ux*eye.x+uy*eye.y+uz*eye.z);
		e[14]=-(fx*eye.x+fy*eye.y+fz*eye.z);
		e[15]=1;
		return this;
	}

	// ── Extract translation ──────────────────────────────────────────────────
	getTranslation(out) {
		out.x = this.elements[12];
		out.y = this.elements[13];
		out.z = this.elements[14];
		return out;
	}
}

Matrix4.IDENTITY = Object.freeze(new Matrix4());
