"use client";
// Multi-select chips: value is an array of ids.
export default function MultiChips({ label, hint, options, value = [], onChange, render, max }) {
  const toggle = (id) => {
    if (value.includes(id)) { if (value.length > 1) onChange(value.filter((v) => v !== id)); return; }
    if (max && value.length >= max) return;
    onChange([...value, id]);
  };
  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-semibold text-primary-text">{label}</div>}
      {hint && <div className="text-xs text-secondary-text">{hint}</div>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button key={o} type="button" onClick={() => toggle(o)} aria-pressed={on}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${on
                ? "bg-primary-500/20 border-primary-500 text-primary-text"
                : "bg-bg-elevated border-glass-border text-secondary-text hover:text-primary-text"}`}>
              {render ? render(o) : o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
