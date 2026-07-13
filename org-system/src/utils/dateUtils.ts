import dayjs from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';

dayjs.extend(isBetweenPlugin);

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatTime(date: string | Date): string {
  return dayjs(date).format('HH:mm:ss');
}

export function getNow(): string {
  return dayjs().toISOString();
}

export function getNowFormatted(): string {
  return formatDateTime(new Date());
}

export function addDays(date: string | Date, days: number): string {
  return dayjs(date).add(days, 'day').toISOString();
}

export function addHours(date: string | Date, hours: number): string {
  return dayjs(date).add(hours, 'hour').toISOString();
}

export function addMinutes(date: string | Date, minutes: number): string {
  return dayjs(date).add(minutes, 'minute').toISOString();
}

export function daysAgo(days: number): string {
  return dayjs().subtract(days, 'day').toISOString();
}

export function hoursAgo(hours: number): string {
  return dayjs().subtract(hours, 'hour').toISOString();
}

export function minutesAgo(minutes: number): string {
  return dayjs().subtract(minutes, 'minute').toISOString();
}

export function isBetween(date: string | Date, start: string | Date, end: string | Date): boolean {
  return dayjs(date).isBetween(start, end, null, '[]');
}

export function relativeTime(date: string | Date): string {
  const now = dayjs();
  const target = dayjs(date);
  const diffDays = now.diff(target, 'day');

  if (diffDays === 0) {
    const diffHours = now.diff(target, 'hour');
    if (diffHours === 0) {
      const diffMinutes = now.diff(target, 'minute');
      if (diffMinutes === 0) {
        return '刚刚';
      }
      return `${diffMinutes}分钟前`;
    }
    return `${diffHours}小时前`;
  }
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  return formatDate(date);
}
