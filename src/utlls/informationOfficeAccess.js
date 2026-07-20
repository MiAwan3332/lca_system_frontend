import Cookies from "js-cookie";
import { extractRoleFromToken } from "./useful";

/** Screens allowed for the Information Office role. */
export const INFORMATION_OFFICE_ROUTE_PATHS = [
  "/dashboard",
  "/student",
  "/fees",
  "/finance-report",
  "/teacher",
  "/course",
  "/timetable",
  "/batch",
  "/attendance",
  "/seminar",
  "/complaints",
  "/announcements",
  "/notifications",
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const isInformationOfficeRoleName = (role) =>
  normalizeRole(role) === "information office";

export const isInformationOfficeRole = () => {
  const storedRole = sessionStorage.getItem("role");
  if (storedRole) {
    return isInformationOfficeRoleName(storedRole);
  }

  try {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      return isInformationOfficeRoleName(extractRoleFromToken(authToken));
    }
  } catch {
    return false;
  }

  return false;
};

export const canAccessInformationOfficeRoute = (path) => {
  if (!isInformationOfficeRole()) {
    return true;
  }
  return INFORMATION_OFFICE_ROUTE_PATHS.includes(path);
};

export const getInformationOfficeVisibleRoutes = (allRoutes) => {
  if (!isInformationOfficeRole()) {
    return allRoutes;
  }
  return allRoutes.filter((route) =>
    INFORMATION_OFFICE_ROUTE_PATHS.includes(route.path)
  );
};
