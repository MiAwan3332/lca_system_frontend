import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./Pages/Login.js";
import NoPage from "./Pages/NoPage.js";
import Dashboard from "./Layouts/Dashboard.js";
import { routes } from "./routes.js";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { extractPermissionsFromToken, extractRoleFromToken, extractStudentIdFromToken, storeAuthSession } from "./utlls/useful.js";
import ErrorBoundary from "./Components/ErrorBoundary.js";
import { setupGlobalErrorHandlers } from "./utlls/errorHandler.js";

function App() {
  useEffect(() => {
    const authToken = Cookies.get('authToken');
    if (authToken) {
      const permissions = extractPermissionsFromToken(authToken);
      const role = extractRoleFromToken(authToken);
      const studentId = extractStudentIdFromToken(authToken);
      storeAuthSession({ permissions, role, studentId });
    }

    return setupGlobalErrorHandlers();
  }, []); 

  return (
    <ErrorBoundary>
      <Router>
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
      </Router>
    </ErrorBoundary>
  );
}

export default App;
