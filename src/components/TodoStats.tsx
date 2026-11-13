import { useMemo, useState } from 'react';
import { useTodoStore } from '@/store/todoStore';
import type { Priority } from '@/types/todo';
import { isOverdue } from '@/utils/date';
import { PRIORITY_META, PRIORITY_STATS_ORDER } from '@/utils/priority';

const barClass =
  'mt-1.5 h-2 w-full appearance-none overflow-hidden rounded-full border-0 bg-slate-100 [&::-moz-progress-bar]:rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full';

const indigoBarClass = `${barClass} [&::-moz-progress-bar]:bg-indigo-500 [&::-webkit-progress-value]:bg-indigo-500`;

const TodoStats = () => {
  const todos = useTodoStore((state) => state.todos);
  const [expanded, setExpanded] = useState(true);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;
    const active = total - completed;
    const overdue = todos.filter(
      (todo) => !todo.completed && isOverdue(todo.dueDate)
    ).length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    const categoryCounts = new Map<string, number>();
    const priorityCounts: Record<Priority, number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    for (const todo of todos) {
      categoryCounts.set(todo.category, (categoryCounts.get(todo.category) ?? 0) + 1);
      priorityCounts[todo.priority] += 1;
    }

    const categories = [...categoryCounts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN')
    );

    return { total, completed, active, overdue, rate, categories, priorityCounts };
  }, [todos]);

  return (
    <section
      aria-labelledby="todo-stats-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="todo-stats-heading" className="text-base font-semibold text-slate-900">
            数据概览
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            统计基于全部待办，不受当前筛选与搜索影响。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls="todo-stats-body"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {expanded ? '收起统计' : '展开统计'}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path
              d="m5 8 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div id="todo-stats-body" hidden={!expanded} className="mt-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-medium text-slate-500">待办总数</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {stats.total}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-medium text-slate-500">未完成</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-indigo-600">
              {stats.active}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-medium text-slate-500">已完成</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">
              {stats.completed}
            </dd>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              stats.overdue > 0
                ? 'border-red-200 bg-red-50/60'
                : 'border-slate-200 bg-white'
            }`}
          >
            <dt className="text-xs font-medium text-slate-500">逾期</dt>
            <dd
              className={`mt-1 text-2xl font-semibold tabular-nums ${
                stats.overdue > 0 ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {stats.overdue}
            </dd>
          </div>
        </dl>

        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">完成率</span>
            <span className="text-sm font-semibold tabular-nums text-indigo-600">
              {stats.rate}%
            </span>
          </div>
          <progress
            value={stats.rate}
            max={100}
            aria-label="已完成待办占比"
            className={indigoBarClass}
          />
          <p className="mt-1.5 text-[11px] text-slate-400">
            已完成 {stats.completed} / 总计 {stats.total} 项
            {stats.total === 0 ? '（暂无待办）' : ''}
          </p>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="text-xs font-semibold tracking-wide text-slate-500">
              分类分布
            </h3>
            {stats.categories.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">暂无分类数据</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {stats.categories.map(([category, count]) => (
                  <li key={category}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-600">{category}</span>
                      <span className="shrink-0 tabular-nums text-slate-500">{count}</span>
                    </div>
                    <progress
                      value={count}
                      max={stats.total}
                      aria-label={`${category} 分类待办数量`}
                      className={indigoBarClass}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="text-xs font-semibold tracking-wide text-slate-500">
              优先级分布
            </h3>
            <ul className="mt-3 space-y-2.5">
              {PRIORITY_STATS_ORDER.map((priority) => (
                <li key={priority}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 rounded-full ${PRIORITY_META[priority].dotClass}`}
                      />
                      {PRIORITY_META[priority].label}优先级
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-500">
                      {stats.priorityCounts[priority]}
                    </span>
                  </div>
                  <progress
                    value={stats.priorityCounts[priority]}
                    max={Math.max(stats.total, 1)}
                    aria-label={`${PRIORITY_META[priority].label}优先级待办数量`}
                    className={`${barClass} ${PRIORITY_META[priority].barClass}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TodoStats;
