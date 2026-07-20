/**
 * Roles with unrestricted access to every page/screen.
 * CEO, secrateAdmin, superadmin, and Administrator share the same rights.
 */
export const FULL_ACCESS_ROLE_NAMES = [
  "ceo",
  "secrateadmin",
  "superadmin",
  "super admin",
  "super_admin",
  "administrator",
  "admin",
  "super admin development",
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const isFullAccessRoleName = (role) => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;

  if (
    FULL_ACCESS_ROLE_NAMES.some((name) => normalizeRole(name) === normalized)
  ) {
    return true;
  }

  const compact = normalized.replace(/\s+/g, "");
  return (
    compact === "ceo" ||
    compact === "secrateadmin" ||
    compact === "superadmin" ||
    compact === "administrator" ||
    compact === "admin"
  );
};
