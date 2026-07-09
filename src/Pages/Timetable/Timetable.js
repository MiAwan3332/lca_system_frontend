import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Button, FormControl, Select } from "@chakra-ui/react";
import { FilterX } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import TimetableCalendar from "../../Components/TimetableCalendar";
import PageHeader, { FilterStack } from "../../Components/PageHeader";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import SearchableCourseSelect from "../../Components/SearchableCourseSelect";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import { fetchBatches, selectActiveBatches, fetchBatchCourses, selectBatchCourses } from "../../Features/batchSlice";
import { fetchTeachers, selectAllTeachers, setLimitFilter as setTeacherLimitFilter } from "../../Features/teacherSlice";

function Timetable() {
  const viewOnly = isStudentViewOnly();
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const batches = useSelector(selectActiveBatches);
  const batchCourses = useSelector(selectBatchCourses);
  const teachers = useSelector(selectAllTeachers);

  const [filterBatch, setFilterBatch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");

  useEffect(() => {
    if (!viewOnly) {
      dispatch(fetchBatches({ authToken, queryParams: { limit: 200, page: 1, query: "" } }));
      dispatch(setTeacherLimitFilter(200));
      dispatch(fetchTeachers({ authToken }));
    }
  }, [authToken, dispatch, viewOnly]);

  useEffect(() => {
    if (filterBatch) {
      dispatch(fetchBatchCourses({ authToken, batchId: filterBatch }));
    }
  }, [authToken, dispatch, filterBatch]);

  const handleBatchChange = (batchId) => {
    setFilterBatch(batchId);
    setFilterCourse("");
  };

  const handleClearFilters = () => {
    setFilterBatch("");
    setFilterCourse("");
    setFilterTeacher("");
  };

  const hasFilters = filterBatch || filterCourse || filterTeacher;

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
      {!viewOnly && (
        <FilterStack className="filter-stack--panel filter-stack--table mt-3">
          <SearchableBatchSelect
            batches={batches}
            value={filterBatch}
            onChange={handleBatchChange}
            placeholder="All Batches"
            width="100%"
          />
          {filterBatch && (
            <SearchableCourseSelect
              courses={batchCourses}
              value={filterCourse}
              onChange={setFilterCourse}
              placeholder="All Courses"
              width="100%"
            />
          )}
          <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
            <Select
              placeholder="All Teachers"
              size="lg"
              borderRadius="xl"
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
            >
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </Select>
          </FormControl>
          {hasFilters && (
            <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </FilterStack>
      )}
      <div className="w-full h-[calc(100dvh-10rem)] min-h-[360px] sm:min-h-[480px] md:min-h-[600px] lg:min-h-[700px]">
        <TimetableCalendar
          filterBatchId={filterBatch}
          filterCourseId={filterCourse}
          filterTeacherId={filterTeacher}
        />
      </div>
    </>
  );
}

export default Timetable;
