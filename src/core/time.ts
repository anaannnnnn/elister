const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000; // Asia/Dubai: UTC+4, no DST
const DAY_MS = 24 * 60 * 60 * 1000;

export function dubaiDayRange(date: Date): { start: Date; end: Date } {
  const local = date.getTime() + DUBAI_OFFSET_MS;
  const startLocal = Math.floor(local / DAY_MS) * DAY_MS;
  const start = new Date(startLocal - DUBAI_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}
