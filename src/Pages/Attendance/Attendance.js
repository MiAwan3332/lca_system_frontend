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
  FormLabel,
  Input,
  Select,
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
import { fetchBatches, selectAllBatches } from "../../Features/batchSlice";
import { fetchCourses, selectAllCourses } from "../../Features/courseSlice";
import TableSearch from "../../Components/TableSearch";
import TableRowLoading from "../../Components/TableRowLoading";
import TablePagination from "../../Components/TablePagination";
import { downloadExcel } from "react-export-table-to-excel";
import moment from "moment";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";

function Attendance() {
  const viewOnly = isStudentViewOnly();
  const tableSearchRef = useRef();

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));
  const [selectedBatch, setSelectedBatch] = useState("");

  const [formCourse, setFormCourse] = useState("");
  const [formBatch, setFormBatch] = useState("");
  const [formDate, setFormDate] = useState("");

  const [loading, setLoading] = useState(false);

  const attendances = useSelector(selectAttendances);
  const batches = useSelector(selectAllBatches);
  const { status, pagination } = useSelector((state) => state.attendance);
  const dispatch = useDispatch();

  const handleFormBatchChange = (e) => {
    setFormCourse("");
    setFormDate("");
    setFormBatch(e.target.value);
    setSelectedBatch(batches.find((batch) => batch._id === e.target.value));
    dispatch(
      fetchAttendances({
        authToken,
        course_id: formCourse,
        batch_id: e.target.value,
        date: formDate,
      })
    );
  };

  const handleFormCourseChange = (e) => {
    setFormCourse(e.target.value);
    dispatch(
      fetchAttendances({
        authToken,
        course_id: e.target.value,
        batch_id: formBatch,
        date: formDate,
      })
    );
  };

  const handleFormDateChange = (e) => {
    setFormDate(e.target.value);
    dispatch(
      fetchAttendances({
        authToken,
        course_id: formCourse,
        batch_id: formBatch,
        date: e.target.value,
      })
    );
  };

  const handleClearFilters = () => {
    tableSearchRef.current.clearSearch();
    setFormCourse("");
    setFormBatch("");
    setFormDate("");
    dispatch(
      fetchAttendances({
        authToken,
        course_id: "",
        batch_id: "",
        date: "",
      })
    );
  };

  const handleDownloadExcel = () => {
    setLoading(true);
    dispatch(
      fetchAttendances({
        authToken,
        course_id: formCourse,
        batch_id: formBatch,
        date: formDate,
        download: true,
      })
    )
      .unwrap()
      .then((data) => {
        const attendances = data.data;
        downloadExcel({
          fileName: "StudentsAttendance[" + moment().format("DD/MM/YYYY") + "]",
          sheet: "Students Attendance",
          tablePayload: attendances.map((attendance) => [
            attendances.indexOf(attendance) + 1,
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
    dispatch(
      fetchAttendances({
        authToken,
        course_id: formCourse,
        batch_id: formBatch,
        date: formDate,
      })
    );
  }, []);

  return (
    <>
      <PageHeader title={viewOnly ? "My Attendance" : "Attendance"}>
        <FilterStack>
          {!viewOnly && (
            <div className="w-full sm:max-w-xs">
              <TableSearch
                ref={tableSearchRef}
                setQueryFilter={setQueryFilter}
                method={fetchAttendances}
              />
            </div>
          )}
          {!viewOnly && (
            <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
              <Select
                placeholder="Select Batch"
                size="lg"
                borderRadius="xl"
                value={formBatch}
                onChange={(e) => handleFormBatchChange(e)}
              >
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          )}
          {!viewOnly && selectedBatch && selectedBatch.courses.length > 0 && (
            <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
              <Select
                placeholder="Select Course"
                size="lg"
                borderRadius="xl"
                value={formCourse}
                onChange={(e) => handleFormCourseChange(e)}
              >
                {selectedBatch?.courses?.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
            <Input
              type="date"
              size="lg"
              borderRadius="xl"
              value={formDate}
              onChange={(e) => handleFormDateChange(e)}
            />
          </FormControl>
          <Button
            size="icon"
            p={4}
            borderRadius="xl"
            onClick={(e) => handleClearFilters(e)}
          >
            <FilterX className="h-4 w-4" />
          </Button>
          {!viewOnly && (
            <button
              className="w-full sm:w-auto whitespace-nowrap bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 justify-center transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
              onClick={handleDownloadExcel}
            >
              <Download size={20} />
              Excel File
            </button>
          )}
        </FilterStack>
      </PageHeader>
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
                <Th>Sttendance Status</Th>
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
        />
      )}
    </>
  );
}

export default Attendance;
