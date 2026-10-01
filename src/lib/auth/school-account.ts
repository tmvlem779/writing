const SCHOOL_ACCOUNT_DOMAIN = "accounts.mundeuk.invalid";
const LOGIN_ID_PATTERN = /^[a-z][a-z0-9]{3,31}$/;

export function normalizeLoginId(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidLoginId(value: string): boolean {
  return LOGIN_ID_PATTERN.test(normalizeLoginId(value));
}

export function toSchoolAccountEmail(value: string): string {
  return `${normalizeLoginId(value)}@${SCHOOL_ACCOUNT_DOMAIN}`;
}
