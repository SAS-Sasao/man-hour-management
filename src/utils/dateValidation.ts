export function isValidWorkDate(date: Date): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // 今日の終わりまで許可
  return date <= today;
}

export function getMaxDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function validateDateInput(dateString: string): { isValid: boolean; error?: string } {
  if (!dateString) {
    return { isValid: false, error: '日付を入力してください' };
  }

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: '有効な日付を入力してください' };
  }

  if (!isValidWorkDate(date)) {
    return { isValid: false, error: '未来の日付は入力できません' };
  }

  return { isValid: true };
}