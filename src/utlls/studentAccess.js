import Cookies from "js-cookie";
import axios from "axios";
import { config } from "./config";
import { extractRoleFromToken } from "./useful";
import {
  isTeacherRole,
  canAccessTeacherRoute,
  getTeacherVisibleRoutes,
} from "./teacherAccess";

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
  if (isTeacherRole()) {
    return canAccessTeacherRoute(path);
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
  if (isTeacherRole()) {
    return getTeacherVisibleRoutes(allRoutes);
  }
  if (!isStudentRole()) {
    return allRoutes;
  }

  let routes = allRoutes.filter((route) =>
    STUDENT_ROUTE_PATHS.includes(route.path)
  );

  if (isStudentProfileIncomplete()) {
    return routes.filter((route) => route.path === "/student");
  }

  return routes;
};
