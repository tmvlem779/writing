const INVITE_TYPE = "invite";

export function isSupabaseInviteHash(hash: string) {
  if (!hash.startsWith("#")) return false;

  const params = new URLSearchParams(hash.slice(1));
  return params.get("type") === INVITE_TYPE && Boolean(params.get("access_token"));
}
