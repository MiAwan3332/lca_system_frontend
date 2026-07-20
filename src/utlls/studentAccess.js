import Cookies from "js-cookie";
import axios from "axios";
import { config } from "./config";
import { extractRoleFromToken, isFullAccessRole } from "./useful";
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

export const STUDENT_ROUTE_PATHS = [
  "/dashboard",
  "/user",
  "/student",
  "/fees",
  "/teacher",
  "/batch",
  "/course",
  "/timetable",
  "/attendance",
  "/quiz",
  "/assignments",
  "/course-quizzes",
  "/complaints",
  "/announcements",
];

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
  // CEO, secrateAdmin, superadmin, Administrator — all pages
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
  // CEO, secrateAdmin, superadmin, Administrator — all pages
  if (isFullAccessRole()) {
    return allRoutes;
  }
  if (isTeacherRole()) {
    return getTeacherVisibleRoutes(allRoutes).filter((route) => !route.adminOnly);
  }
  if (isInformationOfficeRole()) {
    return getInformationOfficeVisibleRoutes(allRoutes);
  }
  if (isPrincipalRole()) {
    return getPrincipalVisibleRoutes(allRoutes);
  }
  if (isFinanceAdministratorRole()) {
    return getFinanceAdministratorVisibleRoutes(allRoutes);
  }
  if (!isStudentRole()) {
    return allRoutes;
  }

  let routes = allRoutes.filter((route) =>
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
