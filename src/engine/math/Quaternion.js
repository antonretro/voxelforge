export class Quaternion {
	constructor (x = 0, y = 0, z = 0, w = 1) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}

	copy ({x = 0, y = 0, z = 0, w = 1}) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;

		return this;
	}

	clone () {
		return new Quaternion(this.x, this.y, this.z, this.w);
	}

	set (x = 0, y = 0, z = 0, w = 1) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;

		return this;
	}

	setEuler (x = 0, y = 0, z = 0) {
		// YXZ order (Yaw, Pitch, Roll) - standard for FPS cameras
		const c1 = Math.cos( x / 2 );
		const c2 = Math.cos( y / 2 );
		const c3 = Math.cos( z / 2 );

		const s1 = Math.sin( x / 2 );
		const s2 = Math.sin( y / 2 );
		const s3 = Math.sin( z / 2 );

		this.x = s1 * c2 * c3 + c1 * s2 * s3;
		this.y = c1 * s2 * c3 - s1 * c2 * s3;
		this.z = c1 * c2 * s3 - s1 * s2 * c3;
		this.w = c1 * c2 * c3 + s1 * s2 * s3;

		return this;
	}

	fromEuler (x, y, z) {
		return this.setEuler(x, y, z);
	}

	setAxis ({x = 0, y = 0, z = 0}, angle = 0) {
		// assumes unit vector for axis
		const half = angle * 0.5;
		const s = Math.sin(half);
		const c = Math.cos(half);

		this.x = x * s;
		this.y = y * s;
		this.z = z * s;
		this.w = c;
	}

	inverse () {
		return this.conjugate().normalize();
	}

	conjugate () {
		this.x *= -1;
		this.y *= -1;
		this.z *= -1;

		return this;
	}

	normalise () {
		const l = this.length();

		if (l === 0) {
			this.x = this.y = this.z = 0;
			this.w = 1;
		} else {
			const s = 1 / l;

			this.x *= s;
			this.y *= s;
			this.z *= s;
			this.w *= s;
		}

		return this;
	}

	length () {
		return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2 + this.w **2);
	}

	lengthSq () {
		return this.x ** 2 + this.y ** 2 + this.z ** 2 + this.w **2;
	}

	multiply (quat) {

		this.x = this.x * quat.w + this.w * quat.x + this.y * quat.z - this.z * quat.y;
		this.y = this.y * quat.w + this.w * quat.y + this.z * quat.x - this.x * quat.z;
		this.z = this.z * quat.w + this.w * quat.z + this.x * quat.y - this.y * quat.x;
		this.w = this.w * quat.w - this.x * quat.x - this.y * quat.y - this.z * quat.z;

		return this;
	}
}
