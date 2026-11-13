import type { Todo, TodoDraft, TodoDraftErrors, TodoField, TodoInput } from '@/types/todo';
import { isValidDueDate, toDateInputValue } from './date';

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const CATEGORY_MAX_LENGTH = 20;
export const UNCATEGORIZED = '未分类';

/** 按 Unicode 字符计数，避免 emoji 等被算作两个字符 */
const countCharacters = (value: string): number => Array.from(value).length;

/** 空白分类归一化为 '未分类'（PRD 第 8 节） */
export function normalizeCategory(category: string): string {
  const trimmed = category.trim();
  return trimmed.length > 0 ? trimmed : UNCATEGORIZED;
}

/** 对照 PRD F1 / TECH 8.2 的全部校验规则 */
export function validateTodoDraft(draft: TodoDraft): TodoDraftErrors {
  const errors: TodoDraftErrors = {};

  const title = draft.title.trim();
  if (title.length === 0) {
    errors.title = '请输入待办标题';
  } else if (countCharacters(title) > TITLE_MAX_LENGTH) {
    errors.title = `标题不能超过 ${TITLE_MAX_LENGTH} 个字符`;
  }

  if (countCharacters(draft.description) > DESCRIPTION_MAX_LENGTH) {
    errors.description = `描述不能超过 ${DESCRIPTION_MAX_LENGTH} 个字符`;
  }

  const category = draft.category.trim();
  if (countCharacters(category) > CATEGORY_MAX_LENGTH) {
    errors.category = `分类名不能超过 ${CATEGORY_MAX_LENGTH} 个字符`;
  }

  const dueDate = draft.dueDate.trim();
  if (dueDate.length > 0 && !isValidDueDate(dueDate)) {
    errors.dueDate = '请选择有效日期';
  }

  return errors;
}

/** 错误字段的聚焦顺序，保证聚焦到第一个出错项 */
const FIELD_ORDER: readonly TodoField[] = ['title', 'description', 'category', 'dueDate'];

export function firstInvalidField(errors: TodoDraftErrors): TodoField | null {
  return FIELD_ORDER.find((field) => errors[field] !== undefined) ?? null;
}

/** 将合法草稿归一化为 Store 输入 */
export function toTodoInput(draft: TodoDraft): TodoInput {
  const dueDate = draft.dueDate.trim();
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: normalizeCategory(draft.category),
    priority: draft.priority,
    // 显式写入 undefined，编辑时清空截止日期才能覆盖旧值。
    dueDate: dueDate.length > 0 ? dueDate : undefined,
  };
}

/** 用已保存的待办回填编辑草稿 */
export function toTodoDraft(todo: Todo): TodoDraft {
  return {
    title: todo.title,
    description: todo.description,
    category: todo.category === UNCATEGORIZED ? '' : todo.category,
    priority: todo.priority,
    dueDate: toDateInputValue(todo.dueDate),
  };
}
