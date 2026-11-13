import { differenceInCalendarDays, format, isValid, parse, parseISO, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/** 将 ISO 日期格式化为列表展示文本 */
export function formatDueDate(iso?: string): string {
  if (!iso) return '';
  const date = parseISO(iso);
  return isValid(date) ? format(date, 'yyyy-MM-dd') : '无效日期';
}

/**
 * 逾期判断：截止日期早于今天才算逾期，今天不算。
 * 使用日历日差，避免时分秒干扰。
 */
export function isOverdue(iso?: string): boolean {
  if (!iso) return false;
  const due = parseISO(iso);
  if (!isValid(due)) return false;
  return differenceInCalendarDays(startOfDay(due), startOfDay(new Date())) < 0;
}

/**
 * 校验 yyyy-MM-dd 输入是否为真实日期。
 * 2026-02-30 这类溢出日期会被 date-fns 解析校验拒绝。
 */
export function isValidDueDate(value: string): boolean {
  if (!value) return false;
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value;
}

/** 将存储的 ISO 日期转换为 input[type=date] 可用的值 */
export function toDateInputValue(iso?: string): string {
  if (!iso) return '';
  const date = parseISO(iso);
  return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
}

/** 顶部栏的本地日期文案 */
export function formatTodayLabel(): string {
  return format(new Date(), 'M月d日 EEEE', { locale: zhCN });
}
