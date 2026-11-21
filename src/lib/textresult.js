// Server-only: text models return their answer as a small .txt file in result_urls.
// The route reads it here so the browser gets the text itself (no cross-origin fetch needed).
import "server-only";
import http from "node:http";
import https from "node:https";
import { API_BASE } from "@/lib/aiskills";

const MAX_BYTES = 400 * 1024;

export function readText(url) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch { return resolve(null); }
    const allowHttp = API_BASE.startsWith("http://");
    if (u.protocol !== "https:" && !(allowHttp && u.protocol === "http:")) return resolve(null);
    const lib = u.protocol === "http:" ? http : https;
    const req = lib.get(u, { timeout: 20_000, headers: { "User-Agent": "aiskills-app-template/1.0" } }, (res) => {
      if ((res.statusCode || 0) >= 300) { res.resume(); return resolve(null); }
      const chunks = [];
      let size = 0;
      res.on("data", (c) => {
        size += c.length;
        if (size > MAX_BYTES) { req.destroy(); return; }
        chunks.push(c);
      });
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", () => resolve(null));
    });
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(null));
  });
}
