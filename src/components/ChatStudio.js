"use client";
// Chat layout for conversational apps: settings on the left, the conversation on the right.
// Every message the visitor sends is ONE paid generation; the server (src/lib/plan.js) builds the
// prompt from the app's presets and the recent messages.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiSend, FiLoader, FiAlertTriangle, FiLock, FiRotateCcw } from "react-icons/fi";
import { APP } from "@/lib/app.config";
import { useKit } from "@/lib/kit-i18n";
import Markdown from "./Markdown";
import { Chips, Field, priceLabel } from "./Studio";
import { CopyButton } from "./CopyBar";
import Options from "./Options";

const CHATS_KEY = `${APP.id}:chats`;
const CODE_KEY = `${APP.id}:access-code`;
const STATE_KEY = `${APP.id}:state`;
const TERMINAL = new Set(["completed", "failed", "refunded"]);

function readChats() { try { return JSON.parse(localStorage.getItem(CHATS_KEY) || "{}"); } catch { return {}; } }
function writeChats(c) {
  try { localStorage.setItem(CHATS_KEY, JSON.stringify(c)); } catch {
    // Storage full: keep only the current conversations' last messages.
    try { localStorage.setItem(CHATS_KEY, JSON.stringify(Object.fromEntries(Object.entries(c).map(([a, b]) => [a, b.slice(-20)])))); } catch {}
  }
}

export default function ChatStudio() {
  const { t, tx, k, err: errText, lang } = useKit();
  const [cfg, setCfg] = useState(null);
  const [code, setCode] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [needCode, setNeedCode] = useState(false);
  const [state, setState] = useState(() => APP.initialState());
  const [chats, setChats] = useState({});
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setCfg).catch(() => setCfg({ configured: false }));
    setChats(readChats());
    try {
      setCode(localStorage.getItem(CODE_KEY) || "");
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      if (saved && typeof saved === "object") setState((s) => ({ ...s, ...saved }));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(STATE_KEY, JSON.stringify(APP.persist ? APP.persist(state) : state)); } catch {} }, [state, loaded]);
  useEffect(() => { if (cfg?.accessCode && !code) setNeedCode(true); }, [cfg, code]);

  const headers = useMemo(() => ({ "Content-Type": "application/json", ...(code ? { "x-access-code": code } : {}) }), [code]);
  const set = (patch) => setState((s) => ({ ...s, ...patch }));
  const key = APP.chat.key(state);
  const greeting = APP.chat.greeting ? APP.chat.greeting(state, tx) : null;
  const messages = chats[key] || [];
  const shown = greeting ? [{ role: "assistant", text: greeting, greeting: true }, ...messages] : messages;
  const price = cfg?.prices?.[APP.priceModel(state)];
  const pLabel = priceLabel(price, t);
  const blocked = APP.chat.blocked ? APP.chat.blocked(state, tx) : null;

  const update = useCallback((ck, fn) => {
    setChats((cur) => {
      const next = { ...cur, [ck]: fn(cur[ck] || []).slice(-60) };
      writeChats(next);
      return next;
    });
  }, []);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [shown.length, key, messages[messages.length - 1]?.status]);

  // Poll pending answers.
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  const poll = useCallback(async () => {
    const all = chatsRef.current;
    for (const [ck, list] of Object.entries(all)) {
      for (const m of list) {
        if (m.role !== "assistant" || !m.id || TERMINAL.has(m.status)) continue;
        const g = await fetch(`/api/generations/${m.id}`, { headers, cache: "no-store" }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
        if (!g || !TERMINAL.has(g.status)) continue;
        update(ck, (l) => l.map((x) => (x.id === m.id ? { ...x, status: g.status, text: g.text ?? "", error: g.error } : x)));
      }
    }
  }, [headers, update]);
  const pending = Object.values(chats).some((l) => l.some((m) => m.role === "assistant" && m.id && !TERMINAL.has(m.status)));
  useEffect(() => {
    if (!pending) return;
    const id = setInterval(poll, 3000);
    const first = setTimeout(poll, 1500);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [pending, poll]);

  const send = async () => {
    const text = draft.trim();
    setErr("");
    if (!text || busy || blocked) return;
    if (messages.some((m) => m.role === "assistant" && !TERMINAL.has(m.status))) return;
    const ck = key;
    const history = [...(greeting ? [{ role: "assistant", text: greeting }] : []),
      ...messages.filter((m) => m.role === "user" || m.status === "completed").map((m) => ({ role: m.role, text: m.text })),
      { role: "user", text }];
    setBusy(true);
    try {
      const r = await fetch("/api/generate", { method: "POST", headers, body: JSON.stringify({ ...state, lang, messages: history.slice(-24) }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d.error === "access_code_required") { setNeedCode(true); setCode(""); }
        setErr(d.error === "bad_args" || d.error === "missing_input" ? (d.message || k("needText")) : errText(d.error || "generic"));
        return;
      }
      setDraft("");
      update(ck, (l) => [...l, { role: "user", text, at: Date.now() }, { role: "assistant", id: d.items[0].id, status: "processing", text: "", at: Date.now() }]);
    } catch {
      setErr(t("err_generic"));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => update(key, () => []);
  const saveCode = () => {
    const v = codeDraft.trim();
    if (!v) return;
    setCode(v);
    try { localStorage.setItem(CODE_KEY, v); } catch {}
    setNeedCode(false);
  };
  const waiting = messages.some((m) => m.role === "assistant" && !TERMINAL.has(m.status));

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <section className="mb-8 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-glass-border bg-glass-bg text-[11px] font-bold uppercase tracking-widest text-secondary-text mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" /> {tx(APP.kicker)}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-primary-text leading-[1.05]">{tx(APP.headline)}</h1>
        <p className="mt-3 text-base sm:text-lg text-secondary-text">{tx(APP.description)}</p>
      </section>

      {cfg && !cfg.configured && (
        <div className="mb-6 rounded-2xl border border-secondary-500/50 bg-secondary-500/10 p-4 text-sm text-primary-text">{t("notConfigured")}</div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] gap-6 items-start">
        <div className="rounded-3xl border border-glass-border bg-bg-card p-5 sm:p-6 space-y-6 min-w-0">
          <Options state={state} set={set} Chips={Chips} Field={Field} cfg={cfg} headers={headers} chats={chats} />
        </div>

        <div className="rounded-3xl border border-glass-border bg-bg-card flex flex-col min-w-0 h-[min(78vh,760px)] min-h-[480px]">
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-divider/40">
            <div className="min-w-0 flex items-center gap-3">
              {APP.chat.avatar ? (() => { const a = APP.chat.avatar(state); return (
                <span className="w-10 h-10 rounded-2xl grid place-items-center font-black text-white shrink-0" style={{ background: a.color || "#6366f1" }}>{(a.name || "?").charAt(0).toUpperCase()}</span>); })() : null}
              <div className="min-w-0">
                <div className="font-bold text-primary-text truncate">{APP.chat.title(state, tx)}</div>
                {APP.chat.subtitle && <div className="text-xs text-secondary-text truncate">{APP.chat.subtitle(state, tx)}</div>}
              </div>
            </div>
            <button type="button" onClick={reset} disabled={!messages.length || waiting}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs text-secondary-text hover:text-primary-text disabled:opacity-40">
              <FiRotateCcw className="w-3.5 h-3.5" /> {k("newChat")}
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4" aria-live="polite">
            {blocked ? (
              <div className="h-full grid place-items-center text-center text-sm text-secondary-text px-6">{blocked}</div>
            ) : !shown.length ? (
              <div className="h-full grid place-items-center text-center text-sm text-secondary-text px-6">{APP.chat.empty ? tx(APP.chat.empty) : k("chatEmpty")}</div>
            ) : shown.map((m, i) => (
              <div key={m.id || `${m.role}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${m.role === "user"
                  ? "bg-primary-500/20 border border-primary-500/40 text-primary-text text-sm whitespace-pre-wrap break-words"
                  : "bg-bg-elevated border border-glass-border"}`}>
                  {m.role === "user" ? m.text
                    : m.status && !TERMINAL.has(m.status)
                      ? <span className="inline-flex items-center gap-2 text-sm text-secondary-text"><FiLoader className="w-4 h-4 animate-spin" /> {k("thinking")}</span>
                      : m.status && m.status !== "completed"
                        ? <span className="inline-flex items-center gap-2 text-sm text-secondary-text"><FiAlertTriangle className="w-4 h-4 text-secondary-500" /> {t("failed")}</span>
                        : <div className="space-y-2">
                            {APP.chat.renderAnswer ? APP.chat.renderAnswer(m.text) : <Markdown text={m.text} />}
                            {!m.greeting && APP.chat.copy !== false && <CopyButton text={APP.chat.copyText ? APP.chat.copyText(m.text) : m.text} small />}
                          </div>}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-divider/40 p-4 sm:p-5 space-y-2">
            <div className="flex gap-2 items-end">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} maxLength={APP.chat.maxInput || 1500}
                placeholder={APP.chat.placeholder ? tx(APP.chat.placeholder) : k("typeMessage")} disabled={Boolean(blocked)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                className="flex-1 min-w-0 resize-none rounded-xl bg-bg-elevated border border-glass-border px-3 py-2.5 text-sm text-primary-text placeholder:text-secondary-text/70 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <button type="button" onClick={send} disabled={busy || waiting || !draft.trim() || Boolean(blocked) || (cfg && !cfg.configured)} aria-label={k("send")}
                className="shrink-0 h-11 w-11 sm:w-auto sm:px-4 inline-flex items-center justify-center gap-2 rounded-xl font-bold bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                <span className="hidden sm:inline">{k("send")}</span>
              </button>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[11px] text-secondary-text">
              <span>{pLabel ? <><span className="font-bold text-primary-text">{pLabel}</span> {k("perMessage")}</> : null}</span>
              <span>{t("charged")}</span>
            </div>
            {err && <p role="alert" className="text-sm text-secondary-500">{err}</p>}
          </div>
        </div>
      </div>

      {needCode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-glass-border bg-bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold text-primary-text"><FiLock /> {t("accessTitle")}</div>
            <p className="text-sm text-secondary-text">{t("accessText")}</p>
            <input value={codeDraft} onChange={(e) => setCodeDraft(e.target.value)} type="password" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") saveCode(); }}
              className="w-full rounded-xl bg-bg-elevated border border-glass-border px-3 py-2.5 text-sm text-primary-text focus:outline-none focus:ring-1 focus:ring-primary-500" />
            <button type="button" onClick={saveCode} className="w-full rounded-xl py-2.5 font-bold bg-primary hover:bg-primary-hover">{t("accessSave")}</button>
          </div>
        </div>
      )}
    </main>
  );
}
