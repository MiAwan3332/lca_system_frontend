import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function GoogleWorkspaceRedirect() {
  const location = useLocation();
  return <Navigate to={`/profile${location.search || ""}`} replace />;
}

export default GoogleWorkspaceRedirect;
