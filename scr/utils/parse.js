export function extractNumber(text) {
  if (!text) return 0;
  const match = text.replace(/\s/g, "").match(/[\d.,]+/);
  return match ? parseFloat(match[0].replace(",", ".")) : 0;
}

export function cleanText(text) {
  return text ? text.trim().replace(/\s+/g, " ") : "";
}
