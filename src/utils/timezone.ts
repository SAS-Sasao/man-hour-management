/**
 * 日本時間（JST）対応のユーティリティ関数
 */

/**
 * 現在の日本時間を取得
 * @returns 日本時間のDateオブジェクト
 */
export function getJSTNow(): Date {
  const now = new Date();
  // UTC時間に9時間を加算して日本時間にする
  return new Date(now.getTime() + (9 * 60 * 60 * 1000));
}

/**
 * 指定された日付を日本時間として解釈
 * @param dateString 日付文字列（YYYY-MM-DD形式など）
 * @returns 日本時間として解釈されたDateオブジェクト
 */
export function parseJSTDate(dateString: string): Date {
  // 日付のみの場合（YYYY-MM-DD形式）
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // 日本時間の00:00:00として解釈
    const [year, month, day] = dateString.split('-').map(Number);
    // 月は0ベースなので-1
    const jstDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    return jstDate;
  }
  
  // その他の形式の場合は通常の解析
  return new Date(dateString);
}

/**
 * 日本時間でのタイムスタンプを生成
 * @returns 日本時間のタイムスタンプ（createdAt, updatedAt用）
 */
export function createJSTTimestamp(): Date {
  const now = new Date();
  // UTC時間に9時間を加算して日本時間にする
  return new Date(now.getTime() + (9 * 60 * 60 * 1000));
}

/**
 * 日付を日本時間の文字列に変換
 * @param date Dateオブジェクト
 * @param format フォーマット（'date' | 'datetime' | 'time'）
 * @returns フォーマットされた日本時間の文字列
 */
export function formatJSTDate(date: Date, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
  switch (format) {
    case 'date':
      // YYYY-MM-DD形式で返す
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    case 'time':
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Tokyo'
      });
    case 'datetime':
    default:
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Tokyo'
      });
  }
}

/**
 * 日本時間での日付比較
 * @param date1 比較対象の日付1
 * @param date2 比較対象の日付2
 * @returns date1がdate2より新しい場合true
 */
export function isJSTDateAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}

/**
 * 日本時間での日付の開始時刻（00:00:00）を取得
 * @param date 対象の日付
 * @returns 日本時間での日付の開始時刻
 */
export function getJSTDateStart(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * 日本時間での日付の終了時刻（23:59:59.999）を取得
 * @param date 対象の日付
 * @returns 日本時間での日付の終了時刻
 */
export function getJSTDateEnd(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}
