"use client";

import { ENGINES, engineOf } from "@/lib/app.config";
import { useLang } from "@/lib/i18n";

export default function Options({ state, set, Chips, Field, cfg }) {
  const { lang, tx, t } = useLang();
  const ru = lang === "ru";
  const e = engineOf(state);
  const aspects = state.mode === "image" ? e.i2vAspects : e.aspects;
  const choose = (id) => {
    const n = ENGINES.find((x) => x.id === id);
    set({
      engine: id,
      duration: n.durations.includes(state.duration) ? state.duration : n.durations[0],
      aspect: (n.aspects || []).includes(state.aspect) ? state.aspect : (n.aspects || ["9:16"])[0],
      resolution: n.resolutions?.[0] || "720p",
    });
  };
  const price = (n) => {
    const p = cfg?.prices?.[state.mode === "image" ? n.i2v : n.t2v];
    if (!p) return "";
    return p.cents_per_second != null ? `$${(p.cents_per_second / 100).toFixed(2)}/s` : p.cents != null ? `$${(p.cents / 100).toFixed(2)}` : "";
  };
  return (
    <>
      <Field label={ru ? "Что происходит в кадре" : "What happens in the shot"} required rows={5} max={2000} value={state.prompt} onChange={(v) => set({ prompt: v })}
        placeholder={ru ? "Бумажный кораблик плывёт по дождливой улице вечернего города, отражения фонарей, камера медленно едет следом"
          : "A paper boat sails down a rainy evening street, reflections of street lights, the camera slowly follows it"} />
      <div className="space-y-2">
        <div className="text-sm font-semibold text-primary-text">{ru ? "Модель" : "Model"}</div>
        <div className="grid gap-2" role="radiogroup">
          {ENGINES.map((n) => (
            <button key={n.id} type="button" role="radio" aria-checked={state.engine === n.id} onClick={() => choose(n.id)}
              className={`text-left rounded-xl border px-3 py-2 transition-colors ${state.engine === n.id ? "border-primary-500 bg-primary-500/10" : "border-glass-border bg-bg-elevated hover:bg-bg-card-hover"}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-primary-text">{n.name}</span>
                <span className="text-xs text-secondary-text shrink-0">{price(n)}</span>
              </div>
              <div className="text-xs text-secondary-text">{tx(n.note)}</div>
            </button>
          ))}
        </div>
      </div>
      {aspects && <Chips label={t("aspect")} options={aspects} value={aspects.includes(state.aspect) ? state.aspect : aspects[0]} onChange={(v) => set({ aspect: v })} />}
      {e.durations.length > 1 && (
        <Chips label={ru ? "Длительность" : "Duration"} options={e.durations} value={state.duration} onChange={(v) => set({ duration: v })} render={(v) => `${v} ${ru ? "с" : "s"}`} />
      )}
      {e.resolutions?.length > 1 && <Chips label={t("resolution")} options={e.resolutions} value={state.resolution} onChange={(v) => set({ resolution: v })} />}
    </>
  );
}
