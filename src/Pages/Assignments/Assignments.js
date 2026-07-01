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
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { FileX, Plus, Eye, Send, Trash2, ClipboardList } from "lucide-react";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import { hasPermission } from "../../utlls/useful";
import {
  fetchAssignments,
  selectAllAssignments,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  publishAssignment,
  deleteAssignment,
  fetchAssignmentSubmissions,
} from "../../Features/assignmentSlice";
import AssignmentFormModal from "./AssignmentFormModal";
import AssignmentDetailModal from "./AssignmentDetailModal";
import GradeSubmissionModal from "./GradeSubmissionModal";
import SubmissionsListModal from "./SubmissionsListModal";

const statusColor = {
  Draft: "gray",
  Published: "green",
  Submitted: "blue",
  "Late Submitted": "orange",
  "Under Review": "yellow",
  Graded: "purple",
  Completed: "teal",
};

function Assignments() {
  const viewOnly = isStudentViewOnly();
  const canManage = hasPermission(["Add_Assignment", "Edit_Assignment"]) || !viewOnly;
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const { fetchStatus, pagination } = useSelector((state) => state.assignments);
  const assignments = useSelector(selectAllAssignments);
  const submissions = useSelector((state) => state.assignments.submissions);

  const formDisclosure = useDisclosure();
  const detailDisclosure = useDisclosure();
  const gradeDisclosure = useDisclosure();
  const submissionsDisclosure = useDisclosure();

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchAssignments({ authToken, status: statusFilter || undefined }));
  }, [dispatch, authToken, statusFilter]);

  const openDetail = (assignment) => {
    setSelectedAssignment(assignment);
    detailDisclosure.onOpen();
  };

  const openSubmissions = (assignment) => {
    setSelectedAssignment(assignment);
    dispatch(fetchAssignmentSubmissions({ authToken, assignment_id: assignment._id }));
    submissionsDisclosure.onOpen();
  };

  const openGrade = (submission) => {
    setSelectedSubmission(submission);
    gradeDisclosure.onOpen();
  };

  return (
    <>
      <PageHeader
        title={viewOnly ? "My Assignments" : "Course Assignments"}
        subtitle={
          viewOnly
            ? "View, download, and submit assignments for your batch."
            : "Create and manage assignments linked to batches and courses."
        }
      >
        <FilterStack>
          {!viewOnly && (
            <div className="w-full sm:max-w-xs">
              <TableSearch
                setQueryFilter={setQueryFilter}
                method={fetchAssignments}
              />
            </div>
          )}
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
          {canManage && (
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
          )}
        </FilterStack>
      </PageHeader>

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
                <TableRowLoading cols={7} />
              ) : assignments.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" py={8}>
                    <FileX className="mx-auto mb-2 text-gray-400" />
                    No assignments found
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
                      <Badge colorScheme={statusColor[item.status] || "gray"}>
                        {item.visibility_status || item.status}
                      </Badge>
                    </Td>
                    <Td>
                      <ButtonGroup size="sm" variant="outline" className="action-cell">
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
                                onClick={() =>
                                  dispatch(publishAssignment({ authToken, id: item._id }))
                                }
                              >
                                Publish
                              </Button>
                            )}
                            <Button
                              onClick={() => {
                                setEditingAssignment(item);
                                formDisclosure.onOpen();
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              colorScheme="red"
                              leftIcon={<Trash2 size={14} />}
                              onClick={() =>
                                dispatch(deleteAssignment({ authToken, id: item._id }))
                              }
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </ButtonGroup>
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
        onGrade={openGrade}
      />

      <GradeSubmissionModal
        isOpen={gradeDisclosure.isOpen}
        onClose={gradeDisclosure.onClose}
        authToken={authToken}
        submission={selectedSubmission}
        maxMarks={selectedAssignment?.max_marks}
      />
    </>
  );
}

export default Assignments;
