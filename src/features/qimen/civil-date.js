// 台灣民用日期的選擇與導覽。UTC 僅作日曆運算載體，不轉換輸入時區。
export const MIN_YEAR = 1901;
export const MAX_YEAR = 2100;

export function daysInMonth(year, month) {
  return new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
}

export function clampCivilDay(value) {
  return {
    ...value,
    day: String(Math.min(Number(value.day), daysInMonth(value.year, value.month))).padStart(2, '0'),
  };
}

export function shiftCivilDate(value, unit, amount) {
  const date = new Date(Date.UTC(Number(value.year), Number(value.month) - 1,
    Number(value.day), Number(value.hour), Number(value.minute)));
  if (unit === 'month' || unit === 'year') {
    // 先移至一日，避免 1/31 + 一月溢位成 3/3，或閏日 + 一年變成 3/1。
    date.setUTCDate(1);
    if (unit === 'month') date.setUTCMonth(date.getUTCMonth() + amount);
    else date.setUTCFullYear(date.getUTCFullYear() + amount);
    date.setUTCDate(Math.min(Number(value.day), daysInMonth(date.getUTCFullYear(), date.getUTCMonth() + 1)));
  } else if (unit === 'day') date.setUTCDate(date.getUTCDate() + amount);
  else if (unit === 'hour') date.setUTCHours(date.getUTCHours() + amount);
  else throw new RangeError(`Unknown calendar unit: ${unit}`);

  const year = date.getUTCFullYear();
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  return {
    year: String(year),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
    day: String(date.getUTCDate()).padStart(2, '0'),
    hour: String(date.getUTCHours()).padStart(2, '0'),
    minute: String(date.getUTCMinutes()).padStart(2, '0'),
  };
}

export function taipeiNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
}
