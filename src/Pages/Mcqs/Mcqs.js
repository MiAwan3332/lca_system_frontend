import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Badge,
  useDisclosure,
} from "@chakra-ui/react";
import { FileX, FilterX } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchMcqs,
  selectAllMcqs,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setCourseFilter,
  setBatchFilter,
  clearMcqFilters,
} from "../../Features/mcqSlice";
import { fetchCourses, selectAllCourses } from "../../Features/courseSlice";
import { fetchBatches, fetchBatchCourses, selectActiveBatches, selectBatchCourses } from "../../Features/batchSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import SearchableCourseSelect from "../../Components/SearchableCourseSelect";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import McqImportModal from "./McqImportModal";
import McqAddMethods from "./McqAddMethods";
import AddModel from "./AddModel";
import UpdateModal from "./UpdateModal";
import DeleteModal from "./DeleteModal";
import { downloadMcqTemplate } from "../../utlls/mcqExcel";
import { hasPermission } from "../../utlls/useful";
import { isTeacherRole } from "../../utlls/teacherAccess";
import ActionMenu from "../../Components/ActionMenu";

const truncateText = (text, maxLength = 60) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const getCourseName = (courseId) => {
  if (!courseId) return "N/A";
  if (typeof courseId === "object" && courseId.name) return courseId.name;
  return "N/A";
};

const getCorrectOptionLabel = (correctOption) => {
  const labels = ["A", "B", "C", "D"];
  const index = parseInt(correctOption, 10);
  return labels[index] || "N/A";
};

function Mcq() {
  const [authToken] = useState(Cookies.get("authToken"));
  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure();
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const isTeacher = isTeacherRole();
  const canAdd = hasPermission(["Add_Mcq"]) || isTeacher;
  const canEdit = hasPermission(["Update_Mcq"]) || isTeacher;
  const canDelete = hasPermission(["Delete_Mcq"]) || isTeacher;
  const showActions = canEdit || canDelete;

  const mcqs = useSelector(selectAllMcqs);
  const courses = useSelector(selectAllCourses);
  const batches = useSelector(selectActiveBatches);
  const batchCourses = useSelector(selectBatchCourses);
  const { fetchStatus, pagination, filters } = useSelector((state) => state.mcqs);
  const dispatch = useDispatch();

  const loadMcqs = () => {
    dispatch(fetchMcqs({ authToken }));
  };

  useEffect(() => {
    loadMcqs();
    dispatch(
      fetchCourses({ authToken, queryParams: { limit: 200, page: 1, query: "" } })
    );
    dispatch(fetchBatches({ authToken, queryParams: { limit: 200, page: 1, query: "" } }));
  }, [authToken, dispatch]);

  useEffect(() => {
    if (filters.batch_id) {
      dispatch(fetchBatchCourses({ authToken, batchId: filters.batch_id }));
    }
  }, [authToken, dispatch, filters.batch_id]);

  const handleBatchFilter = (batchId) => {
    dispatch(setBatchFilter(batchId));
    loadMcqs();
  };

  const handleCourseFilter = (courseId) => {
    dispatch(setCourseFilter(courseId));
    loadMcqs();
  };

  const clearFilters = () => {
    dispatch(clearMcqFilters());
    loadMcqs();
  };

  const courseOptions = filters.batch_id ? batchCourses : courses;

  const handleDownloadTemplate = () => {
    downloadMcqTemplate(courses[0]?.name || "Sample Course");
  };

  const pageTitle = isTeacher ? "My MCQs" : "All MCQs";
  const pageSubtitle = isTeacher
    ? "Add and manage MCQs for your assigned courses only."
    : canAdd
      ? "Manage your MCQ bank using manual entry, Excel import, or the Quiz module."
      : "Read-only MCQ bank. Use the Quiz module to attempt quizzes.";

  return (
    <>
      <PageHeader title={pageTitle} subtitle={pageSubtitle}>
        <FilterStack>
          <div className="w-full sm:max-w-xs">
            <TableSearch setQueryFilter={setQueryFilter} method={fetchMcqs} />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <SearchableBatchSelect
              batches={batches}
              value={filters.batch_id}
              onChange={handleBatchFilter}
              placeholder="All Batches"
              width="100%"
            />
            <SearchableCourseSelect
              courses={courseOptions}
              value={filters.course_id}
              onChange={handleCourseFilter}
              placeholder={isTeacher ? "Filter by assigned course" : "All Courses"}
              width="100%"
            />
            {(filters.batch_id || filters.course_id) && (
              <IconButton
                aria-label="Clear filters"
                icon={<FilterX size={18} />}
                size="lg"
                borderRadius="xl"
                variant="outline"
                onClick={clearFilters}
              />
            )}
          </div>
        </FilterStack>
      </PageHeader>

      {canAdd && (
        <McqAddMethods
          onAddManual={onAddOpen}
          onImportExcel={onImportOpen}
          onDownloadTemplate={handleDownloadTemplate}
        />
      )}

      <DataTableShell>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th>Course</Th>
                <Th data-searchable>Question</Th>
                <Th>Option-A</Th>
                <Th>Option-B</Th>
                <Th>Option-C</Th>
                <Th>Option-D</Th>
                <Th>Correct</Th>
                {showActions && <Th isNumeric>Action</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={8}
                  actions={showActions ? ["w-10", "w-10"] : []}
                />
              ) : mcqs?.length === 0 ? (
                <Tr>
                  <Td colSpan={showActions ? 9 : 8}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No mcq records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                mcqs?.map((mcq, index) => (
                  <Tr key={mcq._id}>
                    <Td>{(pagination.page - 1) * pagination.limit + index + 1}</Td>
                    <Td>{getCourseName(mcq.courseId)}</Td>
                    <Td title={mcq.question}>{truncateText(mcq.question)}</Td>
                    <Td title={mcq.option1}>{truncateText(mcq.option1, 30)}</Td>
                    <Td title={mcq.option2}>{truncateText(mcq.option2, 30)}</Td>
                    <Td title={mcq.option3}>{truncateText(mcq.option3, 30)}</Td>
                    <Td title={mcq.option4}>{truncateText(mcq.option4, 30)}</Td>
                    <Td>
                      <Badge colorScheme="green">
                        {getCorrectOptionLabel(mcq.correct_option)}
                      </Badge>
                    </Td>
                    {showActions && (
                      <Td className="space-x-3" isNumeric>
                        <ActionMenu>
                          {canEdit && <UpdateModal mcq={mcq} />}
                          {canDelete && <DeleteModal mcqId={mcq._id} />}
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
          method={fetchMcqs}
        />
      )}
      {canAdd && (
        <>
          <AddModel
            isOpen={isAddOpen}
            onClose={onAddClose}
            stayOpenOnSubmit
          />
          <McqImportModal
            isOpen={isImportOpen}
            onClose={onImportClose}
            courses={courses}
          />
        </>
      )}
    </>
  );
}

export default Mcq;
