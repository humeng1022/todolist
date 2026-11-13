# AGENTS.md — 待办事项应用 AI 开发约束

## 1. 文件定位

本文件面向参与本项目的 AI 编程助手（Codex、Cursor、Claude Code、GitHub Copilot 等），是**项目级操作约束**，而非人类贡献者文档。README 面向人类，AGENTS.md 面向 AI：提供可执行的指令、边界与验证标准。

**核心原则**：每条指令都应能改变 AI 的行为。模糊的「遵循最佳实践」不写入；可执行的「禁止使用 `any`」写入。凡本文件与 PRD.md、TECH.md 冲突处，以 PRD 的功能描述与 TECH 的技术实现为准，并在代码注释中标注冲突点供用户裁决。


## 2. 环境与依赖约束

### 2.1 运行时与包管理器

| 项目     | 约束                                                         |
| -------- | ------------------------------------------------------------ |
| Node.js  | `>= 20.19`（Vite 7 最低要求）                                |
| 包管理器 | **仅使用 `pnpm`**。禁止生成 `package-lock.json`、`yarn.lock` 或 `bun.lockb` |
| 安装命令 | `pnpm install`                                               |
| 新增依赖 | **必须先确认**，不得自行 `pnpm add` 未经 PRD/TECH 授权的包   |

### 2.2 技术栈锁定

以下依赖版本由 TECH.md 第 2 节确定，**AI 不得擅自升级主版本号**：

```json
{
  "react": "^19.x",
  "typescript": "~5.8",
  "zustand": "^5.x",
  "tailwindcss": "^4.x",
  "date-fns": "^4.x",
  "vite": "^7.x"
}
```

**禁止**引入以下替代方案（除非用户明确要求）：
- 状态管理：Redux、MobX、Jotai、Recoil
- 日期库：Moment.js、Day.js、Luxon
- 样式方案：CSS Modules、styled-components、Emotion
- 构建工具：Webpack、Parcel、Rollup（直接使用）


## 3. 开发顺序约束（强制执行）

TECH.md 第 3 节定义了模块化开发顺序。AI **必须**按此顺序推进，每完成一个模块先验证再进入下一个：

| 步骤 | 模块       | 产出                                 | 完成判定                                   |
| ---- | ---------- | ------------------------------------ | ------------------------------------------ |
| 1    | 数据模型   | `src/types/todo.ts`                  | `Todo` 字段齐全、无 `any`、TS 编译通过     |
| 2    | 数据存储层 | `src/utils/storage.ts`               | 读写正确、非法 JSON 容错回退               |
| 3    | 状态管理   | `src/store/todoStore.ts`             | 增删改、筛选、搜索 action 齐备且不可变更新 |
| 4    | 添加功能   | `src/components/AddTodo.tsx`         | 校验规则对照 PRD F1 全部生效               |
| 5    | 列表与筛选 | `TodoList`、`TodoItem`、`TodoFilter` | 筛选组合结果正确                           |
| 6    | 搜索与统计 | `TodoSearch`、`TodoStats`            | 搜索与筛选组合、统计实时准确               |

**禁止行为**：
- 跳过第 1、2 步直接写组件（数据模型与存储层先行是硬性要求）
- 在 Store 尚未定义 action 时先在组件中临时 `useState` 管理待办
- 一次性生成全部模块而不做分步验证


## 4. 数据模型约束

`src/types/todo.ts` 是全项目类型的唯一事实来源。`Todo` 必须且仅包含以下字段（TECH.md 第 5 节）：

```typescript
export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;           // crypto.randomUUID()
  title: string;        // 必填
  description: string;  // 默认 ''
  category: string;     // 默认 '未分类'
  priority: Priority;   // 默认 'medium'
  dueDate?: string;     // ISO 8601 字符串
  completed: boolean;   // 默认 false
  createdAt: string;    // ISO 8601 字符串
}
```

**禁止行为**：
- 在 `components/` 中定义新的 `interface`（类型一律放 `types/`）
- 修改 `Todo` 字段而不提升 `persist` 的 `version` 并编写 `migrate`
- 将 `priority` 写成 `enum`（使用联合类型）
- 将 `dueDate` 存为 `Date` 对象（必须 ISO 字符串）
- 使用 `Date.now()`、`Math.random()` 或自增计数器生成 `id`


## 5. 架构与文件约束

### 5.1 目录结构（不可偏离）

```
src/
├── components/    # 展示组件，禁止直接读写 LocalStorage
├── store/         # Zustand Store，状态变更唯一入口
├── types/         # 类型定义
├── utils/         # storage.ts（存储封装）、date.ts（日期工具）
├── App.tsx
└── main.tsx
```

**禁止行为**：
- 在 `components/` 中调用 `localStorage.setItem` / `getItem`（一律经 `utils/storage.ts` 或 Store）
- 创建 TECH.md 未列出的顶层目录
- 修改 `vite.config.ts` 的 `resolve.alias`（`@/` 映射已锁定）

### 5.2 状态管理约束

所有待办数据变更**必须**通过 `useTodoStore` 的 action 完成。禁止：
- 在组件中用 `useState` 管理待办数组
- 对 `todos` 执行 `push`、`splice`、`sort` 等原地操作
- 将派生数据（完成率、逾期数、分布）写入 Store

```typescript
// ✅ 允许
const activeCount = useTodoStore((s) => s.todos.filter((t) => !t.completed).length);

// ❌ 禁止
const todos = useTodoStore((s) => s.todos);
todos.push(newTodo); // 原地修改
```

### 5.3 持久化约束

- 持久化**仅**由 `persist` 中间件 + `utils/storage.ts` 处理
- `partialize` **不得**将 `filter` 纳入持久化（筛选为会话级状态）
- 修改存储结构时**必须**同步提升 `version` 并编写 `migrate`


## 6. 编码风格（硬性规则）

### 6.1 TypeScript

| 规则           | 说明                                                   |
| -------------- | ------------------------------------------------------ |
| `strict: true` | 不得建议关闭                                           |
| **禁止 `any`** | 用 `unknown` + 类型收窄，或定义精确类型                |
| 导出函数       | 标注返回类型（Store action 除外，由 Zustand 推导）     |
| 类型导入       | `import type { Todo } from '@/types/todo'`             |
| 枚举替代       | 联合类型（`'low' \| 'medium' \| 'high'`），禁止 `enum` |

### 6.2 React

| 规则       | 说明                                                      |
| ---------- | --------------------------------------------------------- |
| 组件定义   | 函数组件 + 箭头函数，禁止 `function` 声明（除非需要提升） |
| Props 类型 | 每个组件必须有 `interface XxxProps`                       |
| 默认导出   | 组件 `export default`，工具函数命名导出                   |
| Hooks 顺序 | 遵循 React 规则，禁止条件调用                             |
| 内联样式   | **禁止** `style={{}}`，一律 Tailwind 类名                 |

### 6.3 Tailwind CSS

- 禁止 `@apply` 抽离组件类
- 动态颜色必须用**完整类名**（`text-priority-high`），禁止 `text-priority-${level}` 拼接
- 优先级颜色使用 `priority.low/medium/high` 配置

### 6.4 命名

| 类型           | 规范                | 示例                                   |
| -------------- | ------------------- | -------------------------------------- |
| 组件文件       | PascalCase          | `TodoItem.tsx`、`AddTodo.tsx`          |
| 工具文件       | camelCase           | `storage.ts`、`date.ts`                |
| Store 文件     | camelCase + `Store` | `todoStore.ts`                         |
| Type/Interface | PascalCase          | `Todo`、`FilterStatus`                 |
| Store action   | 动词开头 camelCase  | `addTodo`、`toggleTodo`、`resetFilter` |


## 7. 日期处理约束

- **只使用** `date-fns` 纯函数
- **禁止**对 `Date` 调用 `setDate`、`setMonth`、`setFullYear` 等变更方法
- 日期存储：ISO 8601 字符串
- 用户输入通过 `parse` + `isValid` 校验，拒绝 `2026-02-30` 等非法日期
- 逾期判断：`differenceInCalendarDays(startOfDay(dueDate), startOfDay(new Date())) < 0`，**今天不算逾期**


## 8. 功能实现边界（对照 PRD）

### 8.1 允许自行实现

- 组件 UI 结构与 Tailwind 类名
- Store action 内部逻辑（在 TECH.md 第 7 节已定义接口范围内）
- `utils/date.ts`、`utils/storage.ts` 的实现细节
- 空状态、错误提示的展示方式

### 8.2 必须确认后才能实现

- 新增 PRD 未列出的功能（拖拽、导入导出等）
- 修改 `Todo` 数据结构（新增字段）
- 修改筛选组合规则或统计口径
- 新增任何依赖

### 8.3 绝对禁止

- 引入后端 API 或任何网络请求
- 添加用户认证、登录代码
- 在组件中绕过 Store 直接读写 LocalStorage
- 删除或覆盖 PRD.md、TECH.md、AGENTS.md
- 未经用户要求自动执行 `git commit`、`git push`、创建分支或 worktree


## 9. 验证要求

每完成一个模块（TECH.md 第 3 节的任一步骤），**必须**运行并确保通过：

```bash
pnpm lint      # ESLint 检查
pnpm build     # TypeScript 编译 + Vite 构建
```

**禁止**提交存在以下情况的代码：
- `pnpm build` 因类型错误失败
- `pnpm lint` 新增报错
- 引入 `// @ts-ignore` 或 `// eslint-disable-next-line` 未附注释说明理由

**测试**：本期不强制单元测试。若主动添加，必须使用 Vitest + React Testing Library，禁止引入 Jest。


## 10. 参考索引与冲突处理

需要更多上下文时，AI 应主动读取：

| 文件                     | 用途                                             |
| ------------------------ | ------------------------------------------------ |
| `PRD.md`                 | 功能需求、校验规则、验收标准、边界场景           |
| `TECH.md`                | 数据模型、开发顺序、Store 接口、存储层、构建配置 |
| `src/types/todo.ts`      | 类型定义唯一事实来源                             |
| `src/store/todoStore.ts` | Store 接口与 action 签名                         |

**冲突处理**：以 PRD 的功能描述和 TECH 的技术实现为准；若本文件与二者矛盾，在代码注释中标注冲突点供用户裁决，不得擅自取舍。

---

*文件版本：1.1 | 最后更新：2026-11-13 | 变更：同步 TECH.md 1.1 的开发顺序、数据模型字段、存储层与 AddTodo 组件约束*