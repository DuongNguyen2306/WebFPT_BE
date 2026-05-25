/** Username đăng nhập: 3–32 ký tự, chữ/số/gạch dưới (lưu lowercase) */
const USERNAME_REGEX = /^[a-z0-9_]{3,32}$/;

export function normalizeUsername(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (!USERNAME_REGEX.test(s)) {
    return null;
  }
  return s;
}

export function isValidUsername(raw: string): boolean {
  return normalizeUsername(raw) !== null;
}
