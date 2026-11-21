// Server-only: read a public web page for the visitor (GEO check, knowledge-base sources).
// Guards against SSRF: http(s) only, standard ports, every hop (redirects included) must resolve to a
// public IP address — the address is checked inside the DNS lookup the socket actually uses.
import "server-only";
import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import net from "node:net";

export class FetchError extends Error {
  constructor(code, message) { super(message || code); this.code = code; }
}

function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const s = ip.toLowerCase();
  if (s === "::" || s === "::1") return true;
  if (s.startsWith("::ffff:")) return privateIp(s.slice(7));
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(s);
}

// Local testing against the mock: SAFEFETCH_ALLOW_LOCAL=1 lets 127.0.0.1 through. Never set it on Vercel.
const allowLocal = () => process.env.SAFEFETCH_ALLOW_LOCAL === "1";

function guardedLookup(hostname, options, cb) {
  if (typeof options === "function") { cb = options; options = {}; }
  dns.lookup(hostname, { family: options?.family || 0, all: true }, (err, list) => {
    if (err) return cb(err);
    const ok = (list || []).filter((a) => allowLocal() || !privateIp(a.address));
    if (!ok.length || ok.length !== list.length) return cb(new FetchError("blocked_address", "This address is not public"));
    if (options?.all) return cb(null, ok);
    cb(null, ok[0].address, ok[0].family);
  });
}

function once(url, { accept, maxBytes, timeout }) {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "http:" ? http : https;
    const req = lib.request(url, {
      method: "GET", timeout, lookup: guardedLookup,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AISkillsAppTemplate/1.0; +https://aiskills.team)",
        Accept: accept, "Accept-Language": "en,ru;q=0.8",
      },
    }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        return resolve({ redirect: res.headers.location, status });
      }
      const chunks = [];
      let size = 0;
      res.on("data", (c) => {
        size += c.length;
        if (size > maxBytes) { res.destroy(); resolve({ status, type: String(res.headers["content-type"] || ""), body: Buffer.concat(chunks).toString("utf8"), truncated: true }); return; }
        chunks.push(c);
      });
      res.on("end", () => resolve({ status, type: String(res.headers["content-type"] || ""), body: Buffer.concat(chunks).toString("utf8") }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new FetchError("timeout", "The site did not answer in time")));
    req.on("error", (e) => reject(e instanceof FetchError ? e : new FetchError(e.code === "blocked_address" ? "blocked_address" : "unreachable", "Could not open the page")));
    req.end();
  });
}

export function normalizeUrl(raw) {
  let s = typeof raw === "string" ? raw.trim() : "";
  if (!s || s.length > 2000) throw new FetchError("bad_url", "Enter a web address");
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u;
  try { u = new URL(s); } catch { throw new FetchError("bad_url", "Enter a valid web address"); }
  if (!["http:", "https:"].includes(u.protocol)) throw new FetchError("bad_url", "Only http(s) addresses");
  if (u.port && !["80", "443"].includes(u.port) && !allowLocal()) throw new FetchError("bad_url", "Only standard ports");
  if (u.username || u.password) throw new FetchError("bad_url", "Addresses with a login are not allowed");
  u.hash = "";
  return u;
}

export async function safeFetch(raw, { accept = "text/html,text/plain;q=0.9,*/*;q=0.5", maxBytes = 1_500_000, timeout = 12_000 } = {}) {
  let url = raw instanceof URL ? raw : normalizeUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    const r = await once(url, { accept, maxBytes, timeout });
    if (!r.redirect) return { ...r, url: url.toString() };
    url = normalizeUrl(new URL(r.redirect, url).toString());
  }
  throw new FetchError("too_many_redirects", "Too many redirects");
}

// Rough, dependency-free HTML → text.
export function htmlToText(html) {
  return String(html || "")
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
