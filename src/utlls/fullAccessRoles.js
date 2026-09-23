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
 * Only these roles may delete a student or shift batch (UI + API).
 * vice-principle, principle, ceo, superadmin, secratesuperadmin, accounts
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
  "accounts",
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

/** Only Super Admin, Super Admin Development, Secrate Super Admin, or Secrate Admin. */
export const isStrictSuperAdminRoleName = (role) => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  const compact = normalized.replace(/\s+/g, "");
  if (
    compact === "superadmin" ||
    compact === "superadmindevelopment" ||
    compact === "superadmindev" ||
    compact === "secratesuperadmin" ||
    compact === "secrateadmin"
  ) {
    return true;
  }
  // Tolerate role labels like "Super-Admin Development", "Secrate Super Admin"
  if (compact.includes("superadmin") && compact.includes("development")) {
    return true;
  }
  if (compact.includes("secrate") && compact.includes("superadmin")) {
    return true;
  }
  if (compact.includes("secrate") && compact.includes("admin")) {
    return true;
  }
  return compact === "superadmin";
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
    compact === "secratesuperadmin" ||
    compact === "accounts"
  );
};
