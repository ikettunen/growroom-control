/**
 * Light cycle scheduler.
 *
 * Each room has a photoperiod (lightCycleHours: hours of light per day) and a
 * daily on-window start time (lightOnAt, local server time). This computes
 * whether the light should currently be ON, so the Pi receives an on/off window
 * instead of a raw intensity boolean.
 *
 *   lightCycleHours >= 24  -> always on
 *   lightCycleHours <= 0   -> always off
 *   otherwise              -> ON from lightOnAt for lightCycleHours (wraps midnight)
 */
export function isLightOn(cycleHours: number, onAt: string, now: Date = new Date()): boolean {
  const hours = Number(cycleHours);
  if (!Number.isFinite(hours)) return false;
  if (hours >= 24) return true;
  if (hours <= 0) return false;

  const [h, m, s] = String(onAt || '06:00:00')
    .split(':')
    .map((part) => parseInt(part, 10) || 0);

  const start = new Date(now);
  start.setHours(h, m, s, 0);

  let elapsedMs = now.getTime() - start.getTime();
  if (elapsedMs < 0) {
    // Start time is later today -> the window began yesterday evening
    elapsedMs += 24 * 60 * 60 * 1000;
  }

  return elapsedMs < hours * 60 * 60 * 1000;
}
