import { memo, useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useTodoStore } from '@/store/todoStore';
import type { Todo, TodoDraft, TodoDraftErrors, TodoField } from '@/types/todo';
import { formatDueDate, isOverdue } from '@/utils/date';
import { PRIORITY_META, PRIORITY_ORDER } from '@/utils/priority';
import {
  DESCRIPTION_MAX_LENGTH,
  UNCATEGORIZED,
  firstInvalidField,
  toTodoDraft,
  toTodoInput,
  validateTodoDraft,
} from '@/utils/validation';

interface TodoItemProps {
  todo: Todo;
  /** 已有分类，供编辑时快速选择 */
  categories: string[];
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';
const inputErrorClass = 'border-red-300 focus:border-red-400 focus:ring-red-100';

const TodoItem = ({ todo, categories }: TodoItemProps) => {
  const updateTodo = useTodoStore((state) => state.updateTodo);
  const deleteTodo = useTodoStore((state) => state.deleteTodo);
  const toggleTodo = useTodoStore((state) => state.toggleTodo);

  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState<TodoDraft>(() => toTodoDraft(todo));
  const [errors, setErrors] = useState<TodoDraftErrors>({});

  const fieldRefs = useRef<
    Partial<Record<TodoField, HTMLInputElement | HTMLTextAreaElement | null>>
  >({});
  const titleEditRef = useRef<HTMLInputElement>(null);

  const fieldId = useId();
  const categoryListId = `${fieldId}-category-options`;

  const overdue = !todo.completed && isOverdue(todo.dueDate);
  const categoryIsUncategorized = todo.category === UNCATEGORIZED;

  useEffect(() => {
    if (!isEditing) return;
    const frame = window.requestAnimationFrame(() => titleEditRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isEditing]);

  const startEditing = () => {
    setDraft(toTodoDraft(todo));
    setErrors({});
    setConfirmDelete(false);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setErrors({});
  };

  const requestDelete = () => {
    // 编辑中被删除时先退出编辑态（PRD 第 8 节）。
    setIsEditing(false);
    setErrors({});
    setConfirmDelete(true);
  };

  const handleDelete = () => {
    deleteTodo(todo.id);
  };

  const updateDraft = (patch: Partial<TodoDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next: TodoDraftErrors = { ...prev };
      for (const key of Object.keys(patch) as TodoField[]) {
        delete next[key];
      }
      return next;
    });
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateTodoDraft(draft);
    setErrors(nextErrors);

    const firstInvalid = firstInvalidField(nextErrors);
    if (firstInvalid) {
      window.requestAnimationFrame(() => fieldRefs.current[firstInvalid]?.focus());
      return;
    }

    updateTodo(todo.id, toTodoInput(draft));
    setIsEditing(false);
    setErrors({});
  };

  const cardBorder = overdue
    ? 'border-red-200 border-l-4 border-l-red-400'
    : 'border-slate-200';

  return (
    <li
      className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${cardBorder} ${
        todo.completed ? 'bg-slate-50/60' : ''
      }`}
    >
      {isEditing ? (
        <form onSubmit={handleSave} noValidate className="space-y-3">
          <div>
            <label
              htmlFor={`${fieldId}-title`}
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              标题
            </label>
            <input
              id={`${fieldId}-title`}
              ref={(element) => {
                fieldRefs.current.title = element;
                titleEditRef.current = element;
              }}
              type="text"
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? `${fieldId}-title-error` : undefined}
              className={`${inputClass} ${errors.title ? inputErrorClass : ''}`}
            />
            {errors.title ? (
              <p
                id={`${fieldId}-title-error`}
                role="alert"
                className="mt-1 text-xs font-medium text-red-600"
              >
                {errors.title}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${fieldId}-due-date`}
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                截止日期
              </label>
              <input
                id={`${fieldId}-due-date`}
                ref={(element) => {
                  fieldRefs.current.dueDate = element;
                }}
                type="date"
                value={draft.dueDate}
                onChange={(event) => updateDraft({ dueDate: event.target.value })}
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={
                  errors.dueDate ? `${fieldId}-due-date-error` : undefined
                }
                className={`${inputClass} ${errors.dueDate ? inputErrorClass : ''}`}
              />
              {errors.dueDate ? (
                <p
                  id={`${fieldId}-due-date-error`}
                  role="alert"
                  className="mt-1 text-xs font-medium text-red-600"
                >
                  {errors.dueDate}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor={`${fieldId}-priority`}
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                优先级
              </label>
              <select
                id={`${fieldId}-priority`}
                value={draft.priority}
                onChange={(event) => {
                  const next = PRIORITY_ORDER.find(
                    (priority) => priority === event.target.value
                  );
                  if (next) updateDraft({ priority: next });
                }}
                className={inputClass}
              >
                {PRIORITY_ORDER.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_META[priority].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor={`${fieldId}-category`}
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                分类
              </label>
              <input
                id={`${fieldId}-category`}
                ref={(element) => {
                  fieldRefs.current.category = element;
                }}
                type="text"
                value={draft.category}
                onChange={(event) => updateDraft({ category: event.target.value })}
                list={categoryListId}
                placeholder="未分类"
                aria-invalid={Boolean(errors.category)}
                aria-describedby={
                  errors.category ? `${fieldId}-category-error` : undefined
                }
                className={`${inputClass} ${errors.category ? inputErrorClass : ''}`}
              />
              <datalist id={categoryListId}>
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {errors.category ? (
                <p
                  id={`${fieldId}-category-error`}
                  role="alert"
                  className="mt-1 text-xs font-medium text-red-600"
                >
                  {errors.category}
                </p>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor={`${fieldId}-description`}
                className="mb-1 block text-xs font-medium text-slate-500"
              >
                描述
              </label>
              <textarea
                id={`${fieldId}-description`}
                ref={(element) => {
                  fieldRefs.current.description = element;
                }}
                rows={2}
                value={draft.description}
                onChange={(event) =>
                  updateDraft({ description: event.target.value })
                }
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? `${fieldId}-description-error` : undefined
                }
                className={`${inputClass} resize-y ${
                  errors.description ? inputErrorClass : ''
                }`}
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                {errors.description ? (
                  <p
                    id={`${fieldId}-description-error`}
                    role="alert"
                    className="text-xs font-medium text-red-600"
                  >
                    {errors.description}
                  </p>
                ) : (
                  <span />
                )}
                <span
                  className={`text-[11px] tabular-nums ${
                    draft.description.length > DESCRIPTION_MAX_LENGTH
                      ? 'text-red-500'
                      : 'text-slate-400'
                  }`}
                >
                  {draft.description.length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={requestDelete}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              删除
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
              >
                保存
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
            aria-label={`标记「${todo.title}」为${todo.completed ? '未完成' : '已完成'}`}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3
                className={`min-w-0 break-words text-sm font-semibold leading-6 ${
                  todo.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                }`}
              >
                {todo.title}
              </h3>

              {confirmDelete ? (
                <div
                  role="group"
                  aria-label="确认删除待办"
                  className="flex shrink-0 items-center gap-1.5"
                >
                  <span className="text-xs text-slate-500">确认删除？</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1"
                  >
                    删除
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        d="M4 14.5V16h1.5l8-8L12 6.5l-8 8ZM12.9 5.6l1.5 1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={requestDelete}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        d="M5 6h10M8 6V4.5h4V6M6.5 6l.5 9h6l.5-9M8.5 9v3.5M11.5 9v3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    删除
                  </button>
                </div>
              )}
            </div>

            {todo.description ? (
              <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-slate-500">
                {todo.description}
              </p>
            ) : null}

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${PRIORITY_META[todo.priority].badgeClass}`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${PRIORITY_META[todo.priority].dotClass}`}
                />
                {PRIORITY_META[todo.priority].label}优先级
              </span>

              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  categoryIsUncategorized
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                {todo.category}
              </span>

              {todo.dueDate ? (
                <span
                  className={`inline-flex items-center gap-1 text-xs ${
                    overdue ? 'font-medium text-red-600' : 'text-slate-500'
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-3.5 w-3.5"
                  >
                    <rect
                      x="3.5"
                      y="4.5"
                      width="13"
                      height="12"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M3.5 8.5h13M7 3.5v2M13 3.5v2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  截止 {formatDueDate(todo.dueDate)}
                </span>
              ) : null}

              {overdue ? (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                  逾期
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

export default memo(TodoItem);
