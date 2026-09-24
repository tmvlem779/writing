const PASSWORD_SETUP_TYPES = new Set(["invite", "recovery"]);

export type PasswordSetupSession = {
  accessToken: string;
  refreshToken: string;
};

export function buildPasswordResetRedirect(origin: string) {
  return new URL("/auth/confirm?next=/set-password", origin).toString();
}

export function parsePasswordSetupHash(hash: string): PasswordSetupSession | null {
  if (!hash.startsWith("#")) return null;

  const params = new URLSearchParams(hash.slice(1));
  const type = params.get("type");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!type || !PASSWORD_SETUP_TYPES.has(type) || !accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}
