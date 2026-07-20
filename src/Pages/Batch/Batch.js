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
  Switch,
  Badge,
  HStack,
  FormControl,
  Select,
  Input,
  Button,
} from "@chakra-ui/react";
import AddModel from "./AddModel";
import DeleteModal from "./DeleteModal";
import UpdateModal from "./UpdateModal";
import { FileX, FilterX, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBatches,
  selectAllBatches,
  selectCurrentActiveBatch,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setStatusFilter,
  setBatchTypeFilter,
  setStartDateFilter,
  setEndDateFilter,
  clearBatchFilters,
  toggleBatchStatus,
} from "../../Features/batchSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import AssignCoursesModal from "./AssignCoursesModal";
import AssignTeachersModal from "./AssignTeachersModal";
import BatchDeactivateConfirmModal from "./BatchDeactivateConfirmModal";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import { isInstitutionAdmin, isTeacherRole } from "../../utlls/teacherAccess";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";

function Batch() {
  const viewOnly = isStudentViewOnly();
  const canManageInstitution = isInstitutionAdmin();
  const isTeacher = isTeacherRole();
  const showFeeAndDates = !isTeacher;
  const tableSearchRef = useRef();
  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(null);

  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const { fetchStatus, pagination, filters, toggleBatchStatusStatus } = useSelector(
    (state) => state.batches
  );
  const batches = useSelector(selectAllBatches);
  const activeBatch = useSelector(selectCurrentActiveBatch);
  const dispatch = useDispatch();

  const loadBatches = () => {
    dispatch(fetchBatches({ authToken }));
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
    loadBatches();
  }, []);

  const handleStatusChange = (e) => {
    dispatch(setStatusFilter(e.target.value));
    loadBatches();
  };

  const handleBatchTypeChange = (e) => {
    dispatch(setBatchTypeFilter(e.target.value));
    loadBatches();
  };

  const handleStartDateChange = (e) => {
    dispatch(setStartDateFilter(e.target.value));
    loadBatches();
  };

  const handleEndDateChange = (e) => {
    dispatch(setEndDateFilter(e.target.value));
    loadBatches();
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearBatchFilters());
    loadBatches();
  };

  const hasActiveFilters =
    filters.is_active ||
    filters.batch_type ||
    filters.start_date ||
    filters.end_date ||
    filters.query;

  const handleToggleStatus = (batch) => {
    const nextStatus = batch.is_active === false;
    if (!nextStatus && (batch.enrolled_student_count || 0) > 0) {
      setDeactivateConfirm({
        batch,
        enrolledCount: batch.enrolled_student_count,
      });
      return;
    }
    dispatch(
      toggleBatchStatus({
        authToken,
        id: batch._id,
        is_active: nextStatus,
      })
    );
  };

  const confirmBatchDeactivate = () => {
    if (!deactivateConfirm?.batch) return;
    dispatch(
      toggleBatchStatus({
        authToken,
        id: deactivateConfirm.batch._id,
        is_active: false,
      })
    )
      .unwrap()
      .then(() => setDeactivateConfirm(null))
      .catch(() => {});
  };

  const actionColumnCount = canManageInstitution ? 2 : 0;
  const feeDateColumnCount = showFeeAndDates ? 3 : 0;
  const baseColumnCount = 4 + feeDateColumnCount; // No, Name, Description, Batch Type (+ fee/dates)
  const tableColumnCount = viewOnly
    ? baseColumnCount
    : baseColumnCount + actionColumnCount;

  return (
    <>
      <PageHeader title={viewOnly ? "My Batch" : canManageInstitution ? "All Batchs" : "My Assigned Batches"}>
        {canManageInstitution && (
          <FilterStack className="filter-stack--actions">
            {hasPermission(["Add_Batch"]) && (
              <button
                className="table-action-btn"
                onClick={onAddOpen}
              >
                <Plus size={18} />
                Add Batch
              </button>
            )}
          </FilterStack>
        )}
      </PageHeader>
      {canManageInstitution && (
        <FilterStack className="filter-stack--panel filter-stack--table mt-3">
          <div className="w-full sm:max-w-xs">
            <TableSearch
              ref={tableSearchRef}
              setQueryFilter={setQueryFilter}
              method={fetchBatches}
            />
          </div>
          <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
            <Select
              size="lg"
              borderRadius="xl"
              value={filters.is_active}
              onChange={handleStatusChange}
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
            <Input
              size="lg"
              borderRadius="xl"
              placeholder="Batch type"
              value={filters.batch_type}
              onChange={handleBatchTypeChange}
            />
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
            <Input
              type="date"
              size="lg"
              borderRadius="xl"
              value={filters.start_date}
              onChange={handleStartDateChange}
            />
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
            <Input
              type="date"
              size="lg"
              borderRadius="xl"
              value={filters.end_date}
              onChange={handleEndDateChange}
            />
          </FormControl>
          {hasActiveFilters && (
            <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </FilterStack>
      )}
      <DataTableShell>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th data-searchable>Name</Th>
                <Th data-searchable>Description</Th>
                <Th data-searchable>Batch Type</Th>
                {showFeeAndDates && <Th>Batch Fee</Th>}
                {showFeeAndDates && <Th>Start Date</Th>}
                {showFeeAndDates && <Th>End Date</Th>}
                {!viewOnly && canManageInstitution && <Th>Status</Th>}
                {!viewOnly && canManageInstitution && <Th isNumeric>Action</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={tableColumnCount}
                  actions={["w-10", "w-10", "w-20", "w-20"]}
                />
              ) : batches.length === 0 ? (
                <Tr>
                  <Td colSpan={tableColumnCount}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No batch records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                batches.map((batch) => {
                  const isActive = batch.is_active !== false;
                  return (
                  <Tr
                    key={batch._id}
                    className={
                      activeBatch?._id === batch._id
                        ? "bg-[#FFCB82]/20"
                        : !isActive
                          ? "opacity-70"
                          : ""
                    }
                  >
                    <Td>{batches.indexOf(batch) + 1}</Td>
                    <Td>{batch.name}</Td>
                    <Td>{batch.description}</Td>
                    <Td>{batch.batch_type ? batch.batch_type : "N/A"}</Td>
                    {showFeeAndDates && (
                      <Td>
                        {batch.is_special_batch ? (
                          <Badge colorScheme="purple">Special</Badge>
                        ) : batch.batch_fee != null && batch.batch_fee !== "" ? (
                          `${batch.batch_fee} Rs.`
                        ) : (
                          "N/A"
                        )}
                      </Td>
                    )}
                    {showFeeAndDates && <Td>{batch.startdate}</Td>}
                    {showFeeAndDates && <Td>{batch.enddate}</Td>}
                    {!viewOnly && canManageInstitution && (
                      <Td>
                        <HStack spacing={2}>
                          <Badge colorScheme={isActive ? "green" : "gray"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                          {hasPermission(["Update_Batch"]) && (
                            <Switch
                              isChecked={isActive}
                              onChange={() => handleToggleStatus(batch)}
                              colorScheme="yellow"
                              size="sm"
                            />
                          )}
                        </HStack>
                      </Td>
                    )}
                    {!viewOnly && (
                    <Td className="space-x-3 flex justify-end" isNumeric>
                      <ActionMenu>
                        {canManageInstitution && hasPermission(["Update_Batch"]) && (
                          <UpdateModal batch={batch} />
                        )}
                        {canManageInstitution && hasPermission(["Delete_Batch"]) && (
                          <DeleteModal batchId={batch._id} />
                        )}
                        {canManageInstitution && hasPermission(["Update_Batch"]) && (
                          <AssignCoursesModal batchId={batch._id} />
                        )}
                        {canManageInstitution && hasPermission(["Update_Batch"]) && (
                          <AssignTeachersModal batchId={batch._id} />
                        )}
                      </ActionMenu>
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
          method={fetchBatches}
        />
      )}
      {!viewOnly && canManageInstitution && <AddModel isOpen={isAddOpen} onClose={onAddClose} />}
      <BatchDeactivateConfirmModal
        isOpen={Boolean(deactivateConfirm)}
        onClose={() => setDeactivateConfirm(null)}
        batchName={deactivateConfirm?.batch?.name || ""}
        enrolledCount={deactivateConfirm?.enrolledCount || 0}
        onConfirm={confirmBatchDeactivate}
        isLoading={toggleBatchStatusStatus === "loading"}
      />
    </>
  );
}

export default Batch;
