import { markSessionStarted } from "./authSession.js";
import { config } from "./config.js";
import { isFullAccessRoleName } from "./fullAccessRoles.js";

const PERMISSION_ALIASES = {
  Pay_Fee: ["Pay_Fee", "pay_fee", "Pay_fee"],
  Discount_Fee: ["Discount_Fee", "discount_fee", "Discount_fee"],
  Delete_Fee: ["Delete_Fee", "delete_fee", "Delete_fee"],
  Add_Mcq: ["Add_Mcq", "Add_mcq", "add_mcq"],
  Update_Mcq: ["Update_Mcq", "Update_mcq", "update_mcq"],
  Delete_Mcq: ["Delete_Mcq", "Delete_mcq", "delete_mcq"],
};

const normalizeRoleName = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/** Principal / Vice-Principal: full CRUD on allocated screens. */
const isPrincipalManageRoleName = (role) => {
  const normalized = normalizeRoleName(role);
  return (
    normalized === "principal" ||
    normalized === "vice-principal" ||
    normalized === "viceprincipal"
  );
};

const parseJwtPayload = (token) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(window.atob(base64));
};

const extractUserIdFromToken = (token) => {
  const jwtPayload = parseJwtPayload(token);
  return jwtPayload.user.id;
};

const extractRoleFromToken = (token) => {
  const jwtPayload = parseJwtPayload(token);
  return jwtPayload.user.role;
};

const extractPermissionsFromToken = (token) => {
  const jwtPayload = parseJwtPayload(token);
  const permissions = jwtPayload.user.permissions;
  return Array.isArray(permissions) ? permissions.join(",") : permissions || "";
};

const extractStudentIdFromToken = (token) => {
  const jwtPayload = parseJwtPayload(token);
  return jwtPayload.user?.studentId || null;
};

const extractTeacherIdFromToken = (token) => {
  const jwtPayload = parseJwtPayload(token);
  return jwtPayload.user?.teacherId || null;
};

const parseStoredPermissions = (storedPermissions) => {
  if (!storedPermissions) return [];
  const trimmed = storedPermissions.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return trimmed.split(",").map((p) => p.trim()).filter(Boolean);
};

const getCurrentRoleName = () => {
  const storedRole = sessionStorage.getItem("role");
  if (storedRole) return storedRole;

  try {
    const authToken =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("authToken="))
            ?.split("=")[1]
        : null;
    if (authToken) {
      return extractRoleFromToken(authToken);
    }
  } catch {
    return null;
  }
  return null;
};

const hasFullAccess = () => {
  const role = getCurrentRoleName();
  return isFullAccessRoleName(role);
};

const isFullAccessRole = () => hasFullAccess();

/** Full action rights (add/update/view/delete) without opening Roles/Permissions/Logs. */
const hasUnrestrictedActionAccess = () => {
  if (hasFullAccess()) return true;
  return isPrincipalManageRoleName(getCurrentRoleName());
};

const hasPermission = (permissionsToCheck) => {
  if (hasUnrestrictedActionAccess()) return true;

  const checks = Array.isArray(permissionsToCheck) ? permissionsToCheck : [];
  if (!checks.length) return false;

  const permissionsArray = parseStoredPermissions(
    sessionStorage.getItem("permissions")
  );

  return checks.some((permission) => {
    const aliases = PERMISSION_ALIASES[permission] || [permission];
    return aliases.some((alias) => permissionsArray.includes(alias));
  });
};

const storeAuthSession = ({
  authToken,
  permissions,
  role,
  studentId,
  teacherId,
  profileUpdatedOnce,
  skipProfileCompletion,
}) => {
  if (authToken) {
    sessionStorage.setItem("authToken", authToken);
    markSessionStarted();
  }
  if (role) {
    sessionStorage.setItem("role", role);
  }
  if (permissions) {
    const permissionString = Array.isArray(permissions)
      ? permissions.join(",")
      : permissions;
    sessionStorage.setItem("permissions", permissionString);
  }
  if (studentId) {
    sessionStorage.setItem("studentId", studentId);
  } else if (authToken) {
    const tokenStudentId = extractStudentIdFromToken(authToken);
    if (tokenStudentId) {
      sessionStorage.setItem("studentId", tokenStudentId);
    }
  }
  if (teacherId) {
    sessionStorage.setItem("teacherId", teacherId);
  } else if (authToken) {
    const tokenTeacherId = extractTeacherIdFromToken(authToken);
    if (tokenTeacherId) {
      sessionStorage.setItem("teacherId", tokenTeacherId);
    }
  }
  if (profileUpdatedOnce !== undefined) {
    sessionStorage.setItem(
      "profileUpdatedOnce",
      String(profileUpdatedOnce === true)
    );
  }
  if (skipProfileCompletion !== undefined) {
    sessionStorage.setItem(
      "skipProfileCompletion",
      String(skipProfileCompletion === true)
    );
  }
};

const getMediaUrl = (url) => {
  if (!url) return url;
  if (typeof url !== "string") return url;

  // Match: http://173.249.42.210/api/public/files/... or http://localhost:5000/public/files/...
  const regex = /^https?:\/\/[^\/]+(?:\/api)?(\/public)?(\/files\/.*)$/i;
  const match = url.match(regex);
  if (match) {
    return `${config.BASE_URL}/public${match[2]}`;
  }

  return url;
};

export {
  extractUserIdFromToken,
  extractRoleFromToken,
  extractPermissionsFromToken,
  extractStudentIdFromToken,
  extractTeacherIdFromToken,
  hasPermission,
  hasFullAccess,
  isFullAccessRole,
  storeAuthSession,
  getMediaUrl,
};
