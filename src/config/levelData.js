// ============================================
// levelData.js — 15 Polished Levels
// ============================================
// 3 Worlds × 5 Levels = 15 Levels Total

// ========================
// WORLD 1: THE BRASS WORKSHOP
// ========================
const WORLD_1 = [
  {
    id: 1, name: 'First Strike', world: 1,
    cols: 4, rows: 1, bpm: 80,
    availableParts: ['hammer'],
    targetPattern: [
      ['hammer', null, null, null],
    ],
  },
  {
    id: 2, name: 'Triple Tap', world: 1,
    cols: 4, rows: 1, bpm: 85,
    availableParts: ['hammer'],
    targetPattern: [
      ['hammer', null, 'hammer', 'hammer'],
    ],
  },
  {
    id: 3, name: 'High & Low', world: 1,
    cols: 4, rows: 2, bpm: 85,
    availableParts: ['hammer'],
    targetPattern: [
      ['hammer', null, 'hammer', null],
      [null, 'hammer', null, 'hammer'],
    ],
  },
  {
    id: 4, name: 'First Beat', world: 1,
    cols: 4, rows: 2, bpm: 90,
    availableParts: ['hammer', 'wrench'],
    targetPattern: [
      ['hammer', null, 'hammer', null],
      ['wrench', null, null, 'wrench'],
    ],
  },
  {
    id: 5, name: 'March', world: 1,
    cols: 5, rows: 3, bpm: 100,
    availableParts: ['hammer', 'wrench'],
    targetPattern: [
      ['hammer', null, null, 'hammer', null],
      [null, 'hammer', null, null, 'hammer'],
      ['wrench', null, 'wrench', null, 'wrench'],
    ],
  },
];

// ========================
// WORLD 2: STEAM POWERED
// Parts start sharing rows — listen carefully!
// ========================
const WORLD_2 = [
  {
    // Level 6: Intro to mixing — bell sneaks into drum's row
    id: 6, name: 'Pressure Rising', world: 2,
    cols: 4, rows: 3, bpm: 100,
    availableParts: ['hammer', 'wrench', 'spring'],
    targetPattern: [
      ['hammer',   null,   'wrench',  null  ],
      [null,     'wrench', null,    'hammer'],
      ['spring', null,   null,    'spring'],
    ],
  },
  {
    // Level 7: Each row has 2 different parts
    id: 7, name: 'Iron Horse', world: 2,
    cols: 6, rows: 3, bpm: 110,
    availableParts: ['hammer', 'wrench', 'spring'],
    targetPattern: [
      ['hammer',   null,    'spring', null,   'hammer',   null   ],
      [null,     'wrench',  null,     'hammer', null,     'wrench' ],
      ['spring', null,    null,     null,   'spring', null   ],
    ],
  },
  {
    // Level 8: Heavier mixing — same part in 3 different rows
    id: 8, name: 'Furnace', world: 2,
    cols: 8, rows: 3, bpm: 110,
    availableParts: ['hammer', 'wrench', 'spring'],
    targetPattern: [
      [null,    'hammer',   null,     'wrench',   null,   'hammer',   null,     'spring'],
      ['wrench',  null,     'spring', null,     'hammer', null,     'wrench',   null    ],
      [null,    'spring', null,     null,     null,   'spring', null,     'hammer'  ],
    ],
  },
  {
    // Level 9: 4 parts, but rows are mixed salad
    id: 9, name: 'Steam Roller', world: 2,
    cols: 8, rows: 4, bpm: 115,
    availableParts: ['hammer', 'wrench', 'spring', 'gear'],
    targetPattern: [
      ['hammer',   null,   'gear',   null,     'wrench',   null,   'hammer',  null    ],
      [null,     'wrench', null,     'spring', null,     'gear', null,    'wrench'  ],
      ['gear',   null,   null,     'hammer',   null,     null,   'gear',  null    ],
      [null,     null,   'spring', null,     'spring', null,   null,    'spring'],
    ],
  },
  {
    // Level 10: Full chaos — every row is a surprise
    id: 10, name: 'Full Steam', world: 2,
    cols: 8, rows: 4, bpm: 120,
    availableParts: ['hammer', 'wrench', 'spring', 'gear'],
    targetPattern: [
      ['wrench',   null,     'hammer',   null,   'gear',   null,     'hammer',   'wrench'  ],
      ['hammer',   null,     'gear',   null,   null,     'spring', null,     'gear'  ],
      [null,     'spring', null,     'wrench', null,     'hammer',   null,     null    ],
      ['gear',   null,     'spring', null,   'wrench',   null,     'spring', null    ],
    ],
  },
];

// ========================
// WORLD 3: CRYSTAL HARMONIC
// 5 parts, heavy cross-row mixing — listening is essential
// ========================
const WORLD_3 = [
  {
    // Level 11: Intro chime — mild mixing with new instrument
    id: 11, name: 'First Resonance', world: 3,
    cols: 6, rows: 3, bpm: 110,
    availableParts: ['hammer', 'wrench', 'spring', 'tuningfork'],
    targetPattern: [
      ['hammer',  null,   'tuningfork', null,   'wrench',  null   ],
      ['tuningfork', null,   null,    'hammer', null,    'spring'],
      [null,    'wrench', null,    null,   'tuningfork', null   ],
    ],
  },
  {
    // Level 12: 5 parts in 4 rows — some parts MUST share rows
    id: 12, name: 'Prism', world: 3,
    cols: 8, rows: 4, bpm: 120,
    availableParts: ['hammer', 'wrench', 'spring', 'gear', 'tuningfork'],
    targetPattern: [
      ['hammer',  null,    'tuningfork', null,   'gear',   null,   'hammer',   null    ],
      [null,    'wrench',  null,    'hammer', null,     'tuningfork',null,     'gear'  ],
      ['tuningfork', null,    'gear',  null,   null,     'wrench', null,     'spring'],
      [null,    'spring',null,    null,   'spring', null,   'wrench',   null    ],
    ],
  },
  {
    // Level 13: Diagonal-ish pattern — tricky visually
    id: 13, name: 'Resonance', world: 3,
    cols: 8, rows: 5, bpm: 125,
    availableParts: ['hammer', 'wrench', 'spring', 'gear', 'tuningfork'],
    targetPattern: [
      ['hammer',   null,     null,     'tuningfork', null,    null,     'wrench',  null    ],
      [null,     'tuningfork',  null,     null,    'gear',  null,     null,    'hammer'  ],
      [null,     null,     'wrench',   null,    null,    'spring', null,    null    ],
      ['gear',   null,     null,     'hammer',  null,    null,     'tuningfork', null    ],
      [null,     'spring', 'gear',   null,    'wrench',  null,     null,    'spring'],
    ],
  },
  {
    // Level 14: Dense — almost all cells filled, maximum confusion
    id: 14, name: 'Overdrive', world: 3,
    cols: 8, rows: 5, bpm: 130,
    availableParts: ['hammer', 'wrench', 'spring', 'gear', 'tuningfork'],
    targetPattern: [
      ['wrench',   'hammer',   null,     'gear',   'tuningfork', null,     'hammer',   'spring'],
      ['tuningfork',  null,     'spring', null,     'hammer',  'gear',   null,     'wrench'  ],
      [null,     'gear',   'hammer',   null,     null,    'wrench',   'tuningfork',  null    ],
      ['spring', null,     null,     'tuningfork',  'wrench',  null,     'spring', null    ],
      [null,     'wrench',   'gear',   null,     null,    'spring', null,     'gear'  ],
    ],
  },
  {
    // Level 15: FINAL — the Gearbox Symphony itself — beautiful chaos
    id: 15, name: 'Gearbox Symphony', world: 3,
    cols: 8, rows: 5, bpm: 140,
    availableParts: ['hammer', 'wrench', 'spring', 'gear', 'tuningfork'],
    targetPattern: [
      ['hammer',   'gear',   null,     'wrench',   'tuningfork', null,     'hammer',   'gear'  ],
      ['tuningfork',  null,     'hammer',   null,     'gear',  'spring', null,     'tuningfork' ],
      [null,     'wrench',   'gear',   'hammer',   null,    'tuningfork',  'wrench',   null    ],
      ['spring', null,     'tuningfork',  null,     'wrench',  null,     'gear',   'spring'],
      ['gear',   'spring', null,     'gear',   null,    'hammer',   'spring', 'wrench'  ],
    ],
  },
];

// ========================
// WORLD METADATA (for UI)
export const WORLDS = [
  { id: 1, name: 'The Brass Workshop', color: 0x8c5b35, icon: '⚙️', levels: [1, 5] },
  { id: 2, name: 'Steam Powered',      color: 0x6a9cc2, icon: '💨', levels: [6, 10] },
  { id: 3, name: 'Crystal Harmonic',   color: 0x5dbca2, icon: '💎', levels: [11, 15] },
];

const LEVELS = [
  ...WORLD_1,
  ...WORLD_2,
  ...WORLD_3,
];

export default LEVELS;
