import { useTodoStore } from '@/store/todoStore';

const TodoSearch = () => {
  const keyword = useTodoStore((state) => state.filter.keyword);
  const setFilter = useTodoStore((state) => state.setFilter);

  return (
    <div className="relative flex-1">
      <label htmlFor="todo-search" className="sr-only">
        搜索待办
      </label>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      >
        <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="m13 13 3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      <input
        id="todo-search"
        type="search"
        value={keyword}
        onChange={(event) => setFilter({ keyword: event.target.value })}
        placeholder="搜索标题或描述…"
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {keyword.length > 0 ? (
        <button
          type="button"
          onClick={() => setFilter({ keyword: '' })}
          aria-label="清空搜索"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
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
      ) : null}
    </div>
  );
};

export default TodoSearch;
