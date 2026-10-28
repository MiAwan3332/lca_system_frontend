/**
 * Frontend helpers for refund request create / decide access.
 */
import Cookies from "js-cookie";
import { accessSnapshot, dynamicPermission } from './accessCapabilities';
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
  compactRole(role || getCurrentRoleName()) === "ceo";

export const isSuperAdminRole = (role) => {
  const compact = compactRole(role || getCurrentRoleName());
  return (
    compact === "secrateadmin" ||
    compact === "secratesuperadmin" ||
    compact === "superadmin" ||
    compact === "superadmindevelopment"
  );
};

export const isPrincipalFamilyRole = (role) => {
  const compact = compactRole(role || getCurrentRoleName());
  return (
    compact === "principal" ||
    compact === "principle" ||
    compact === "viceprincipal" ||
    compact === "viceprinciple"
  );
};

export const isAccountsRole = (role) =>
  compactRole(role || getCurrentRoleName()) === "accounts";

/**
 * Today's collection cards on the dashboard:
 * Principal, Vice Principal, CEO, Super Admins, and Accounts.
 */
export const canViewDashboardCollections = (role) => {
  if (accessSnapshot().managed) return dynamicPermission(['getTodayCollections', 'getFinanceReport']);
  const current = role || getCurrentRoleName();
  return (
    isCeoRole(current) ||
    isPrincipalFamilyRole(current) ||
    isSuperAdminRole(current) ||
    isAccountsRole(current)
  );
};

/**
 * Create refund requests from Students actions:
 * CEO, Principal, Vice Principal, Super Admin, Accounts.
 */
export const canCreateRefundRequest = (role) => {
  if (accessSnapshot().managed) return dynamicPermission(['createRefundRequest']);
  const current = role || getCurrentRoleName();
  return (
    isCeoRole(current) ||
    isPrincipalFamilyRole(current) ||
    isSuperAdminRole(current) ||
    isAccountsRole(current)
  );
};

/** Same roles — Request Management decisions. */
export const canDecideRefundRequest = (role) => accessSnapshot().managed ? dynamicPermission(['approveRefundRequest', 'rejectRefundRequest']) : canCreateRefundRequest(role);

/** Paying out an approved refund is its own permission, separate from approving it. */
export const canProcessRefundRequest = (role) => accessSnapshot().managed ? dynamicPermission(['processRefundRequest']) : canDecideRefundRequest(role);

export const canAccessRequestManagement = (role) => accessSnapshot().managed ? dynamicPermission(['getRefundRequests']) : canDecideRefundRequest(role);

/** Super Admin only — edit Cash/Online + screenshot on refunded requests. */
export const canUpdateRefundPayout = (role) => accessSnapshot().managed ? dynamicPermission(['updateRefundPayout']) : isSuperAdminRole(role);
