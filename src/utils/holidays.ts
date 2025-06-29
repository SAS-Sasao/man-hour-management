/**
 * 日本の祝日判定ユーティリティ
 */

// 固定祝日の定義
const FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: '元日' },
  { month: 2, day: 11, name: '建国記念の日' },
  { month: 2, day: 23, name: '天皇誕生日' },
  { month: 4, day: 29, name: '昭和の日' },
  { month: 5, day: 3, name: '憲法記念日' },
  { month: 5, day: 4, name: 'みどりの日' },
  { month: 5, day: 5, name: 'こどもの日' },
  { month: 8, day: 11, name: '山の日' },
  { month: 11, day: 3, name: '文化の日' },
  { month: 11, day: 23, name: '勤労感謝の日' },
];

// ハッピーマンデー祝日の定義
const HAPPY_MONDAY_HOLIDAYS = [
  { month: 1, week: 2, name: '成人の日' },
  { month: 7, week: 3, name: '海の日' },
  { month: 9, week: 3, name: '敬老の日' },
  { month: 10, week: 2, name: 'スポーツの日' },
];

/**
 * 春分の日を計算
 */
function getSpringEquinox(year: number): number {
  if (year >= 1851 && year <= 1899) {
    return Math.floor(19.8277 + 0.2422 * (year - 1851) - Math.floor((year - 1851) / 4));
  } else if (year >= 1900 && year <= 1979) {
    return Math.floor(21.124 + 0.2422 * (year - 1900) - Math.floor((year - 1900) / 4));
  } else if (year >= 1980 && year <= 2099) {
    return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  } else if (year >= 2100 && year <= 2150) {
    return Math.floor(21.8510 + 0.242194 * (year - 2100) - Math.floor((year - 2100) / 4));
  }
  return 20; // デフォルト値
}

/**
 * 秋分の日を計算
 */
function getAutumnEquinox(year: number): number {
  if (year >= 1851 && year <= 1899) {
    return Math.floor(22.7020 + 0.2422 * (year - 1851) - Math.floor((year - 1851) / 4));
  } else if (year >= 1900 && year <= 1979) {
    return Math.floor(23.2488 + 0.2422 * (year - 1900) - Math.floor((year - 1900) / 4));
  } else if (year >= 1980 && year <= 2099) {
    return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  } else if (year >= 2100 && year <= 2150) {
    return Math.floor(24.2488 + 0.242194 * (year - 2100) - Math.floor((year - 2100) / 4));
  }
  return 23; // デフォルト値
}

/**
 * 指定した月の第n月曜日の日付を取得
 */
function getNthMonday(year: number, month: number, nth: number): number {
  const firstDay = new Date(year, month - 1, 1);
  const firstMonday = 1 + ((8 - firstDay.getDay()) % 7);
  return firstMonday + (nth - 1) * 7;
}

/**
 * 振替休日かどうかを判定
 */
function isSubstituteHoliday(date: Date): boolean {
  // 月曜日でない場合は振替休日ではない
  if (date.getDay() !== 1) return false;

  // 前日（日曜日）が祝日かどうかをチェック
  const previousDay = new Date(date);
  previousDay.setDate(date.getDate() - 1);
  
  return isHoliday(previousDay);
}

/**
 * 国民の休日かどうかを判定（祝日に挟まれた平日）
 */
function isNationalHoliday(date: Date): boolean {
  // 祝日でない平日のみ対象
  if (date.getDay() === 0 || date.getDay() === 6 || isHoliday(date)) return false;

  const previousDay = new Date(date);
  previousDay.setDate(date.getDate() - 1);
  
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  return isHoliday(previousDay) && isHoliday(nextDay);
}

/**
 * 祝日かどうかを判定
 */
export function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 固定祝日をチェック
  for (const holiday of FIXED_HOLIDAYS) {
    if (holiday.month === month && holiday.day === day) {
      return true;
    }
  }

  // ハッピーマンデー祝日をチェック
  for (const holiday of HAPPY_MONDAY_HOLIDAYS) {
    if (holiday.month === month) {
      const holidayDate = getNthMonday(year, month, holiday.week);
      if (day === holidayDate) {
        return true;
      }
    }
  }

  // 春分の日
  if (month === 3 && day === getSpringEquinox(year)) {
    return true;
  }

  // 秋分の日
  if (month === 9 && day === getAutumnEquinox(year)) {
    return true;
  }

  return false;
}

/**
 * 祝日名を取得
 */
export function getHolidayName(date: Date): string | null {
  if (!isHoliday(date)) return null;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 固定祝日をチェック
  for (const holiday of FIXED_HOLIDAYS) {
    if (holiday.month === month && holiday.day === day) {
      return holiday.name;
    }
  }

  // ハッピーマンデー祝日をチェック
  for (const holiday of HAPPY_MONDAY_HOLIDAYS) {
    if (holiday.month === month) {
      const holidayDate = getNthMonday(year, month, holiday.week);
      if (day === holidayDate) {
        return holiday.name;
      }
    }
  }

  // 春分の日
  if (month === 3 && day === getSpringEquinox(year)) {
    return '春分の日';
  }

  // 秋分の日
  if (month === 9 && day === getAutumnEquinox(year)) {
    return '秋分の日';
  }

  // 振替休日
  if (isSubstituteHoliday(date)) {
    return '振替休日';
  }

  // 国民の休日
  if (isNationalHoliday(date)) {
    return '国民の休日';
  }

  return null;
}

/**
 * 営業日かどうかを判定（平日かつ祝日でない）
 */
export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  // 土日は営業日ではない
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  
  // 祝日は営業日ではない
  if (isHoliday(date)) return false;
  
  // 振替休日は営業日ではない
  if (isSubstituteHoliday(date)) return false;
  
  // 国民の休日は営業日ではない
  if (isNationalHoliday(date)) return false;
  
  return true;
}

/**
 * 指定月の営業日数を計算
 */
export function getBusinessDaysInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  let businessDays = 0;

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const currentDate = new Date(year, month - 1, day);
    if (isBusinessDay(currentDate)) {
      businessDays++;
    }
  }

  return businessDays;
}

/**
 * 指定期間の営業日数を計算
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let businessDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isBusinessDay(currentDate)) {
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return businessDays;
}
