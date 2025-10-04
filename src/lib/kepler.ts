export interface OrbitalElements {
	a: number; // semi-major axis (AU)
	e: number; // eccentricity
	i: number; // inclination (deg)
	Ω: number; // longitude of ascending node (deg)
	ω: number; // argument of periapsis (deg)
	M: number; // mean anomaly at epoch (deg)
	epoch: number; // epoch in ms
}

export interface CartesianState {
	x: number;
	y: number;
	z: number;
	vx: number;
	vy: number;
	vz: number;
}

/**
 * Convert Keplerian orbital elements to Cartesian state (AU, AU/day)
 * Uses Newton-Raphson to solve Kepler's equation for eccentric anomaly.
 */
export function keplerToCartesian(elements: OrbitalElements, now: number): CartesianState {
	// Gaussian gravitational constant (k) squared -> μ = k^2 (units: AU^3 / day^2)
	const mu = 0.01720209895 ** 2;

	const t = (now - elements.epoch) / 86400000; // days since epoch

	// Mean motion (rad/day)
	const n = Math.sqrt(mu / Math.pow(elements.a, 3));

	// Mean anomaly at time now (radians)
	let M = (elements.M * Math.PI) / 180 + n * t;
	// Normalize M to [-PI, PI]
	M = ((M + Math.PI) % (2 * Math.PI)) - Math.PI;

	// Solve Kepler's equation: M = E - e*sin(E) for E
	const e = elements.e;
	let E = M; // initial guess
	if (Math.abs(e) < 0.8) {
		E = M;
	} else {
		E = Math.PI;
	}

	// Newton-Raphson
	for (let iter = 0; iter < 50; iter++) {
		const f = E - e * Math.sin(E) - M;
		const fp = 1 - e * Math.cos(E);
		const delta = f / fp;
		E -= delta;
		if (Math.abs(delta) < 1e-12) break;
	}

	// True anomaly components and distance
	const cosE = Math.cos(E);
	const sinE = Math.sin(E);

	const a = elements.a;
	const r = a * (1 - e * cosE);

	// position in orbital plane (PQW frame)
	const x_orb = a * (cosE - e);
	const y_orb = a * Math.sqrt(Math.max(0, 1 - e * e)) * sinE;

	// velocity in orbital plane (AU/day)
	const factor = Math.sqrt(mu * a) / r;
	const vx_orb = -factor * sinE;
	const vy_orb = factor * Math.sqrt(Math.max(0, 1 - e * e)) * cosE;

	// rotation to inertial frame using Ω, i, ω (all converted to radians)
	const Omega = (elements.Ω * Math.PI) / 180;
	const inc = (elements.i * Math.PI) / 180;
	const omega = (elements.ω * Math.PI) / 180;

	const cosO = Math.cos(Omega);
	const sinO = Math.sin(Omega);
	const cosi = Math.cos(inc);
	const sini = Math.sin(inc);
	const cosw = Math.cos(omega);
	const sinw = Math.sin(omega);

	// rotation matrix components
	const R11 = cosO * cosw - sinO * sinw * cosi;
	const R12 = -cosO * sinw - sinO * cosw * cosi;
	const R21 = sinO * cosw + cosO * sinw * cosi;
	const R22 = -sinO * sinw + cosO * cosw * cosi;
	const R31 = sinw * sini;
	const R32 = cosw * sini;

	const X = R11 * x_orb + R12 * y_orb;
	const Y = R21 * x_orb + R22 * y_orb;
	const Z = R31 * x_orb + R32 * y_orb;

	const VX = R11 * vx_orb + R12 * vy_orb;
	const VY = R21 * vx_orb + R22 * vy_orb;
	const VZ = R31 * vx_orb + R32 * vy_orb;

	return { x: X, y: Y, z: Z, vx: VX, vy: VY, vz: VZ };
}
