export const HOURS_PER_DAY = 7.5;

export function hoursToPersonDays(hours: number): number {
  return hours / HOURS_PER_DAY;
}

export function formatPersonDays(hours: number): string {
  const days = hoursToPersonDays(hours);
  return `${days.toFixed(2)}人日`;
}

export function formatHoursAndPersonDays(hours: number): string {
  const days = hoursToPersonDays(hours);
  return `${hours.toFixed(1)}h (${days.toFixed(2)}人日)`;
}