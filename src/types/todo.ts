/**
 * 全项目类型定义的唯一事实来源（TECH.md 第 5 节、AGENTS.md 第 4 节）。
 * 组件与工具层不得另行定义 Todo 相关结构。
 */

/** 优先级：低、中、高 */
export type Priority = 'low' | 'medium' | 'high';

/** 待办事项实体 */
export interface Todo {
  /** 唯一标识，crypto.randomUUID() 生成 */
  id: string;
  /** 标题，必填，去除首尾空格后非空 */
  title: string;
  /** 描述，可选，默认空字符串 */
  description: string;
  /** 分类，可选，默认 '未分类'（仅空格视为未填写） */
  category: string;
  /** 优先级，默认 'medium' */
  priority: Priority;
  /** 截止日期，可选，ISO 8601 字符串（yyyy-MM-dd） */
  dueDate?: string;
  /** 是否完成，默认 false */
  completed: boolean;
  /** 创建时间，ISO 8601 字符串，系统生成 */
  createdAt: string;
}

/** 状态筛选 */
export type FilterStatus = 'all' | 'active' | 'completed';

/** 筛选条件集合（仅会话级，不持久化） */
export interface TodoFilterState {
  status: FilterStatus;
  priority: Priority | 'all';
  category: string | 'all';
  /** 搜索关键词，空字符串表示不搜索 */
  keyword: string;
}

/** 创建待办的输入（id 与 createdAt 由系统生成，completed 固定为 false） */
export type TodoInput = Omit<Todo, 'id' | 'createdAt' | 'completed'>;

/** 可编辑字段 */
export type TodoUpdate = Partial<
  Pick<Todo, 'title' | 'description' | 'category' | 'priority' | 'dueDate'>
>;

/** 添加与编辑表单共用的草稿模型（dueDate 为 input[type=date] 的 yyyy-MM-dd） */
export type TodoDraft = Pick<
  Todo,
  'title' | 'description' | 'category' | 'priority'
> & {
  dueDate: string;
};

/** 草稿字段名 */
export type TodoField = keyof TodoDraft;

/** 字段级校验错误 */
export type TodoDraftErrors = Partial<Record<TodoField, string>>;
