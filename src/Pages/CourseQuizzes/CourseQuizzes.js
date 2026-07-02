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
  Badge,
  Button,
  ButtonGroup,
  useDisclosure,
  Select,
  FormControl,
  Box,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { FileX, Plus, Play, Send, Trash2, History, BarChart3 } from "lucide-react";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import ActionMenu from "../../Components/ActionMenu";
import {
  fetchCourseQuizzes,
  selectAllCourseQuizzes,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  publishCourseQuiz,
  deleteCourseQuiz,
  startCourseQuizAttempt,
  fetchCourseQuizAttempts,
  publishCourseQuizResults,
} from "../../Features/courseQuizSlice";
import QuizFormModal from "./QuizFormModal";
import CourseQuizAttempt from "./CourseQuizAttempt";
import AttemptHistoryModal from "./AttemptHistoryModal";

const statusColor = {
  Draft: "gray",
  Scheduled: "blue",
  Active: "green",
  Closed: "orange",
  Published: "purple",
  Submitted: "cyan",
  "Under Review": "yellow",
  Graded: "teal",
};

function CourseQuizzes() {
  const viewOnly = isStudentViewOnly();
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const { fetchStatus, pagination } = useSelector((state) => state.courseQuizzes);
  const quizzes = useSelector(selectAllCourseQuizzes);
  const attempts = useSelector((state) => state.courseQuizzes.attempts);

  const formDisclosure = useDisclosure();
  const historyDisclosure = useDisclosure();

  const [editingQuiz, setEditingQuiz] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [screen, setScreen] = useState("list");
  const [lastResult, setLastResult] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchCourseQuizzes({ authToken, status: statusFilter || undefined }));
  }, [dispatch, authToken, statusFilter]);

  const handleStart = async (quiz) => {
    const result = await dispatch(startCourseQuizAttempt({ authToken, quizId: quiz._id }));
    if (result.payload) {
      setActiveQuiz(quiz);
      setScreen("attempt");
    }
  };

  const handleSubmitted = (result) => {
    setLastResult(result);
    setScreen("result");
    setActiveQuiz(null);
  };

  return (
    <Box>
      <PageHeader
        title={viewOnly ? "My Course Quizzes" : "Course Quizzes"}
        subtitle={
          viewOnly
            ? "Take scheduled quizzes during their availability window."
            : "Schedule and manage batch-linked course quizzes."
        }
      >
        <FilterStack>
          {screen === "list" && !viewOnly && (
            <div className="w-full sm:max-w-xs">
              <TableSearch setQueryFilter={setQueryFilter} method={fetchCourseQuizzes} />
            </div>
          )}
          {screen === "list" && (
            <>
              <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
                <Select
                  size="lg"
                  borderRadius="xl"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                  <option value="Published">Published</option>
                </Select>
              </FormControl>
              <Button
                leftIcon={<History size={18} />}
                variant="outline"
                borderRadius="xl"
                w={{ base: "full", sm: "auto" }}
                onClick={() => {
                  dispatch(fetchCourseQuizAttempts({ authToken }));
                  historyDisclosure.onOpen();
                }}
              >
                Attempt History
              </Button>
            </>
          )}
          {!viewOnly && screen === "list" && (
            <Button
              leftIcon={<Plus size={18} />}
              colorScheme="yellow"
              borderRadius="xl"
              w={{ base: "full", sm: "auto" }}
              onClick={() => {
                setEditingQuiz(null);
                formDisclosure.onOpen();
              }}
            >
              New Quiz
            </Button>
          )}
        </FilterStack>
      </PageHeader>

      {screen === "list" && (
        <DataTableShell>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>No</Th>
                  <Th data-searchable>Title</Th>
                  <Th>Batch</Th>
                  <Th>Course</Th>
                  <Th>Window</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {fetchStatus === "loading" ? (
                  <TableRowLoading cols={7} />
                ) : quizzes.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={8}>
                      <FileX className="mx-auto mb-2 text-gray-400" />
                      No quizzes found
                    </Td>
                  </Tr>
                ) : (
                  quizzes.map((item, index) => (
                    <Tr key={item._id}>
                      <Td>{(pagination.page - 1) * pagination.limit + index + 1}</Td>
                      <Td fontWeight="medium">{item.title}</Td>
                      <Td>{item.batch?.name}</Td>
                      <Td>{item.course?.name}</Td>
                      <Td fontSize="sm">
                        {new Date(item.start_datetime).toLocaleString()}
                        <br />
                        {new Date(item.end_datetime).toLocaleString()}
                      </Td>
                      <Td>
                        <Badge colorScheme={statusColor[item.runtime_status || item.status] || "gray"}>
                          {item.runtime_status || item.status}
                        </Badge>
                      </Td>
                      <Td>
                        <ActionMenu>
                          {viewOnly && (item.runtime_status === "Active" || item.status === "Active") && (
                            <Button
                              leftIcon={<Play size={14} />}
                              colorScheme="green"
                              onClick={() => handleStart(item)}
                            >
                              Start
                            </Button>
                          )}
                          {!viewOnly && (
                            <>
                              {item.status === "Draft" && (
                                <Button
                                  leftIcon={<Send size={14} />}
                                  onClick={() =>
                                    dispatch(publishCourseQuiz({ authToken, id: item._id }))
                                  }
                                >
                                  Publish
                                </Button>
                              )}
                              <Button
                                leftIcon={<BarChart3 size={14} />}
                                onClick={() =>
                                  dispatch(publishCourseQuizResults({ authToken, id: item._id }))
                                }
                              >
                                Publish Results
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingQuiz(item);
                                  formDisclosure.onOpen();
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                colorScheme="red"
                                leftIcon={<Trash2 size={14} />}
                                onClick={() =>
                                  dispatch(deleteCourseQuiz({ authToken, id: item._id }))
                                }
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </ActionMenu>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
          <TablePagination
            pagination={pagination}
            setPageFilter={setPageFilter}
            setLimitFilter={setLimitFilter}
            method={fetchCourseQuizzes}
          />
        </DataTableShell>
      )}

      {screen === "attempt" && activeQuiz && (
        <CourseQuizAttempt
          authToken={authToken}
          quiz={activeQuiz}
          onExit={() => setScreen("list")}
          onSubmitted={handleSubmitted}
        />
      )}

      {screen === "result" && lastResult && (
        <Box className="bg-white border border-[#E0E8EC] rounded-xl p-6 max-w-lg mx-auto">
          <VStack spacing={3}>
            <Text fontSize="xl" fontWeight="bold">Quiz Submitted</Text>
            {lastResult.result_visible ? (
              <>
                <Text>Score: {lastResult.total_score} / {lastResult.max_score}</Text>
                <Text>Percentage: {lastResult.percentage}%</Text>
                <Badge colorScheme={lastResult.passed ? "green" : "red"}>
                  {lastResult.passed ? "Passed" : "Not Passed"}
                </Badge>
              </>
            ) : (
              <Text color="gray.600">
                Your submission was recorded. Results will be published later.
              </Text>
            )}
            <Button colorScheme="yellow" onClick={() => { setScreen("list"); setLastResult(null); }}>
              Back to Quizzes
            </Button>
          </VStack>
        </Box>
      )}

      <QuizFormModal
        isOpen={formDisclosure.isOpen}
        onClose={formDisclosure.onClose}
        authToken={authToken}
        quiz={editingQuiz}
      />

      <AttemptHistoryModal
        isOpen={historyDisclosure.isOpen}
        onClose={historyDisclosure.onClose}
        attempts={attempts}
      />
    </Box>
  );
}

export default CourseQuizzes;
