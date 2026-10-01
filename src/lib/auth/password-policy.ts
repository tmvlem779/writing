export const PASSWORD_REQUIREMENTS_MESSAGE =
  "비밀번호는 8자 이상이며 영문 소문자와 숫자를 각각 1개 이상 포함해야 합니다.";

export function meetsPasswordRequirements(password: string) {
  return password.length >= 8
    && password.length <= 128
    && /^[a-z0-9]+$/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password);
}
