import { useMemo, useState } from 'react';
import TodoItem from '@/components/TodoItem';
import { useTodoStore } from '@/store/todoStore';
import { useDebouncedValue } from '@/utils/useDebouncedValue';

interface TodoListProps {
  /** 无待办时，引导用户把焦点移到添加表单 */
  onAddFirst: () => void;
}

/**
 * 列表容器：按筛选条件与防抖后的关键词派生可见列表。
 * 派生数据不写回 Store（TECH.md 7.3）。
 */
const TodoList = ({ onAddFirst }: TodoListProps) => {
  const todos = useTodoStore((state) => state.todos);
  const filter = useTodoStore((state) => state.filter);
  const resetFilter = useTodoStore((state) => state.resetFilter);
  const clearCompleted = useTodoStore((state) => state.clearCompleted);

  const [confirmingCount, setConfirmingCount] = useState<number | null>(null);

  const debouncedKeyword = useDebouncedValue(filter.keyword.trim().toLowerCase(), 300);
  // 清空搜索时立即恢复列表，不必等待防抖计时器。
  const effectiveKeyword =
    filter.keyword.trim().length === 0 ? '' : debouncedKeyword;

  const visibleTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        if (filter.status === 'active') return !todo.completed;
        if (filter.status === 'completed') return todo.completed;
        return true;
      })
      .filter(
        (todo) => filter.priority === 'all' || todo.priority === filter.priority
      )
      .filter(
        (todo) => filter.category === 'all' || todo.category === filter.category
      )
      .filter((todo) => {
        if (!effectiveKeyword) return true;
        return (
          todo.title.toLowerCase().includes(effectiveKeyword) ||
          todo.description.toLowerCase().includes(effectiveKeyword)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [
    todos,
    filter.status,
    filter.priority,
    filter.category,
    effectiveKeyword,
  ]);

  // 分类建议用字符串键缓存，保证 todos 更新但分类集合不变时引用稳定，
  // 让 memo 化的 TodoItem 可以跳过无关列表项的渲染。
  const categoryKey = useMemo(
    () =>
      JSON.stringify(
        [...new Set(todos.map((todo) => todo.category))].sort((a, b) =>
          a.localeCompare(b, 'zh-CN')
        )
      ),
    [todos]
  );
  const categories = useMemo<string[]>(
    () => JSON.parse(categoryKey) as string[],
    [categoryKey]
  );

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos]
  );

  const hasActiveCondition =
    filter.status !== 'all' ||
    filter.priority !== 'all' ||
    filter.category !== 'all' ||
    filter.keyword.trim().length > 0;

  if (todos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
            <rect
              x="4.5"
              y="4"
              width="15"
              height="16"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M8.5 9.5h7M8.5 13h7M8.5 16.5h4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">还没有待办事项</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          从记录第一件小事开始，让今天更有条理。数据会自动保存在本机。
        </p>
        <button
          type="button"
          onClick={onAddFirst}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          添加第一条待办
        </button>
      </div>
    );
  }

  if (visibleTodos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="m15.5 15.5 3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">没有符合条件的待办</h2>
        <p className="mt-1 text-sm text-slate-500">
          试试换一个关键词，或清除当前筛选条件。
        </p>
        {hasActiveCondition ? (
          <button
            type="button"
            onClick={resetFilter}
            className="mt-4 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            清除筛选
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {visibleTodos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} categories={categories} />
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs text-slate-500">
          当前显示
          <span className="mx-1 font-semibold tabular-nums text-slate-800">
            {visibleTodos.length}
          </span>
          条 · 已完成
          <span className="mx-1 font-semibold tabular-nums text-slate-800">
            {completedCount}
          </span>
          条
        </p>

        {completedCount > 0 && confirmingCount === completedCount ? (
          <div
            role="group"
            aria-label="确认清除已完成待办"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-medium text-slate-700">
              确认删除 {completedCount} 条已完成的待办？
            </span>
            <button
              type="button"
              onClick={() => {
                clearCompleted();
                setConfirmingCount(null);
              }}
              className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1"
            >
              确认删除
            </button>
            <button
              type="button"
              onClick={() => setConfirmingCount(null)}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={completedCount === 0}
            onClick={() => setConfirmingCount(completedCount)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-red-200 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:shadow-none disabled:hover:border-slate-200"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
              <path
                d="M5 6h10M8 6V4.5h4V6M6.5 6l.5 9h6l.5-9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            清除已完成
          </button>
        )}
      </div>
    </div>
  );
};

export default TodoList;
