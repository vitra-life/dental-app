// Sample data is dated relative to the moment the app loads, so "today",
// "this week" and "last month" views always have something to show.

const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` for today plus `days` (negative for the past). */
export function dateOffset(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString().split('T')[0];
}

/** ISO timestamp for now plus `days`. */
export function timestampOffset(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}
