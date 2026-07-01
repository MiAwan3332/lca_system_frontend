import React, { useEffect } from "react";
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
  Text,
  Box,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { FileX } from "lucide-react";
import TableRowLoading from "../../Components/TableRowLoading";
import { fetchAssignmentSubmissions } from "../../Features/assignmentSlice";

const statusColor = {
  Submitted: "blue",
  "Late Submitted": "orange",
  "Under Review": "yellow",
  Graded: "purple",
  Completed: "teal",
  "Resubmission Requested": "red",
};

function TeacherSubmissionMarking({
  authToken,
  batchId,
  courseId,
  statusFilter,
  onGrade,
}) {
  const dispatch = useDispatch();
  const { submissions, submissionsStatus, submissionsPagination } = useSelector(
    (state) => state.assignments
  );

  useEffect(() => {
    dispatch(
      fetchAssignmentSubmissions({
        authToken,
        batch_id: batchId || undefined,
        course_id: courseId || undefined,
        status: statusFilter || undefined,
        page: 1,
        limit: 100,
      })
    );
  }, [dispatch, authToken, batchId, courseId, statusFilter]);

  const pendingCount = submissions.filter((item) =>
    ["Submitted", "Late Submitted", "Under Review"].includes(item.status)
  ).length;

  return (
    <Box>
      <Text fontSize="sm" color="gray.600" mb={4}>
        Review and grade student submissions by batch and course.
        {pendingCount > 0 ? ` ${pendingCount} pending review.` : ""}
      </Text>

      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Batch</Th>
              <Th>Course</Th>
              <Th>Assignment</Th>
              <Th>Student</Th>
              <Th>Attempt</Th>
              <Th>Status</Th>
              <Th>Marks</Th>
              <Th>Submitted</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {submissionsStatus === "loading" ? (
              <TableRowLoading nOfColumns={8} actions={["w-16"]} />
            ) : submissions.length === 0 ? (
              <Tr>
                <Td colSpan={9} textAlign="center" py={8}>
                  <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                    <FileX />
                    No submissions found for the selected filters
                  </span>
                </Td>
              </Tr>
            ) : (
              submissions.map((sub) => {
                const assignment = sub.assignment;
                const maxMarks = assignment?.max_marks;
                const marksLabel =
                  sub.marks_obtained != null
                    ? `${sub.marks_obtained}${maxMarks ? ` / ${maxMarks}` : ""}`
                    : "—";
                const needsReview = ["Submitted", "Late Submitted", "Under Review"].includes(
                  sub.status
                );

                return (
                  <Tr key={sub._id}>
                    <Td>{assignment?.batch?.name || "—"}</Td>
                    <Td>{assignment?.course?.name || "—"}</Td>
                    <Td fontWeight="medium">{assignment?.title || "—"}</Td>
                    <Td>{sub.student?.name || "—"}</Td>
                    <Td>{sub.attempt_number}</Td>
                    <Td>
                      <Badge colorScheme={statusColor[sub.status] || "gray"}>
                        {sub.status}
                      </Badge>
                    </Td>
                    <Td fontWeight={sub.marks_obtained != null ? "semibold" : "normal"}>
                      {marksLabel}
                    </Td>
                    <Td>
                      {sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleString()
                        : "—"}
                    </Td>
                    <Td>
                      <Button
                        size="xs"
                        colorScheme={needsReview ? "yellow" : "gray"}
                        variant={needsReview ? "solid" : "outline"}
                        onClick={() => onGrade(sub, assignment)}
                      >
                        {sub.marks_obtained != null ? "Edit Marks" : "Add Marks"}
                      </Button>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {submissionsPagination?.totalDocs > submissions.length && (
        <Text fontSize="xs" color="gray.500" mt={3}>
          Showing {submissions.length} of {submissionsPagination.totalDocs} submissions.
        </Text>
      )}
    </Box>
  );
}

export default TeacherSubmissionMarking;
