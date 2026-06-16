import React, { useEffect, useState } from "react";
import TimetableCalendar from "../../Components/TimetableCalendar";
import PageHeader from "../../Components/PageHeader";

function Timetable() {
  return (
    <>
      <PageHeader title="Timetable" subtitle="View and manage class schedules" />
      <div className="w-full h-[calc(100dvh-10rem)] min-h-[360px] sm:min-h-[480px] md:min-h-[600px] lg:min-h-[700px]">
        <TimetableCalendar />
      </div>
    </>
  );
}

export default Timetable;
