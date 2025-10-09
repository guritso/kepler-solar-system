import { keplerToCartesian } from './kepler';
import type { OrbitalElements } from './kepler';
import { computeOrbitPoints } from './trails';
import { AU_TO_SIM } from "./stores"

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
	trail?: { x: number; y: number }[]; // Dynamic trail for comets only
	orbit?: { x: number; y: number }[]; // Static orbit for planets only
	orbitalElements?: OrbitalElements; // Keplerian elements for analytic update (all)
	isSmall?: boolean; // Flag: true for small bodies
}

const DAY_TO_SEC = 86400;

function fromOrbital(
	name: string,
	elements: OrbitalElements,
	mass: number,
	radiusScale: number,
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

	return {
		name,
		radius: sun.radius * radiusScale,
		x,
		y,
		vx,
		vy,
		mass,
		gradient
	};
}

const sun: Body = {
	name: 'Sun',
	radius: 10,
	x: 0,
	y: 0,
	vx: 0,
	vy: 0,
	mass: 1.989e30,
	gradient: {
		one: 'rgb(255, 253, 131)',
		two: 'rgb(255, 217, 0)'
	}
};

// Planetary elements (simplified, epoch arbitrary = Date.now() in ms ~2025-10-06)
const mercuryEl: OrbitalElements = {
	a: 0.3963303568552592,
	e: 0.195146800949858,
	i: 6.998467562564008,
	Ω: 48.54860929512073,
	ω: 29.90600153654426,
	M: 152.5050447087461,
	epoch: 1759132800000 // 2025-10-06
};
const venusEl: OrbitalElements = {
	a: 0.7193075628881022,
	e: 0.00961301922234237,
	i: 3.395190616929889,
	Ω: 76.61547876637461,
	ω: 346.1809908562251,
	M: 70.73681720932568,
	epoch: 1759132800000
};
const earthEl: OrbitalElements = {
	a: 0.9884778595229721,
	e: 0.0224665980676975,
	i: 0.009361834796841753,
	Ω: 242.5714748746163,
	ω: 238.093817256785,
	M: 252.1662094875961,
	epoch: 1759132800000
};
const marsEl: OrbitalElements = {
	a: 1.5361808446362526,
	e: 0.09327957122076079,
	i: 1.846149199958463,
	Ω: 49.67412197237504,
	ω: 284.0761205312491,
	M: 271.5705002287118,
	epoch: 1759132800000
};
const jupiterEl: OrbitalElements = {
	a: 5.196872446649367,
	e: 0.04902661375752699,
	i: 1.303775355536004,
	Ω: 100.4997221050677,
	ω: 273.2754318441118,
	M: 82.23624259872942,
	epoch: 1759132800000
};
const saturnEl: OrbitalElements = {
	a: 9.537827257799261,
	e: 0.05454059430016105,
	i: 2.488808873212828,
	Ω: 113.644119191983,
	ω: 338.5479951631343,
	M: 272.6176161051636,
	epoch: 1759132800000
};
const uranusEl: OrbitalElements = {
	a: 19.188180030037476,
	e: 0.04726029813008705,
	i: 0.7726304037113545,
	Ω: 73.99333322935934,
	ω: 97.11194454391001,
	M: 252.4895802486794,
	epoch: 1759132800000
};
const neptuneEl: OrbitalElements = {
	a: 30.06973093117018,
	e: 0.008593397795593868,
	i: 1.775164447238822,
	Ω: 131.9635756395051,
	ω: 272.6698679970442,
	M: 316.5089329576374,
	epoch: 1759132800000
};
const ceresEl: OrbitalElements = {
	a: 2.75335009,
	e: 8.256884979564472e-2,
	i: 1.059670287549551e1,
	Ω: 8.022742118128347e1,
	ω: 7.411014758807298e1,
	M: 2.204689200573771e2,
	epoch: 1759132800000
};
const plutoEl: OrbitalElements = {
	a: 39.58862938517124,
	e: 0.2518378778576892,
	i: 17.14771140999114,
	Ω: 110.2923840543057,
	ω: 113.7090015158565,
	M: 38.68366347318184,
	epoch: 2457588.5
};
const sednaEl: OrbitalElements = {
	a: 549.5396510704963,
	e: 0.8615456732,
	i: 11.9261038261,
	Ω: 144.4704621550,
	ω: 310.9902088880,
	M: 358.6088086366,
	epoch: 1759708800000
};
const atlasEl: OrbitalElements = {
	a: -0.26391591751781, // AU (negative for hyperbolic orbit)
	e: 6.139587836355706, // hyperbolic eccentricity
	i: 175.1131015287974, // deg
	Ω: 322.1568699043938, // deg
	ω: 128.0099421020839, // deg
	M: -723.1822479798254, // deg (negative for hyperbolic)
	epoch: 2460878.5  // 2025-10-06 00:00 UTC (Julian Date)
};

// Create fresh bodies array (for initial and reset)
export function createBodies(): Body[] {
	// Planets (analytic, static orbit line)
	const mercury = fromOrbital('Mercury', mercuryEl, 3.3014e23, 0.003506, {
		one: 'rgb(200, 200, 200)',
		two: 'rgb(100, 100, 100)'
	});
	mercury.orbit = computeOrbitPoints(mercuryEl);
	mercury.orbitalElements = mercuryEl;

	const venus = fromOrbital('Venus', venusEl, 4.8675e24, 0.008699, {
		one: 'rgb(255, 200, 100)',
		two: 'rgb(200, 100, 0)'
	});
	venus.orbit = computeOrbitPoints(venusEl);
	venus.orbitalElements = venusEl;

	const earth = fromOrbital('Earth', earthEl, 5.9723e24, 0.009158, {
		one: 'rgb(0, 121, 202)',
		two: 'rgba(21, 204, 76, 0.57)'
	});
	earth.orbit = computeOrbitPoints(earthEl);
	earth.orbitalElements = earthEl;

	const mars = fromOrbital('Mars', marsEl, 6.4171e23, 0.004872, {
		one: 'rgb(255, 100, 50)',
		two: 'rgb(150, 50, 0)'
	});
	mars.orbit = computeOrbitPoints(marsEl);
	mars.orbitalElements = marsEl;

	const jupiter = fromOrbital('Jupiter', jupiterEl, 1.8982e27, 0.100476, {
		one: 'rgb(201, 230, 71)',
		two: 'rgba(255, 230, 0, 0.57)'
	});
	jupiter.orbit = computeOrbitPoints(jupiterEl);
	jupiter.orbitalElements = jupiterEl;

	const saturn = fromOrbital('Saturn', saturnEl, 5.6834e26, 0.083703, {
		one: 'rgb(250, 200, 100)',
		two: 'rgb(200, 150, 50)'
	});
	saturn.orbit = computeOrbitPoints(saturnEl);
	saturn.orbitalElements = saturnEl;

	const uranus = fromOrbital('Uranus', uranusEl, 8.681e25, 0.036456, {
		one: 'rgb(100, 200, 255)',
		two: 'rgb(50, 100, 150)'
	});
	uranus.orbit = computeOrbitPoints(uranusEl);
	uranus.orbitalElements = uranusEl;

	const neptune = fromOrbital('Neptune', neptuneEl, 1.0241e26, 0.035396, {
		one: 'rgb(50, 100, 255)',
		two: 'rgb(0, 50, 150)'
	});
	neptune.orbit = computeOrbitPoints(neptuneEl);
	neptune.orbitalElements = neptuneEl;

	const ceres = fromOrbital('Ceres', ceresEl, 9.393e20, 0.000675, {
		one: 'rgb(200,200,200)',
		two: 'rgb(160,160,160)'
	});
	ceres.orbitalElements = ceresEl;
	ceres.orbit = computeOrbitPoints(ceresEl);
	ceres.isSmall = true;
	ceres.trail = []; 

	const pluto = fromOrbital('Pluto', plutoEl, 1.303e22, 0.001708, {
		one: 'rgb(200,200,200)',
		two: 'rgb(68, 35, 30)'
	});
	pluto.orbit = computeOrbitPoints(plutoEl);
	pluto.orbitalElements = plutoEl;
	pluto.isSmall = true;
	pluto.trail = []


	const sedna = fromOrbital('sedna', sednaEl, 1e13, 0.0005, {
		one: 'rgb(201, 201, 235)',
		two: 'rgba(100, 100, 139, 0.6)'
	});
	sedna.orbit = computeOrbitPoints(sednaEl);
	sedna.orbitalElements = sednaEl;
	sedna.isSmall = true;
	sedna.trail = []


	const atlas = fromOrbital('3I/ATLAS', atlasEl, 1e13, 0.0005, {
		one: 'rgb(200, 200, 255)',
		two: 'rgba(100, 100, 200, 0.6)'
	});
	atlas.orbitalElements = atlasEl;
	atlas.isSmall = true;
	atlas.trail = []; 

	return [
		sun,
		mercury,
		venus,
		earth,
		mars,
		jupiter,
		saturn,
		uranus,
		neptune,
		ceres,
		atlas,
		pluto,
		sedna
	];
}