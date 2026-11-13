import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import type { Todo, TodoFilterState, TodoInput, TodoUpdate } from '@/types/todo';
import { clearStorage, readStorageSnapshot, writeStorage } from '@/utils/storage';

interface TodoState {
  todos: Todo[];
  filter: TodoFilterState;
  // 增删改
  addTodo: (input: TodoInput) => void;
  updateTodo: (id: string, patch: TodoUpdate) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  clearCompleted: () => void;
  // 筛选与搜索
  setFilter: (patch: Partial<TodoFilterState>) => void;
  resetFilter: () => void;
}

const defaultFilter: TodoFilterState = {
  status: 'all',
  priority: 'all',
  category: 'all',
  keyword: '',
};

export const useTodoStore = create<TodoState>()(
  devtools(
    persist(
      (set) => ({
        todos: [],
        filter: defaultFilter,

        addTodo: (input) =>
          set((state) => ({
            todos: [
              {
                ...input,
                id: crypto.randomUUID(),
                completed: false,
                createdAt: new Date().toISOString(),
              },
              ...state.todos,
            ],
          })),

        updateTodo: (id, patch) =>
          set((state) => ({
            todos: state.todos.map((todo) =>
              todo.id === id ? { ...todo, ...patch } : todo
            ),
          })),

        deleteTodo: (id) =>
          set((state) => ({
            todos: state.todos.filter((todo) => todo.id !== id),
          })),

        toggleTodo: (id) =>
          set((state) => ({
            todos: state.todos.map((todo) =>
              todo.id === id ? { ...todo, completed: !todo.completed } : todo
            ),
          })),

        clearCompleted: () =>
          set((state) => ({
            todos: state.todos.filter((todo) => !todo.completed),
          })),

        setFilter: (patch) =>
          set((state) => ({ filter: { ...state.filter, ...patch } })),

        resetFilter: () => set({ filter: defaultFilter }),
      }),
      {
        name: 'todo-storage',
        version: 1,
        storage: createJSONStorage(() => ({
          getItem: () => readStorageSnapshot(),
          setItem: (_name, value) => {
            try {
              writeStorage(JSON.parse(value) as unknown);
            } catch {
              // persist 传入非法字符串时直接清空，避免反复损坏。
              clearStorage();
            }
          },
          removeItem: () => clearStorage(),
        })),
        // 仅持久化 todos，filter 属会话级状态（AGENTS.md 5.3）。
        partialize: (state) => ({ todos: state.todos }),
        migrate: (persistedState, version) => {
          // * 本版本尚未发生结构升级；保留迁移入口，未来提升 version 时在此补全。
          if (version < 1) {
            return { todos: [] };
          }
          return persistedState as { todos: Todo[] };
        },
      }
    ),
    { name: 'TodoStore' }
  )
);
