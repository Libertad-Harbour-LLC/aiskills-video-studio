import "server-only";
// Fit the recent conversation into the prompt budget of a text model (4,000 characters per request),
// newest messages first; older ones are dropped.
export function transcript(messages, { budget = 3000, userName = "User", botName = "Assistant", maxEach = 1500 } = {}) {
  const list = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim())
    .map((m) => ({ role: m.role, text: m.text.replace(/\s+\n/g, "\n").trim().slice(0, maxEach) }));
  const out = [];
  let used = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    const line = `${list[i].role === "user" ? userName : botName}: ${list[i].text}`;
    if (used + line.length + 2 > budget) break;
    out.unshift(line);
    used += line.length + 2;
  }
  return { lines: out, last: list[list.length - 1] || null };
}
