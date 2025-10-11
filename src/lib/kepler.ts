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
	// Gaussian gravitational constant squared -> mu (AU^3 / day^2)
	const mu = 0.01720209895 ** 2;

	// --- epoch units: accept either Unix ms or Julian Date (JD) ---
	let epochMs = elements.epoch;
	if (Math.abs(epochMs) < 1e11) { // provável JD
		epochMs = (epochMs - 2440587.5) * 86400000;
	}
	const tDays = (now - epochMs) / 86400000; // dias desde epoch

	// orbital params
	let a = elements.a;
	const e = elements.e;
	const toRad = (deg: number) => (deg * Math.PI) / 180;

	// normalize a for hyperbolic convention if needed
	if (e > 1 && a > 0) a = -a;

	// mean motion (usar abs(a)^3)
	const n = Math.sqrt(mu / Math.abs(a * a * a));

    // Mean anomaly at time now (rad)
    let M = toRad(elements.M) + n * tDays;
	// For elliptical orbits, M is periodic (normalize). For hyperbolic orbits (e>1), do not normalize!
    if (e < 1) {
        M = ((M + Math.PI) % (2 * Math.PI)) - Math.PI;
    }

	if (Math.abs(e - 1) < 1e-12) {
		throw new Error('Parabolic orbits (e ~= 1) não suportadas.');
	}

	let nu = 0;
	let r = 0;
	let p = 0;

	if (e < 1) {
		// Eccentric anomaly E for ellipse
		let E = (Math.abs(e) < 0.8) ? M : Math.PI;
		for (let i = 0; i < 200; i++) {
			const f = E - e * Math.sin(E) - M;
			const fp = 1 - e * Math.cos(E);
			const d = f / fp;
			E -= d;
			if (Math.abs(d) < 1e-14) break;
		}
		// corrected: usar sin(E/2), cos(E/2)
		const sinE2 = Math.sin(E / 2);
		const cosE2 = Math.cos(E / 2);
		nu = 2 * Math.atan2(Math.sqrt(1 + e) * sinE2, Math.sqrt(1 - e) * cosE2);

		p = a * (1 - e * e);
		r = p / (1 + e * Math.cos(nu));
	} else {
		// Hyperbolic: solve for H (hyperbolic anomaly)
		// M = e*sinh(H) - H
		// initial guess
		let H = Math.asinh(M / e);
		if (!isFinite(H)) H = Math.sign(M) * Math.log(2 * Math.abs(M) / e + 1.8);
		for (let i = 0; i < 300; i++) {
			const sinhH = Math.sinh(H);
			const coshH = Math.cosh(H);
			const f = e * sinhH - H - M;
			const fp = e * coshH - 1;
			const d = f / fp;
			H -= d;
			if (Math.abs(d) < 1e-14) break;
		}
		const sinhH2 = Math.sinh(H / 2);
		const coshH2 = Math.cosh(H / 2);
		nu = 2 * Math.atan2(Math.sqrt(e + 1) * sinhH2, Math.sqrt(e - 1) * coshH2);

		p = Math.abs(a) * (e * e - 1); // Para órbitas hiperbólicas: p = |a|(e²-1)
		r = p / (1 + e * Math.cos(nu));
	}

	// posição no plano orbital
	const x_orb = r * Math.cos(nu);
	const y_orb = r * Math.sin(nu);

	// velocidade no plano orbital (radial + transverse)
	if (p <= 0) throw new Error('p (semi-latus rectum) invalid.');
	const sqrt_mu_over_p = Math.sqrt(mu / p);
	const vr = sqrt_mu_over_p * e * Math.sin(nu);
	const vtheta = sqrt_mu_over_p * (1 + e * Math.cos(nu));

	const vx_orb = vr * Math.cos(nu) - vtheta * Math.sin(nu);
	const vy_orb = vr * Math.sin(nu) + vtheta * Math.cos(nu);

	// rotação PQW -> IJK
	const Omega = toRad(elements.Ω);
	const inc = toRad(elements.i);
	const omega = toRad(elements.ω);

	const cosO = Math.cos(Omega), sinO = Math.sin(Omega);
	const cosi = Math.cos(inc), sini = Math.sin(inc);
	const cosw = Math.cos(omega), sinw = Math.sin(omega);

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
