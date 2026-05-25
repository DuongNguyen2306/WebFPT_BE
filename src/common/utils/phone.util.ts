const VN_PHONE_REGEX = /^0(3|5|7|8|9)\d{8}$/;

/** Chuẩn hóa SĐT VN (0xxxxxxxxx) hoặc null nếu không hợp lệ */
export function normalizeVnPhone(raw: string): string | null {
  let s = raw.trim().replace(/\s+/g, '');
  if (s.startsWith('+84')) {
    s = `0${s.slice(3)}`;
  } else if (s.startsWith('84') && s.length >= 10) {
    s = `0${s.slice(2)}`;
  }
  if (!VN_PHONE_REGEX.test(s)) {
    return null;
  }
  return s;
}

export function isValidVnPhone(raw: string): boolean {
  return normalizeVnPhone(raw) !== null;
}
