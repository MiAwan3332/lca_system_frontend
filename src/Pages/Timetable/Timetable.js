import React from "react";
import TimetableCalendar from "../../Components/TimetableCalendar";
import PageHeader from "../../Components/PageHeader";
import { isStudentViewOnly } from "../../utlls/studentAccess";

function Timetable() {
  const viewOnly = isStudentViewOnly();

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle={
          viewOnly
            ? "View your scheduled classes. Tap a class to see details."
            : "View and manage class schedules"
        }
      />
      <div className="w-full h-[calc(100dvh-10rem)] min-h-[360px] sm:min-h-[480px] md:min-h-[600px] lg:min-h-[700px]">
        <TimetableCalendar />
      </div>
    </>
  );
}

export default Timetable;
