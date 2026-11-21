"use client";
// Extra interface strings for the text, chat and audio templates (the base strings live in i18n.js).
import { useLang } from "@/lib/i18n";

const S = {
  en: {
    copy: "Copy", copied: "Copied", downloadTxt: "Download .md", print: "Print / PDF",
    writing: "Writing…", thinking: "Thinking…", send: "Send", typeMessage: "Type a message…",
    newChat: "New chat", perMessage: "per message", perSecond: "per second", seconds: "s",
    total: "total", step1: "Step 1 · start frame", step2: "Step 2 · video", chaining: "Frame is ready — animating it…",
    chatEmpty: "Start the conversation — each message is one paid AI request.",
    needText: "Fill in the required fields first.", tooLong: "The text is too long.",
    rawAnswer: "The answer could not be shown as a layout — here is the raw text.",
    err_bad_url: "Enter a valid public web address.", err_blocked_address: "This address is not public.",
    err_unreachable: "Could not open that page.", err_timeout: "The site did not answer in time.",
    err_too_many_redirects: "The page redirects too many times.", err_page_empty: "The page has no readable text.",
    err_prompt_too_long: "The request is too long — shorten the text.", err_missing_dialogue: "Add at least one line with text.",
    err_missing_input: "Fill in the required fields first.",
    audio: "Audio", play: "Play",
  },
  ru: {
    copy: "Копировать", copied: "Скопировано", downloadTxt: "Скачать .md", print: "Печать / PDF",
    writing: "Пишем…", thinking: "Думаю…", send: "Отправить", typeMessage: "Напишите сообщение…",
    newChat: "Новый чат", perMessage: "за сообщение", perSecond: "за секунду", seconds: "с",
    total: "итого", step1: "Шаг 1 · стартовый кадр", step2: "Шаг 2 · видео", chaining: "Кадр готов — оживляем его…",
    chatEmpty: "Начните разговор — каждое сообщение это один платный запрос к ИИ.",
    needText: "Сначала заполните обязательные поля.", tooLong: "Слишком длинный текст.",
    rawAnswer: "Ответ не удалось разложить по макету — вот текст как есть.",
    err_bad_url: "Введите правильный публичный адрес сайта.", err_blocked_address: "Это не публичный адрес.",
    err_unreachable: "Не удалось открыть страницу.", err_timeout: "Сайт не ответил вовремя.",
    err_too_many_redirects: "Страница слишком много раз перенаправляет.", err_page_empty: "На странице нет читаемого текста.",
    err_prompt_too_long: "Запрос слишком длинный — сократите текст.", err_missing_dialogue: "Добавьте хотя бы одну реплику с текстом.",
    err_missing_input: "Сначала заполните обязательные поля.",
    audio: "Аудио", play: "Слушать",
  },
};

export function useKit() {
  const ctx = useLang();
  const k = (key) => S[ctx.lang]?.[key] ?? S.en[key] ?? ctx.t(key);
  // Error code → text: kit strings first, then the base ones.
  const err = (code) => {
    const a = S[ctx.lang]?.[`err_${code}`];
    if (a) return a;
    const b = ctx.t(`err_${code}`);
    return b.startsWith("err_") ? ctx.t("err_generic") : b;
  };
  return { ...ctx, k, err };
}

// Model answers often come wrapped in ```json fences or with text around — take the JSON object out.
export function parseJson(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/, "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
}
