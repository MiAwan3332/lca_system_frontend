import Cookies from "js-cookie";
import axios from "axios";
import { config } from "./config";
import {
  extractRoleFromToken,
  isFullAccessRole,
  isPlatformSuperAdminRole,
} from "./useful";
import {
  isTeacherRole,
  canAccessTeacherRoute,
  getTeacherVisibleRoutes,
} from "./teacherAccess";
import {
  isInformationOfficeRole,
  canAccessInformationOfficeRoute,
  getInformationOfficeVisibleRoutes,
} from "./informationOfficeAccess";
import {
  isPrincipalRole,
  canAccessPrincipalRoute,
  getPrincipalVisibleRoutes,
} from "./principalAccess";
import {
  isFinanceAdministratorRole,
  canAccessFinanceAdministratorRoute,
  getFinanceAdministratorVisibleRoutes,
} from "./financeAdministratorAccess";
import { canAccessRequestManagement } from "./refundAccess";
import {
  canAccessInterviewPanel,
  isInterviewPanelRoute,
} from "./interviewPanelAccess";

export const STUDENT_ROUTE_PATHS = [
  "/dashboard",
  "/profile",
  "/user",
  "/student",
  "/teacher",
  "/batch",
  "/course",
  "/timetable",
  "/attendance",
  "/quiz",
  "/assignments",
  "/course-quizzes",
];

/** Only Super Admins (teachers & students keep allowlists for teaching/learning pages only). */
export const SUPER_ADMIN_ONLY_ROUTE_PATHS = [
  "/fees",
  "/notifications",
  "/teacher",
  "/course",
  "/timetable",
  "/attendance",
  "/mcq",
  "/quiz",
  "/assignments",
  "/course-quizzes",
  "/seminar",
  "/interview-panel",
  "/interview-panel-schedules",
  "/announcements",
  "/expenses",
  "/role",
  "/permission",
  "/activity-logs/students",
  "/activity-logs/teachers",
  "/activity-logs/admins",
];

export const isSuperAdminOnlyRoute = (path) => {
  const normalized = String(path || "");
  if (SUPER_ADMIN_ONLY_ROUTE_PATHS.includes(normalized)) return true;
  if (normalized.startsWith("/activity-logs")) return true;
  if (normalized.startsWith("/interview-panel")) return true;
  return false;
};

/**
 * Restricted pages: Super Admins only by default.
 * Interview Panel / Panel Schedules: Superadmin, Secrate Superadmin,
 * Principal, Vice-Principal, CEO, Super Admin Development.
 */
export const canAccessSuperAdminOnlyRoute = (path) => {
  if (!isSuperAdminOnlyRoute(path)) return true;

  if (isInterviewPanelRoute(path)) {
    return canAccessInterviewPanel();
  }

  if (isPlatformSuperAdminRole()) return true;

  const lockedForEveryoneElse = [
    "/fees",
    "/notifications",
    "/seminar",
    "/announcements",
    "/expenses",
    "/role",
    "/permission",
  ];
  const normalized = String(path || "");
  if (
    lockedForEveryoneElse.includes(normalized) ||
    normalized.startsWith("/activity-logs")
  ) {
    return false;
  }

  if (isTeacherRole()) return canAccessTeacherRoute(path);
  if (isStudentRole()) {
    if (isStudentProfileIncomplete() && path !== "/student") return false;
    return STUDENT_ROUTE_PATHS.includes(path);
  }
  return false;
};

export const isStudentRole = () => {
  const storedRole = sessionStorage.getItem("role");
  if (storedRole) {
    return storedRole.toLowerCase() === "student";
  }

  try {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      const role = extractRoleFromToken(authToken);
      return role?.toLowerCase() === "student";
    }
  } catch {
    return false;
  }

  return false;
};

export const isStudentViewOnly = () => isStudentRole();

export const getStudentId = () => sessionStorage.getItem("studentId");

export const setProfileUpdatedOnce = (value) => {
  sessionStorage.setItem("profileUpdatedOnce", String(value === true));
};

export const setSkipProfileCompletion = (value) => {
  sessionStorage.setItem("skipProfileCompletion", String(value === true));
};

export const isStudentProfileIncomplete = () => {
  if (!isStudentRole()) {
    return false;
  }
  if (sessionStorage.getItem("skipProfileCompletion") === "true") {
    return false;
  }
  return sessionStorage.getItem("profileUpdatedOnce") !== "true";
};

export const syncStudentProfileStatus = async () => {
  if (!isStudentRole()) {
    return true;
  }

  const authToken = Cookies.get("authToken");
  const studentId = getStudentId();
  if (!authToken || !studentId) {
    return false;
  }

  try {
    const response = await axios.get(
      `${config.BASE_URL}/students/${studentId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    const complete =
      response.data.profile_updated_once === true ||
      response.data.skip_profile_completion === true;
    setProfileUpdatedOnce(response.data.profile_updated_once === true);
    setSkipProfileCompletion(response.data.skip_profile_completion === true);
    return complete;
  } catch {
    return false;
  }
};

export const canAccessRoute = (path) => {
  if (path === "/profile" || path === "/google-workspace") {
    return true;
  }
  if (path === "/complaints") {
    return false;
  }
  if (path === "/request-management" && !canAccessRequestManagement()) {
    return false;
  }
  if (!canAccessSuperAdminOnlyRoute(path)) {
    return false;
  }
  // CEO, secrateAdmin, superadmin, Administrator — remaining pages
  if (isFullAccessRole()) {
    return true;
  }
  if (isTeacherRole()) {
    return canAccessTeacherRoute(path);
  }
  if (isInformationOfficeRole()) {
    return canAccessInformationOfficeRoute(path);
  }
  if (isPrincipalRole()) {
    return canAccessPrincipalRoute(path);
  }
  if (isFinanceAdministratorRole()) {
    return canAccessFinanceAdministratorRoute(path);
  }
  if (!isStudentRole()) {
    return true;
  }
  if (isStudentProfileIncomplete() && path !== "/student") {
    return false;
  }
  return STUDENT_ROUTE_PATHS.includes(path);
};

export const getVisibleRoutes = (allRoutes) => {
  const visibleRouteList = allRoutes.filter((route) => {
    if (route.hidden) return false;
    if (route.path === "/request-management" && !canAccessRequestManagement()) {
      return false;
    }
    if (!canAccessSuperAdminOnlyRoute(route.path)) {
      return false;
    }
    return true;
  });
  // CEO, secrateAdmin, superadmin, Administrator — remaining pages
  if (isFullAccessRole()) {
    return visibleRouteList;
  }
  if (isTeacherRole()) {
    return getTeacherVisibleRoutes(visibleRouteList).filter((route) => !route.adminOnly);
  }
  if (isInformationOfficeRole()) {
    return getInformationOfficeVisibleRoutes(visibleRouteList);
  }
  if (isPrincipalRole()) {
    return getPrincipalVisibleRoutes(visibleRouteList);
  }
  if (isFinanceAdministratorRole()) {
    return getFinanceAdministratorVisibleRoutes(visibleRouteList);
  }
  if (!isStudentRole()) {
    return visibleRouteList;
  }

  let routes = visibleRouteList.filter((route) =>
    STUDENT_ROUTE_PATHS.includes(route.path)
  );

  routes = routes.map((route) =>
    route.studentName ? { ...route, name: route.studentName } : route
  );

  if (isStudentProfileIncomplete()) {
    return routes.filter((route) => route.path === "/student");
  }

  return routes;
};
