import type { Body } from './bodies';
import type { OrbitalElements } from './kepler';

// Simulation scale: must match the scale used in bodies.ts
const AU_TO_SIM = 215; // 1 AU == 215 simulation units

/**
 * Identifica se um corpo é um cometa
 */
function isComet(body: Body): boolean {
    return body.name.includes('ATLAS') || body.name.includes('Comet') || body.trail !== undefined;
}

/**
 * Aplica rotações inversas orbitais para obter coordenadas no frame perifocal
 */
function applyInverseOrbitalRotations(bx: number, by: number, bz: number, elements: OrbitalElements): { x: number; y: number; z: number } {
    const Ω = (elements.Ω * Math.PI) / 180;
    const i = (elements.i * Math.PI) / 180;
    const ω = (elements.ω * Math.PI) / 180;

    // Rotação z por -Ω
    let x_a = bx * Math.cos(Ω) + by * Math.sin(Ω);
    let y_a = -bx * Math.sin(Ω) + by * Math.cos(Ω);
    let z_a = bz;

    // Rotação x por -i
    let x_b = x_a;
    let y_b = y_a * Math.cos(i) + z_a * Math.sin(i);
    let z_b = -y_a * Math.sin(i) + z_a * Math.cos(i);

    // Rotação z por -ω
    let x_peri = x_b * Math.cos(ω) + y_b * Math.sin(ω);
    let y_peri = -x_b * Math.sin(ω) + y_b * Math.cos(ω);
    let z_peri = z_b;

    return { x: x_peri, y: y_peri, z: z_peri };
}

/**
 * Gera pontos para uma órbita elíptica usando elementos orbitais, alinhada à posição atual do corpo
 */
export function generateEllipticalOrbit(body: Body, elements: OrbitalElements, segments: number = 360): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const a = elements.a; // semi-major axis
    const e = elements.e; // eccentricity

    // Posição atual em AU
    const bx = body.x / AU_TO_SIM;
    const by = body.y / AU_TO_SIM;
    const bz = 0;

    // Computa anomalia verdadeira atual (nu) no frame perifocal
    const periPos = applyInverseOrbitalRotations(bx, by, bz, elements);
    let nu = Math.atan2(periPos.y, periPos.x);
    if (nu < 0) nu += 2 * Math.PI;

    // Ângulos para órbitas elípticas (usamos anomalia verdadeira, offset por nu)
    for (let i = 0; i <= segments; i++) {
        const delta = (i / segments) * 2 * Math.PI;
        const angle = nu + delta;

        // Para órbitas elípticas, usamos a forma paramétrica
        const r = a * (1 - e * e) / (1 + e * Math.cos(angle));

        let x, y;
        if (e < 1) {
            // Órbita elíptica (fechada)
            x = r * Math.cos(angle);
            y = r * Math.sin(angle);
        } else {
            // Órbita hiperbólica (aberta) - trajetória linear aproximada
            x = r * Math.cos(angle);
            y = r * Math.sin(angle);
        }
        const z = 0;

        // Aplica as rotações orbitais (Ω, i, ω) para posicionar corretamente a órbita
        const rotatedCoords = applyOrbitalRotations(x, y, z, elements);

        // Aplica a escala de simulação para combinar com as posições dos corpos
        points.push({ x: rotatedCoords.x * AU_TO_SIM, y: rotatedCoords.y * AU_TO_SIM });
    }

    return points;
}

/**
 * Aplica as rotações orbitais para posicionar corretamente a órbita no espaço
 */
function applyOrbitalRotations(x: number, y: number, z: number, elements: OrbitalElements): { x: number; y: number; z: number } {
    const Ω = (elements.Ω * Math.PI) / 180; // Longitude of ascending node (radians)
    const i = (elements.i * Math.PI) / 180;  // Inclination (radians)
    const ω = (elements.ω * Math.PI) / 180;  // Argument of periapsis (radians)

    // Primeiro aplica a rotação pelo argumento do periapsis (ω)
    let x1 = x * Math.cos(ω) - y * Math.sin(ω);
    let y1 = x * Math.sin(ω) + y * Math.cos(ω);
    let z1 = z;

    // Depois aplica a inclinação (i)
    let x2 = x1;
    let y2 = y1 * Math.cos(i) - z1 * Math.sin(i);
    let z2 = y1 * Math.sin(i) + z1 * Math.cos(i);

    // Finalmente aplica a longitude do nó ascendente (Ω)
    let x3 = x2 * Math.cos(Ω) - y2 * Math.sin(Ω);
    let y3 = x2 * Math.sin(Ω) + y2 * Math.cos(Ω);
    let z3 = z2;

    return { x: x3, y: y3, z: z3 };
}

/**
 * Calcula trajetória linear baseada na velocidade atual do corpo
 */
export function generateLinearTrajectory(body: Body, segments: number = 100, timeAhead: number = 365 * 24 * 3600): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];

    // Adiciona ponto atual
    points.push({ x: body.x, y: body.y });

    // Calcula direção baseada na velocidade
    const speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    if (speed === 0) {
        return points; // Não há movimento
    }

    const directionX = body.vx / speed;
    const directionY = body.vy / speed;

    // Gera pontos futuros baseados na velocidade atual
    const timeStep = timeAhead / segments;
    for (let i = 1; i <= segments; i++) {
        const t = i * timeStep;
        const distance = speed * t;

        points.push({
            x: body.x + directionX * distance,
            y: body.y + directionY * distance
        });
    }

    return points;
}

/**
 * Cria dados de órbita para um corpo específico baseado em seus elementos orbitais ou trajetória
 */
export function createOrbitForBody(body: Body): { x: number; y: number }[] {
    // Para o Sol, não desenhamos órbita
    if (body.name === 'Sun') {
        return [];
    }

    // Para cometas, não mostramos trajetória futura linear
    if (isComet(body)) {
        return [];
    }

    // Tenta encontrar elementos orbitais para o corpo
    const orbitalElements = findOrbitalElements(body.name);

    if (orbitalElements) {
        // Corpo tem elementos orbitais definidos - desenha órbita elíptica alinhada
        return generateEllipticalOrbit(body, orbitalElements);
    } else {
        // Corpo sem elementos orbitais - trajetória linear baseada na velocidade
        return generateLinearTrajectory(body);
    }
}

/**
 * Encontra elementos orbitais para um corpo específico
 */
function findOrbitalElements(bodyName: string): OrbitalElements | null {
    // Mapeamento dos nomes dos corpos para seus elementos orbitais definidos em bodies.ts
    const orbitalElementsMap: Record<string, OrbitalElements> = {
        'Mercury': {
            a: 0.3963303568552592,
            e: 0.195146800949858,
            i: 6.998467562564008,
            Ω: 48.54860929512073,
            ω: 29.90600153654426,
            M: 152.5050447087461,
            epoch: 1759536000000
        },
        'Venus': {
            a: 0.7193075628881022,
            e: 0.00961301922234237,
            i: 3.395190616929889,
            Ω: 76.61547876637461,
            ω: 346.1809908562251,
            M: 70.73681720932568,
            epoch: 1759536000000
        },
        'Earth': {
            a: 0.9884778595229721,
            e: 0.0224665980676975,
            i: 0.009361834796841753,
            Ω: 242.5714748746163,
            ω: 238.093817256785,
            M: 252.1662094875961,
            epoch: 1759536000000
        },
        'Mars': {
            a: 1.5361808446362526,
            e: 0.09327957122076079,
            i: 1.846149199958463,
            Ω: 49.67412197237504,
            ω: 284.0761205312491,
            M: 271.5705002287118,
            epoch: 1759536000000
        },
        'Jupiter': {
            a: 5.196872446649367,
            e: 0.04902661375752699,
            i: 1.303775355536004,
            Ω: 100.4997221050677,
            ω: 273.2754318441118,
            M: 82.23624259872942,
            epoch: 1759536000000
        },
        'Saturn': {
            a: 9.537827257799261,
            e: 0.05454059430016105,
            i: 2.488808873212828,
            Ω: 113.644119191983,
            ω: 338.5479951631343,
            M: 272.6176161051636,
            epoch: 1759536000000
        },
        'Uranus': {
            a: 19.188180030037476,
            e: 0.04726029813008705,
            i: 0.7726304037113545,
            Ω: 73.99333322935934,
            ω: 97.11194454391001,
            M: 252.4895802486794,
            epoch: 1759536000000
        },
        'Neptune': {
            a: 30.06973093117018,
            e: 0.008593397795593868,
            i: 1.775164447238822,
            Ω: 131.9635756395051,
            ω: 272.6698679970442,
            M: 316.5089329576374,
            epoch: 1759536000000
        },
        'Ceres': {
            a: 2.75335009,
            e: 8.256884979564472E-02,
            i: 1.059670287549551E+01,
            Ω: 8.022742118128347E+01,
            ω: 7.411014758807298E+01,
            M: 2.204689200573771E+02,
            epoch: 1759536000000
        }
    };

    return orbitalElementsMap[bodyName] || null;
}

/**
 * Cria dados de órbitas para todos os corpos
 */
export function createOrbitsForAllBodies(bodies: Body[]): Map<string, { x: number; y: number }[]> {
    const orbits = new Map<string, { x: number; y: number }[]>();

    bodies.forEach(body => {
        const orbitPoints = createOrbitForBody(body);
        if (orbitPoints.length > 0) {
            orbits.set(body.name, orbitPoints);
        }
    });

    return orbits;
}