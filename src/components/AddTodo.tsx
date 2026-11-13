import { useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, RefObject } from 'react';
import { useTodoStore } from '@/store/todoStore';
import type { TodoDraft, TodoDraftErrors, TodoField, Priority } from '@/types/todo';
import { PRIORITY_META, PRIORITY_ORDER } from '@/utils/priority';
import {
  CATEGORY_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  firstInvalidField,
  toTodoInput,
  validateTodoDraft,
} from '@/utils/validation';

interface AddTodoProps {
  /** 由 App 持有，用于提交后把焦点还给标题输入框 */
  titleInputRef: RefObject<HTMLInputElement | null>;
}

const EMPTY_DRAFT: TodoDraft = {
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  dueDate: '',
};

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';
const inputErrorClass =
  'border-red-300 focus:border-red-400 focus:ring-red-100';

const AddTodo = ({ titleInputRef }: AddTodoProps) => {
  const addTodo = useTodoStore((state) => state.addTodo);
  const todos = useTodoStore((state) => state.todos);

  const [draft, setDraft] = useState<TodoDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<TodoDraftErrors>({});
  const [showDetails, setShowDetails] = useState(true);

  const fieldRefs = useRef<
    Partial<Record<TodoField, HTMLInputElement | HTMLTextAreaElement | null>>
  >({});

  const fieldId = useId();
  const descriptionId = `${fieldId}-description`;
  const categoryId = `${fieldId}-category`;
  const dueDateId = `${fieldId}-due-date`;
  const categoryListId = `${fieldId}-category-options`;

  const categoryOptions = useMemo(() => {
    const categories = new Set(todos.map((todo) => todo.category));
    return [...categories].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [todos]);

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

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateDraft({ title: event.target.value });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateTodoDraft(draft);
    setErrors(nextErrors);

    const firstInvalid = firstInvalidField(nextErrors);
    if (firstInvalid) {
      if (firstInvalid !== 'title') {
        setShowDetails(true);
      }
      // 等错误提示与详情区渲染完成后再聚焦。
      window.requestAnimationFrame(() => fieldRefs.current[firstInvalid]?.focus());
      return;
    }

    addTodo(toTodoInput(draft));
    setDraft(EMPTY_DRAFT);
    setErrors({});
    titleInputRef.current?.focus();
  };

  const handlePriorityChange = (priority: Priority) => {
    updateDraft({ priority });
  };

  return (
    <section
      aria-labelledby="add-todo-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="add-todo-heading" className="text-base font-semibold text-slate-900">
            添加待办
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            仅标题必填，其余信息可稍后补充。
          </p>
        </div>
        <span className="hidden rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-600 sm:inline">
          快速记录
        </span>
      </div>

      <form className="mt-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label htmlFor={`${fieldId}-title`} className="sr-only">
              待办标题
            </label>
            <input
              id={`${fieldId}-title`}
              ref={(element) => {
                fieldRefs.current.title = element;
                titleInputRef.current = element;
              }}
              type="text"
              value={draft.title}
              onChange={handleTitleChange}
              placeholder="需要做点什么？"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? `${fieldId}-title-error` : undefined}
              className={`${inputClass} py-2.5 text-base sm:text-sm ${
                errors.title ? inputErrorClass : ''
              }`}
            />
            {errors.title ? (
              <p
                id={`${fieldId}-title-error`}
                role="alert"
                className="mt-1.5 text-xs font-medium text-red-600"
              >
                {errors.title}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="h-4 w-4"
            >
              <path
                d="M10 4v12M4 10h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            添加
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            aria-expanded={showDetails}
            aria-controls={`${fieldId}-details`}
            className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-medium text-slate-500 transition hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className={`h-3.5 w-3.5 transition-transform ${
                showDetails ? 'rotate-180' : ''
              }`}
            >
              <path
                d="m5 8 5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {showDetails ? '收起详细信息' : '展开详细信息'}
          </button>
          <p className="text-[11px] text-slate-400">按 Enter 快速添加</p>
        </div>

        <div
          id={`${fieldId}-details`}
          className={`mt-4 border-t border-slate-100 pt-4 ${
            showDetails ? 'grid gap-4 sm:grid-cols-2' : 'hidden'
          }`}
        >
          <div className="sm:col-span-2">
            <label
              htmlFor={descriptionId}
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              描述
            </label>
            <textarea
              id={descriptionId}
              ref={(element) => {
                fieldRefs.current.description = element;
              }}
              rows={3}
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
              placeholder="补充背景、步骤或验收标准…"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? `${descriptionId}-error` : `${descriptionId}-counter`
              }
              className={`${inputClass} resize-y ${
                errors.description ? inputErrorClass : ''
              }`}
            />
            <div className="mt-1 flex items-start justify-between gap-3">
              {errors.description ? (
                <p
                  id={`${descriptionId}-error`}
                  role="alert"
                  className="text-xs font-medium text-red-600"
                >
                  {errors.description}
                </p>
              ) : (
                <span />
              )}
              <span
                id={`${descriptionId}-counter`}
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

          <div>
            <label
              htmlFor={dueDateId}
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              截止日期
            </label>
            <input
              id={dueDateId}
              ref={(element) => {
                fieldRefs.current.dueDate = element;
              }}
              type="date"
              value={draft.dueDate}
              onChange={(event) => updateDraft({ dueDate: event.target.value })}
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? `${dueDateId}-error` : undefined}
              className={`${inputClass} ${
                errors.dueDate ? inputErrorClass : ''
              }`}
            />
            {errors.dueDate ? (
              <p
                id={`${dueDateId}-error`}
                role="alert"
                className="mt-1.5 text-xs font-medium text-red-600"
              >
                {errors.dueDate}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={categoryId}
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              分类
            </label>
            <input
              id={categoryId}
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
                errors.category ? `${categoryId}-error` : `${categoryId}-hint`
              }
              className={`${inputClass} ${
                errors.category ? inputErrorClass : ''
              }`}
            />
            <datalist id={categoryListId}>
              {categoryOptions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {errors.category ? (
              <p
                id={`${categoryId}-error`}
                role="alert"
                className="mt-1.5 text-xs font-medium text-red-600"
              >
                {errors.category}
              </p>
            ) : (
              <p id={`${categoryId}-hint`} className="mt-1.5 text-[11px] text-slate-400">
                留空将归入「未分类」，最多 {CATEGORY_MAX_LENGTH} 个字符。
              </p>
            )}
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 block text-xs font-medium text-slate-600">
              优先级
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_ORDER.map((priority) => (
                <label key={priority} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`${fieldId}-priority`}
                    value={priority}
                    checked={draft.priority === priority}
                    onChange={() => handlePriorityChange(priority)}
                    className="peer sr-only"
                  />
                  <span className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-600 transition peer-checked:border-indigo-300 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300 peer-focus-visible:ring-offset-1">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full ${PRIORITY_META[priority].dotClass}`}
                    />
                    {PRIORITY_META[priority].label}优先级
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="text-[11px] text-slate-400 sm:col-span-2">
            截止日期早于今天也可以提交，列表会以「逾期」样式标记。标题上限 {TITLE_MAX_LENGTH} 字符。
          </p>
        </div>
      </form>
    </section>
  );
};

export default AddTodo;
