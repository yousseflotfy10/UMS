export function normalizeEmail(email) {
  return String(email || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u00A0\s]+/g, "")
    .replace(/[\uFF20]/g, "@")
    .replace(/[\u3002\uFF0E\uFF61\uFE52]/g, ".")
    .trim()
    .toLowerCase();
}

export function isValidEmail(email) {
  const value = normalizeEmail(email);

  if (!value || value.length > 254) return false;
  if (value.includes(" ")) return false;

  const atIndex = value.indexOf("@");
  const lastAtIndex = value.lastIndexOf("@");

  if (atIndex <= 0 || atIndex !== lastAtIndex) return false;

  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);

  if (!local || !domain) return false;
  if (local.length > 64) return false;
  if (!domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  if (domain.includes("..")) return false;

  const domainParts = domain.split(".");

  if (domainParts.some((part) => !part || part.startsWith("-") || part.endsWith("-"))) {
    return false;
  }

  const lastDomainPart = domainParts[domainParts.length - 1];

  if (lastDomainPart.length < 2) return false;

  // Keep this permissive enough for normal public emails such as Gmail, Outlook,
  // university emails, and longer modern domains. Supabase will still do its own
  // server-side validation when the reset request is sent.
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

export function getFriendlyEmail(email) {
  return normalizeEmail(email);
}
