import Cookies from "js-cookie";
import { extractRoleFromToken, extractTeacherIdFromToken } from "./useful";

export const TEACHER_ROUTE_PATHS = [
  "/dashboard",
  "/student",
  "/teacher",
  "/batch",
  "/course",
  "/timetable",
  "/attendance",
  "/mcq",
  "/assignments",
  "/course-quizzes",
  "/complaints",
];

export const isTeacherRole = () => {
  const storedRole = sessionStorage.getItem("role");
  if (storedRole) {
    return storedRole.toLowerCase() === "teacher";
  }

  try {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      const role = extractRoleFromToken(authToken);
      return role?.toLowerCase() === "teacher";
    }
  } catch {
    return false;
  }

  return false;
};

export const isInstitutionAdmin = () => {
  const storedRole = sessionStorage.getItem("role");
  if (!storedRole) return true;
  const role = storedRole.toLowerCase();
  return role !== "student" && role !== "teacher";
};

export const getTeacherId = () => sessionStorage.getItem("teacherId");

export const canAccessTeacherRoute = (path) => {
  if (!isTeacherRole()) {
    return true;
  }
  return TEACHER_ROUTE_PATHS.includes(path);
};

export const getTeacherVisibleRoutes = (allRoutes) => {
  if (!isTeacherRole()) {
    return allRoutes;
  }
  return allRoutes.filter((route) => TEACHER_ROUTE_PATHS.includes(route.path));
};
