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
  Switch,
  Badge,
  HStack,
  VStack,
} from "@chakra-ui/react";
import AddModel from "./AddModel";
import UpdateModal from "./UpdateModal";
import ShiftBatchModal from "./ShiftBatchModal";
import StudentHistoryModal from "./StudentHistoryModal";
import GeneratePendingFeeSlipAction from "./GeneratePendingFeeSlipAction";
import GeneratePendingFeeWizard from "./GeneratePendingFeeWizard";
import ReprintFeeSlipAction from "./ReprintFeeSlipAction";
import RefundRequestAction from "./RefundRequestAction";
import ProcessRefundAction from "./ProcessRefundAction";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBatches,
  selectActiveBatches,
  setLimitFilter as setBatchLimitFilter,
} from "../../Features/batchSlice";
import QrCodeModal from "../../Components/Modals/Student/QrCodeModal";
import { FileX, FilterX, Plus, FileUp, Archive, HandCoins, GraduationCap } from "lucide-react";
import {
  fetchStudents,
  selectAllStudents,
  selectStudentStatusCounts,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setBatchFilter,
  setPaymentStatusFilter,
  setStartDateFilter,
  setEndDateFilter,
  setCityFilter,
  setSearchFieldFilter,
  clearStudentFilters,
  setStatusFilter,
  toggleStudentStatus,
  toggleBatchStudentsStatus,
} from "../../Features/studentSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import ChangePasswordModal from "./ChangePasswordModal";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import StudentCardModal from "../../Components/Modals/Student/StudentCardModal";
import ViewModal from "./ViewModal";
import ExportModal from "./ExportModal";
import StudentImportModal from "./StudentImportModal";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import DeleteModal from "./DeleteModal";
import StudentRefundHistoryPanel from "./StudentRefundHistoryPanel";
import DeletedStudentsPanel from "./DeletedStudentsPanel";
import { isStudentViewOnly, isStudentProfileIncomplete } from "../../utlls/studentAccess";
import { isTeacherRole } from "../../utlls/teacherAccess";
import { hasPermission, canDeleteStudent, canShiftStudentBatch } from "../../utlls/useful";
import { canAccessRequestManagement } from "../../utlls/refundAccess";
import { useNavigate } from "react-router-dom";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";

const LIST_VIEWS = {
  all: "all",
  refund: "refund",
  deleted: "deleted",
};

function Student() {
  const navigate = useNavigate();
  const tableSearchRef = useRef();
  const [authToken] = useState(Cookies.get("authToken"));
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [listView, setListView] = useState(LIST_VIEWS.all);
  const showDeleteStudent = canDeleteStudent();
  const showShiftBatch = canShiftStudentBatch();
  const showRefundToggle = canAccessRequestManagement();
  const showListViewSwitcher = showRefundToggle || showDeleteStudent;
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);
  const onImportOpen = () => setIsImportOpen(true);
  const onImportClose = () => setIsImportOpen(false);

  const { fetchStatus, pagination, filters } = useSelector(
    (state) => state.students
  );
  const students = useSelector(selectAllStudents);
  const statusCounts = useSelector(selectStudentStatusCounts);
  const batches = useSelector(selectActiveBatches);
  const dispatch = useDispatch();

  const loadStudents = () => {
    dispatch(fetchStudents({ authToken }));
  };

  const handleBatchChange = (batch_id) => {
    dispatch(setBatchFilter(batch_id));
    setTimeout(() => loadStudents(), 0);
  };

  const handlePaymentStatusChange = (e) => {
    dispatch(setPaymentStatusFilter(e.target.value));
    setTimeout(() => loadStudents(), 0);
  };

  const handleStartDateChange = (e) => {
    dispatch(setStartDateFilter(e.target.value));
    setTimeout(() => loadStudents(), 0);
  };

  const handleEndDateChange = (e) => {
    dispatch(setEndDateFilter(e.target.value));
    setTimeout(() => loadStudents(), 0);
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

  const handleStatusFilterChange = (value) => {
    const next = value == null ? "" : String(value);
    dispatch(setStatusFilter(next));
    // Defer fetch so Redux filter state is applied before params are read.
    setTimeout(() => {
      dispatch(fetchStudents({ authToken }));
    }, 0);
  };

  const handleStatusSelectChange = (e) => {
    handleStatusFilterChange(e.target.value);
  };

  const STATUS_COUNT_OPTIONS = [
    { value: "", label: "Total", count: statusCounts.total },
    { value: "true", label: "Active", count: statusCounts.active },
    { value: "false", label: "Inactive", count: statusCounts.inactive },
  ];

  const renderStatusCountFilters = () => (
    <div className="w-full">
      <Text fontSize="xs" color="gray.500" mb={1} fontWeight="medium">
        Student counts
      </Text>
      <div className="grid grid-cols-3 gap-2 w-full max-w-xl">
        {STATUS_COUNT_OPTIONS.map((option) => {
          const isSelected = String(filters.is_active || "") === option.value;
          return (
            <Button
              key={option.label}
              type="button"
              size="md"
              w="full"
              h="auto"
              py={2.5}
              px={3}
              borderRadius="xl"
              border="1px solid"
              borderColor={isSelected ? "#E3B574" : "#E0E8EC"}
              bg={isSelected ? "#FFCB82" : "white"}
              color={isSelected ? "#654E26" : "#4A5568"}
              _hover={{ bg: isSelected ? "#E3B574" : "#FFFBF5" }}
              onClick={() => handleStatusFilterChange(option.value)}
            >
              <VStack spacing={0} w="full">
                <Text as="span" fontWeight="600" fontSize="sm">
                  {option.label}
                </Text>
                <Text as="span" fontWeight="700" fontSize="md" lineHeight="1.2">
                  {Number(option.count) || 0}
                </Text>
              </VStack>
            </Button>
          );
        })}
      </div>
    </div>
  );

  const renderStatusSelectFilter = () => (
    <FormControl className="responsive-input" w={{ base: "full", md: "11rem" }}>
      <Select
        size="lg"
        borderRadius="xl"
        value={filters.is_active || ""}
        onChange={handleStatusSelectChange}
      >
        <option value="">All statuses</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </Select>
    </FormControl>
  );

  const handleToggleStudentStatus = (student) => {
    const nextStatus = student.is_active === false;
    dispatch(
      toggleStudentStatus({
        authToken,
        id: student._id,
        is_active: nextStatus,
      })
    );
  };

  const handleBatchStudentsStatus = (is_active) => {
    if (!filters.batch_id) return;
    dispatch(
      toggleBatchStudentsStatus({
        authToken,
        batchId: filters.batch_id,
        is_active,
      })
    ).then(() => loadStudents());
  };

  const selectedBatch = batches.find((b) => b._id === filters.batch_id);

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
      dispatch(setStatusFilter(""));
    } else {
      dispatch(clearStudentFilters());
    }
    loadStudents();
  };

  const viewOnly = isStudentViewOnly();
  const profileIncomplete = isStudentProfileIncomplete();
  const isTeacher = isTeacherRole();
  const showAdminControls = !viewOnly && !isTeacher;
  const canUpdateStudent = hasPermission(["Update_Student"]);
  const showStatusColumn = !viewOnly && canUpdateStudent;

  const tableColumnCount = viewOnly
    ? 6
    : isTeacher
    ? showStatusColumn
      ? 6
      : 5
    : showStatusColumn
    ? 8
    : 7;

  useEffect(() => {
    dispatch(clearStudentFilters());
    if (isTeacher) {
      dispatch(setSearchFieldFilter("name"));
    }
    dispatch(setBatchLimitFilter(100));
    dispatch(fetchBatches({ authToken }));
    // Defer so cleared filters are applied before the list request.
    const timer = setTimeout(() => {
      dispatch(fetchStudents({ authToken }));
    }, 0);
    return () => clearTimeout(timer);
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
        title={
          viewOnly
            ? "My Profile"
            : listView === LIST_VIEWS.refund
              ? "Refund History"
              : listView === LIST_VIEWS.deleted
                ? "Deleted Students"
                : "All Students"
        }
        subtitle={
          listView === LIST_VIEWS.refund
            ? "Students who requested refunds — pending, approved, refunded, and rejected."
            : listView === LIST_VIEWS.deleted
              ? "Who deleted which student, with complete archived finance data."
              : isTeacher
                ? "Students from your assigned batches only."
                : undefined
        }
      >
        {showAdminControls && listView === LIST_VIEWS.all && (
          <FilterStack className="filter-stack--actions">
            {hasPermission(["Add_Student"]) && (
              <>
                <button
                  type="button"
                  className="table-action-btn"
                  onClick={onImportOpen}
                >
                  <FileUp size={18} />
                  Import Excel
                </button>
                <button
                  className="table-action-btn table-action-btn--primary"
                  onClick={onAddOpen}
                >
                  <Plus size={18} />
                  Add Student
                </button>
                <GeneratePendingFeeWizard />
              </>
            )}
            <ExportModal />
          </FilterStack>
        )}
      </PageHeader>

      {showAdminControls && showListViewSwitcher && (
        <FilterStack className="filter-stack--panel mt-3 mb-1">
          <ButtonGroup
            isAttached
            variant="outline"
            borderRadius="xl"
            flexWrap="wrap"
            size="md"
          >
            <Button
              leftIcon={<GraduationCap size={16} />}
              borderRadius="xl"
              bg={listView === LIST_VIEWS.all ? "#FFCB82" : "white"}
              borderColor={listView === LIST_VIEWS.all ? "#E3B574" : "#E0E8EC"}
              color={listView === LIST_VIEWS.all ? "#654E26" : "#4A5568"}
              onClick={() => setListView(LIST_VIEWS.all)}
            >
              All Students
            </Button>
            {showRefundToggle && (
              <Button
                leftIcon={<HandCoins size={16} />}
                borderRadius="xl"
                bg={listView === LIST_VIEWS.refund ? "#FFCB82" : "white"}
                borderColor={
                  listView === LIST_VIEWS.refund ? "#E3B574" : "#E0E8EC"
                }
                color={listView === LIST_VIEWS.refund ? "#654E26" : "#4A5568"}
                onClick={() => setListView(LIST_VIEWS.refund)}
              >
                Refund History
              </Button>
            )}
            {showDeleteStudent && (
              <Button
                leftIcon={<Archive size={16} />}
                borderRadius="xl"
                bg={listView === LIST_VIEWS.deleted ? "#FFCB82" : "white"}
                borderColor={
                  listView === LIST_VIEWS.deleted ? "#E3B574" : "#E0E8EC"
                }
                color={listView === LIST_VIEWS.deleted ? "#654E26" : "#4A5568"}
                onClick={() => setListView(LIST_VIEWS.deleted)}
              >
                Deleted Students
              </Button>
            )}
          </ButtonGroup>
        </FilterStack>
      )}

      {showAdminControls && listView === LIST_VIEWS.refund ? (
        <StudentRefundHistoryPanel />
      ) : showAdminControls && listView === LIST_VIEWS.deleted ? (
        <DeletedStudentsPanel />
      ) : (
        <>
      {isTeacher && (
        <>
          <div className="mt-3 mb-2">{renderStatusCountFilters()}</div>
          <FilterStack className="filter-stack--panel filter-stack--table mt-2">
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
            {renderStatusSelectFilter()}
            {(filters.batch_id || filters.query || filters.is_active) && (
              <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
                <FilterX className="h-4 w-4" />
              </Button>
            )}
            {canUpdateStudent && filters.batch_id && (
              <>
                <Button
                  size="sm"
                  colorScheme="green"
                  borderRadius="xl"
                  onClick={() => handleBatchStudentsStatus(true)}
                >
                  Activate all
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  borderRadius="xl"
                  onClick={() => handleBatchStudentsStatus(false)}
                >
                  Deactivate all
                </Button>
              </>
            )}
          </FilterStack>
        </>
      )}

      {showAdminControls && (
        <>
          <div className="mt-3 mb-2">{renderStatusCountFilters()}</div>
          <FilterStack className="filter-stack--panel filter-stack--table mt-2">
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
            <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
              <SearchableBatchSelect
                batches={batches}
                value={filters.batch_id}
                onChange={handleBatchChange}
                placeholder="All Batches"
                width="100%"
              />
            </FormControl>
            <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
              <Select
                size="lg"
                borderRadius="xl"
                value={filters.payment_status || ""}
                onChange={handlePaymentStatusChange}
              >
                <option value="">All payment statuses</option>
                <option value="pending_dues">Pending Dues</option>
                <option value="fully_paid">Fully Paid</option>
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
            {renderStatusSelectFilter()}
            {canUpdateStudent && filters.batch_id && selectedBatch && (
              <>
                <Button
                  size="sm"
                  colorScheme="green"
                  borderRadius="xl"
                  onClick={() => handleBatchStudentsStatus(true)}
                >
                  Activate all in {selectedBatch.name}
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  borderRadius="xl"
                  onClick={() => handleBatchStudentsStatus(false)}
                >
                  Deactivate all in {selectedBatch.name}
                </Button>
              </>
            )}
            <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
              <FilterX className="h-4 w-4" />
            </Button>
          </FilterStack>
        </>
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
                <Th>Roll No</Th>
                <Th data-searchable>Name</Th>
                <Th data-searchable>Phone</Th>
                <Th>City</Th>
                <Th>Last Active Batch</Th>
                {showStatusColumn && <Th>Status</Th>}
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
                students.map((student, index) => {
                  const isActive = student.is_active !== false;
                  const hasPendingFee = Number(student.pending_fee) > 0;
                  return (
                  <Tr
                    key={student._id}
                    className={[
                      !isActive ? "opacity-70" : "",
                      hasPendingFee ? "student-row--pending-fee" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={
                      hasPendingFee
                        ? `Pending fee: Rs. ${Number(student.pending_fee).toLocaleString()}`
                        : undefined
                    }
                  >
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
                    <Td>{student.roll_number || "—"}</Td>
                    <Td>
                      <HStack spacing={2} align="center">
                        <Text as="span">{student.name}</Text>
                        {hasPendingFee && (
                          <Badge colorScheme="orange" borderRadius="md">
                            Pending
                          </Badge>
                        )}
                      </HStack>
                    </Td>
                    <Td>{student.phone}</Td>
                    <Td>{student.city || "-"}</Td>
                    <Td>{student.batch ? student.batch.name : "No Batch"}</Td>
                    {showStatusColumn && (
                      <Td>
                        <HStack spacing={2}>
                          <Badge colorScheme={isActive ? "green" : "gray"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Switch
                            size="sm"
                            isChecked={isActive}
                            onChange={() => handleToggleStudentStatus(student)}
                            colorScheme="green"
                          />
                        </HStack>
                      </Td>
                    )}
                    {showAdminControls && (
                    <Td className="space-x-3" isNumeric>
                      <div className="action-cell">
                        <ActionMenu>
                          <StudentHistoryModal student={student} />
                          {hasPendingFee && (
                            <GeneratePendingFeeSlipAction student={student} />
                          )}
                          <ReprintFeeSlipAction student={student} />
                          {hasPermission(["Update_Student"]) && (
                            <>
                              <UpdateModal student={student} />
                              {showShiftBatch && <ShiftBatchModal student={student} />}
                              <ChangePasswordModal student={student} />
                            </>
                          )}
                          {showDeleteStudent && (
                            <DeleteModal studentId={student._id} />
                          )}
                          <RefundRequestAction student={student} />
                          <ProcessRefundAction student={student} />
                        </ActionMenu>
                      </div>
                    </Td>
                    )}
                  </Tr>
                );
                })
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
        </>
      )}
      <AddModel isOpen={isAddOpen && showAdminControls} onClose={onAddClose} />
      <StudentImportModal
        isOpen={isImportOpen && showAdminControls}
        onClose={onImportClose}
        batches={batches}
      />
    </>
  );
}

export default Student;
