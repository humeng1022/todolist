import type { Priority } from '@/types/todo';

/**
 * 优先级展示元数据。
 * Tailwind 类名必须保持完整字符串，禁止动态拼接（AGENTS.md 6.3）。
 */
export const PRIORITY_META = {
  low: {
    label: '低',
    badgeClass: 'bg-slate-100 text-slate-600 ring-slate-200',
    dotClass: 'bg-priority-low',
    barClass:
      '[&::-webkit-progress-value]:bg-priority-low [&::-moz-progress-bar]:bg-priority-low',
  },
  medium: {
    label: '中',
    badgeClass: 'bg-amber-50 text-amber-700 ring-amber-200',
    dotClass: 'bg-priority-medium',
    barClass:
      '[&::-webkit-progress-value]:bg-priority-medium [&::-moz-progress-bar]:bg-priority-medium',
  },
  high: {
    label: '高',
    badgeClass: 'bg-red-50 text-red-700 ring-red-200',
    dotClass: 'bg-priority-high',
    barClass:
      '[&::-webkit-progress-value]:bg-priority-high [&::-moz-progress-bar]:bg-priority-high',
  },
} as const satisfies Record<Priority, unknown>;

/** 表单与筛选的优先级顺序 */
export const PRIORITY_ORDER: readonly Priority[] = ['low', 'medium', 'high'];

/** 统计面板的优先级顺序（高 → 低） */
export const PRIORITY_STATS_ORDER: readonly Priority[] = ['high', 'medium', 'low'];

/** 收紧下拉框回传的字符串类型，避免在组件中做裸类型断言 */
export function isPriorityFilterValue(value: string): value is Priority | 'all' {
  return value === 'all' || value === 'low' || value === 'medium' || value === 'high';
}
