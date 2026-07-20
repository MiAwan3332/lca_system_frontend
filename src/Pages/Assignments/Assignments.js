import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Text,
  IconButton,
  Input,
  Link,
  createStandaloneToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { Cloud, ExternalLink, FileX, Plus, Eye, Send, Trash2, ClipboardList, FilterX, Pencil } from "lucide-react";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import SearchableCourseSelect from "../../Components/SearchableCourseSelect";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import { isTeacherRole, isInstitutionAdmin } from "../../utlls/teacherAccess";
import { hasPermission } from "../../utlls/useful";
import { fetchBatches, selectActiveBatches } from "../../Features/batchSlice";
import {
  fetchAssignments,
  selectAllAssignments,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setBatchFilter,
  setCourseFilter,
  setStartDateFilter,
  setEndDateFilter,
  clearAssignmentFilters,
  publishAssignment,
  deleteAssignment,
  fetchAssignmentSubmissions,
  fetchBatchCoursesForAssignment,
  fetchMyAssignmentCourses,
} from "../../Features/assignmentSlice";
import AssignmentFormModal from "./AssignmentFormModal";
import AssignmentDetailModal from "./AssignmentDetailModal";
import GradeSubmissionModal from "./GradeSubmissionModal";
import SubmissionsListModal from "./SubmissionsListModal";
import TeacherSubmissionMarking from "./TeacherSubmissionMarking";
import { config } from "../../utlls/config";

const { toast } = createStandaloneToast();
const BASE_URL = config.BASE_URL;

const statusColor = {
  Draft: "gray",
  Published: "green",
  "Not Submitted": "gray",
  Submitted: "blue",
  "Late Submitted": "orange",
  "Under Review": "yellow",
  Graded: "purple",
  Completed: "teal",
  "Resubmission Requested": "red",
};

function Assignments() {
  const viewOnly = isStudentViewOnly();
  const isTeacher = isTeacherRole();
  // Teachers and institution staff can create/edit; students remain view-only.
  const canManage =
    !viewOnly &&
    (isTeacher || hasPermission(["Add_Assignment", "Edit_Assignment"]) || isInstitutionAdmin());
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const { fetchStatus, pagination, filters, batchCourses } = useSelector(
    (state) => state.assignments
  );
  const assignments = useSelector(selectAllAssignments);
  const submissions = useSelector((state) => state.assignments.submissions);
  const batches = useSelector(selectActiveBatches);

  const formDisclosure = useDisclosure();
  const detailDisclosure = useDisclosure();
  const gradeDisclosure = useDisclosure();
  const submissionsDisclosure = useDisclosure();

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [syncingAssignmentId, setSyncingAssignmentId] = useState("");

  const loadAssignments = () => {
    dispatch(
      fetchAssignments({
        authToken,
        // Students must not send leaked batch filters from shared Redux state
        status: viewOnly ? undefined : statusFilter || undefined,
        submission_status: viewOnly ? statusFilter || undefined : undefined,
        batch_id: viewOnly ? "" : filters.batch_id || undefined,
        course_id: filters.course_id || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      })
    );
  };

  useEffect(() => {
    if (!viewOnly) {
      dispatch(fetchBatches({ authToken, queryParams: { limit: 200, page: 1, query: "" } }));
    } else {
      dispatch(fetchMyAssignmentCourses({ authToken }));
    }
  }, [dispatch, authToken, viewOnly]);

  useEffect(() => {
    loadAssignments();
  }, [
    dispatch,
    authToken,
    statusFilter,
    filters.batch_id,
    filters.course_id,
    filters.start_date,
    filters.end_date,
    viewOnly,
  ]);

  useEffect(() => {
    if (!viewOnly && filters.batch_id) {
      dispatch(fetchBatchCoursesForAssignment({ authToken, batchId: filters.batch_id }));
    }
  }, [dispatch, authToken, filters.batch_id, viewOnly]);

  const groupedAssignments = useMemo(() => {
    const groups = new Map();

    assignments.forEach((item) => {
      const batchName = item.batch?.name || "Unassigned Batch";
      const courseName = item.course?.name || "Unassigned Course";
      const key = `${batchName}::${courseName}`;

      if (!groups.has(key)) {
        groups.set(key, { batchName, courseName, items: [] });
      }
      groups.get(key).items.push(item);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const batchCompare = a.batchName.localeCompare(b.batchName);
      if (batchCompare !== 0) return batchCompare;
      return a.courseName.localeCompare(b.courseName);
    });
  }, [assignments]);

  const handleBatchFilter = (batchId) => {
    dispatch(setBatchFilter(batchId));
  };

  const handleCourseFilter = (courseId) => {
    dispatch(setCourseFilter(courseId));
  };

  const clearFilters = () => {
    dispatch(clearAssignmentFilters());
    setStatusFilter("");
    setSubmissionStatusFilter("");
  };

  const hasActiveFilters =
    filters.batch_id ||
    filters.course_id ||
    filters.start_date ||
    filters.end_date ||
    Boolean(statusFilter);

  const openDetail = (assignment) => {
    setSelectedAssignment(assignment);
    detailDisclosure.onOpen();
  };

  const openSubmissions = (assignment) => {
    setSelectedAssignment(assignment);
    dispatch(fetchAssignmentSubmissions({ authToken, assignment_id: assignment._id }));
    submissionsDisclosure.onOpen();
  };

  const openGrade = (submission, assignment = null) => {
    setSelectedSubmission(submission);
    if (assignment) {
      setSelectedAssignment(assignment);
    } else if (submission?.assignment) {
      setSelectedAssignment(submission.assignment);
    }
    gradeDisclosure.onOpen();
  };

  const handleGraded = () => {
    if (selectedAssignment?._id && submissionsDisclosure.isOpen) {
      dispatch(
        fetchAssignmentSubmissions({ authToken, assignment_id: selectedAssignment._id })
      );
    }
    if (activeTab === 1) {
      dispatch(
        fetchAssignmentSubmissions({
          authToken,
          batch_id: filters.batch_id || undefined,
          course_id: filters.course_id || undefined,
          status: submissionStatusFilter || undefined,
          page: 1,
          limit: 100,
        })
      );
    }
  };

  const handleGoogleAssignmentSync = async (assignment) => {
    setSyncingAssignmentId(assignment._id);
    try {
      const response = await axios.post(
        `${BASE_URL}/google/classroom/assignments/${assignment._id}/sync`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast({
        title: response.data?.reused
          ? "Assignment already synced to Google Classroom"
          : "Assignment synced to Google Classroom",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      loadAssignments();
    } catch (error) {
      toast({
        title: "Google Classroom sync failed",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setSyncingAssignmentId("");
    }
  };

  const renderAssignmentRow = (item, index) => (
    <Tr key={item._id}>
      <Td>{(pagination.page - 1) * pagination.limit + index + 1}</Td>
      <Td fontWeight="medium">{item.title}</Td>
      <Td>{item.batch?.name}</Td>
      <Td>{item.course?.name}</Td>
      <Td>{item.max_marks ?? "—"}</Td>
      <Td>
        {item.has_deadline && item.submission_deadline
          ? new Date(item.submission_deadline).toLocaleString()
          : "No deadline"}
      </Td>
      <Td>
        <Badge colorScheme={statusColor[item.status] || "gray"}>
          {item.visibility_status || item.status}
        </Badge>
      </Td>
      {!viewOnly && (
        <Td>
          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme={item.google_classroom_coursework_id ? "green" : "gray"}>
              {item.google_classroom_coursework_id ? "Synced" : "Not synced"}
            </Badge>
            {item.google_classroom_alternate_link && (
              <Link
                href={item.google_classroom_alternate_link}
                isExternal
                color="blue.500"
                display="inline-flex"
                alignItems="center"
                gap={1}
                fontSize="sm"
              >
                Open <ExternalLink size={12} />
              </Link>
            )}
          </HStack>
        </Td>
      )}
      <Td>
        <ActionMenu>
          <Button leftIcon={<Eye size={14} />} onClick={() => openDetail(item)}>
            View
          </Button>
          {!viewOnly && (
            <>
              <Button
                leftIcon={<ClipboardList size={14} />}
                onClick={() => openSubmissions(item)}
              >
                Submissions
              </Button>
              {item.visibility_status === "Draft" && (
                <Button
                  leftIcon={<Send size={14} />}
                  onClick={() => dispatch(publishAssignment({ authToken, id: item._id }))}
                >
                  Publish
                </Button>
              )}
              <Button
                leftIcon={<Pencil size={14} />}
                onClick={() => {
                  setEditingAssignment(item);
                  formDisclosure.onOpen();
                }}
              >
                Edit
              </Button>
              <Button
                leftIcon={<Cloud size={14} />}
                isLoading={syncingAssignmentId === item._id}
                onClick={() => handleGoogleAssignmentSync(item)}
              >
                {item.google_classroom_coursework_id
                  ? "Recheck Classroom"
                  : "Sync Classroom"}
              </Button>
              <Button
                colorScheme="red"
                leftIcon={<Trash2 size={14} />}
                onClick={() => dispatch(deleteAssignment({ authToken, id: item._id }))}
              >
                Delete
              </Button>
            </>
          )}
        </ActionMenu>
      </Td>
    </Tr>
  );

  const assignmentFilters = (
    <>
      {!viewOnly && (
        <div className="w-full sm:max-w-xs">
          <TableSearch setQueryFilter={setQueryFilter} method={fetchAssignments} />
        </div>
      )}
      {!viewOnly && (
        <SearchableBatchSelect
          batches={batches}
          value={filters.batch_id}
          onChange={handleBatchFilter}
          placeholder={isTeacher ? "Filter by assigned batch" : "Filter by batch"}
          width="100%"
        />
      )}
      {(viewOnly || filters.batch_id) && (
        <SearchableCourseSelect
          courses={batchCourses}
          value={filters.course_id}
          onChange={handleCourseFilter}
          placeholder="Filter by course"
          width="100%"
        />
      )}
      {viewOnly && (
        <>
          <FormControl className="responsive-input" w={{ base: "full", md: "11rem" }}>
            <Input
              type="date"
              size="lg"
              borderRadius="xl"
              value={filters.start_date || ""}
              onChange={(e) => dispatch(setStartDateFilter(e.target.value))}
              title="Deadline from"
              aria-label="Deadline from"
            />
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "11rem" }}>
            <Input
              type="date"
              size="lg"
              borderRadius="xl"
              value={filters.end_date || ""}
              onChange={(e) => dispatch(setEndDateFilter(e.target.value))}
              title="Deadline to"
              aria-label="Deadline to"
            />
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "14rem" }}>
            <Select
              size="lg"
              borderRadius="xl"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Not Submitted">Not Submitted</option>
              <option value="Submitted">Submitted</option>
              <option value="Late Submitted">Late Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Graded">Graded</option>
              <option value="Completed">Completed</option>
              <option value="Resubmission Requested">Resubmission Requested</option>
            </Select>
          </FormControl>
        </>
      )}
      {hasActiveFilters && (
        <IconButton
          aria-label="Clear filters"
          icon={<FilterX size={18} />}
          size="lg"
          borderRadius="xl"
          variant="outline"
          onClick={clearFilters}
        />
      )}
      {!viewOnly && (
        <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
          <Select
            size="lg"
            borderRadius="xl"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </Select>
        </FormControl>
      )}
    </>
  );

  return (
    <>
      <PageHeader
        title={
          viewOnly ? "My Assignments" : isTeacher ? "Assignments & Marking" : "Course Assignments"
        }
        subtitle={
          viewOnly
            ? "View, download, and submit assignments for your batch."
            : isTeacher
              ? "Create and update assignments for your assigned batches and courses, then mark student submissions."
              : "Create and manage assignments linked to batches and courses."
        }
      >
        {canManage && activeTab === 0 && (
          <FilterStack className="filter-stack--actions">
            <Button
              leftIcon={<Plus size={18} />}
              colorScheme="yellow"
              borderRadius="xl"
              w={{ base: "full", sm: "auto" }}
              onClick={() => {
                setEditingAssignment(null);
                formDisclosure.onOpen();
              }}
            >
              New Assignment
            </Button>
          </FilterStack>
        )}
      </PageHeader>

      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        {assignmentFilters}
      </FilterStack>

      {!viewOnly ? (
        <Tabs index={activeTab} onChange={setActiveTab} colorScheme="yellow" mb={4}>
          <TabList>
            <Tab>Assignments</Tab>
            <Tab>Mark Submissions</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <DataTableShell>
                {isTeacher && groupedAssignments.length > 0 ? (
                  <Box className="space-y-6">
                    {groupedAssignments.map((group) => (
                      <Box key={`${group.batchName}-${group.courseName}`}>
                        <Text fontWeight="semibold" mb={2}>
                          {group.batchName} — {group.courseName}
                        </Text>
                        <TableContainer>
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>No</Th>
                                <Th>Title</Th>
                                <Th>Max Marks</Th>
                                <Th>Deadline</Th>
                                <Th>Status</Th>
                                <Th>Google Classroom</Th>
                                <Th>Actions</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {group.items.map((item, index) => (
                                <Tr key={item._id}>
                                  <Td>{index + 1}</Td>
                                  <Td fontWeight="medium">{item.title}</Td>
                                  <Td>{item.max_marks ?? "—"}</Td>
                                  <Td>
                                    {item.has_deadline && item.submission_deadline
                                      ? new Date(item.submission_deadline).toLocaleString()
                                      : "No deadline"}
                                  </Td>
                                  <Td>
                                    <Badge colorScheme={statusColor[item.status] || "gray"}>
                                      {item.visibility_status || item.status}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <HStack spacing={2} flexWrap="wrap">
                                      <Badge
                                        colorScheme={
                                          item.google_classroom_coursework_id ? "green" : "gray"
                                        }
                                      >
                                        {item.google_classroom_coursework_id
                                          ? "Synced"
                                          : "Not synced"}
                                      </Badge>
                                      {item.google_classroom_alternate_link && (
                                        <Link
                                          href={item.google_classroom_alternate_link}
                                          isExternal
                                          color="blue.500"
                                          display="inline-flex"
                                          alignItems="center"
                                          gap={1}
                                          fontSize="sm"
                                        >
                                          Open <ExternalLink size={12} />
                                        </Link>
                                      )}
                                    </HStack>
                                  </Td>
                                  <Td>
                                    <ButtonGroup size="sm" variant="outline" flexWrap="wrap">
                                      <Button
                                        size="sm"
                                        leftIcon={<Eye size={14} />}
                                        onClick={() => openDetail(item)}
                                      >
                                        View
                                      </Button>
                                      <Button
                                        size="sm"
                                        leftIcon={<ClipboardList size={14} />}
                                        onClick={() => openSubmissions(item)}
                                      >
                                        Submissions
                                      </Button>
                                      {item.visibility_status === "Draft" && (
                                        <Button
                                          size="sm"
                                          leftIcon={<Send size={14} />}
                                          onClick={() =>
                                            dispatch(
                                              publishAssignment({
                                                authToken,
                                                id: item._id,
                                              })
                                            )
                                          }
                                        >
                                          Publish
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        leftIcon={<Pencil size={14} />}
                                        onClick={() => {
                                          setEditingAssignment(item);
                                          formDisclosure.onOpen();
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        leftIcon={<Cloud size={14} />}
                                        isLoading={syncingAssignmentId === item._id}
                                        onClick={() => handleGoogleAssignmentSync(item)}
                                      >
                                        {item.google_classroom_coursework_id
                                          ? "Recheck Classroom"
                                          : "Sync Classroom"}
                                      </Button>
                                    </ButtonGroup>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>No</Th>
                          <Th data-searchable>Title</Th>
                          <Th>Batch</Th>
                          <Th>Course</Th>
                          <Th>Max Marks</Th>
                          <Th>Deadline</Th>
                          <Th>Status</Th>
                          <Th>Google Classroom</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {fetchStatus === "loading" ? (
                          <TableRowLoading nOfColumns={9} actions={["w-10", "w-10", "w-10"]} />
                        ) : assignments.length === 0 ? (
                          <Tr>
                            <Td colSpan={9} textAlign="center" py={8}>
                              <FileX className="mx-auto mb-2 text-gray-400" />
                              No assignments found
                            </Td>
                          </Tr>
                        ) : (
                          assignments.map((item, index) => renderAssignmentRow(item, index))
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
                <TablePagination
                  pagination={pagination}
                  setPageFilter={setPageFilter}
                  setLimitFilter={setLimitFilter}
                  method={fetchAssignments}
                />
              </DataTableShell>
            </TabPanel>

            <TabPanel px={0}>
              <Box mb={4}>
                <FormControl className="responsive-input" w={{ base: "full", md: "14rem" }}>
                  <Select
                    size="lg"
                    borderRadius="xl"
                    value={submissionStatusFilter}
                    onChange={(e) => setSubmissionStatusFilter(e.target.value)}
                  >
                    <option value="">All Submission Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Late Submitted">Late Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Graded">Graded</option>
                    <option value="Completed">Completed</option>
                    <option value="Resubmission Requested">Resubmission Requested</option>
                  </Select>
                </FormControl>
              </Box>
              <DataTableShell>
                <TeacherSubmissionMarking
                  authToken={authToken}
                  batchId={filters.batch_id}
                  courseId={filters.course_id}
                  statusFilter={submissionStatusFilter}
                  onGrade={openGrade}
                />
              </DataTableShell>
            </TabPanel>
          </TabPanels>
        </Tabs>
      ) : (
        <DataTableShell>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>No</Th>
                  <Th data-searchable>Title</Th>
                  <Th>Batch</Th>
                  <Th>Course</Th>
                  <Th>Deadline</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {fetchStatus === "loading" ? (
                  <TableRowLoading nOfColumns={6} actions={["w-10"]} />
                ) : assignments.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={8}>
                      <FileX className="mx-auto mb-2 text-gray-400" />
                      No published assignments available for your batch yet.
                      <Text fontSize="sm" color="gray.500" mt={2}>
                        Assignments appear here after a teacher publishes them and the
                        availability date has started.
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  assignments.map((item, index) => (
                    <Tr key={item._id}>
                      <Td>{(pagination.page - 1) * pagination.limit + index + 1}</Td>
                      <Td fontWeight="medium">{item.title}</Td>
                      <Td>{item.batch?.name}</Td>
                      <Td>{item.course?.name}</Td>
                      <Td>
                        {item.has_deadline && item.submission_deadline
                          ? new Date(item.submission_deadline).toLocaleString()
                          : "No deadline"}
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            statusColor[item.student_status] ||
                            statusColor[item.status] ||
                            "gray"
                          }
                        >
                          {item.student_status ||
                            item.visibility_status ||
                            item.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Button size="sm" leftIcon={<Eye size={14} />} onClick={() => openDetail(item)}>
                          View
                        </Button>
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
            method={fetchAssignments}
          />
        </DataTableShell>
      )}

      <AssignmentFormModal
        isOpen={formDisclosure.isOpen}
        onClose={formDisclosure.onClose}
        authToken={authToken}
        assignment={editingAssignment}
      />

      <AssignmentDetailModal
        isOpen={detailDisclosure.isOpen}
        onClose={detailDisclosure.onClose}
        authToken={authToken}
        assignment={selectedAssignment}
      />

      <SubmissionsListModal
        isOpen={submissionsDisclosure.isOpen}
        onClose={submissionsDisclosure.onClose}
        submissions={submissions}
        assignment={selectedAssignment}
        onGrade={(submission) => openGrade(submission, selectedAssignment)}
      />

      <GradeSubmissionModal
        isOpen={gradeDisclosure.isOpen}
        onClose={gradeDisclosure.onClose}
        authToken={authToken}
        submission={selectedSubmission}
        maxMarks={selectedAssignment?.max_marks}
        onGraded={handleGraded}
      />
    </>
  );
}

export default Assignments;
