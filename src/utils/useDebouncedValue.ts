import { useEffect, useState } from 'react';

/**
 * 返回延迟 `delay` 毫秒后才更新的值，用于搜索防抖。
 * 定时器在卸载或值变化时清除，避免多余更新。
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
