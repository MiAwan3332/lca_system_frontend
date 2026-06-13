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
  ButtonGroup,
  HStack,
  FormControl,
  Input,
  Select,
  Button,
} from "@chakra-ui/react";
import AddModel from "./AddModel";
import DeleteModal from "./DeleteModal";
import UpdateModal from "./UpdateModal";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBatches,
  selectAllBatches,
  setLimitFilter as setBatchLimitFilter,
} from "../../Features/batchSlice";
import QrCodeModal from "../../Components/Modals/Student/QrCodeModal";
import { FileX, FilterX, Plus } from "lucide-react";
import {
  fetchStudents,
  selectAllStudents,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setBatchFilter,
  setEnrollmentFilter,
  setStartDateFilter,
  setEndDateFilter,
  setCityFilter,
  clearStudentFilters,
} from "../../Features/studentSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import EnrollmentModal from "./EnrollmentModal";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import StudentCardModal from "../../Components/Modals/Student/StudentCardModal";
import ViewModal from "./ViewModal";
import ExportModal from "./ExportModal";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";

function Student() {
  const tableSearchRef = useRef();
  const [authToken] = useState(Cookies.get("authToken"));
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const { fetchStatus, pagination, filters } = useSelector(
    (state) => state.students
  );
  const students = useSelector(selectAllStudents);
  const batches = useSelector(selectAllBatches);
  const dispatch = useDispatch();

  const loadStudents = () => {
    dispatch(fetchStudents({ authToken }));
  };

  const handleBatchChange = (batch_id) => {
    dispatch(setBatchFilter(batch_id));
    loadStudents();
  };

  const handleEnrollmentChange = (e) => {
    dispatch(setEnrollmentFilter(e.target.value));
    loadStudents();
  };

  const handleStartDateChange = (e) => {
    dispatch(setStartDateFilter(e.target.value));
    loadStudents();
  };

  const handleEndDateChange = (e) => {
    dispatch(setEndDateFilter(e.target.value));
    loadStudents();
  };

  const handleCityChange = (e) => {
    dispatch(setCityFilter(e.target.value));
  };

  const handleCityKeyDown = (e) => {
    if (e.key === "Enter") {
      loadStudents();
    }
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearStudentFilters());
    loadStudents();
  };

  const hasPermission = (permissionsToCheck) => {
    const storedPermissions = sessionStorage.getItem("permissions");
    const permissionsArray = storedPermissions
      ? storedPermissions.split(",")
      : [];
    return permissionsToCheck.some((permission) =>
      permissionsArray.includes(permission)
    );
  };

  useEffect(() => {
    dispatch(setBatchLimitFilter(100));
    dispatch(fetchBatches({ authToken }));
    dispatch(fetchStudents({ authToken }));
  }, []);

  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-xl font-semibold ml-6 text-nowrap">All Students</h1>
        <div className="w-full flex items-center justify-end gap-3 flex-wrap">
          <TableSearch
            ref={tableSearchRef}
            setQueryFilter={setQueryFilter}
            method={fetchStudents}
          />
          {hasPermission(["Add_Student"]) && (
            <button
              className="bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
              onClick={onAddOpen}
            >
              <Plus size={24} />
              Add Student
            </button>
          )}
          <ExportModal />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mr-6 mt-3 flex-wrap">
        <HStack spacing={3}>
          <FormControl>
            <SearchableBatchSelect
              batches={batches}
              value={filters.batch_id}
              onChange={handleBatchChange}
              placeholder="All Batches"
              width="12rem"
            />
          </FormControl>
          <FormControl>
            <Select
              placeholder="Enrollment Status"
              w={44}
              size="lg"
              borderRadius="xl"
              value={filters.enrollment_status}
              onChange={handleEnrollmentChange}
            >
              <option value="enrolled">Enrolled</option>
              <option value="unenrolled">Unenrolled</option>
            </Select>
          </FormControl>
          <FormControl>
            <Input
              type="date"
              w={40}
              size="lg"
              borderRadius="xl"
              placeholder="Admission From"
              value={filters.start_date}
              onChange={handleStartDateChange}
            />
          </FormControl>
          <FormControl>
            <Input
              type="date"
              w={40}
              size="lg"
              borderRadius="xl"
              placeholder="Admission To"
              value={filters.end_date}
              onChange={handleEndDateChange}
            />
          </FormControl>
          <FormControl>
            <Input
              placeholder="City"
              w={36}
              size="lg"
              borderRadius="xl"
              value={filters.city}
              onChange={handleCityChange}
              onKeyDown={handleCityKeyDown}
              onBlur={loadStudents}
            />
          </FormControl>
          <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
            <FilterX className="h-4 w-4" />
          </Button>
        </HStack>
      </div>

      <div className="w-full bg-white mt-3 rounded-xl border border-[#E0E8EC]">
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th>View | QR | Card</Th>
                <Th data-searchable>Name</Th>
                <Th data-searchable>Email</Th>
                <Th data-searchable>Phone</Th>
                <Th>City</Th>
                <Th>Last Active Batch</Th>
                <Th isNumeric>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={8}
                  actions={["w-10", "w-10", "w-20"]}
                />
              ) : students.length === 0 ? (
                <Tr>
                  <Td colSpan={8}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No student records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                students.map((student, index) => (
                  <Tr key={student._id}>
                    <Td>{index + 1}</Td>
                    <Td>
                      <ButtonGroup variant="outline">
                        <ViewModal student={student} />
                        <QrCodeModal student={student} />
                        <StudentCardModal student={student} />
                      </ButtonGroup>
                    </Td>
                    <Td>{student.name}</Td>
                    <Td>{student.email}</Td>
                    <Td>{student.phone}</Td>
                    <Td>{student.city || "-"}</Td>
                    <Td>{student.batch ? student.batch.name : "No Batch"}</Td>
                    <Td className="space-x-3" isNumeric>
                      <div className="flex flex-nowrap justify-end items-center gap-2">
                        {hasPermission(["Update_Student"]) && (
                          <UpdateModal student={student} />
                        )}
                        {hasPermission(["Delete_Student"]) && (
                          <DeleteModal studentId={student._id} />
                        )}
                        <EnrollmentModal studentId={student._id} />
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </div>
      {fetchStatus !== "loading" && (
        <TablePagination
          pagination={pagination}
          setLimitFilter={setLimitFilter}
          setPageFilter={setPageFilter}
          method={fetchStudents}
        />
      )}
      <AddModel isOpen={isAddOpen} onClose={onAddClose} />
    </>
  );
}

export default Student;
