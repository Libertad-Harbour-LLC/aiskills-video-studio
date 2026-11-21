// Video Studio — text → video or image → video with a choice of the AI SKILLS video models.
// Each engine is a pair of catalog models (from text / from a photo); the visitor can only pick from this list.

export const ENGINES = [
  { id: "veo-lite", name: "Veo 3.1 Lite", t2v: "veo31-lite", i2v: "veo31-lite-i2v", durations: [8], aspects: ["9:16", "16:9"], i2vAspects: ["9:16", "16:9"],
    resolutions: ["720p", "1080p"], resMult: { "1080p": 1.3 },
    note: { en: "8 s with sound and speech. Put spoken lines in quotes.", ru: "8 с со звуком и речью. Реплики — в кавычках." } },
  { id: "veo-fast", name: "Veo 3.1 Fast", t2v: "veo-3-1-fast", i2v: "veo31-fast-i2v", durations: [8], aspects: ["9:16", "16:9"], i2vAspects: ["9:16", "16:9"],
    resolutions: ["720p", "1080p"], resMult: { "1080p": 1.3 },
    note: { en: "Higher quality, 8 s with sound and speech.", ru: "Качество выше, 8 с со звуком и речью." } },
  { id: "kling", name: "Kling 4.0", t2v: "kling-4-t2v", i2v: "kling-4-keyframe", durations: [5, 10, 15], aspects: ["16:9", "9:16", "1:1"], i2vAspects: null,
    note: { en: "720p with sound, up to 15 s. From a photo the format follows the photo.", ru: "720p со звуком, до 15 с. Из фото формат берётся с фото." } },
  { id: "wan", name: "Wan 3.0 Prime", t2v: "wan30-prime-t2v", i2v: "wan30-prime-i2v", durations: [5, 10, 15], aspects: ["16:9", "9:16", "1:1", "4:3", "3:4"], i2vAspects: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    note: { en: "720p with sound, 5–15 s.", ru: "720p со звуком, 5–15 с." } },
  { id: "seedance", name: "Seedance 2.5 · 480p", t2v: "seedance-25-t2v-480", i2v: "seedance-25-i2v-480", durations: [5, 10, 15], aspects: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], i2vAspects: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    note: { en: "Fast 480p drafts with strong motion.", ru: "Быстрые черновики 480p с сильной динамикой." } },
  { id: "grok", name: "Grok Imagine Video 1.5", t2v: "grok-imagine-video-1-5-text-to-video", i2v: "grok-imagine-video-1-5-image-to-video", durations: [5, 10, 15],
    aspects: ["16:9", "9:16", "1:1", "4:3", "3:4"], i2vAspects: null, resolutions: ["720p"],
    note: { en: "The most affordable: 720p with sound.", ru: "Самый доступный: 720p со звуком." } },
  { id: "horse", name: "HappyHorse 1.1", t2v: "happy-horse-1.1-text-to-video-720p", i2v: "happyhorse-i2v", durations: [5, 10], aspects: ["16:9", "9:16", "1:1", "4:3", "3:4"], i2vAspects: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    note: { en: "Expressive character animation, 720p.", ru: "Выразительная анимация персонажей, 720p." } },
];
export const engineOf = (s) => ENGINES.find((e) => e.id === s.engine) || ENGINES[0];
export const modelOf = (s) => (s.mode === "image" ? engineOf(s).i2v : engineOf(s).t2v);

export const APP = {
  id: "video-studio",
  name: "Video Studio",
  theme: "midnight",
  tagline: { en: "Text or photo → video", ru: "Текст или фото → видео" },
  kicker: { en: "AI video generator", ru: "ИИ-генератор видео" },
  headline: { en: "Make a video from a sentence or a photo", ru: "Видео из одной фразы или фотографии" },
  description: {
    en: "Describe a scene or add a photo, pick one of the leading video models, the format and length — get a ready clip, most of them with sound.",
    ru: "Опишите сцену или добавьте фото, выберите одну из ведущих видеомоделей, формат и длину — получите готовый ролик, у большинства моделей со звуком.",
  },
  cta: { en: "Generate video", ru: "Создать видео" },
  emptyText: { en: "Describe the scene, choose a model and press “Generate video”. Videos take 1–5 minutes.", ru: "Опишите сцену, выберите модель и нажмите «Создать видео». Видео делается 1–5 минут." },
  needText: { en: "Describe the scene (and add a photo in the photo mode).", ru: "Опишите сцену (а в режиме «Из фото» добавьте фото)." },
  models: ENGINES.flatMap((e) => [e.t2v, e.i2v]),
  upload: { types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 20 * 1024 * 1024 },
  modes: [
    { id: "text", label: { en: "From text", ru: "Из текста" }, desc: { en: "Describe the scene in words.", ru: "Опишите сцену словами." } },
    { id: "image", label: { en: "From a photo", ru: "Из фото" }, desc: { en: "Your photo becomes the first frame and comes to life.", ru: "Ваше фото станет первым кадром и оживёт." } },
  ],
  slots: [{ key: "image", kind: "image", min: 1, max: 1, modes: ["image"],
    label: { en: "Start frame", ru: "Первый кадр" },
    hint: { en: "JPG or PNG, at least 300 px on the short side.", ru: "JPG или PNG, не меньше 300 px по короткой стороне." } }],
  compare: false,
  initialState: () => ({ mode: "text", engine: "veo-lite", prompt: "", aspect: "9:16", duration: 8, resolution: "720p" }),
  ready: (s) => s.prompt.trim().length >= 3 && s.prompt.length <= 2000,
  priceModel: modelOf,
  priceText: (s, prices, t) => {
    const p = prices?.[modelOf(s)];
    if (!p) return null;
    const e = engineOf(s);
    if (p.cents_per_second != null) return `$${(p.cents_per_second / 100).toFixed(2)}/s × ${s.duration} s = $${((p.cents_per_second * s.duration) / 100).toFixed(2)}`;
    if (p.cents != null) return `$${((p.cents * (e.resMult?.[s.resolution] || 1)) / 100).toFixed(2)}`;
    if (p.from_cents != null) return `${t("priceFrom")} $${(p.from_cents / 100).toFixed(2)}`;
    return null;
  },
  label: (s) => `${engineOf(s).name} · ${s.prompt.slice(0, 40)}`,
};
