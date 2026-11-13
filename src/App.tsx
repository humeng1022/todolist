import { useRef, useState } from 'react';
import AddTodo from '@/components/AddTodo';
import TodoFilter from '@/components/TodoFilter';
import TodoList from '@/components/TodoList';
import TodoSearch from '@/components/TodoSearch';
import TodoStats from '@/components/TodoStats';
import { formatTodayLabel } from '@/utils/date';
import { hasCorruptedStorage } from '@/utils/storage';

const App = () => {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [showStorageWarning, setShowStorageWarning] = useState<boolean>(() =>
    hasCorruptedStorage()
  );

  const focusTitle = () => titleInputRef.current?.focus();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path
                    d="m5 10.5 3 3 7-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="text-sm font-medium text-indigo-600">
                Todo · 本地任务管理
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              我的待办
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-slate-500">
              记录、整理并推进今天的每一件事。数据只保存在此浏览器，不会上传服务器。
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-500 shadow-sm">
            今天 · {formatTodayLabel()}
          </div>
        </header>

        {showStorageWarning ? (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
            >
              <path
                d="M10 3.5 17 16H3l7-12.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M10 8v3.5M10 14h.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium">本地数据无法读取，已回退为空列表</p>
              <p className="mt-0.5 text-amber-700">
                浏览器中的旧数据可能已损坏或结构不兼容。新增待办后会覆盖旧数据，当前应用仍可正常使用。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowStorageWarning(false)}
              aria-label="关闭数据提示"
              className="rounded-md p-1 text-amber-500 transition hover:bg-amber-100 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path
                  d="m6 6 8 8M14 6l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ) : null}

        <main className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
          <AddTodo titleInputRef={titleInputRef} />
          <TodoStats />

          <section
            aria-label="搜索与筛选"
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <TodoSearch />
            <div className="mt-4 border-t border-slate-100 pt-4">
              <TodoFilter />
            </div>
          </section>

          <TodoList onAddFirst={focusTitle} />
        </main>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          数据保存于浏览器 LocalStorage · 纯前端运行，无网络请求
        </footer>
      </div>
    </div>
  );
};

export default App;
