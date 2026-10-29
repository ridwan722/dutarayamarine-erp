type TranslationLanguage = "id" | "en";

interface TranslationRequest {
  text?: unknown;
  source?: unknown;
  target?: unknown;
}

const SUPPORTED_LANGUAGES = new Set<TranslationLanguage>(["id", "en"]);
const MAX_TRANSLATION_CHARACTERS = 5_000;

function isTranslationLanguage(value: unknown): value is TranslationLanguage {
  return typeof value === "string" && SUPPORTED_LANGUAGES.has(value as TranslationLanguage);
}

function parseGoogleTranslation(response: unknown) {
  if (!Array.isArray(response) || !Array.isArray(response[0])) return "";

  return response[0]
    .map((segment) =>
      Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : "",
    )
    .join("")
    .trim();
}

export default defineEventHandler(async (event) => {
  if (getCookie(event, "sns_admin_access") !== "granted") {
    throw createError({ statusCode: 401, statusMessage: "Sesi admin tidak valid" });
  }

  const body = await readBody<TranslationRequest>(event);
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: "Teks terjemahan tidak boleh kosong" });
  }
  if (text.length > MAX_TRANSLATION_CHARACTERS) {
    throw createError({
      statusCode: 413,
      statusMessage: `Teks terjemahan maksimal ${MAX_TRANSLATION_CHARACTERS} karakter`,
    });
  }
  if (!isTranslationLanguage(body.source) || !isTranslationLanguage(body.target)) {
    throw createError({ statusCode: 400, statusMessage: "Bahasa terjemahan tidak didukung" });
  }
  if (body.source === body.target) {
    throw createError({ statusCode: 400, statusMessage: "Bahasa asal dan tujuan harus berbeda" });
  }

  try {
    const requestBody = new URLSearchParams({
      client: "gtx",
      sl: body.source,
      tl: body.target,
      dt: "t",
      q: text,
    });
    const response = await $fetch<unknown>(
      "https://translate.googleapis.com/translate_a/single",
      {
        method: "POST",
        body: requestBody,
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        timeout: 15_000,
      },
    );
    const translatedText = parseGoogleTranslation(response);

    if (!translatedText) {
      throw new Error("Layanan terjemahan mengembalikan hasil kosong");
    }

    return { translatedText };
  } catch (error) {
    console.error("Server translation failed:", error);
    throw createError({
      statusCode: 502,
      statusMessage: "Layanan terjemahan sedang tidak tersedia. Silakan coba lagi.",
    });
  }
});
