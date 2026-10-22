// Independent of Qi Men calculations. Compass bearings: north=0°, clockwise.
// Later Heaven trigrams + Luo Shu palace numbers; no auspiciousness rules.
export const DIRECTIONS = Object.freeze([
  { id: 'N', name: '正北', trigram: '坎', symbol: '☵', palace: 1, element: '水', image: '水', bearing: 0, range: '337.5°–360° / 0°–22.5°' },
  { id: 'NE', name: '東北', trigram: '艮', symbol: '☶', palace: 8, element: '土', image: '山', bearing: 45, range: '22.5°–67.5°' },
  { id: 'E', name: '正東', trigram: '震', symbol: '☳', palace: 3, element: '木', image: '雷', bearing: 90, range: '67.5°–112.5°' },
  { id: 'SE', name: '東南', trigram: '巽', symbol: '☴', palace: 4, element: '木', image: '風', bearing: 135, range: '112.5°–157.5°' },
  { id: 'S', name: '正南', trigram: '離', symbol: '☲', palace: 9, element: '火', image: '火', bearing: 180, range: '157.5°–202.5°' },
  { id: 'SW', name: '西南', trigram: '坤', symbol: '☷', palace: 2, element: '土', image: '地', bearing: 225, range: '202.5°–247.5°' },
  { id: 'W', name: '正西', trigram: '兌', symbol: '☱', palace: 7, element: '金', image: '澤', bearing: 270, range: '247.5°–292.5°' },
  { id: 'NW', name: '西北', trigram: '乾', symbol: '☰', palace: 6, element: '金', image: '天', bearing: 315, range: '292.5°–337.5°' },
].map(Object.freeze));

export const CENTER = Object.freeze({ id: 'C', name: '中宮', palace: 5, element: '土', trigram: null });

export function normalizeBearing(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null;
  const angle = Number(value);
  if (!Number.isFinite(angle)) return null;
  const remainder = angle % 360;
  return remainder < 0 ? remainder + 360 : (remainder || 0);
}

export function directionForBearing(value) {
  const angle = normalizeBearing(value);
  if (angle === null) return null;
  // Lower bound included; upper bound excluded, including the north wrap.
  return DIRECTIONS[Math.floor((angle + 22.5) / 45) % 8];
}

export function palaceLayout(orientation = 'north') {
  const ids = orientation === 'south'
    ? ['SE', 'S', 'SW', 'E', 'C', 'W', 'NE', 'N', 'NW']
    : ['NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE'];
  return ids.map(id => id === 'C' ? CENTER : DIRECTIONS.find(d => d.id === id));
}
