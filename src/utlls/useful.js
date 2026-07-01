const FULL_ACCESS_ROLES = [
  "secrateadmin",
  "superadmin",
  "super_admin",
  "super admin",
  "Super Admin",
  "Super_Admin",
  "admin",
];

const PERMISSION_ALIASES = {
  Pay_Fee: ["Pay_Fee", "pay_fee", "Pay_fee"],
  Discount_Fee: ["Discount_Fee", "discount_fee", "Discount_fee"],
  Delete_Fee: ["Delete_Fee", "delete_fee", "Delete_fee"],
  Add_Mcq: ["Add_Mcq", "Add_mcq", "add_mcq"],
  Update_Mcq: ["Update_Mcq", "Update_mcq", "update_mcq"],
  Delete_Mcq: ["Delete_Mcq", "Delete_mcq", "delete_mcq"],
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

const hasFullAccess = () => {
  const storedRole = sessionStorage.getItem("role");
  if (
    storedRole &&
    FULL_ACCESS_ROLES.some(
      (role) => role.toLowerCase() === storedRole.toLowerCase()
    )
  ) {
    return true;
  }

  try {
    const authToken =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("authToken="))
            ?.split("=")[1]
        : null;
    if (authToken) {
      const role = extractRoleFromToken(authToken);
      return FULL_ACCESS_ROLES.some(
        (fullRole) => fullRole.toLowerCase() === role?.toLowerCase()
      );
    }
  } catch {
    return false;
  }

  return false;
};

const hasPermission = (permissionsToCheck) => {
  if (hasFullAccess()) return true;

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

export {
  extractUserIdFromToken,
  extractRoleFromToken,
  extractPermissionsFromToken,
  extractStudentIdFromToken,
  extractTeacherIdFromToken,
  hasPermission,
  hasFullAccess,
  storeAuthSession,
};
