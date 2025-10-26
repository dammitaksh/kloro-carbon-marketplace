export type Role = "buyer" | "seller" | "admin" | "individual";

const KEY = "user_role";

export function setRole(role: Role) {
  try {
    localStorage.setItem(KEY, role);
  } catch (_) {}
}

export function getRole(): Role | null {
  try {
    const v = localStorage.getItem(KEY) as Role | null;
    return v === "buyer" || v === "seller" || v === "admin" || v === "individual" ? v : null;
  } catch (_) {
    return null;
  }
}

export function clearRole() {
  try {
    localStorage.removeItem(KEY);
  } catch (_) {}
}
