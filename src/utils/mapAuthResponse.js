import { normalizeRole } from "@/utils/roleRedirect";

/** Map AuthResponse từ BE sang user object trong store */
export function mapAuthResponseToUser(auth) {
  if (!auth) return null;
  const source = auth.user || auth;
  return {
    id: source.userId || source.id,
    username: source.username,
    email: source.email,
    role: source.role,
    fullName: source.fullName || source.name,
    phone: source.phone,
  };
}

export function extractAccessToken(auth) {
  return auth?.token || auth?.accessToken || null;
}

export function applyAuthToState(auth) {
  const token = extractAccessToken(auth);
  const user = mapAuthResponseToUser(auth);
  const role = normalizeRole(user?.role);
  return { token, user, role, isAuthenticated: !!token && !!user };
}
