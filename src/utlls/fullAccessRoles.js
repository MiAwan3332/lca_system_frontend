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

/**
 * Platform superadmins — only these roles may open restricted system/academic pages
 * (teachers, courses, timetable, attendance, MCQs, quizzes, assignments, roles, permissions, logs,
 * announcements, seminars, expenses).
 */
export const PLATFORM_SUPER_ADMIN_ROLE_NAMES = [
  "secrateadmin",
  "secrate admin",
  "secratesuperadmin",
  "secrate superadmin",
  "secrate super admin",
  "superadmin",
  "super admin",
  "super_admin",
  "super admin development",
  "ceo",
  "principle",
  "principal",
  "vice principle",
  "vice-principle",
  "vice principal",
];

/**
 * Only these roles may delete a student (UI + API).
 * vice-principle, principle, ceo, superadmin, secratesuperadmin
 */
export const STUDENT_DELETE_ROLE_NAMES = [
  "ceo",
  "principle",
  "principal",
  "vice principle",
  "vice-principle",
  "vice principal",
  "superadmin",
  "super admin",
  "super_admin",
  "super admin development",
  "secrateadmin",
  "secrate admin",
  "secratesuperadmin",
  "secrate superadmin",
  "secrate super admin",
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
    compact === "superadmindevelopment" ||
    compact === "administrator" ||
    compact === "admin"
  );
};

export const isPlatformSuperAdminRoleName = (role) => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;

  if (
    PLATFORM_SUPER_ADMIN_ROLE_NAMES.some(
      (name) => normalizeRole(name) === normalized
    )
  ) {
    return true;
  }

  const compact = normalized.replace(/\s+/g, "");
  return (
    compact === "secrateadmin" ||
    compact === "secratesuperadmin" ||
    compact === "superadmin" ||
    compact === "superadmindevelopment" ||
    compact === "ceo" ||
    compact === "principle" ||
    compact === "principal" ||
    compact === "viceprinciple" ||
    compact === "viceprincipal"
  );
};

export const canDeleteStudentRoleName = (role) => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;

  if (
    STUDENT_DELETE_ROLE_NAMES.some((name) => normalizeRole(name) === normalized)
  ) {
    return true;
  }

  const compact = normalized.replace(/\s+/g, "");
  return (
    compact === "ceo" ||
    compact === "principle" ||
    compact === "principal" ||
    compact === "viceprinciple" ||
    compact === "viceprincipal" ||
    compact === "superadmin" ||
    compact === "superadmindevelopment" ||
    compact === "secrateadmin" ||
    compact === "secratesuperadmin"
  );
};
