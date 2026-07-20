import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  FormControl,
  Input,
  Button,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { selectAttendances } from "../../Features/attendanceSlice";
import { Download, FileX, FilterX } from "lucide-react";
import {
  fetchAttendances,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
} from "../../Features/attendanceSlice";
import { fetchBatches, selectActiveBatches, fetchBatchCourses, selectBatchCourses } from "../../Features/batchSlice";
import TableSearch from "../../Components/TableSearch";
import TableRowLoading from "../../Components/TableRowLoading";
import TablePagination from "../../Components/TablePagination";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import SearchableCourseSelect from "../../Components/SearchableCourseSelect";
import { downloadExcel } from "react-export-table-to-excel";
import moment from "moment";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";

function Attendance() {
  const viewOnly = isStudentViewOnly();
  const tableSearchRef = useRef();

  const [authToken] = useState(Cookies.get("authToken"));
  const [formCourse, setFormCourse] = useState("");
  const [formBatch, setFormBatch] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const attendances = useSelector(selectAttendances);
  const batches = useSelector(selectActiveBatches);
  const batchCourses = useSelector(selectBatchCourses);
  const { status, pagination } = useSelector((state) => state.attendance);
  const dispatch = useDispatch();

  const filterPayload = {
    course_id: formCourse,
    batch_id: formBatch,
    date: formStartDate || formEndDate ? "" : formDate,
    start_date: formStartDate,
    end_date: formEndDate,
  };

  const buildParams = (overrides = {}) => ({
    authToken,
    ...filterPayload,
    ...overrides,
  });

  const loadAttendances = (overrides = {}) => {
    dispatch(fetchAttendances(buildParams(overrides)));
  };

  const handleFormBatchChange = (batchId) => {
    setFormCourse("");
    setFormBatch(batchId);
    loadAttendances({ course_id: "", batch_id: batchId });
  };

  const handleFormCourseChange = (courseId) => {
    setFormCourse(courseId);
    loadAttendances({ course_id: courseId });
  };

  const handleFormDateChange = (e) => {
    const value = e.target.value;
    setFormDate(value);
    setFormStartDate("");
    setFormEndDate("");
    loadAttendances({ date: value, start_date: "", end_date: "" });
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setFormStartDate(value);
    setFormDate("");
    loadAttendances({ date: "", start_date: value });
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setFormEndDate(value);
    setFormDate("");
    loadAttendances({ date: "", end_date: value });
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    setFormCourse("");
    setFormBatch("");
    setFormDate("");
    setFormStartDate("");
    setFormEndDate("");
    loadAttendances({
      course_id: "",
      batch_id: "",
      date: "",
      start_date: "",
      end_date: "",
    });
  };

  const handleDownloadExcel = () => {
    setLoading(true);
    dispatch(fetchAttendances({ ...buildParams(), download: true }))
      .unwrap()
      .then((data) => {
        const rows = data.data;
        downloadExcel({
          fileName: "StudentsAttendance[" + moment().format("DD/MM/YYYY") + "]",
          sheet: "Students Attendance",
          tablePayload: rows.map((attendance, index) => [
            index + 1,
            attendance.date,
            attendance.student.name,
            attendance.batch.name,
            attendance.course.name,
            "Present",
          ]),
        });
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    dispatch(fetchBatches({ authToken }));
    loadAttendances();
  }, []);

  useEffect(() => {
    if (formBatch) {
      dispatch(fetchBatchCourses({ authToken, batchId: formBatch }));
    }
  }, [authToken, dispatch, formBatch]);

  const courseOptions = formBatch ? batchCourses : [];

  return (
    <>
      <PageHeader title={viewOnly ? "My Attendance" : "Attendance"}>
        {!viewOnly && (
          <FilterStack className="filter-stack--actions">
            <button
              className="table-action-btn"
              onClick={handleDownloadExcel}
              disabled={loading}
            >
              <Download size={18} />
              Excel File
            </button>
          </FilterStack>
        )}
      </PageHeader>

      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        {!viewOnly && (
          <div className="w-full sm:max-w-xs">
            <TableSearch
              ref={tableSearchRef}
              setQueryFilter={setQueryFilter}
              method={fetchAttendances}
              payload={filterPayload}
            />
          </div>
        )}
          {!viewOnly && (
            <SearchableBatchSelect
              batches={batches}
              value={formBatch}
              onChange={handleFormBatchChange}
              placeholder="All Batches"
              width="100%"
            />
          )}
          {!viewOnly && formBatch && courseOptions.length > 0 && (
            <SearchableCourseSelect
              courses={courseOptions}
              value={formCourse}
              onChange={handleFormCourseChange}
              placeholder="All Courses"
              width="100%"
            />
          )}
          <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
            <Input
              type="date"
              size="lg"
              borderRadius="xl"
              value={formDate}
              onChange={handleFormDateChange}
              title="Single date"
            />
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
            <Input
              type="date"
              size="lg"
              borderRadius="xl"
              value={formStartDate}
              onChange={handleStartDateChange}
              title="From date"
            />
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
            <Input
              type="date"
              size="lg"
              borderRadius="xl"
              value={formEndDate}
              onChange={handleEndDateChange}
              title="To date"
            />
          </FormControl>
          <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
            <FilterX className="h-4 w-4" />
          </Button>
      </FilterStack>
      <DataTableShell>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th>Date</Th>
                <Th data-searchable>Student Name</Th>
                <Th>Batch</Th>
                <Th>Course</Th>
                <Th>Attendance Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {status == "loading" ? (
                <TableRowLoading nOfColumns={6} actions={[]} />
              ) : attendances.length === 0 ? (
                <Tr>
                  <Td colSpan={6}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No attendance record found
                    </span>
                  </Td>
                </Tr>
              ) : (
                (attendances ?? [])?.map((attendance) => (
                  <Tr key={attendance._id}>
                    <Td>{attendances.indexOf(attendance) + 1}</Td>
                    <Td>{attendance.date}</Td>
                    <Td>{attendance.student.name}</Td>
                    <Td>{attendance.batch.name}</Td>
                    <Td>{attendance.course.name}</Td>
                    <Td>
                      <div className="bg-[#7AEF85] text-[#257947] font-medium p-[10px] rounded-xl transition-colors duration-300 flex flex-nowrap items-center gap-1.5 px-5 max-w-min">
                        Present
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </DataTableShell>
      {status === "succeeded" && (
        <TablePagination
          pagination={pagination}
          setLimitFilter={setLimitFilter}
          setPageFilter={setPageFilter}
          method={fetchAttendances}
          payload={filterPayload}
        />
      )}
    </>
  );
}

export default Attendance;
