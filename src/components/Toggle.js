"use client";
export default function Toggle({ label, checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 w-full text-left">
      <span className="text-sm text-primary-text">{label}</span>
      <span className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-primary" : "bg-bg-elevated border border-glass-border"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${checked ? "left-[18px]" : "left-0.5 bg-white"}`} style={checked ? { background: "var(--color-primary-btn-text)" } : undefined} />
      </span>
    </button>
  );
}
