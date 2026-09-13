import Cookies from "js-cookie";
import { extractRoleFromToken } from "./useful";
import { INFORMATION_OFFICE_ROUTE_PATHS } from "./informationOfficeAccess";

/**
 * Accounts = Information Office screens + Request Management
 * (refund create/decide). Delete / shift are gated separately by role helpers.
 */
export const ACCOUNTS_ROUTE_PATHS = [
  ...INFORMATION_OFFICE_ROUTE_PATHS,
  "/request-management",
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const isAccountsRoleName = (role) => {
  const normalized = normalizeRole(role);
  const compact = normalized.replace(/\s+/g, "");
  return normalized === "accounts" || compact === "accounts";
};

export const isAccountsRole = () => {
  const storedRole = sessionStorage.getItem("role");
  if (storedRole) {
    return isAccountsRoleName(storedRole);
  }

  try {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      return isAccountsRoleName(extractRoleFromToken(authToken));
    }
  } catch {
    return false;
  }

  return false;
};

export const canAccessAccountsRoute = (path) => {
  if (!isAccountsRole()) {
    return true;
  }
  return ACCOUNTS_ROUTE_PATHS.includes(path);
};

export const getAccountsVisibleRoutes = (allRoutes) => {
  if (!isAccountsRole()) {
    return allRoutes;
  }
  return allRoutes.filter((route) => ACCOUNTS_ROUTE_PATHS.includes(route.path));
};
