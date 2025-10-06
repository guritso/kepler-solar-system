import { keplerToCartesian } from './kepler';
import type { OrbitalElements } from './kepler';
import type { Body } from './bodies';

const AU_TO_SIM = 215; // Mesmo valor de bodies.ts
const mu = 0.01720209895 ** 2; // Constante gravitacional (GM escalado pros seus units)

/**
 * Calcula pontos ao longo da órbita completa (amostragem uniforme por anomalia média).
 * Para planetas: elipse fechada. Para cometas hiperbólicos: arco aberto.
 * @param elements - Elementos keplerianos
 * @param numPoints - Número de pontos (mais = mais suave, default 360 para 1° por ponto)
 * @returns Array de {x, y} em unidades de simulação
 */
export function computeOrbitPoints(
	elements: OrbitalElements,
	numPoints: number = 360
): { x: number; y: number }[] {
	const points: { x: number; y: number }[] = [];
	const now = Date.now(); // Tempo atual (como em fromOrbital)

	let currentM =
		elements.M +
		(((Math.sqrt(mu / Math.pow(elements.a, 3)) * (now - elements.epoch)) / 86400000) * 180) /
			Math.PI; // M atual em deg
	currentM = ((currentM % 360) + 360) % 360;

	for (let i = 0; i < numPoints; i++) {
		const deltaM = (i / numPoints) * 360 - 180; // Varia -180° a +180° do atual (full loop)
		const M_deg = (currentM + deltaM + 360) % 360;
		const tempElements = { ...elements, M: M_deg };
		const state = keplerToCartesian(tempElements, now); // No tempo atual

		points.push({
			x: state.x * AU_TO_SIM,
			y: state.y * AU_TO_SIM
		});
	}

	return points;
}
/**
 * Atualiza trail dinâmico para cometas (acumula posições passadas).
 * Chame isso após cada update de posição.
 * @param body - Corpo com trail (ex: cometa)
 * @param maxLength - Máximo de pontos no trail (default 1000 para performance)
 */
export function updateDynamicTrail(body: Body, maxLength: number = 1000) {
	if (!body.trail) {
		body.trail = [];
	}

	body.trail.push({ x: body.x, y: body.y });

	// Limita comprimento para evitar memória excessiva
	if (body.trail.length > maxLength) {
		body.trail.shift();
	}
}
/**
 * Desenha a órbita ou trail no contexto (chame em Canvas.svelte).
 * @param ctx - Contexto 2D
 * @param body - Corpo
 * @param gridSize - Escala de grid (de Canvas.svelte)
 * @param scale - Escala atual (de Canvas.svelte)
 */
export function drawTrail(
	ctx: CanvasRenderingContext2D,
	body: Body,
	gridSize: number,
	scale: number
) {
	if (!body.orbit && !body.trail) return;

	ctx.strokeStyle = body.gradient.one; // Cor do gradiente com alpha baixo (51% transparente)
	ctx.lineWidth = Math.max(0.5, 1 / scale); // Linha fina, ajusta com zoom
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.beginPath();

	let first = true;

	// Desenha órbita estática se existir
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
		ctx.closePath(); // Fecha elipse para planetas
	}

	// Ou desenha trail dinâmico se existir (para cometas)
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
