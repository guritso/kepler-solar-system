import type { Body } from './bodies';

export function calculateGravity(dt: number, bodies: Body[]) {
	const GM_sun = 3.94e-7; // Correct scaled GM for units
	const fixedDt = 0.01;
	let substeps = Math.ceil(dt / fixedDt);
	substeps = Math.min(substeps, 100);
	const effectiveDt = dt / substeps;

	for (let step = 0; step < substeps; step++) {
		bodies.forEach((body, index) => {
			if (index === 0) return;
			const sun = bodies[0];
			const dx = sun.x - body.x;
			const dy = sun.y - body.y;
			const r = Math.sqrt(dx * dx + dy * dy);
			if (r === 0) return;
			const accelMag = GM_sun / (r * r);
			const ax = accelMag * (dx / r);
			const ay = accelMag * (dy / r);
			body.vx += ax * effectiveDt;
			body.vy += ay * effectiveDt;
			body.x += body.vx * effectiveDt;
			body.y += body.vy * effectiveDt;
		});
	}
}
