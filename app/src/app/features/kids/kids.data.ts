// app/src/app/features/kids/kids.data.ts

export interface KidsWord {
  letter: string;
  word: string;
  emoji: string;
  audioWord: string;
}

export interface KidsLocation {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgFrom: string;
  bgTo: string;
  letters: string;
  words: KidsWord[];
}

export const KIDS_LOCATIONS: KidsLocation[] = [
  {
    id: 'farm', name: 'Farm', emoji: '🌾', color: '#22c55e',
    bgFrom: '#bbf7d0', bgTo: '#86efac', letters: 'A–E',
    words: [
      { letter: 'A', word: 'Apple',    emoji: '🍎', audioWord: 'apple' },
      { letter: 'B', word: 'Bee',      emoji: '🐝', audioWord: 'bee' },
      { letter: 'C', word: 'Cat',      emoji: '🐱', audioWord: 'cat' },
      { letter: 'D', word: 'Dog',      emoji: '🐶', audioWord: 'dog' },
      { letter: 'E', word: 'Egg',      emoji: '🥚', audioWord: 'egg' },
    ],
  },
  {
    id: 'city', name: 'City', emoji: '🏙️', color: '#3b82f6',
    bgFrom: '#bfdbfe', bgTo: '#93c5fd', letters: 'F–J',
    words: [
      { letter: 'F', word: 'Fish',  emoji: '🐟', audioWord: 'fish' },
      { letter: 'G', word: 'Gate',  emoji: '🚪', audioWord: 'gate' },
      { letter: 'H', word: 'Hat',   emoji: '🎩', audioWord: 'hat' },
      { letter: 'I', word: 'Ice',   emoji: '🧊', audioWord: 'ice' },
      { letter: 'J', word: 'Jar',   emoji: '🫙', audioWord: 'jar' },
    ],
  },
  {
    id: 'ocean', name: 'Ocean', emoji: '🌊', color: '#06b6d4',
    bgFrom: '#a5f3fc', bgTo: '#67e8f9', letters: 'K–O',
    words: [
      { letter: 'K', word: 'Kite',    emoji: '🪁', audioWord: 'kite' },
      { letter: 'L', word: 'Lion',    emoji: '🦁', audioWord: 'lion' },
      { letter: 'M', word: 'Moon',    emoji: '🌙', audioWord: 'moon' },
      { letter: 'N', word: 'Net',     emoji: '🕸️', audioWord: 'net' },
      { letter: 'O', word: 'Octopus', emoji: '🐙', audioWord: 'octopus' },
    ],
  },
  {
    id: 'space', name: 'Space', emoji: '🚀', color: '#a855f7',
    bgFrom: '#e9d5ff', bgTo: '#c4b5fd', letters: 'P–T',
    words: [
      { letter: 'P', word: 'Planet', emoji: '🪐', audioWord: 'planet' },
      { letter: 'Q', word: 'Queen',  emoji: '👑', audioWord: 'queen' },
      { letter: 'R', word: 'Rocket', emoji: '🚀', audioWord: 'rocket' },
      { letter: 'S', word: 'Star',   emoji: '⭐', audioWord: 'star' },
      { letter: 'T', word: 'Tree',   emoji: '🌳', audioWord: 'tree' },
    ],
  },
  {
    id: 'home', name: 'Home', emoji: '🏠', color: '#f97316',
    bgFrom: '#fed7aa', bgTo: '#fdba74', letters: 'U–X',
    words: [
      { letter: 'U', word: 'Umbrella', emoji: '☂️', audioWord: 'umbrella' },
      { letter: 'V', word: 'Van',      emoji: '🚐', audioWord: 'van' },
      { letter: 'W', word: 'Window',   emoji: '🪟', audioWord: 'window' },
      { letter: 'X', word: 'X-ray',    emoji: '🩻', audioWord: 'x-ray' },
    ],
  },
  {
    id: 'carnival', name: 'Carnival', emoji: '🎪', color: '#ec4899',
    bgFrom: '#fbcfe8', bgTo: '#f9a8d4', letters: 'Y–Z',
    words: [
      { letter: 'Y', word: 'Yo-yo',  emoji: '🪀', audioWord: 'yo-yo' },
      { letter: 'Z', word: 'Zebra',  emoji: '🦓', audioWord: 'zebra' },
      { letter: 'A', word: 'Apple',  emoji: '🍎', audioWord: 'apple' },
      { letter: 'D', word: 'Dog',    emoji: '🐶', audioWord: 'dog' },
      { letter: 'S', word: 'Star',   emoji: '⭐', audioWord: 'star' },
    ],
  },
];

export interface KidsProgress {
  completedLocations: string[];
  locationStars: Record<string, number>;
  xp: number;
  level: number;
}

export function loadKidsProgress(): KidsProgress {
  try {
    const raw = localStorage.getItem('kids-progress');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { completedLocations: [], locationStars: {}, xp: 0, level: 1 };
}

export function saveKidsProgress(p: KidsProgress): void {
  localStorage.setItem('kids-progress', JSON.stringify(p));
}
