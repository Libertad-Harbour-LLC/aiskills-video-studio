"use client";
import { useState } from "react";
import { FiCopy, FiCheck, FiDownload } from "react-icons/fi";
import { useKit } from "@/lib/kit-i18n";
import { APP } from "@/lib/app.config";

export function saveText(text, name) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function CopyButton({ text, small }) {
  const { k } = useKit();
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {} ta.remove();
    }
    setOk(true); setTimeout(() => setOk(false), 1500);
  };
  return (
    <button type="button" onClick={copy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold bg-bg-elevated border border-glass-border text-primary-text hover:bg-bg-card-hover ${small ? "px-2.5 py-1 text-xs" : "px-3 py-2 text-sm"}`}>
      {ok ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />} {ok ? k("copied") : k("copy")}
    </button>
  );
}

export default function CopyBar({ text, id, extra }) {
  const { k } = useKit();
  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton text={text} />
      <button type="button" onClick={() => saveText(text, `${APP.id}-${String(id || Date.now()).slice(0, 8)}.md`)}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover">
        <FiDownload className="w-4 h-4" /> {k("downloadTxt")}
      </button>
      {extra}
    </div>
  );
}
