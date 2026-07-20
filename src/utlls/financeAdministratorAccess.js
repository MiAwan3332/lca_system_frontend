import Cookies from "js-cookie";
import { extractRoleFromToken } from "./useful";

/** Screens allowed for the Finance Administrator role. */
export const FINANCE_ADMIN_ROUTE_PATHS = [
  "/dashboard",
  "/profile",
  "/fees",
  "/finance-report",
  "/expenses",
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const isFinanceAdministratorRoleName = (role) => {
  const normalized = normalizeRole(role);
  return (
    normalized === "finance administrator" ||
    normalized === "finance admin" ||
    normalized === "financeadministrator"
  );
};

export const isFinanceAdministratorRole = () => {
  const storedRole = sessionStorage.getItem("role");
  if (storedRole) {
    return isFinanceAdministratorRoleName(storedRole);
  }

  try {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      return isFinanceAdministratorRoleName(extractRoleFromToken(authToken));
    }
  } catch {
    return false;
  }

  return false;
};

export const canAccessFinanceAdministratorRoute = (path) => {
  if (!isFinanceAdministratorRole()) {
    return true;
  }
  return FINANCE_ADMIN_ROUTE_PATHS.includes(path);
};

export const getFinanceAdministratorVisibleRoutes = (allRoutes) => {
  if (!isFinanceAdministratorRole()) {
    return allRoutes;
  }
  return allRoutes.filter((route) =>
    FINANCE_ADMIN_ROUTE_PATHS.includes(route.path)
  );
};
