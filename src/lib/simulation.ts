// simulation.ts
import { keplerToCartesian } from './kepler';
import type { Body } from './bodies';
import { updateDynamicTrail } from './trails';
import { AU_TO_SIM, DAY_TO_SEC } from "./constants";
// const GM_sun = 3.94e-7; // No longer needed for numeric integration

/**
 * update bodies positions and velocities
 * - analytical for all bodies with orbitalElements (exact!)
 * - dynamic trail update only for hyperbolic small bodies
 * @param bodies - Array of bodies
 * @param actualTime - Time in ms (from Canvas.svelte)
 * @param dt - Delta time in seconds (for dynamic trails)
 */
export function updateBodies(bodies: Body[], actualTime: number, dt: number) {
	// Analytical update for all bodies with orbitalElements (prevents straight-line drift)
	bodies.forEach((body) => {
		if (body.orbitalElements) {
			const state = keplerToCartesian(body.orbitalElements, actualTime);
			body.x = state.x * AU_TO_SIM;
			body.y = state.y * AU_TO_SIM;
			body.vx = (state.vx / DAY_TO_SEC) * AU_TO_SIM;
			body.vy = (state.vy / DAY_TO_SEC) * AU_TO_SIM;

			// Update dynamic trail only for hyperbolic (e >= 1) small bodies
			if (body.isSmall && body.orbitalElements.e >= 1 && dt > 0) {
				updateDynamicTrail(body, 1000); // Shorter trail for fast-moving comets
			}
		}
	});
}
