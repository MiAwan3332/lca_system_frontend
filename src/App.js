import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./Pages/Login.js";
import NoPage from "./Pages/NoPage.js";
import Dashboard from "./Layouts/Dashboard.js";
import { routes } from "./routes.js";
import { useEffect } from "react";
import { extractPermissionsFromToken, extractRoleFromToken, extractStudentIdFromToken, extractTeacherIdFromToken, storeAuthSession } from "./utlls/useful.js";
import ErrorBoundary from "./Components/ErrorBoundary.js";
import SessionGuard from "./Components/SessionGuard.js";
import { setupGlobalErrorHandlers } from "./utlls/errorHandler.js";
import {
  getAuthToken,
  isAuthSessionExpired,
} from "./utlls/authSession.js";

function App() {
  useEffect(() => {
    const authToken = getAuthToken();
    if (authToken && !isAuthSessionExpired()) {
      const permissions = extractPermissionsFromToken(authToken);
      const role = extractRoleFromToken(authToken);
      const studentId = extractStudentIdFromToken(authToken);
      const teacherId = extractTeacherIdFromToken(authToken);
      storeAuthSession({ permissions, role, studentId, teacherId });
    }

    return setupGlobalErrorHandlers();
  }, []); 

  return (
    <ErrorBoundary>
      <Router>
        <SessionGuard>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />}>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  element={
                    <ErrorBoundary>{route.component}</ErrorBoundary>
                  }
                  path={route.path}
                />
              ))}
            </Route>
            <Route path="*" element={<NoPage />} />
          </Routes>
        </SessionGuard>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
