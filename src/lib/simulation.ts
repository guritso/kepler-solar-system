import { keplerToCartesian } from './kepler';
import type { OrbitalElements } from './kepler';
import type { Body } from './bodies';
import { updateDynamicTrail } from './trails';

const AU_TO_SIM = 215;
const DAY_TO_SEC = 86400;
const GM_sun = 3.94e-7; // only for cometa

/**
 * update bodies positions and velocities
 * - analytical for planets (exact!)
 * - numeric for cometa ATLAS
 * @param bodies - Array mutável de bodies
 * @param actualTime - Tempo em ms (de Canvas.svelte)
 * @param dt - Delta time em segundos (pro cometa numérico)
 */
export function updateBodies(bodies: Body[], actualTime: number, dt: number) {
	// analytical for planets (exact!)
	bodies.forEach((body) => {
		if (body.orbitalElements) {
			const state = keplerToCartesian(body.orbitalElements, actualTime);
			body.x = state.x * AU_TO_SIM;
			body.y = state.y * AU_TO_SIM;
			body.vx = (state.vx / DAY_TO_SEC) * AU_TO_SIM;
			body.vy = (state.vy / DAY_TO_SEC) * AU_TO_SIM;
		}
	});

	// numeric for cometa
	bodies.forEach((body) => {
		if (!body.orbitalElements && dt > 0) { // Qualquer body sem elementos keplerianos
			const sun = bodies[0];
			const fixedDt = 0.01; // Substep base pra precisão
			let substeps = Math.ceil(dt / fixedDt);
			substeps = Math.min(substeps, 50); // Limite pra performance
			const effectiveDt = dt / substeps;

			for (let step = 0; step < substeps; step++) {
				const dx = sun.x - body.x;
				const dy = sun.y - body.y;
				const r = Math.sqrt(dx * dx + dy * dy);
				if (r > 0) {
					const accelMag = GM_sun / (r * r);
					const ax = accelMag * (dx / r);
					const ay = accelMag * (dy / r);
					body.vx += ax * effectiveDt;
					body.vy += ay * effectiveDt;
					body.x += body.vx * effectiveDt;
					body.y += body.vy * effectiveDt;
					updateDynamicTrail(body, 500); // Trail curto pra cometas rápidas
				}
			}
		}
	});
}