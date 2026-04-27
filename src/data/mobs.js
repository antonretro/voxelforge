
export const MOBS = [
    {
        id: 'sheep',
        name: 'Sheep',
        hp: 8,
        speed: 0.05,
        color: [1, 1, 1], // White
        model: 'cube',
        width: 0.6,
        height: 0.8
    },
    {
        id: 'pig',
        name: 'Pig',
        hp: 10,
        speed: 0.06,
        color: [1, 0.7, 0.7], // Pink
        model: 'cube',
        width: 0.6,
        height: 0.7
    }
];

export const MOB_MAP = new Map(MOBS.map(m => [m.id, m]));
