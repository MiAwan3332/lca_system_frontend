import React from "react";
import { Navigate } from "react-router-dom";
import { canDeleteStudent } from "../../utlls/useful";
import PageHeader from "../../Components/PageHeader";
import DeletedStudentsPanel from "./DeletedStudentsPanel";

/** Standalone route — same content as All Students → Deleted Students tab. */
export default function DeletedStudents() {
  if (!canDeleteStudent()) {
    return <Navigate to="/student" replace />;
  }

  return (
    <>
      <PageHeader
        title="Deleted Students"
        subtitle="Who deleted which student, with complete archived finance data."
      />
      <DeletedStudentsPanel />
    </>
  );
}
