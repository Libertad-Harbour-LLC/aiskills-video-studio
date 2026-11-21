import "server-only";
import { ENGINES } from "@/lib/app.config";
import { PlanError, pick, urls } from "@/lib/plan-helpers";

// Visitor's choice → one generation. Only models from ENGINES can be started.
export function plan(body) {
  const e = ENGINES.find((x) => x.id === body.engine) || ENGINES[0];
  const fromImage = body.mode === "image";
  const prompt = String(body.prompt || "").replace(/\s+/g, " ").trim().slice(0, 2000);
  if (prompt.length < 3) throw new PlanError("Describe the scene", "missing_input");
  const params = {};
  const aspects = fromImage ? e.i2vAspects : e.aspects;
  if (aspects) params.aspect_ratio = pick(body.aspect, aspects, aspects[0]);
  if (e.durations.length > 1) params.duration = pick(Number(body.duration), e.durations, e.durations[0]);
  if (e.resolutions) params.resolution = pick(body.resolution, e.resolutions, e.resolutions[0]);
  const job = { model: fromImage ? e.i2v : e.t2v, prompt, params };
  if (fromImage) job.inputs = { image_urls: urls(body.inputs, "image", { name: "start frame" }) };
  return [job];
}
