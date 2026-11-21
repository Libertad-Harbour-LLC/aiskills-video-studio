"use client";
// Small, safe Markdown renderer (no HTML injection): headings, lists, quotes, code, tables, bold/italic, links.
import { Fragment } from "react";

function inline(text, keyBase) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**") || tok.startsWith("__")) out.push(<strong key={key} className="font-bold text-primary-text">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={key} className="px-1 py-0.5 rounded bg-bg-elevated text-[0.9em]">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("[")) {
      const label = tok.slice(1, tok.indexOf("]"));
      out.push(<a key={key} href={m[2]} target="_blank" rel="noopener noreferrer nofollow" className="underline text-primary-400">{label}</a>);
    } else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text, className = "" }) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={blocks.length} className="rounded-xl bg-bg-elevated border border-glass-border p-3 overflow-x-auto text-xs whitespace-pre-wrap break-words">{buf.join("\n")}</pre>);
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      const cls = lvl === 1 ? "text-2xl font-black mt-2" : lvl === 2 ? "text-xl font-bold mt-4" : "text-base font-bold mt-3";
      blocks.push(<div key={blocks.length} role="heading" aria-level={lvl} className={`${cls} text-primary-text`}>{inline(h[2], `h${i}`)}</div>);
      i++; continue;
    }
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, ""));
        i++;
      }
      const L = ordered ? "ol" : "ul";
      blocks.push(<L key={blocks.length} className={`${ordered ? "list-decimal" : "list-disc"} pl-5 space-y-1`}>
        {items.map((t, j) => <li key={j}>{inline(t, `l${i}-${j}`)}</li>)}
      </L>);
      continue;
    }
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={blocks.length} className="border-l-2 border-primary-500 pl-3 text-secondary-text">{inline(buf.join(" "), `q${i}`)}</blockquote>);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(lines[i++]);
      const cells = rows.filter((r) => !/^\s*\|[\s:|-]+\|\s*$/.test(r)).map((r) => r.trim().slice(1, -1).split("|").map((c) => c.trim()));
      blocks.push(
        <div key={blocks.length} className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <tbody>{cells.map((r, a) => (
              <tr key={a} className={a === 0 ? "font-bold" : ""}>{r.map((c, b) => <td key={b} className="border border-glass-border px-2 py-1 align-top">{inline(c, `t${a}-${b}`)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>);
      continue;
    }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { blocks.push(<hr key={blocks.length} className="border-divider/50" />); i++; continue; }
    if (!line.trim()) { i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\s*([-*+]|\d+[.)])\s+|\s*>|\s*\|)/.test(lines[i])) buf.push(lines[i++]);
    blocks.push(<p key={blocks.length}>{buf.map((b, j) => <Fragment key={j}>{j > 0 && <br />}{inline(b, `p${i}-${j}`)}</Fragment>)}</p>);
  }
  return <div className={`space-y-3 text-sm leading-relaxed text-primary-text/90 break-words ${className}`}>{blocks}</div>;
}
