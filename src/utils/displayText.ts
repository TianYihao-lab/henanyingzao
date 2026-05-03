export function stripCitationMarkers(text: string | null | undefined): string {
  if (!text) return "";

  return text
    .replace(/\[\d+\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeParagraphSpacing(text: string): string {
  return text
    .replace(/\s*([，。！？；：、,.!?;:])\s*/g, "$1")
    .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function formatDisplayParagraph(text: string | null | undefined): string {
  const cleaned = normalizeParagraphSpacing(stripCitationMarkers(text));

  if (!cleaned) return "";

  if (/[。！？!?]$/u.test(cleaned)) {
    return cleaned;
  }

  const lastSentenceEnd = Math.max(
    cleaned.lastIndexOf("。"),
    cleaned.lastIndexOf("！"),
    cleaned.lastIndexOf("？"),
    cleaned.lastIndexOf("!"),
    cleaned.lastIndexOf("?"),
  );

  if (lastSentenceEnd >= 0) {
    return cleaned.slice(0, lastSentenceEnd + 1).trim();
  }

  return cleaned.replace(/[，、；：,.!?;:]+$/u, "").trim();
}
