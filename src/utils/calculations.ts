import { getBusinessDaysInMonth } from './holidays';

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

/**
 * 営業日数から人月を計算
 */
export function businessDaysToPersonMonths(businessDays: number): number {
  return businessDays / 20; // 1人月 = 20営業日として計算
}

/**
 * 工数から人月を計算（営業日ベース）
 */
export function hoursToPersonMonths(hours: number): number {
  const personDays = hoursToPersonDays(hours);
  return personDays / 20; // 1人月 = 20営業日として計算
}

/**
 * 指定月の営業日数から想定工数を計算
 */
export function getExpectedHoursForMonth(year: number, month: number): number {
  const businessDays = getBusinessDaysInMonth(year, month);
  return businessDays * HOURS_PER_DAY;
}

/**
 * 指定月の営業日数から人月を計算
 */
export function getPersonMonthsForMonth(year: number, month: number): number {
  const businessDays = getBusinessDaysInMonth(year, month);
  return businessDaysToPersonMonths(businessDays);
}

/**
 * 人月を表示用にフォーマット
 */
export function formatPersonMonths(personMonths: number): string {
  return `${personMonths.toFixed(2)}人月`;
}

/**
 * 工数と人月を表示用にフォーマット
 */
export function formatHoursAndPersonMonths(hours: number): string {
  const personMonths = hoursToPersonMonths(hours);
  return `${hours.toFixed(1)}h (${personMonths.toFixed(2)}人月)`;
}

/**
 * 営業日数と人月を表示用にフォーマット
 */
export function formatBusinessDaysAndPersonMonths(businessDays: number): string {
  const personMonths = businessDaysToPersonMonths(businessDays);
  return `${businessDays}営業日 (${personMonths.toFixed(2)}人月)`;
}

/**
 * 進捗率を計算（実績工数 / 営業日ベース想定工数）
 */
export function calculateMonthlyProgress(actualHours: number, year: number, month: number): number {
  const expectedHours = getExpectedHoursForMonth(year, month);
  if (expectedHours === 0) return 0;
  return (actualHours / expectedHours) * 100;
}
