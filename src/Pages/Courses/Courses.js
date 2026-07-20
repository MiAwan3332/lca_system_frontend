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
  Button,
} from "@chakra-ui/react";
import AddModel from "./AddModel";
import DeleteModal from "./DeleteModal";
import UpdateModal from "./UpdateModal";
import { FileX, FilterX, Plus } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchCourses,
  selectAllCourses,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setBatchFilter,
  clearCourseFilters,
} from "../../Features/courseSlice";
import { fetchBatches, selectActiveBatches } from "../../Features/batchSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import { isTeacherRole, isInstitutionAdmin } from "../../utlls/teacherAccess";
import { hasPermission } from "../../utlls/useful";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";

function Course() {
  const viewOnly = isStudentViewOnly();
  const isTeacher = isTeacherRole();
  const canManageInstitution = isInstitutionAdmin();
  const showFeeAndActions = canManageInstitution;
  const tableSearchRef = useRef();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const courses = useSelector(selectAllCourses);
  const batches = useSelector(selectActiveBatches);
  const { fetchStatus, pagination, filters } = useSelector((state) => state.courses);
  const dispatch = useDispatch();

  const loadCourses = () => {
    dispatch(fetchCourses({ authToken }));
  };

  useEffect(() => {
    if (canManageInstitution) {
      dispatch(fetchBatches({ authToken, queryParams: { limit: 200, page: 1, query: "" } }));
    }
    loadCourses();
  }, []);

  const handleBatchChange = (batchId) => {
    dispatch(setBatchFilter(batchId));
    loadCourses();
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearCourseFilters());
    loadCourses();
  };

  return (
    <>
      <PageHeader title={viewOnly || isTeacher ? "My Courses" : "All Courses"}>
        {canManageInstitution && (
          <FilterStack className="filter-stack--actions">
            {hasPermission(["Add_Course"]) && (
              <button
                className="table-action-btn"
                onClick={onAddOpen}
              >
                <Plus size={18} />
                Add Course
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
              method={fetchCourses}
            />
          </div>
          <SearchableBatchSelect
            batches={batches}
            value={filters.batch_id}
            onChange={handleBatchChange}
            placeholder="All Batches"
            width="100%"
          />
          {(filters.batch_id || filters.query) && (
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
                {showFeeAndActions && <Th>Course Fee</Th>}
                {showFeeAndActions && <Th isNumeric>Action</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={showFeeAndActions ? 5 : 3}
                  actions={showFeeAndActions ? ["w-10", "w-10"] : []}
                />
              ) : courses.length === 0 ? (
                <Tr>
                  <Td colSpan={showFeeAndActions ? 5 : 3}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No course records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                courses.map((course) => (
                  <Tr key={course._id}>
                    <Td>{courses.indexOf(course) + 1}</Td>
                    <Td>{course.name}</Td>
                    <Td>{course.description}</Td>
                    {showFeeAndActions && <Td>{course.fee || "N/A"}</Td>}
                    {showFeeAndActions && (
                    <Td className="space-x-3" isNumeric>
                      <ActionMenu>
                        {hasPermission(["Update_Course"]) && (
                          <UpdateModal course={course} />
                        )}
                        {hasPermission(["Delete_Course"]) && (
                          <DeleteModal courseId={course._id} />
                        )}
                      </ActionMenu>
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
          method={fetchCourses}
        />
      )}
      {canManageInstitution && <AddModel isOpen={isAddOpen} onClose={onAddClose} />}
    </>
  );
}

export default Course;
