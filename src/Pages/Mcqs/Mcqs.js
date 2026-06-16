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
} from "../../Features/mcqSlice";
import { fetchCourses, selectAllCourses } from "../../Features/courseSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import SearchableCourseSelect from "../../Components/SearchableCourseSelect";

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

  const mcqs = useSelector(selectAllMcqs);
  const courses = useSelector(selectAllCourses);
  const { fetchStatus, pagination, filters } = useSelector((state) => state.mcqs);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMcqs({ authToken }));
    dispatch(
      fetchCourses({ authToken, queryParams: { limit: 200, page: 1, query: "" } })
    );
  }, [authToken, dispatch]);

  const handleCourseFilter = (courseId) => {
    dispatch(setCourseFilter(courseId));
    dispatch(fetchMcqs({ authToken }));
  };

  const clearCourseFilter = () => {
    dispatch(setCourseFilter(""));
    dispatch(fetchMcqs({ authToken }));
  };

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-xl font-semibold ml-6 text-nowrap">All MCQs</h1>
          <p className="text-sm text-gray-500 ml-6 mt-1">
            Read-only MCQ bank. Use the Quiz module to attempt quizzes.
          </p>
        </div>
        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 lg:px-0">
          <div className="w-full sm:max-w-xs">
            <TableSearch setQueryFilter={setQueryFilter} method={fetchMcqs} />
          </div>
          <div className="flex items-center gap-2">
            <SearchableCourseSelect
              courses={courses}
              value={filters.course_id}
              onChange={handleCourseFilter}
              placeholder="Filter by course"
              width="14rem"
            />
            {filters.course_id && (
              <IconButton
                aria-label="Clear course filter"
                icon={<FilterX size={18} />}
                size="lg"
                borderRadius="xl"
                variant="outline"
                onClick={clearCourseFilter}
              />
            )}
          </div>
        </div>
      </div>
      <div className="w-full bg-white mt-3 rounded-xl border border-[#E0E8EC]">
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
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading nOfColumns={8} actions={[]} />
              ) : mcqs?.length === 0 ? (
                <Tr>
                  <Td colSpan={8}>
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
          method={fetchMcqs}
        />
      )}
    </>
  );
}

export default Mcq;
