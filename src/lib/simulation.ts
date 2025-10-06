import { keplerToCartesian } from './kepler';
import type { OrbitalElements } from './kepler';
import type { Body } from './bodies';
import { updateDynamicTrail } from './trails';

const AU_TO_SIM = 215;
const DAY_TO_SEC = 86400;
const GM_sun = 3.94e-7; // Só pro cometa

/**
 * Atualiza posições/velocidades dos bodies baseado no tempo simulado.
 * - Analítica pra planetas (exata!).
 * - Numérica simples pro cometa ATLAS.
 * @param bodies - Array mutável de bodies
 * @param actualTime - Tempo em ms (de Canvas.svelte)
 */
export function updateBodies(bodies: Body[], actualTime: number) {
	// Atualização ANALÍTICA pros planetas
	bodies.forEach((body) => {
		if (body.orbitalElements) {
			const state = keplerToCartesian(body.orbitalElements, actualTime);
			body.x = state.x * AU_TO_SIM;
			body.y = state.y * AU_TO_SIM;
			body.vx = (state.vx / DAY_TO_SEC) * AU_TO_SIM;
			body.vy = (state.vy / DAY_TO_SEC) * AU_TO_SIM;
		}
	});

	// Atualização NUMÉRICA só pro cometa ATLAS
	const comet = bodies.find((b) => b.name === '3I/ATLAS');
	if (comet) {
		const sun = bodies[0];
		const dt = 0.01; // Fixed small dt pra estabilidade (ajuste se precisar)
		const dx = sun.x - comet.x;
		const dy = sun.y - comet.y;
		const r = Math.sqrt(dx * dx + dy * dy);
		if (r > 0) {
			const accelMag = GM_sun / (r * r);
			const ax = accelMag * (dx / r);
			const ay = accelMag * (dy / r);
			comet.vx += ax * dt;
			comet.vy += ay * dt;
			comet.x += comet.vx * dt;
			comet.y += comet.vy * dt;
			updateDynamicTrail(comet);
		}
	}
}
