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
    id: 'farm', name: 'Farm', emoji: '🌾', color: '#33cc33',
    bgFrom: '#bbf7d0', bgTo: '#86efac', letters: 'A–Z',
    words: [
      { letter: 'A', word: 'Apple',    emoji: '🍎', audioWord: 'apple' },
      { letter: 'B', word: 'Bee',      emoji: '🐝', audioWord: 'bee' },
      { letter: 'C', word: 'Cat',      emoji: '🐱', audioWord: 'cat' },
      { letter: 'D', word: 'Dog',      emoji: '🐶', audioWord: 'dog' },
      { letter: 'E', word: 'Egg',      emoji: '🥚', audioWord: 'egg' },
      { letter: 'F', word: 'Frog',     emoji: '🐸', audioWord: 'frog' },
      { letter: 'G', word: 'Goat',     emoji: '🐐', audioWord: 'goat' },
      { letter: 'H', word: 'Hen',      emoji: '🐔', audioWord: 'hen' },
      { letter: 'I', word: 'Ice',      emoji: '🧊', audioWord: 'ice' },
      { letter: 'J', word: 'Jar',      emoji: '🫙', audioWord: 'jar' },
      { letter: 'K', word: 'Kite',     emoji: '🪁', audioWord: 'kite' },
      { letter: 'L', word: 'Lamb',     emoji: '🐑', audioWord: 'lamb' },
      { letter: 'M', word: 'Mango',    emoji: '🥭', audioWord: 'mango' },
      { letter: 'N', word: 'Nest',     emoji: '🪹', audioWord: 'nest' },
      { letter: 'O', word: 'Owl',      emoji: '🦉', audioWord: 'owl' },
      { letter: 'P', word: 'Pig',      emoji: '🐷', audioWord: 'pig' },
      { letter: 'Q', word: 'Queen',    emoji: '👑', audioWord: 'queen' },
      { letter: 'R', word: 'Rabbit',   emoji: '🐰', audioWord: 'rabbit' },
      { letter: 'S', word: 'Snail',    emoji: '🐌', audioWord: 'snail' },
      { letter: 'T', word: 'Tractor',  emoji: '🚜', audioWord: 'tractor' },
      { letter: 'U', word: 'Umbrella', emoji: '☂️', audioWord: 'umbrella' },
      { letter: 'V', word: 'Vine',     emoji: '🌿', audioWord: 'vine' },
      { letter: 'W', word: 'Wheat',    emoji: '🌾', audioWord: 'wheat' },
      { letter: 'X', word: 'X-Ray',    emoji: '🩻', audioWord: 'x-ray' },
      { letter: 'Y', word: 'Yak',      emoji: '🐃', audioWord: 'yak' },
      { letter: 'Z', word: 'Zebra',    emoji: '🦓', audioWord: 'zebra' },
      { letter: 'C', word: 'Cow',      emoji: '🐄', audioWord: 'cow' },
      { letter: 'D', word: 'Duck',     emoji: '🦆', audioWord: 'duck' },
      { letter: 'H', word: 'Horse',    emoji: '🐴', audioWord: 'horse' },
      { letter: 'M', word: 'Mouse',    emoji: '🐭', audioWord: 'mouse' },
      { letter: 'R', word: 'Rose',     emoji: '🌹', audioWord: 'rose' },
    ],
  },
  {
    id: 'city', name: 'City', emoji: '🏙️', color: '#3399ff',
    bgFrom: '#bfdbfe', bgTo: '#93c5fd', letters: 'A–Z',
    words: [
      { letter: 'B', word: 'Bus',        emoji: '🚌', audioWord: 'bus' },
      { letter: 'C', word: 'Car',        emoji: '🚗', audioWord: 'car' },
      { letter: 'D', word: 'Door',       emoji: '🚪', audioWord: 'door' },
      { letter: 'F', word: 'Fire Truck', emoji: '🚒', audioWord: 'fire truck' },
      { letter: 'G', word: 'Glasses',    emoji: '👓', audioWord: 'glasses' },
      { letter: 'H', word: 'House',      emoji: '🏠', audioWord: 'house' },
      { letter: 'J', word: 'Jacket',     emoji: '🧥', audioWord: 'jacket' },
      { letter: 'K', word: 'Key',        emoji: '🔑', audioWord: 'key' },
      { letter: 'L', word: 'Lamp',       emoji: '💡', audioWord: 'lamp' },
      { letter: 'M', word: 'Map',        emoji: '🗺️', audioWord: 'map' },
      { letter: 'O', word: 'Oven',       emoji: '🫕', audioWord: 'oven' },
      { letter: 'P', word: 'Phone',      emoji: '📱', audioWord: 'phone' },
      { letter: 'Q', word: 'Queen',      emoji: '👑', audioWord: 'queen' },
      { letter: 'R', word: 'Robot',      emoji: '🤖', audioWord: 'robot' },
      { letter: 'S', word: 'Sock',       emoji: '🧦', audioWord: 'sock' },
      { letter: 'T', word: 'Train',      emoji: '🚂', audioWord: 'train' },
      { letter: 'U', word: 'Umbrella',   emoji: '☂️', audioWord: 'umbrella' },
      { letter: 'V', word: 'Van',        emoji: '🚐', audioWord: 'van' },
      { letter: 'W', word: 'Window',     emoji: '🪟', audioWord: 'window' },
      { letter: 'X', word: 'X-ray',      emoji: '🩻', audioWord: 'x-ray' },
      { letter: 'Y', word: 'Yo-yo',      emoji: '🪀', audioWord: 'yo-yo' },
      { letter: 'Z', word: 'Zipper',     emoji: '🤐', audioWord: 'zipper' },
      { letter: 'B', word: 'Bag',        emoji: '👜', audioWord: 'bag' },
      { letter: 'C', word: 'Cap',        emoji: '🧢', audioWord: 'cap' },
      { letter: 'F', word: 'Fan',        emoji: '🌀', audioWord: 'fan' },
      { letter: 'G', word: 'Gate',       emoji: '🚧', audioWord: 'gate' },
      { letter: 'A', word: 'Ambulance',  emoji: '🚑', audioWord: 'ambulance' },
      { letter: 'E', word: 'Elevator',   emoji: '🛗', audioWord: 'elevator' },
      { letter: 'I', word: 'Ice Cream',  emoji: '🍦', audioWord: 'ice cream' },
      { letter: 'N', word: 'Newspaper',  emoji: '📰', audioWord: 'newspaper' },
    ],
  },
  {
    id: 'ocean', name: 'Ocean', emoji: '🌊', color: '#06b6d4',
    bgFrom: '#a5f3fc', bgTo: '#67e8f9', letters: 'A–Z',
    words: [
      { letter: 'A', word: 'Anchor',    emoji: '⚓', audioWord: 'anchor' },
      { letter: 'B', word: 'Boat',      emoji: '⛵', audioWord: 'boat' },
      { letter: 'C', word: 'Crab',      emoji: '🦀', audioWord: 'crab' },
      { letter: 'D', word: 'Dolphin',   emoji: '🐬', audioWord: 'dolphin' },
      { letter: 'F', word: 'Fish',      emoji: '🐟', audioWord: 'fish' },
      { letter: 'I', word: 'Island',    emoji: '🏝️', audioWord: 'island' },
      { letter: 'J', word: 'Jellyfish', emoji: '🪼', audioWord: 'jellyfish' },
      { letter: 'L', word: 'Lobster',   emoji: '🦞', audioWord: 'lobster' },
      { letter: 'N', word: 'Net',       emoji: '🥅', audioWord: 'net' },
      { letter: 'O', word: 'Octopus',   emoji: '🐙', audioWord: 'octopus' },
      { letter: 'R', word: 'Reef',      emoji: '🪸', audioWord: 'reef' },
      { letter: 'S', word: 'Shark',     emoji: '🦈', audioWord: 'shark' },
      { letter: 'T', word: 'Turtle',    emoji: '🐢', audioWord: 'turtle' },
      { letter: 'V', word: 'Volcano',   emoji: '🌋', audioWord: 'volcano' },
      { letter: 'W', word: 'Wave',      emoji: '🌊', audioWord: 'wave' },
      { letter: 'Y', word: 'Yacht',     emoji: '🛥️', audioWord: 'yacht' },
      { letter: 'S', word: 'Starfish',  emoji: '🌟', audioWord: 'starfish' },
      { letter: 'W', word: 'Whale',     emoji: '🐋', audioWord: 'whale' },
      { letter: 'S', word: 'Seal',      emoji: '🦭', audioWord: 'seal' },
      { letter: 'P', word: 'Pearl',     emoji: '🔮', audioWord: 'pearl' },
      { letter: 'K', word: 'Kelp',      emoji: '🌱', audioWord: 'kelp' },
      { letter: 'M', word: 'Mermaid',   emoji: '🧜', audioWord: 'mermaid' },
      { letter: 'E', word: 'Eel',       emoji: '🐟', audioWord: 'eel' },
      { letter: 'G', word: 'Seagull',   emoji: '🐦', audioWord: 'seagull' },
      { letter: 'H', word: 'Hat',       emoji: '🎩', audioWord: 'hat' },
      { letter: 'Q', word: 'Queen',     emoji: '👑', audioWord: 'queen' },
      { letter: 'U', word: 'Umbrella',  emoji: '⛱️', audioWord: 'umbrella' },
      { letter: 'X', word: 'X-ray Fish',emoji: '🐡', audioWord: 'x-ray fish' },
      { letter: 'Z', word: 'Zebra Fish',emoji: '🐠', audioWord: 'zebra fish' },
      { letter: 'P', word: 'Prawn',     emoji: '🍤', audioWord: 'prawn' },
    ],
  },
  {
    id: 'space', name: 'Space', emoji: '🚀', color: '#cc33ff',
    bgFrom: '#e9d5ff', bgTo: '#c4b5fd', letters: 'A–Z',
    words: [
      { letter: 'A', word: 'Asteroid',      emoji: '☄️', audioWord: 'asteroid' },
      { letter: 'B', word: 'Black Hole',    emoji: '🕳️', audioWord: 'black hole' },
      { letter: 'C', word: 'Comet',         emoji: '🌠', audioWord: 'comet' },
      { letter: 'E', word: 'Earth',         emoji: '🌍', audioWord: 'earth' },
      { letter: 'F', word: 'Flag',          emoji: '🚩', audioWord: 'flag' },
      { letter: 'G', word: 'Galaxy',        emoji: '🌌', audioWord: 'galaxy' },
      { letter: 'H', word: 'Helmet',        emoji: '🪖', audioWord: 'helmet' },
      { letter: 'J', word: 'Jupiter',       emoji: '🪐', audioWord: 'jupiter' },
      { letter: 'M', word: 'Moon',          emoji: '🌙', audioWord: 'moon' },
      { letter: 'N', word: 'Night',          emoji: '🌃', audioWord: 'night' },
      { letter: 'O', word: 'Owl',            emoji: '🦉', audioWord: 'owl' },
      { letter: 'P', word: 'Planet',        emoji: '🪐', audioWord: 'planet' },
      { letter: 'Q', word: 'Quiz',           emoji: '❓', audioWord: 'quiz' },
      { letter: 'R', word: 'Rocket',        emoji: '🚀', audioWord: 'rocket' },
      { letter: 'S', word: 'Star',          emoji: '⭐', audioWord: 'star' },
      { letter: 'T', word: 'Telescope',     emoji: '🔭', audioWord: 'telescope' },
      { letter: 'U', word: 'Universe',      emoji: '🌌', audioWord: 'universe' },
      { letter: 'V', word: 'Venus',         emoji: '🌟', audioWord: 'venus' },
      { letter: 'W', word: 'Wave',          emoji: '👋', audioWord: 'wave' },
      { letter: 'X', word: 'X-Ray',         emoji: '🩻', audioWord: 'x-ray' },
      { letter: 'Y', word: 'Year',          emoji: '📅', audioWord: 'year' },
      { letter: 'Z', word: 'Zero Gravity',  emoji: '🧑‍🚀', audioWord: 'zero gravity' },
      { letter: 'S', word: 'Sun',           emoji: '☀️', audioWord: 'sun' },
      { letter: 'M', word: 'Mars',          emoji: '🔴', audioWord: 'mars' },
      { letter: 'S', word: 'Saturn',        emoji: '🪐', audioWord: 'saturn' },
      { letter: 'A', word: 'Alien',         emoji: '👽', audioWord: 'alien' },
      { letter: 'D', word: 'Dust',          emoji: '💨', audioWord: 'dust' },
      { letter: 'I', word: 'Ice',           emoji: '🧊', audioWord: 'ice' },
      { letter: 'K', word: 'Kite',          emoji: '🪁', audioWord: 'kite' },
      { letter: 'L', word: 'Light',         emoji: '💡', audioWord: 'light' },
    ],
  },
  {
    id: 'home', name: 'Home', emoji: '🏠', color: '#ff6600',
    bgFrom: '#fed7aa', bgTo: '#fdba74', letters: 'A–Z',
    words: [
      { letter: 'A', word: 'Alarm',     emoji: '⏰', audioWord: 'alarm' },
      { letter: 'B', word: 'Bed',       emoji: '🛏️', audioWord: 'bed' },
      { letter: 'C', word: 'Chair',     emoji: '🪑', audioWord: 'chair' },
      { letter: 'D', word: 'Door',      emoji: '🚪', audioWord: 'door' },
      { letter: 'E', word: 'Envelope',  emoji: '✉️', audioWord: 'envelope' },
      { letter: 'F', word: 'Fork',      emoji: '🍴', audioWord: 'fork' },
      { letter: 'G', word: 'Glass',     emoji: '🥛', audioWord: 'glass' },
      { letter: 'H', word: 'Hat',       emoji: '🎩', audioWord: 'hat' },
      { letter: 'J', word: 'Jar',       emoji: '🫙', audioWord: 'jar' },
      { letter: 'K', word: 'Kettle',    emoji: '🫖', audioWord: 'kettle' },
      { letter: 'L', word: 'Light',     emoji: '💡', audioWord: 'light' },
      { letter: 'M', word: 'Mirror',    emoji: '🪞', audioWord: 'mirror' },
      { letter: 'N', word: 'Nightlight',emoji: '🕯️', audioWord: 'nightlight' },
      { letter: 'O', word: 'Oven',      emoji: '🫕', audioWord: 'oven' },
      { letter: 'P', word: 'Plate',     emoji: '🍽️', audioWord: 'plate' },
      { letter: 'Q', word: 'Quilt',     emoji: '🛏️', audioWord: 'quilt' },
      { letter: 'R', word: 'Radio',     emoji: '📻', audioWord: 'radio' },
      { letter: 'S', word: 'Shelf',     emoji: '📚', audioWord: 'shelf' },
      { letter: 'T', word: 'Toothbrush',emoji: '🪥', audioWord: 'toothbrush' },
      { letter: 'U', word: 'Umbrella',  emoji: '☂️', audioWord: 'umbrella' },
      { letter: 'V', word: 'Vase',      emoji: '🏺', audioWord: 'vase' },
      { letter: 'W', word: 'Wall',      emoji: '🧱', audioWord: 'wall' },
      { letter: 'X', word: 'Xbox',      emoji: '🎮', audioWord: 'xbox' },
      { letter: 'Y', word: 'Yarn',      emoji: '🧶', audioWord: 'yarn' },
      { letter: 'Z', word: 'Zipper',    emoji: '🤐', audioWord: 'zipper' },
      { letter: 'B', word: 'Bowl',      emoji: '🥣', audioWord: 'bowl' },
      { letter: 'C', word: 'Cup',       emoji: '☕', audioWord: 'cup' },
      { letter: 'F', word: 'Fan',       emoji: '🌀', audioWord: 'fan' },
      { letter: 'I', word: 'Ink',       emoji: '🖊️', audioWord: 'ink' },
      { letter: 'S', word: 'Soap',      emoji: '🧼', audioWord: 'soap' },
    ],
  },
  {
    id: 'carnival', name: 'Carnival', emoji: '🎪', color: '#ff3333',
    bgFrom: '#fbcfe8', bgTo: '#f9a8d4', letters: 'A–Z',
    words: [
      { letter: 'A', word: 'Acrobat',      emoji: '🤸', audioWord: 'acrobat' },
      { letter: 'B', word: 'Balloon',      emoji: '🎈', audioWord: 'balloon' },
      { letter: 'C', word: 'Candy',        emoji: '🍬', audioWord: 'candy' },
      { letter: 'D', word: 'Drum',         emoji: '🥁', audioWord: 'drum' },
      { letter: 'E', word: 'Elephant',     emoji: '🐘', audioWord: 'elephant' },
      { letter: 'F', word: 'Ferris Wheel', emoji: '🎡', audioWord: 'ferris wheel' },
      { letter: 'G', word: 'Games',        emoji: '🎮', audioWord: 'games' },
      { letter: 'H', word: 'Horn',         emoji: '📯', audioWord: 'horn' },
      { letter: 'I', word: 'Ice Cream',    emoji: '🍦', audioWord: 'ice cream' },
      { letter: 'J', word: 'Juggler',      emoji: '🤹', audioWord: 'juggler' },
      { letter: 'K', word: 'Kite',         emoji: '🪁', audioWord: 'kite' },
      { letter: 'L', word: 'Lollipop',     emoji: '🍭', audioWord: 'lollipop' },
      { letter: 'M', word: 'Magician',     emoji: '🧙', audioWord: 'magician' },
      { letter: 'N', word: 'Noodles',      emoji: '🍜', audioWord: 'noodles' },
      { letter: 'O', word: 'Orange',       emoji: '🍊', audioWord: 'orange' },
      { letter: 'P', word: 'Popcorn',      emoji: '🍿', audioWord: 'popcorn' },
      { letter: 'Q', word: 'Queen',        emoji: '👑', audioWord: 'queen' },
      { letter: 'R', word: 'Ribbon',       emoji: '🎀', audioWord: 'ribbon' },
      { letter: 'S', word: 'Swing',        emoji: '🛝', audioWord: 'swing' },
      { letter: 'T', word: 'Ticket',       emoji: '🎟️', audioWord: 'ticket' },
      { letter: 'U', word: 'Unicorn',      emoji: '🦄', audioWord: 'unicorn' },
      { letter: 'V', word: 'Violin',       emoji: '🎻', audioWord: 'violin' },
      { letter: 'W', word: 'Wand',         emoji: '🪄', audioWord: 'wand' },
      { letter: 'X', word: 'X-mas Tree',   emoji: '🎄', audioWord: 'christmas tree' },
      { letter: 'Y', word: 'Yoyo',         emoji: '🪀', audioWord: 'yoyo' },
      { letter: 'Z', word: 'Zebra',        emoji: '🦓', audioWord: 'zebra' },
      { letter: 'C', word: 'Clown',        emoji: '🤡', audioWord: 'clown' },
      { letter: 'M', word: 'Mask',         emoji: '🎭', audioWord: 'mask' },
      { letter: 'P', word: 'Puppet',       emoji: '🎎', audioWord: 'puppet' },
      { letter: 'S', word: 'Star',         emoji: '⭐', audioWord: 'star' },
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
