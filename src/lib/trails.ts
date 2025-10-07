import { keplerToCartesian } from './kepler';
import type { OrbitalElements } from './kepler';
import type { Body } from './bodies';

const AU_TO_SIM = 215; // Mesmo valor de bodies.ts
const mu = 0.01720209895 ** 2; // Gravitational constant (GM scaled for your units)

/**
 * Calculates points along the complete orbit (uniform sampling by mean anomaly).
 * For planets: closed ellipse. For hyperbolic comets: open arc.
 * @param elements - Keplerian elements
 * @param numPoints - Number of points (more = smoother, default 360 for 1° per point)
 * @returns Array of {x, y} in simulation units
 */
export function computeOrbitPoints(
	elements: OrbitalElements,
	numPoints: number = 360
): { x: number; y: number }[] {
	const points: { x: number; y: number }[] = [];
	const now = Date.now(); // Current time (as in fromOrbital)

	let currentM =
		elements.M +
		(((Math.sqrt(mu / Math.pow(elements.a, 3)) * (now - elements.epoch)) / 86400000) * 180) /
			Math.PI; // Current M in degrees
	currentM = ((currentM % 360) + 360) % 360;

	for (let i = 0; i < numPoints; i++) {
		const deltaM = (i / numPoints) * 360 - 180; // Varies from -180° to +180° from current (full loop)
		const M_deg = (currentM + deltaM + 360) % 360;
		const tempElements = { ...elements, M: M_deg };
		const state = keplerToCartesian(tempElements, now); // At current time

		points.push({
			x: state.x * AU_TO_SIM,
			y: state.y * AU_TO_SIM
		});
	}

	return points;
}
/**
 * Updates dynamic trail for comets (accumulates past positions).
 * Call this after each position update.
 * @param body - Body with trail (e.g.: comet)
 * @param maxLength - Maximum points in trail (default 1000 for performance)
 */
export function updateDynamicTrail(body: Body, maxLength: number = 1000) {
	if (!body.trail) {
		body.trail = [];
	}

	body.trail.push({ x: body.x, y: body.y });

	// Limits length to avoid excessive memory usage
	if (body.trail.length > maxLength) {
		body.trail.shift();
	}
}
/**
 * Draws the orbit or trail in the context (call in Canvas.svelte).
 * @param ctx - 2D context
 * @param body - Body
 * @param gridSize - Grid scale (from Canvas.svelte)
 * @param scale - Current scale (from Canvas.svelte)
 */
export function drawTrail(
	ctx: CanvasRenderingContext2D,
	body: Body,
	gridSize: number,
	scale: number
) {
	if (!body.orbit && !body.trail) return;

	ctx.strokeStyle = body.gradient.one; // Gradient color with low alpha (51% transparent)
	ctx.lineWidth = Math.max(0, Math.min(0.5 / scale)); // Thin line, adjusts with zoom
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.beginPath();

	let first = true;

	// Draws static orbit if it exists
	if (body.orbit) {
		body.orbit.forEach((point) => {
			const px = point.x * gridSize;
			const py = point.y * gridSize;
			if (first) {
				ctx.moveTo(px, py);
				first = false;
			} else {
				ctx.lineTo(px, py);
			}
		});
		ctx.closePath(); // Closes ellipse for planets
	}

	// Or draws dynamic trail if it exists (for comets)
	if (body.trail && body.trail.length > 1) {
		body.trail.forEach((point, index) => {
			const px = point.x * gridSize;
			const py = point.y * gridSize;
			if (index === 0) {
				ctx.moveTo(px, py);
			} else {
				ctx.lineTo(px, py);
			}
		});
	}

	ctx.stroke();
}
