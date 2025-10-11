import { keplerToCartesian } from './kepler';
import type { OrbitalElements } from './kepler';
import { computeOrbitPoints } from './trails';
import { AU_TO_SIM, AU_IN_KM, DAY_TO_SEC } from './constants';
import bodiesCsv from '$lib/assets/bodies.csv?raw';

export interface Body {
	name: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
	mass: number;
	radius: number;
	gradient: {
		one: string;
		two: string;
	};
	trail?: { x: number; y: number }[];
	orbit?: { x: number; y: number }[]; // Static orbit for planets only
	orbitalElements?: OrbitalElements; // Keplerian elements for analytic update (all)
	isHyperbolic?: boolean; // Flag: true for small bodies
	bodyType?: string;
	orbitalPeriod: number;
}

// Parse CSV data
interface BodyData {
	name: string;
	sma: number; // semi-major axis
	ecc: number; // eccentricity
	inc: number; // inclination
	lan: number; // longitude of ascending node
	aop: number; // argument of periapsis
	ma: number; // mean anomaly
	epoch: number; // epoch
	radius: number; // radius in km
	mass: number; // mass in kg
}

function parseCsvData(csvText: string): BodyData[] {
	const lines = csvText.trim().split('\n');
	const headers = lines[0].split(',');

	return lines.slice(1).map((line) => {
		const values = line.split(',');
		return {
			name: values[0],
			sma: parseFloat(values[1]),
			ecc: parseFloat(values[2]),
			inc: parseFloat(values[3]),
			lan: parseFloat(values[4]),
			aop: parseFloat(values[5]),
			ma: parseFloat(values[6]),
			epoch: parseFloat(values[7]),
			radius: parseFloat(values[8]),
			mass: parseFloat(values[9])
		};
	});
}

const bodiesData = parseCsvData(bodiesCsv);

function fromOrbital(
	name: string,
	elements: OrbitalElements,
	mass: number,
	radiusKm: number,
	gradient: { one: string; two: string }
): Body {
	const now = Date.now();
	const state = keplerToCartesian(elements, now);

	// positions: AU -> sim units
	const x = state.x * AU_TO_SIM;
	const y = state.y * AU_TO_SIM;

	// velocities: AU/day -> AU/sec -> sim units/sec
	const vx = (state.vx / DAY_TO_SEC) * AU_TO_SIM;
	const vy = (state.vy / DAY_TO_SEC) * AU_TO_SIM;

	// Scale radius for realistic proportions in simulation
	// 1 AU = 2150 sim units, 1 AU = 149,597,870.7 km
	// Therefore: 1 km = 2150 / 149,597,870.7 ≈ 0.00001437 sim units
	const radiusScale = AU_TO_SIM / 149597870.7; // Realistic scale based on AU_TO_SIM
	const radius = Math.max(radiusKm * radiusScale, 0.01); // Minimum radius for visibility

	const orbitalPeriod = calculateOrbitalPeriod(elements.a, elements.e);

	return {
		name,
		radius,
		orbitalPeriod,
		x,
		y,
		vx,
		vy,
		mass,
		gradient
	};
}

// Calculate realistic Sun radius using the same scale as other bodies
const SUN_RADIUS_KM = 696340; // Real Sun radius in km
const radiusScale = AU_TO_SIM / 149597870.7;
const sun: Body = {
	name: 'Sun',
	radius: SUN_RADIUS_KM * radiusScale, // Realistic Sun radius
	x: 0,
	y: 0,
	vx: 0,
	vy: 0,
	mass: 1.989e30,
	gradient: {
		one: 'rgb(255, 253, 131)',
		two: 'rgb(255, 217, 0)'
	},
	orbitalPeriod: 0
};

// Convert CSV data to orbital elements
function csvToOrbitalElements(data: BodyData): OrbitalElements {
	return {
		a: data.sma,
		e: data.ecc,
		i: data.inc,
		Ω: data.lan,
		ω: data.aop,
		M: data.ma,
		epoch: data.epoch
	};
}

// Color gradients for different body types
const bodyGradients: Record<string, { one: string; two: string }> = {
	mercury: { one: 'rgb(200, 200, 200)', two: 'rgb(100, 100, 100)' },
	venus: { one: 'rgb(255, 200, 100)', two: 'rgb(200, 100, 0)' },
	earth: { one: 'rgb(0, 121, 202)', two: 'rgba(21, 204, 76, 0.57)' },
	mars: { one: 'rgb(255, 100, 50)', two: 'rgb(150, 50, 0)' },
	jupiter: { one: 'rgb(201, 230, 71)', two: 'rgba(255, 230, 0, 0.57)' },
	saturn: { one: 'rgb(250, 200, 100)', two: 'rgb(200, 150, 50)' },
	uranus: { one: 'rgb(100, 200, 255)', two: 'rgb(50, 100, 150)' },
	neptune: { one: 'rgb(50, 100, 255)', two: 'rgb(0, 50, 150)' },
	pluto: { one: 'rgb(200,200,200)', two: 'rgb(68, 35, 30)' }
};

function classifyBody(body: BodyData): string {
	const { sma, ecc, radius, mass } = body;
	const perihelion = sma * (1 - ecc); // AU

	if (ecc > 0.8 && perihelion < 5) return 'Comet';
	if (radius < 400 || mass < 1e20) return 'Asteroid';
	if (mass < 1e25 && radius > 400 && radius < 2000) return 'Dwarf Planet';

	// Planet: otherwise, assuming major bodies
	return 'Planet';
}

function calculateOrbitalPeriod(sma: number, eccentricity: number): number {
	// Only works for elliptical orbits (e < 1)
	if (eccentricity >= 1) return 0; // Órbita de escape

	// 3rd Law of Kepler: T² = a³ (for AU and years)
	// So: T = √(a³)
	const periodYears = Math.sqrt(sma * sma * sma);
	return periodYears;
}

// Small bodies that should have trails instead of static orbits
function shouldUseTrail(eccentricity: number): boolean {
	return eccentricity >= 1.0;
}

// Create fresh bodies array (for initial and reset)
export function createBodies(): Body[] {
	const bodies: Body[] = [sun]; // Start with the sun

	// Create bodies from CSV data (skip Sun as it's already created)
	for (const data of bodiesData) {
		// Skip Sun - it's already created above
		if (data.name.toLowerCase() === 'sun') continue;

		const elements = csvToOrbitalElements(data);
		const gradient = bodyGradients[data.name.toLowerCase()] || {
			one: 'rgb(200,200,200)',
			two: 'rgb(160,160,160)'
		};

		const body = fromOrbital(data.name, elements, data.mass, data.radius, gradient);

		// Set orbital elements for all bodies
		body.orbitalElements = elements;

		// For planets: static orbit, for small bodies: dynamic trail
		if (shouldUseTrail(data.ecc)) {
			body.isHyperbolic = true;
			body.trail = [];
		} else {
			body.orbit = computeOrbitPoints(elements);
		}

		body.bodyType = classifyBody(data);

		bodies.push(body);
	}

	return bodies;
}
