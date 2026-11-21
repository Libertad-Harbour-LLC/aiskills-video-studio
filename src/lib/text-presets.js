// Shared presets for the text templates (safe on server and client).
export const LANGUAGES = [
  { id: "auto", label: { en: "Same as my text", ru: "Как в моём тексте" }, name: "the same language as the user's input" },
  { id: "en", label: { en: "English", ru: "Английский" }, name: "English" },
  { id: "ru", label: { en: "Russian", ru: "Русский" }, name: "Russian" },
  { id: "es", label: { en: "Spanish", ru: "Испанский" }, name: "Spanish" },
  { id: "de", label: { en: "German", ru: "Немецкий" }, name: "German" },
  { id: "fr", label: { en: "French", ru: "Французский" }, name: "French" },
  { id: "pt", label: { en: "Portuguese", ru: "Португальский" }, name: "Portuguese" },
  { id: "it", label: { en: "Italian", ru: "Итальянский" }, name: "Italian" },
  { id: "uk", label: { en: "Ukrainian", ru: "Украинский" }, name: "Ukrainian" },
  { id: "kk", label: { en: "Kazakh", ru: "Казахский" }, name: "Kazakh" },
  { id: "tr", label: { en: "Turkish", ru: "Турецкий" }, name: "Turkish" },
  { id: "ar", label: { en: "Arabic", ru: "Арабский" }, name: "Arabic" },
  { id: "zh", label: { en: "Chinese", ru: "Китайский" }, name: "Simplified Chinese" },
  { id: "ja", label: { en: "Japanese", ru: "Японский" }, name: "Japanese" },
];
export const langName = (id) => (LANGUAGES.find((l) => l.id === id) || LANGUAGES[0]).name;
