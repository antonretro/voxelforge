const HALF_DEG = Math.PI / 360;

export class Quaternion {
	constructor(x = 0, y = 0, z = 0, w = 1) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}

	// ── Factories ───────────────────────────────────────────────────────────
	static identity()              { return new Quaternion(); }
	static from(q)                 { return new Quaternion(q.x, q.y, q.z, q.w); }
	static fromEuler(x, y, z)      { return new Quaternion().setEuler(x, y, z); }
	static fromAxisAngle(axis, ang){ return new Quaternion().setAxisAngle(axis, ang); }

	// ── Copy / clone ────────────────────────────────────────────────────────
	set(x = 0, y = 0, z = 0, w = 1) { this.x=x; this.y=y; this.z=z; this.w=w; return this; }
	copy(q)  { this.x=q.x; this.y=q.y; this.z=q.z; this.w=q.w; return this; }
	clone()  { return new Quaternion(this.x, this.y, this.z, this.w); }

	// ── Set from Euler angles (YXZ — yaw/pitch/roll, standard FPS) ──────────
	setEuler(pitch = 0, yaw = 0, roll = 0) {
		const cp = Math.cos(pitch * 0.5), sp = Math.sin(pitch * 0.5);
		const cy = Math.cos(yaw   * 0.5), sy = Math.sin(yaw   * 0.5);
		const cr = Math.cos(roll  * 0.5), sr = Math.sin(roll  * 0.5);
		this.x = sp*cy*cr + cp*sy*sr;
		this.y = cp*sy*cr - sp*cy*sr;
		this.z = cp*cy*sr - sp*sy*cr;
		this.w = cp*cy*cr + sp*sy*sr;
		return this;
	}

	fromEuler(x, y, z) { return this.setEuler(x, y, z); }

	// ── Set from axis + angle (axis must be unit length) ────────────────────
	setAxisAngle(axis, angle) {
		const half = angle * 0.5;
		const s = Math.sin(half);
		this.x = axis.x * s;
		this.y = axis.y * s;
		this.z = axis.z * s;
		this.w = Math.cos(half);
		return this;
	}

	setAxis(axis, angle) { return this.setAxisAngle(axis, angle); }

	// ── Derived from degrees ─────────────────────────────────────────────────
	setEulerDeg(pitch, yaw, roll) {
		return this.setEuler(pitch * HALF_DEG * 2, yaw * HALF_DEG * 2, roll * HALF_DEG * 2);
	}

	// ── Magnitude ───────────────────────────────────────────────────────────
	lengthSq() { return this.x**2 + this.y**2 + this.z**2 + this.w**2; }
	length()   { return Math.sqrt(this.lengthSq()); }

	normalise() {
		const l = this.length();
		if (l === 0) { this.x=0; this.y=0; this.z=0; this.w=1; }
		else { const s = 1/l; this.x*=s; this.y*=s; this.z*=s; this.w*=s; }
		return this;
	}
	normalize() { return this.normalise(); }

	// ── Conjugate / inverse ─────────────────────────────────────────────────
	conjugate() { this.x=-this.x; this.y=-this.y; this.z=-this.z; return this; }
	invert()    { return this.conjugate().normalise(); }
	inverse()   { return this.invert(); }

	// ── Hamilton product (this = this × q) ──────────────────────────────────
	multiply(q) {
		const { x: ax, y: ay, z: az, w: aw } = this;
		const { x: bx, y: by, z: bz, w: bw } = q;
		this.x = aw*bx + ax*bw + ay*bz - az*by;
		this.y = aw*by - ax*bz + ay*bw + az*bx;
		this.z = aw*bz + ax*by - ay*bx + az*bw;
		this.w = aw*bw - ax*bx - ay*by - az*bz;
		return this;
	}

	// ── premultiply (q × this) ───────────────────────────────────────────────
	premultiply(q) { return Quaternion.from(q).multiply(this).copy(this); }

	// ── Dot product ─────────────────────────────────────────────────────────
	dot(q) { return this.x*q.x + this.y*q.y + this.z*q.z + this.w*q.w; }

	// ── Spherical linear interpolation ──────────────────────────────────────
	slerp(q, t) {
		let cosom = this.dot(q);
		if (cosom < 0) { cosom = -cosom; q = Quaternion.from(q).conjugate(); }
		let scale0, scale1;
		if (1 - cosom > 1e-6) {
			const omega = Math.acos(cosom);
			const sinom = 1 / Math.sin(omega);
			scale0 = Math.sin((1-t)*omega) * sinom;
			scale1 = Math.sin(t*omega) * sinom;
		} else {
			scale0 = 1 - t;
			scale1 = t;
		}
		this.x = scale0*this.x + scale1*q.x;
		this.y = scale0*this.y + scale1*q.y;
		this.z = scale0*this.z + scale1*q.z;
		this.w = scale0*this.w + scale1*q.w;
		return this;
	}

	// ── Convert back to Euler (YXZ) ──────────────────────────────────────────
	toEuler(out = { x: 0, y: 0, z: 0 }) {
		const { x, y, z, w } = this;
		out.x = Math.asin( Math.max(-1, Math.min(1, 2*(w*x - y*z))));
		out.y = Math.atan2(2*(w*y + x*z), 1 - 2*(x*x + y*y));
		out.z = Math.atan2(2*(w*z + x*y), 1 - 2*(x*x + z*z));
		return out;
	}
}
