/**
 * Frontend helpers for refund request create / decide access.
 */
import Cookies from "js-cookie";
import { extractRoleFromToken } from "./useful";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const compactRole = (role) => normalizeRole(role).replace(/\s+/g, "");

const resolveRoleName = (role) => {
  if (!role) return null;
  if (typeof role === "object") {
    return role.name || role.role || role.title || null;
  }
  return role;
};

export const getCurrentRoleName = () => {
  const storedRole = resolveRoleName(sessionStorage.getItem("role"));
  if (storedRole) return storedRole;

  try {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      return resolveRoleName(extractRoleFromToken(authToken));
    }
  } catch {
    return null;
  }
  return null;
};

export const isCeoRole = (role) =>
  compactRole(role ?? getCurrentRoleName()) === "ceo";

export const isSuperAdminRole = (role) => {
  const compact = compactRole(role ?? getCurrentRoleName());
  return (
    compact === "secrateadmin" ||
    compact === "superadmin" ||
    compact === "superadmindevelopment"
  );
};

export const isPrincipalFamilyRole = (role) => {
  const compact = compactRole(role ?? getCurrentRoleName());
  return compact === "principal" || compact === "viceprincipal";
};

/**
 * Create refund requests from Students actions:
 * CEO, Principal, Vice Principal, Super Admin.
 */
export const canCreateRefundRequest = (role) => {
  const current = role ?? getCurrentRoleName();
  return (
    isCeoRole(current) ||
    isPrincipalFamilyRole(current) ||
    isSuperAdminRole(current)
  );
};

/** Same roles — Request Management decisions. */
export const canDecideRefundRequest = (role) =>
  canCreateRefundRequest(role);

export const canAccessRequestManagement = (role) =>
  canDecideRefundRequest(role);
