export const PUBLISH_TIME_ZONE = 'Africa/Harare';

type WallTime = { year: number; month: number; day: number; hour: number; minute: number };

function parseWallTime(value: string): WallTime | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const fields = [yearText, monthText, dayText, hourText, minuteText].map(Number);
  const [year, month, day, hour, minute] = fields;
  const normalized = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() + 1 !== month ||
    normalized.getUTCDate() !== day ||
    normalized.getUTCHours() !== hour ||
    normalized.getUTCMinutes() !== minute
  )
    return null;
  return { year, month, day, hour, minute };
}

function wallParts(date: Date): WallTime {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PUBLISH_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(value.year),
    month: Number(value.month),
    day: Number(value.day),
    hour: Number(value.hour),
    minute: Number(value.minute),
  };
}

function sameWallTime(a: WallTime, b: WallTime) {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  );
}

/** Treats the datetime-local value as a Zimbabwe wall clock and resolves it to UTC. */
export function harareLocalToUtc(value: string): Date | null {
  const desired = parseWallTime(value);
  if (!desired) return null;
  const desiredAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  let candidate = desiredAsUtc;
  for (let attempt = 0; attempt < 4; attempt++) {
    const observed = wallParts(new Date(candidate));
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
    );
    const correction = desiredAsUtc - observedAsUtc;
    candidate += correction;
    if (correction === 0) break;
  }
  const result = new Date(candidate);
  return sameWallTime(wallParts(result), desired) ? result : null;
}

export function utcToHarareLocal(date: Date): string {
  const parts = wallParts(date);
  return `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}T${parts.hour.toString().padStart(2, '0')}:${parts.minute.toString().padStart(2, '0')}`;
}

export function formatHarareDateTime(date: Date): string {
  return `${new Intl.DateTimeFormat('en-ZW', {
    timeZone: PUBLISH_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(date)} Africa/Harare`;
}
