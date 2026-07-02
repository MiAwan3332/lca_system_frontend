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
  FormControl,
  Input,
  Select,
  Button,
  Text,
  Box,
} from "@chakra-ui/react";
import AddModel from "./AddModel";
import DeleteModal from "./DeleteModal";
import UpdateModal from "./UpdateModal";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBatches,
  selectActiveBatches,
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
  setSearchFieldFilter,
  clearStudentFilters,
} from "../../Features/studentSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import ChangePasswordModal from "./ChangePasswordModal";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import StudentCardModal from "../../Components/Modals/Student/StudentCardModal";
import ViewModal from "./ViewModal";
import ExportModal from "./ExportModal";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import { isStudentViewOnly, isStudentProfileIncomplete } from "../../utlls/studentAccess";
import { isTeacherRole } from "../../utlls/teacherAccess";
import { useNavigate } from "react-router-dom";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";

function Student() {
  const navigate = useNavigate();
  const tableSearchRef = useRef();
  const [authToken] = useState(Cookies.get("authToken"));
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const { fetchStatus, pagination, filters } = useSelector(
    (state) => state.students
  );
  const students = useSelector(selectAllStudents);
  const batches = useSelector(selectActiveBatches);
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

  const handleSearchFieldChange = (e) => {
    dispatch(setSearchFieldFilter(e.target.value));
    if (filters.query) {
      loadStudents();
    }
  };

  const searchPlaceholder =
    filters.search_field === "name"
      ? "Search by student name..."
      : filters.search_field === "email"
      ? "Search by email..."
      : filters.search_field === "phone"
      ? "Search by phone number..."
      : "Search by name, email, or phone...";

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    if (isTeacher) {
      dispatch(setBatchFilter(""));
      dispatch(setQueryFilter(""));
      dispatch(setSearchFieldFilter("name"));
    } else {
      dispatch(clearStudentFilters());
    }
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

  const viewOnly = isStudentViewOnly();
  const profileIncomplete = isStudentProfileIncomplete();
  const isTeacher = isTeacherRole();
  const showAdminControls = !viewOnly && !isTeacher;
  const tableColumnCount = viewOnly ? 7 : isTeacher ? 6 : 8;

  useEffect(() => {
    if (isTeacher) {
      dispatch(setSearchFieldFilter("name"));
    }
    dispatch(setBatchLimitFilter(100));
    dispatch(fetchBatches({ authToken }));
    dispatch(fetchStudents({ authToken }));
  }, []);

  return (
    <>
      {viewOnly && profileIncomplete && students[0] && (
        <ViewModal
          student={students[0]}
          forced
          onComplete={() => navigate("/dashboard")}
        />
      )}

      {viewOnly && profileIncomplete && (
        <Box
          mb={4}
          p={4}
          borderRadius="xl"
          bg="orange.50"
          border="1px solid"
          borderColor="orange.200"
          maxW="3xl"
        >
          <Text fontSize="sm" color="orange.800" fontWeight="medium">
            Profile completion is required on your first login. Please fill in
            all details in the form below to access the rest of the system.
          </Text>
        </Box>
      )}

      <PageHeader
        title={viewOnly ? "My Profile" : "All Students"}
        subtitle={
          isTeacher ? "Students from your assigned batches only." : undefined
        }
      >
        {showAdminControls && (
          <FilterStack>
            <FormControl className="responsive-input" w={{ base: "full", sm: "10rem" }}>
              <Select
                size="lg"
                borderRadius="xl"
                value={filters.search_field}
                onChange={handleSearchFieldChange}
              >
                <option value="all">All Fields</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </Select>
            </FormControl>
            <div className="w-full sm:max-w-xs">
              <TableSearch
                ref={tableSearchRef}
                setQueryFilter={setQueryFilter}
                method={fetchStudents}
                placeholder={searchPlaceholder}
              />
            </div>
            {hasPermission(["Add_Student"]) && (
              <button
                className="w-full sm:w-auto bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 justify-center transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
                onClick={onAddOpen}
              >
                <Plus size={24} />
                Add Student
              </button>
            )}
            <ExportModal />
          </FilterStack>
        )}
        {isTeacher && (
          <FilterStack>
            <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
              <SearchableBatchSelect
                batches={batches}
                value={filters.batch_id}
                onChange={handleBatchChange}
                placeholder="All Assigned Batches"
                width="100%"
              />
            </FormControl>
            <div className="w-full sm:max-w-xs">
              <TableSearch
                ref={tableSearchRef}
                setQueryFilter={setQueryFilter}
                method={fetchStudents}
                placeholder="Search by student name..."
              />
            </div>
            {(filters.batch_id || filters.query) && (
              <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </FilterStack>
        )}
      </PageHeader>

      {showAdminControls && (
      <FilterStack className="mt-3">
          <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
            <SearchableBatchSelect
              batches={batches}
              value={filters.batch_id}
              onChange={handleBatchChange}
              placeholder="All Batches"
              width="100%"
            />
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "11rem" }}>
            <Select
              placeholder="Enrollment Status"
              size="lg"
              borderRadius="xl"
              value={filters.enrollment_status}
              onChange={handleEnrollmentChange}
            >
              <option value="enrolled">Enrolled</option>
              <option value="unenrolled">Unenrolled</option>
            </Select>
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
            <Input
              type="date"
              size="lg"
              borderRadius="xl"
              placeholder="Admission From"
              value={filters.start_date}
              onChange={handleStartDateChange}
            />
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
            <Input
              type="date"
              size="lg"
              borderRadius="xl"
              placeholder="Admission To"
              value={filters.end_date}
              onChange={handleEndDateChange}
            />
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "9rem" }}>
            <Input
              placeholder="City"
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
      </FilterStack>
      )}

      <DataTableShell>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                {(showAdminControls || viewOnly) && (
                  <Th>{viewOnly ? "View" : "View | QR | Card"}</Th>
                )}
                <Th data-searchable>Name</Th>
                <Th data-searchable>Email</Th>
                <Th data-searchable>Phone</Th>
                <Th>City</Th>
                <Th>Last Active Batch</Th>
                {showAdminControls && <Th isNumeric>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={tableColumnCount}
                  actions={showAdminControls ? ["w-10", "w-10", "w-20"] : viewOnly ? ["w-10"] : []}
                />
              ) : students.length === 0 ? (
                <Tr>
                  <Td colSpan={tableColumnCount}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No student records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                students.map((student, index) => (
                  <Tr key={student._id}>
                    <Td>
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </Td>
                    {(showAdminControls || viewOnly) && (
                    <Td>
                      <ButtonGroup variant="outline">
                        {(!viewOnly || !profileIncomplete) && (
                          <ViewModal student={student} />
                        )}
                        {showAdminControls && <QrCodeModal student={student} />}
                        {showAdminControls && <StudentCardModal student={student} />}
                      </ButtonGroup>
                    </Td>
                    )}
                    <Td>{student.name}</Td>
                    <Td>{student.email}</Td>
                    <Td>{student.phone}</Td>
                    <Td>{student.city || "-"}</Td>
                    <Td>{student.batch ? student.batch.name : "No Batch"}</Td>
                    {showAdminControls && (
                    <Td className="space-x-3" isNumeric>
                      <div className="action-cell">
                        <ActionMenu>
                          {hasPermission(["Update_Student"]) && (
                            <>
                              <UpdateModal student={student} />
                              <ChangePasswordModal student={student} />
                            </>
                          )}
                          {hasPermission(["Delete_Student"]) && (
                            <DeleteModal studentId={student._id} />
                          )}
                        </ActionMenu>
                      </div>
                    </Td>
                    )}
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </DataTableShell>
      {fetchStatus !== "loading" && (
        <TablePagination
          pagination={pagination}
          setLimitFilter={setLimitFilter}
          setPageFilter={setPageFilter}
          method={fetchStudents}
        />
      )}
      <AddModel isOpen={isAddOpen && showAdminControls} onClose={onAddClose} />
    </>
  );
}

export default Student;
