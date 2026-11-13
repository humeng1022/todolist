# 待办事项应用（Todo App）

一款纯前端、单用户的待办事项管理应用。数据保存在浏览器 LocalStorage，打开即用，无后端、无登录、无网络请求。

功能与交互以 [PRD.md](./PRD.md) 为准，技术实现与工程约束见 [TECH.md](./TECH.md)、[AGENTS.md](./AGENTS.md)。

## 界面预览

![待办事项应用界面预览](./preview.png)

## 功能

- **创建**：标题、描述、截止日期、优先级、分类一次性录入，仅标题必填
- **编辑 / 删除**：行内编辑、单条删除二次确认、按数量提示的「清除已完成」
- **状态切换**：完成 / 取消完成即时更新
- **筛选**：状态、优先级、分类三个维度组合筛选（维度间为「且」）
- **搜索**：标题与描述、不区分大小写、300ms 防抖、与筛选组合生效
- **统计**：总数、未完成、已完成、完成率、逾期数、分类 / 优先级分布
- **持久化**：刷新或重开浏览器后数据恢复；筛选与搜索为会话级状态

## 技术栈

| 层级     | 技术                          |
| -------- | ----------------------------- |
| 构建     | Vite 7                        |
| 框架     | React 19 + TypeScript 5.8     |
| 状态管理 | Zustand 5（`persist` + `devtools`） |
| 样式     | Tailwind CSS 4                |
| 日期     | date-fns 4                    |
| 持久化   | LocalStorage                  |

## 本地运行

要求：Node.js >= 20.19，包管理器仅使用 pnpm。`packageManager` 已锁定 pnpm 10.34.9，Corepack 会自动使用该版本。

```bash
pnpm install
pnpm dev       # 开发服务器 http://localhost:3000
pnpm build     # 类型检查 + 生产构建
pnpm preview   # 预览构建产物
pnpm lint      # ESLint
```

## 部署到 GitHub Pages

仓库已包含 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)，推送到 `main` 后会自动构建并发布静态产物。

1. 在 GitHub 新建仓库并推送本项目（需包含 `.github` 目录）。
2. 进入仓库 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**。
3. 推送到 `main`；也可以在 **Actions** 页手动运行 **Deploy to GitHub Pages**。
4. 发布地址为 `https://<用户名>.github.io/<仓库名>/`。

说明：

- `vite.config.ts` 的 `base` 已设为 `'./'`，构建产物使用相对资源路径，因此不依赖仓库名，也兼容自定义域名。
- 工作流默认监听 `main` 分支；若仓库默认分支是 `master`，请同步修改 `.github/workflows/deploy.yml` 的 `branches`。
- GitHub Pages 默认提供 HTTPS，`crypto.randomUUID()` 等安全上下文 API 可正常使用。
- 每个访问者的待办仍保存在其本人浏览器的 LocalStorage 中，不会跨用户共享。

## 目录结构

```
src/
├── components/          # 展示组件，禁止直接读写 LocalStorage
│   ├── AddTodo.tsx      # 添加表单 + 校验
│   ├── TodoList.tsx     # 列表容器、空状态、清除已完成
│   ├── TodoItem.tsx     # 单条待办、行内编辑、删除确认
│   ├── TodoFilter.tsx   # 状态 / 优先级 / 分类筛选
│   ├── TodoSearch.tsx   # 搜索框
│   └── TodoStats.tsx    # 统计面板
├── store/todoStore.ts   # Zustand Store（状态变更唯一入口）
├── types/todo.ts        # 全项目类型唯一事实来源
├── utils/
│   ├── storage.ts       # LocalStorage 读写与容错
│   ├── date.ts          # date-fns 封装（格式化、逾期）
│   ├── validation.ts    # 创建 / 编辑共用的字段校验
│   ├── priority.ts      # 优先级展示元数据（完整类名白名单）
│   └── useDebouncedValue.ts
├── App.tsx
├── main.tsx
└── index.css            # Tailwind 入口与 priority 设计令牌
```

## 数据模型与持久化

`Todo` 字段：`id`、`title`、`description`、`category`、`priority`、`dueDate?`、`completed`、`createdAt`。

- `id` 由 `crypto.randomUUID()` 生成
- 日期统一存为 ISO 字符串，逾期判断使用 `differenceInCalendarDays`，**今天不算逾期**
- Store 仅持久化 `todos`（`partialize`），`filter` 刷新后重置
- 持久化键：`todo-storage`，`version: 1`
- 存储内容损坏或结构非法时回退为空列表，并在页面顶部给出提示
- 写入失败（容量超限 / 隐私模式）静默降级，不阻塞 UI

## 实现说明

- 开发顺序遵循 TECH.md 第 3 节：类型 → 存储层 → Store → 添加 → 列表与筛选 → 搜索与统计，每步通过 `pnpm lint` 与 `pnpm build`。
- 校验规则集中在 `utils/validation.ts`，创建与编辑共用，避免两套规则漂移。
- 筛选与搜索在 `TodoList` 中派生，不写回 Store；统计基于全部待办，不受筛选影响。
- 动态日期 / 优先级颜色使用完整 Tailwind 类名白名单，未做字符串拼接。

### 与文档的两处环境适配

1. **Tailwind CSS 4 的配置方式**：TECH.md 第 12 节给出 Tailwind 3 风格的 `tailwind.config.js`。本项目使用 v4 的 CSS-first 配置，在 `src/index.css` 的 `@theme` 中声明同名的 `--color-priority-low/medium/high` 令牌，生成的 `text-priority-*`、进度条填充色等工具类与文档方案一致。
2. **pnpm 链接方式**：`.npmrc` 设置 `node-linker=hoisted`。在本机 Windows 环境中，pnpm 默认的 junction 布局会导致 Node 无法向上解析传递依赖；该设置不影响依赖版本与项目代码。

## 浏览器支持

最新版 Chrome、Edge、Firefox、Safari；桌面端为主，≥375px 窄屏可用，统计面板可折叠。
