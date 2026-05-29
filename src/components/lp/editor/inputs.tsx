'use client';
/**
 * Form-Input-Primitives für Section-Config-Panel.
 *
 * Single-Concern Inputs (Text/Textarea/Url) + Repeating-Helpers (ListInput,
 * ObjectListInput) für Arrays in den Configs.
 */
import React from 'react';

type BaseProps = {
  label: string;
  hint?: string;
  required?: boolean;
};

export function TextInput({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
}: BaseProps & { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block mb-3">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        type={type}
        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:border-brand"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <span className="text-[11px] text-slate-500 mt-1 block">{hint}</span>}
    </label>
  );
}

export function TextareaInput({
  label,
  hint,
  value,
  onChange,
  rows = 3,
  placeholder,
}: BaseProps & { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <label className="block mb-3">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <textarea
        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand resize-y"
        rows={rows}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <span className="text-[11px] text-slate-500 mt-1 block">{hint}</span>}
    </label>
  );
}

/**
 * StringListInput — repeating einzeiliger Inputs für string[].
 * Beispiel: kf-bsh-content.items, bsh-final.bullets
 */
export function StringListInput({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: BaseProps & { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const update = (i: number, v: string) => onChange(values.map((x, j) => (i === j ? v : x)));
  const add = () => onChange([...(values || []), '']);
  const remove = (i: number) => onChange(values.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= values.length) return;
    const c = [...values];
    [c[i], c[j]] = [c[j], c[i]];
    onChange(c);
  };
  return (
    <div className="mb-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      {hint && <div className="text-[11px] text-slate-500 mb-2">{hint}</div>}
      <div className="space-y-2">
        {(values || []).map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand"
              value={v}
              onChange={e => update(i, e.target.value)}
              placeholder={placeholder}
            />
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-2 rounded bg-slate-100 hover:bg-slate-200 text-xs disabled:opacity-30">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === values.length - 1} className="px-2 rounded bg-slate-100 hover:bg-slate-200 text-xs disabled:opacity-30">↓</button>
            <button type="button" onClick={() => remove(i)} className="px-2 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs">×</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-semibold"
      >
        + Eintrag
      </button>
    </div>
  );
}

/**
 * ObjectListInput — repeating Cards für object[].
 *
 * Renderer-Function bekommt einzelnes Item + onChange-Patch.
 * Beispiel: bsh-usps.cards, bsh-steps.steps, bsh-team.people, bsh-faq.items, bsh-member.logos
 */
export function ObjectListInput<T extends Record<string, any>>({
  label,
  hint,
  values,
  onChange,
  newItem,
  renderItem,
  itemLabel,
}: BaseProps & {
  values: T[];
  onChange: (v: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, patch: (p: Partial<T>) => void) => React.ReactNode;
  itemLabel?: (item: T, i: number) => string;
}) {
  const patch = (i: number, p: Partial<T>) => onChange(values.map((x, j) => (i === j ? { ...x, ...p } : x)));
  const add = () => onChange([...(values || []), newItem()]);
  const remove = (i: number) => onChange(values.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= values.length) return;
    const c = [...values];
    [c[i], c[j]] = [c[j], c[i]];
    onChange(c);
  };
  return (
    <div className="mb-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      {hint && <div className="text-[11px] text-slate-500 mb-2">{hint}</div>}
      <div className="space-y-3">
        {(values || []).map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600">
                {itemLabel ? itemLabel(item, i) : `#${i + 1}`}
              </span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-xs px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === values.length - 1} className="text-xs px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30">↓</button>
                <button type="button" onClick={() => remove(i)} className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100">🗑</button>
              </div>
            </div>
            {renderItem(item, p => patch(i, p))}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-semibold"
      >
        + Eintrag
      </button>
    </div>
  );
}
