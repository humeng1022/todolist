# 待办事项应用技术文档（TECH.md）

## 1. 文档概述

本文档定义一款纯前端待办事项应用的技术架构、数据模型、状态管理策略与工程规范。应用无后端依赖，所有数据持久化于浏览器 LocalStorage，适用于个人任务管理场景。

**目标读者**：参与本项目开发的前端工程师、代码审查者、后续维护者。

**范围**：涵盖技术选型理由、开发顺序、数据模型、状态管理设计、持久化方案、日期处理约定、样式规范及构建配置。不包含 UI 视觉设计稿与产品需求细节（见 PRD.md）。


## 2. 技术栈与选型理由

| 层级       | 技术         | 版本建议   | 选型理由                                                     |
| ---------- | ------------ | ---------- | ------------------------------------------------------------ |
| 构建工具   | Vite         | ^7.x       | 冷启动快，HMR 响应迅速，原生支持 TS 与 SWC                   |
| 前端框架   | React        | ^19.x      | 生态成熟，函数组件 + Hooks 模式与 Zustand 天然契合           |
| 语言       | TypeScript   | ~5.8       | 静态类型保障数据模型与 Store 接口的可靠性                    |
| 状态管理   | Zustand      | ^5.x       | 体积极小，API 简洁，无 Provider 包裹，支持中间件组合         |
| 样式方案   | Tailwind CSS | ^4.x       | 原子化类名，无需维护独立 CSS 文件，与组件开发节奏匹配        |
| 日期处理   | date-fns     | ^4.x       | 函数式 API，Tree-shaking 友好，不可变操作，无 Moment.js 的包体积负担 |
| 数据持久化 | LocalStorage | 浏览器原生 | 零配置，同步读写，配合 Zustand `persist` 中间件自动完成状态恢复 |


## 3. 开发顺序（重要）

开发按模块循序渐进，**每完成一个模块先测试通过再进入下一个**。顺序如下：

| 步骤        | 模块               | 产出                                             | 验证方式                                    |
| ----------- | ------------------ | ------------------------------------------------ | ------------------------------------------- |
| **第 1 步** | **数据模型定义**   | `src/types/todo.ts`：Todo 接口、优先级与筛选类型 | TS 编译通过，字段类型无 `any`               |
| **第 2 步** | **数据存储层**     | `src/utils/storage.ts`：LocalStorage 读写封装    | 手动调用可正确读写、容错非法 JSON           |
| **第 3 步** | **状态管理**       | `src/store/todoStore.ts`：Zustand 全局 Store     | 添加/删除/更新/筛选各 action 单测或手动验证 |
| **第 4 步** | **添加功能**       | `src/components/AddTodo.tsx`：表单 + 验证        | 创建合法/非法输入均符合 PRD 校验规则        |
| **第 5 步** | **列表展示与筛选** | `TodoList`、`TodoItem`、`TodoFilter`             | 列表渲染、状态/优先级/分类筛选组合正确      |
| **第 6 步** | **搜索与统计**     | 搜索栏、`TodoStats`                              | 搜索与筛选组合、统计数值实时准确            |

> **原则**：数据模型先行。字段定义清楚后，存储层、Store、组件均以 `Todo` 类型为准，避免后期返工。每个模块完成后运行 `pnpm lint && pnpm build` 并做功能自测。


## 4. 项目结构

```
todo-app/
├── public/                     # 静态资源
├── src/
│   ├── components/             # 展示组件（无状态或仅局部状态）
│   │   ├── AddTodo.tsx         # 添加待办表单 + 验证
│   │   ├── TodoList.tsx        # 列表容器
│   │   ├── TodoItem.tsx        # 单条待办
│   │   ├── TodoFilter.tsx      # 筛选（状态/优先级/分类）
│   │   ├── TodoSearch.tsx      # 搜索框
│   │   └── TodoStats.tsx       # 统计面板
│   ├── store/
│   │   └── todoStore.ts        # Zustand Store 定义 + persist 配置
│   ├── types/
│   │   └── todo.ts             # Todo 类型、优先级、筛选枚举
│   ├── utils/
│   │   ├── storage.ts          # LocalStorage 读写封装
│   │   └── date.ts             # date-fns 封装（格式化、逾期判断）
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Tailwind 指令入口
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```


## 5. 数据模型（开发第 1 步）

所有类型集中定义于 `src/types/todo.ts`，是全项目类型的唯一事实来源。

```typescript
// src/types/todo.ts

/** 优先级：低、中、高 */
export type Priority = 'low' | 'medium' | 'high';

/** 待办事项实体 */
export interface Todo {
  id: string;           // 唯一标识，crypto.randomUUID() 生成
  title: string;        // 标题，必填，去除首尾空格后非空
  description: string;  // 描述，可选，默认空字符串
  category: string;     // 分类，可选，默认 '未分类'（仅空格视为未填写）
  priority: Priority;   // 优先级，默认 'medium'
  dueDate?: string;     // 截止日期，可选，ISO 8601 字符串（yyyy-MM-dd 或完整 ISO）
  completed: boolean;   // 是否完成，默认 false
  createdAt: string;    // 创建时间，ISO 8601 字符串，系统生成
}

/** 状态筛选 */
export type FilterStatus = 'all' | 'active' | 'completed';

/** 筛选条件集合 */
export interface TodoFilterState {
  status: FilterStatus;
  priority: Priority | 'all';
  category: string | 'all';
  keyword: string;      // 搜索关键词，空字符串表示不搜索
}

/** 创建待办的输入（id 与 createdAt 由系统生成） */
export type TodoInput = Omit<Todo, 'id' | 'createdAt' | 'completed'>;

/** 可编辑字段 */
export type TodoUpdate = Partial<Pick<Todo, 'title' | 'description' | 'category' | 'priority' | 'dueDate'>>;
```

**字段设计决策**：

| 字段          | 决策                     | 理由                                                  |
| ------------- | ------------------------ | ----------------------------------------------------- |
| `id`          | `crypto.randomUUID()`    | 禁止 `Date.now()`，同毫秒并发会重复                   |
| `description` | `string` 必填默认 `''`   | 避免 `undefined` 判断分支，简化表单与展示逻辑         |
| `category`    | `string` 默认 `'未分类'` | 与 PRD「未分类」展示一致；空白输入归一化为 `'未分类'` |
| `priority`    | 联合类型而非 `enum`      | 与 AGENTS.md 约束一致，序列化友好                     |
| `dueDate`     | 可选 `string`（ISO）     | 与 `Date` 对象解耦，LocalStorage 序列化无类型丢失     |
| `createdAt`   | ISO 字符串               | 用于默认倒序排序，序列化安全                          |


## 6. 数据存储层（开发第 2 步）

封装 LocalStorage 读写，作为持久化的底层工具。Zustand 的 `persist` 中间件最终也经由该层，保证存储逻辑集中、可替换。

```typescript
// src/utils/storage.ts
const STORAGE_KEY = 'todo-storage';

export function readStorage<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // 兼容 persist 的 { state, version } 包裹结构
    return (parsed?.state ?? parsed) as T;
  } catch {
    return fallback; // 非法 JSON 或结构损坏时回退
  }
}

export function writeStorage(value: unknown): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // 容量超限或隐私模式写入失败，静默降级
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

**约定**：
- 读取必须 `try/catch`，数据损坏时回退默认值，应用不崩溃（对应 PRD 第 8 节）。
- 写入失败静默降级，不阻塞 UI。
- 组件层**禁止**直接调用 `localStorage`，一律通过 Store 或本工具。


## 7. 状态管理设计（开发第 3 步）

### 7.1 Store 接口

```typescript
// src/store/todoStore.ts
import type { Todo, TodoInput, TodoUpdate, TodoFilterState } from '@/types/todo';

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
```

### 7.2 中间件组合

采用 `devtools(persist(...))` 组合，顺序不可颠倒（`devtools` 在外层以便追踪持久化动作）。

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { readStorage, writeStorage } from '@/utils/storage';

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
          set((s) => ({
            todos: [
              {
                ...input,
                id: crypto.randomUUID(),
                completed: false,
                createdAt: new Date().toISOString(),
              },
              ...s.todos,
            ],
          })),

        updateTodo: (id, patch) =>
          set((s) => ({
            todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          })),

        deleteTodo: (id) =>
          set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

        toggleTodo: (id) =>
          set((s) => ({
            todos: s.todos.map((t) =>
              t.id === id ? { ...t, completed: !t.completed } : t
            ),
          })),

        clearCompleted: () =>
          set((s) => ({ todos: s.todos.filter((t) => !t.completed) })),

        setFilter: (patch) =>
          set((s) => ({ filter: { ...s.filter, ...patch } })),

        resetFilter: () => set({ filter: defaultFilter }),
      }),
      {
        name: 'todo-storage',
        version: 1,
        storage: createJSONStorage(() => ({
          getItem: (k) => {
            const v = readStorage<Todo[] | null>(null);
            return v ? JSON.stringify({ state: { todos: v }, version: 1 }) : null;
          },
          setItem: (_k, val) => writeStorage(JSON.parse(val)),
          removeItem: () => clearStorage(),
        })),
        partialize: (state) => ({ todos: state.todos }), // 仅持久化 todos
        migrate: (persisted: any, version: number) => {
          if (version === 0) { /* 未来结构迁移 */ }
          return persisted;
        },
      }
    ),
    { name: 'TodoStore' }
  )
);
```

**关键决策**：

| 决策                       | 说明                                                         |
| -------------------------- | ------------------------------------------------------------ |
| `partialize` 排除 `filter` | 筛选与搜索属会话级状态，刷新后重置为默认（PRD 第 5 节 F6）   |
| 派生数据不入 Store         | 完成率、逾期数、分类分布由组件选择器实时计算，避免同步不一致 |
| 不可变更新                 | 所有 action 返回新数组，禁止 `push`/`splice` 原地操作        |
| `resetFilter`              | 对应 PRD「清除筛选」按钮                                     |

### 7.3 派生数据与选择器

```typescript
// 组件内示例
const activeCount = useTodoStore((s) => s.todos.filter((t) => !t.completed).length);
const overdueCount = useTodoStore(
  (s) => s.todos.filter((t) => !t.completed && isOverdue(t.dueDate)).length
);
```

筛选与搜索的执行逻辑放在 `TodoList` 的选择器或 `useMemo` 中，按 `filter` 状态对 `todos` 做「且」过滤，**不写回 Store**。


## 8. 添加功能组件（开发第 4 步）

### 8.1 组件职责

`AddTodo.tsx` 负责表单输入与验证，验证通过后调用 `addTodo`。

```typescript
// src/components/AddTodo.tsx（结构示意）
interface FormState {
  title: string;
  description: string;
  category: string;
  priority: Priority;
  dueDate: string;
}
```

### 8.2 校验规则（对照 PRD F1）

| 字段        | 规则                                        | 提示文案                 |
| ----------- | ------------------------------------------- | ------------------------ |
| title       | 去空格后非空                                | 请输入待办标题           |
| title       | ≤ 100 字符                                  | 标题不能超过 100 个字符  |
| description | ≤ 500 字符                                  | 描述不能超过 500 个字符  |
| category    | 去空格后 ≤ 20 字符，空白归一化为 `'未分类'` | 分类名不能超过 20 个字符 |
| dueDate     | 合法日期（`isValid(parseISO)`）             | 请选择有效日期           |
| priority    | 默认为 `medium`                             | —                        |

**提交流程**：
1. 逐字段校验，任一失败则阻止提交并聚焦首个错误字段。
2. 通过后构造 `TodoInput`，调用 `addTodo`。
3. 提交后清空表单，`priority` 重置为 `medium`，焦点回到标题输入框。

**日期合法性示例**：`2026-02-30` 经 `parse` 后 `isValid` 为 `false`，必须拒绝。


## 9. 列表展示与筛选（开发第 5 步）

- 默认按 `createdAt` 倒序展示。
- `TodoFilter.tsx` 提供状态（分段控件）、优先级、分类（下拉/标签）筛选，不同维度「且」，同维度「或」。
- `TodoItem.tsx` 展示标题、描述（截断两行）、优先级颜色、分类标签、截止日期（逾期红色高亮）、编辑/删除按钮。
- 空状态与无匹配结果状态按 PRD F2 处理。


## 10. 搜索与统计（开发第 6 步）

- `TodoSearch.tsx`：输入防抖 300ms，匹配标题与描述，不区分大小写，与筛选「且」组合。
- `TodoStats.tsx`：基于**全部待办**统计，不受筛选/搜索影响。指标：总数、未完成数、已完成数、完成率（已完成÷总数，总数为 0 时显示 0% 或「—」）、逾期数、分类分布、优先级分布。
- 逾期判定：`differenceInCalendarDays(startOfDay(dueDate), startOfDay(new Date())) < 0`，今天不算逾期。


## 11. 日期处理约定（date-fns）

```typescript
// src/utils/date.ts
import { format, parseISO, isValid, differenceInCalendarDays, startOfDay } from 'date-fns';

export function formatDueDate(iso?: string): string {
  if (!iso) return '';
  const date = parseISO(iso);
  return isValid(date) ? format(date, 'MMM d, yyyy') : '无效日期';
}

export function isOverdue(iso?: string): boolean {
  if (!iso) return false;
  const due = parseISO(iso);
  if (!isValid(due)) return false;
  return differenceInCalendarDays(startOfDay(due), startOfDay(new Date())) < 0;
}
```

**原则**：只使用纯函数；禁止 `setDate`/`setMonth` 等变更方法；输入通过 `parse` + `isValid` 校验。


## 12. 样式规范（Tailwind CSS）

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        priority: { low: '#6b7280', medium: '#f59e0b', high: '#ef4444' },
      },
    },
  },
  plugins: [],
};
```

- 禁止 `@apply` 抽离组件类，保持原子类名在 JSX 中可读。
- 动态优先级颜色使用完整类名白名单（`text-priority-high`），禁止字符串拼接。
- 交互状态使用 `hover:`、`focus:`、`disabled:` 变体。


## 13. 构建与开发配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 3000, open: true },
});
```

```json
// tsconfig.json 关键项
{ "compilerOptions": { "strict": true, "baseUrl": ".", "paths": { "@/*": ["src/*"] } } }
```

```json
// package.json scripts
{ "scripts": { "dev": "vite", "build": "tsc -b && vite build", "preview": "vite preview", "lint": "eslint ." } }
```


## 14. 关键约束与注意事项

1. **ID 生成**：`crypto.randomUUID()`，禁止 `Date.now()` 作唯一标识。
2. **不可变更新**：Store action 对 `todos` 必须返回新数组。
3. **持久化时机**：`persist` 中间件在每次 `set` 后自动写入，无需手动保存。
4. **同步水合**：LocalStorage 同步存储，Store 创建即完成水合，首屏无闪烁。
5. **调试**：开发环境通过 Redux DevTools 查看 `TodoStore` 时间线。
6. **每步验证**：按第 3 节顺序开发，每完成一个模块运行 `pnpm lint && pnpm build` 并做功能自测，通过后再进入下一模块。


## 15. 后续可扩展方向

| 方向          | 说明                                                         |
| ------------- | ------------------------------------------------------------ |
| 拖拽排序      | `@dnd-kit/core`，Store 增加 `reorderTodos`                   |
| 子任务        | `Todo` 增加 `parentId`，树形扁平存储                         |
| 数据导入/导出 | JSON 下载与读取，绕过跨设备限制                              |
| 提醒通知      | `Notification API` + `date-fns` 轮询                         |
| 单元测试      | Vitest + `@testing-library/react`，重点覆盖 Store action 不可变性与校验边界 |

---

*文档版本：1.1 | 最后更新：2026-11-13 | 变更：新增开发顺序章节，明确数据模型字段，补充存储层与 AddTodo 组件设计*