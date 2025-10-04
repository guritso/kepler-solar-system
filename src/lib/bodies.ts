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
    trail: { x: number; y: number }[];
}

const sun: Body = {
    name: 'Sun',
    radius: 20,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 1.989e30,
    gradient: {
        one: 'rgb(255, 252, 52)',
        two: 'rgb(236, 88, 20)'
    },
    trail: [],
};

const mercury: Body = {
    name: 'Mercury',
    radius: sun.radius * 0.003506,
    x: 83,
    y: 0,
    vx: 0,
    vy: 6.88e-5,
    mass: 3.3014e23,
    gradient: {
        one: 'rgb(200, 200, 200)',
        two: 'rgb(100, 100, 100)'
    },
    trail: [],
};

const venus: Body = {
    name: 'Venus',
    radius: sun.radius * 0.008699,
    x: 156,
    y: 0,
    vx: 0,
    vy: 5.03e-5,
    mass: 4.8675e24,
    gradient: {
        one: 'rgb(255, 200, 100)',
        two: 'rgb(200, 100, 0)'
    },
    trail: [],
};

const earth: Body = {
    name: 'Earth',
    radius: sun.radius * 0.009158,
    x: 215,
    y: 0,
    vx: 0,
    vy: 4.28e-5,
    mass: 5.9723e24,
    gradient: {
        one: 'rgb(0, 121, 202)',
        two: 'rgba(21, 204, 76, 0.57)'
    },
    trail: [],
};

const mars: Body = {
    name: 'Mars',
    radius: sun.radius * 0.004872,
    x: 328,
    y: 0,
    vx: 0,
    vy: 3.47e-5,
    mass: 6.4171e23,
    gradient: {
        one: 'rgb(255, 100, 50)',
        two: 'rgb(150, 50, 0)'
    },
    trail: [],
};

const jupiter: Body = {
    name: 'Jupiter',
    radius: sun.radius * 0.100476,
    x: 1119,
    y: 0,
    vx: 0,
    vy: 1.88e-5,
    mass: 1.8982e27,
    gradient: {
        one: 'rgb(201, 230, 71)',
        two: 'rgba(255, 230, 0, 0.57)'
    },
    trail: [],
};

const saturn: Body = {
    name: 'Saturn',
    radius: sun.radius * 0.083703,
    x: 2050,
    y: 0,
    vx: 0,
    vy: 1.39e-5,
    mass: 5.6834e26,
    gradient: {
        one: 'rgb(250, 200, 100)',
        two: 'rgb(200, 150, 50)'
    },
    trail: [],
};

const uranus: Body = {
    name: 'Uranus',
    radius: sun.radius * 0.036456,
    x: 4130,
    y: 0,
    vx: 0,
    vy: 9.79e-6,
    mass: 8.681e25,
    gradient: {
        one: 'rgb(100, 200, 255)',
        two: 'rgb(50, 100, 150)'
    },
    trail: [],
};

const neptune: Body = {
    name: 'Neptune',
    radius: sun.radius * 0.035396,
    x: 6467,
    y: 0,
    vx: 0,
    vy: 7.80e-6,
    mass: 1.0241e26,
    gradient: {
        one: 'rgb(50, 100, 255)',
        two: 'rgb(0, 50, 150)'
    },
    trail: [],
};

const atlas: Body = {
    name: '3I/ATLAS',
    radius: sun.radius * 0.0005, // Exaggerated for visibility; real ~2e-6
    x: -260.8,
    y: -412.8,
    vx: -3.24e-5,
    vy: 8.91e-5,
    mass: 1e13, // Approximate comet mass
    gradient: {
        one: 'rgb(200, 200, 255)',
        two: 'rgba(100, 100, 200, 0.6)'
    },
    trail: [],
};

export const bodies: Body[] = [sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, atlas];