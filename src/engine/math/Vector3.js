export class Vector3 {
	constructor(x = 0, y = 0, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	// ── Factories ───────────────────────────────────────────────────────────
	static from(v)              { return new Vector3(v.x, v.y, v.z); }
	static fromArray(a, o = 0) { return new Vector3(a[o], a[o+1], a[o+2]); }
	static splat(s)             { return new Vector3(s, s, s); }

	// ── In-place setters ────────────────────────────────────────────────────
	set(x = 0, y = 0, z = 0)   { this.x = x; this.y = y; this.z = z; return this; }
	copy(v)                     { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
	clone()                     { return new Vector3(this.x, this.y, this.z); }
	toArray(out = [], o = 0)    { out[o] = this.x; out[o+1] = this.y; out[o+2] = this.z; return out; }

	// ── Arithmetic ──────────────────────────────────────────────────────────
	add(v)          { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
	addScalar(s)    { this.x += s;   this.y += s;   this.z += s;   return this; }
	sub(v)          { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
	subtract(v)     { return this.sub(v); }
	scale(s)        { this.x *= s;   this.y *= s;   this.z *= s;   return this; }
	multiply(s)     { return this.scale(s); }
	divide(s)       { return this.scale(1 / s); }
	negate()        { return this.scale(-1); }
	inverse()       { return this.negate(); }

	addScaled(v, s) {
		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;
		return this;
	}

	// ── Component-wise ──────────────────────────────────────────────────────
	floor()  { this.x = Math.floor(this.x); this.y = Math.floor(this.y); this.z = Math.floor(this.z); return this; }
	ceil()   { this.x = Math.ceil(this.x);  this.y = Math.ceil(this.y);  this.z = Math.ceil(this.z);  return this; }
	abs()    { this.x = Math.abs(this.x);   this.y = Math.abs(this.y);   this.z = Math.abs(this.z);   return this; }
	power(n) { this.x = this.x**n; this.y = this.y**n; this.z = this.z**n; return this; }

	clamp(min, max) {
		this.x = Math.max(min, Math.min(max, this.x));
		this.y = Math.max(min, Math.min(max, this.y));
		this.z = Math.max(min, Math.min(max, this.z));
		return this;
	}

	lerp(v, t) {
		this.x += (v.x - this.x) * t;
		this.y += (v.y - this.y) * t;
		this.z += (v.z - this.z) * t;
		return this;
	}

	// ── Geometry ────────────────────────────────────────────────────────────
	lengthSq()       { return this.x*this.x + this.y*this.y + this.z*this.z; }
	length()         { return Math.sqrt(this.lengthSq()); }
	distanceTo(v)    { return Math.sqrt((this.x-v.x)**2 + (this.y-v.y)**2 + (this.z-v.z)**2); }
	distanceToSq(v)  { return (this.x-v.x)**2 + (this.y-v.y)**2 + (this.z-v.z)**2; }

	dot(v)   { return this.x*v.x + this.y*v.y + this.z*v.z; }
	dot2(v)  { return this.x*v.x + this.y*v.y; }

	cross(v) {
		const ax = this.x, ay = this.y, az = this.z;
		this.x = ay*v.z - az*v.y;
		this.y = az*v.x - ax*v.z;
		this.z = ax*v.y - ay*v.x;
		return this;
	}

	normalise() {
		const len = this.length();
		return len > 0 ? this.scale(1 / len) : this;
	}
	normalize() { return this.normalise(); }

	reflect(normal) {
		const d = 2 * this.dot(normal);
		this.x -= d * normal.x;
		this.y -= d * normal.y;
		this.z -= d * normal.z;
		return this;
	}

	angleTo(v) {
		const denom = Math.sqrt(this.lengthSq() * v.x*v.x + v.y*v.y + v.z*v.z);
		if (denom === 0) return 0;
		return Math.acos(Math.max(-1, Math.min(1, this.dot(v) / denom)));
	}

	applyQuaternion(q) {
		const { x, y, z } = this;
		const { x: qx, y: qy, z: qz, w: qw } = q;
		const ix =  qw*x + qy*z - qz*y;
		const iy =  qw*y + qz*x - qx*z;
		const iz =  qw*z + qx*y - qy*x;
		const iw = -qx*x - qy*y - qz*z;
		this.x = ix*qw + iw*-qx + iy*-qz - iz*-qy;
		this.y = iy*qw + iw*-qy + iz*-qx - ix*-qz;
		this.z = iz*qw + iw*-qz + ix*-qy - iy*-qx;
		return this;
	}

	// ── Predicates ──────────────────────────────────────────────────────────
	equals(v)  { return this.x === v.x && this.y === v.y && this.z === v.z; }
	isZero()   { return this.x === 0 && this.y === 0 && this.z === 0; }
	isNaN()    { return isNaN(this.x) || isNaN(this.y) || isNaN(this.z); }
}

// Shared direction constants (read-only)
Vector3.UP       = Object.freeze(new Vector3( 0,  1,  0));
Vector3.DOWN     = Object.freeze(new Vector3( 0, -1,  0));
Vector3.LEFT     = Object.freeze(new Vector3(-1,  0,  0));
Vector3.RIGHT    = Object.freeze(new Vector3( 1,  0,  0));
Vector3.FORWARD  = Object.freeze(new Vector3( 0,  0,  1));
Vector3.BACKWARD = Object.freeze(new Vector3( 0,  0, -1));
Vector3.ZERO     = Object.freeze(new Vector3( 0,  0,  0));
Vector3.ONE      = Object.freeze(new Vector3( 1,  1,  1));
