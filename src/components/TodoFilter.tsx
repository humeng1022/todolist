import { useEffect, useMemo } from 'react';
import { useTodoStore } from '@/store/todoStore';
import type { FilterStatus } from '@/types/todo';
import { PRIORITY_META, PRIORITY_ORDER, isPriorityFilterValue } from '@/utils/priority';

const STATUS_OPTIONS: ReadonlyArray<{ value: FilterStatus; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '未完成' },
  { value: 'completed', label: '已完成' },
];

const selectClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

const TodoFilter = () => {
  const filter = useTodoStore((state) => state.filter);
  const todos = useTodoStore((state) => state.todos);
  const setFilter = useTodoStore((state) => state.setFilter);
  const resetFilter = useTodoStore((state) => state.resetFilter);

  const { counts, categories, categoryCounts } = useMemo(() => {
    const nextCounts: Record<FilterStatus, number> = {
      all: todos.length,
      active: 0,
      completed: 0,
    };
    const nextCategoryCounts = new Map<string, number>();

    for (const todo of todos) {
      if (todo.completed) {
        nextCounts.completed += 1;
      } else {
        nextCounts.active += 1;
      }
      nextCategoryCounts.set(
        todo.category,
        (nextCategoryCounts.get(todo.category) ?? 0) + 1
      );
    }

    return {
      counts: nextCounts,
      categories: [...nextCategoryCounts.keys()].sort((a, b) =>
        a.localeCompare(b, 'zh-CN')
      ),
      categoryCounts: nextCategoryCounts,
    };
  }, [todos]);

  // 分类下已无待办时自动回到「全部」（PRD 4.2）。
  const activeCategory = filter.category;
  useEffect(() => {
    if (activeCategory !== 'all' && !categoryCounts.has(activeCategory)) {
      setFilter({ category: 'all' });
    }
  }, [activeCategory, categoryCounts, setFilter]);

  const hasActiveFilter =
    filter.status !== 'all' ||
    filter.priority !== 'all' ||
    filter.category !== 'all' ||
    filter.keyword.trim().length > 0;

  const handlePriorityChange = (value: string) => {
    if (isPriorityFilterValue(value)) {
      setFilter({ priority: value });
    }
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div
        role="group"
        aria-label="按完成状态筛选"
        className="inline-flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto"
      >
        {STATUS_OPTIONS.map((option) => {
          const isActive = filter.status === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilter({ status: option.value })}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:flex-none ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {option.label}
              <span
                className={`ml-1 tabular-nums ${
                  isActive ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                {counts[option.value]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 sm:flex sm:flex-none sm:items-end">
        <div className="sm:w-32">
          <label
            htmlFor="filter-priority"
            className="mb-1 block text-[11px] font-medium text-slate-500"
          >
            优先级
          </label>
          <select
            id="filter-priority"
            value={filter.priority}
            onChange={(event) => handlePriorityChange(event.target.value)}
            className={selectClass}
          >
            <option value="all">全部</option>
            {PRIORITY_ORDER.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_META[priority].label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:w-40">
          <label
            htmlFor="filter-category"
            className="mb-1 block text-[11px] font-medium text-slate-500"
          >
            分类
          </label>
          <select
            id="filter-category"
            value={filter.category}
            onChange={(event) => setFilter({ category: event.target.value })}
            className={selectClass}
          >
            <option value="all">全部</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={resetFilter}
          disabled={!hasActiveFilter}
          className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-1 sm:w-auto"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
            <path
              d="M4 5h12M6.5 10h7M9 15h2"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
          清除筛选
        </button>
      </div>
    </div>
  );
};

export default TodoFilter;
