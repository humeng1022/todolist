/**
 * LocalStorage 读写封装（TECH.md 第 6 节）。
 * 组件层禁止直接调用 localStorage，一律通过本模块或 Store。
 */

const STORAGE_KEY = 'todo-storage';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readRaw = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * 读取持久化状态。兼容 persist 的 { state, version } 包裹结构；
 * 非法 JSON 或结构损坏时回退到 fallback，应用不崩溃。
 */
export function readStorage<T>(fallback: T): T {
  try {
    const raw = readRaw();
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return fallback;
    const state = 'state' in parsed ? parsed.state : parsed;
    return (state ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/**
 * 校验后的原始持久化字符串，供 Zustand persist 适配器使用。
 * 缺失、非法 JSON 或缺少 todos 数组时返回 null。
 */
export function readStorageSnapshot(): string | null {
  const raw = readRaw();
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    const state = isRecord(parsed.state) ? parsed.state : parsed;
    return Array.isArray(state.todos) ? raw : null;
  } catch {
    return null;
  }
}

/** 是否存在无法安全恢复的历史数据（对应 PRD 第 8 节提示） */
export function hasCorruptedStorage(): boolean {
  return readRaw() !== null && readStorageSnapshot() === null;
}

/** 写入持久化数据；容量超限或隐私模式失败时静默降级。 */
export function writeStorage(value: unknown): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // 写入失败不阻塞 UI。
  }
}

/** 清除持久化数据 */
export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略移除失败，保持应用可用。
  }
}
