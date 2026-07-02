import Cookies from "js-cookie";

export const clearAuthSession = () => {
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("permissions");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("studentId");
  sessionStorage.removeItem("teacherId");
  sessionStorage.removeItem("profileUpdatedOnce");
  sessionStorage.removeItem("skipProfileCompletion");
  Cookies.remove("authToken");
};
