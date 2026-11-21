"use client";
import { LANGUAGES } from "@/lib/text-presets";
import { useLang } from "@/lib/i18n";

export default function LangSelect({ value, onChange, label }) {
  const { tx, lang } = useLang();
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-primary-text">{label || (lang === "ru" ? "Язык результата" : "Output language")}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-bg-elevated border border-glass-border px-3 py-2.5 text-sm text-primary-text focus:outline-none focus:ring-1 focus:ring-primary-500">
        {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{tx(l.label)}</option>)}
      </select>
    </label>
  );
}
