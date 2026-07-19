import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Link,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  Divider,
  Box,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAssignmentSubmissions,
  submitAssignment,
} from "../../Features/assignmentSlice";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import {
  responsiveModalProps,
  responsiveModalContentProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

const LATE_POLICY_LABELS = {
  no_late: "No late submissions",
  late_with_penalty: "Allow with penalty",
  late_without_penalty: "Allow without penalty",
  late_until_deadline: "Allow until late deadline",
};

const VISIBILITY_LABELS = {
  Published: "Published (visible to students)",
  Draft: "Draft (hidden from students)",
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const ReadOnlyValue = ({ children }) => (
  <Box
    border="1px solid"
    borderColor="gray.200"
    borderRadius="md"
    px={3}
    py={2}
    bg="gray.50"
    minH="40px"
    display="flex"
    alignItems="center"
  >
    <Text fontSize="sm" whiteSpace="pre-wrap" w="100%">
      {children == null || children === "" ? "—" : children}
    </Text>
  </Box>
);

function AssignmentDetailModal({ isOpen, onClose, authToken, assignment }) {
  const dispatch = useDispatch();
  const viewOnly = isStudentViewOnly();
  const submissions = useSelector((state) => state.assignments.submissions);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState([]);

  useEffect(() => {
    if (isOpen && assignment?._id) {
      dispatch(
        fetchAssignmentSubmissions({
          authToken,
          assignment_id: assignment._id,
        })
      );
    }
  }, [isOpen, assignment, dispatch, authToken]);

  const mySubmission = submissions[0];

  const handleSubmit = async () => {
    const formData = new FormData();
    if (submissionText) formData.append("submission_text", submissionText);
    submissionFiles.forEach((file) => formData.append("submission_files", file));
    await dispatch(submitAssignment({ authToken, id: assignment._id, formData }));
    setSubmissionText("");
    setSubmissionFiles([]);
    dispatch(fetchAssignmentSubmissions({ authToken, assignment_id: assignment._id }));
  };

  if (!assignment) return null;

  const hasDeadline = assignment.has_deadline !== false;
  const latePolicy =
    LATE_POLICY_LABELS[assignment.late_submission_policy] ||
    assignment.late_submission_policy ||
    "—";
  const visibilityLabel =
    VISIBILITY_LABELS[assignment.visibility_status] ||
    assignment.visibility_status ||
    "—";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("2xl")}
    >
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>View Assignment</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Title</FormLabel>
              <ReadOnlyValue>{assignment.title}</ReadOnlyValue>
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <ReadOnlyValue>
                {assignment.description?.trim() || "—"}
              </ReadOnlyValue>
            </FormControl>

            <FormControl>
              <FormLabel>Instructions</FormLabel>
              <ReadOnlyValue>
                {assignment.instructions?.trim() || "—"}
              </ReadOnlyValue>
            </FormControl>

            <HStack spacing={4} flexWrap="wrap" align="flex-start">
              <FormControl flex="1" minW="200px">
                <FormLabel>Batch</FormLabel>
                <ReadOnlyValue>
                  {assignment.batch?.name || "—"}
                </ReadOnlyValue>
              </FormControl>
              <FormControl flex="1" minW="200px">
                <FormLabel>Course</FormLabel>
                <ReadOnlyValue>
                  {assignment.course?.name || "—"}
                </ReadOnlyValue>
              </FormControl>
            </HStack>

            <HStack spacing={4} flexWrap="wrap" align="flex-start">
              <FormControl flex="1" minW="140px">
                <FormLabel>Max Marks</FormLabel>
                <ReadOnlyValue>{assignment.max_marks ?? "—"}</ReadOnlyValue>
              </FormControl>
              <FormControl flex="1" minW="140px">
                <FormLabel>Max Attempts</FormLabel>
                <ReadOnlyValue>{assignment.max_attempts ?? "—"}</ReadOnlyValue>
              </FormControl>
              <FormControl flex="1" minW="140px">
                <FormLabel>Visibility</FormLabel>
                <ReadOnlyValue>{visibilityLabel}</ReadOnlyValue>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Students only see Published assignments for their own batch.
                </Text>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Grading Criteria</FormLabel>
              <ReadOnlyValue>
                {assignment.grading_criteria?.trim() || "—"}
              </ReadOnlyValue>
            </FormControl>

            <FormControl>
              <FormLabel>Availability Date</FormLabel>
              <ReadOnlyValue>
                {formatDateTime(assignment.availability_date)}
              </ReadOnlyValue>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Students can see this assignment from this date/time onward.
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Has Deadline</FormLabel>
              <ReadOnlyValue>{hasDeadline ? "Yes" : "No"}</ReadOnlyValue>
            </FormControl>

            {hasDeadline && (
              <>
                <FormControl>
                  <FormLabel>Submission Deadline</FormLabel>
                  <ReadOnlyValue>
                    {formatDateTime(assignment.submission_deadline)}
                  </ReadOnlyValue>
                </FormControl>

                <FormControl>
                  <FormLabel>Late Submission Policy</FormLabel>
                  <ReadOnlyValue>{latePolicy}</ReadOnlyValue>
                </FormControl>

                {assignment.late_submission_policy === "late_with_penalty" && (
                  <FormControl>
                    <FormLabel>Penalty %</FormLabel>
                    <ReadOnlyValue>
                      {assignment.late_penalty_percent != null
                        ? `${assignment.late_penalty_percent}%`
                        : "—"}
                    </ReadOnlyValue>
                  </FormControl>
                )}

                {assignment.late_submission_policy === "late_until_deadline" && (
                  <FormControl>
                    <FormLabel>Late Deadline</FormLabel>
                    <ReadOnlyValue>
                      {formatDateTime(assignment.late_deadline)}
                    </ReadOnlyValue>
                  </FormControl>
                )}
              </>
            )}

            <FormControl>
              <FormLabel>Resubmission Allowed</FormLabel>
              <ReadOnlyValue>
                {assignment.resubmission_allowed ? "Yes" : "No"}
              </ReadOnlyValue>
            </FormControl>

            <FormControl>
              <FormLabel>Attachments</FormLabel>
              {assignment.attachments?.length > 0 ? (
                <VStack align="stretch" spacing={1}>
                  {assignment.attachments.map((file) => (
                    <Link
                      key={file._id || file.file_url}
                      href={file.file_url}
                      isExternal
                      color="blue.500"
                    >
                      {file.file_name}
                      {file.file_size
                        ? ` (${Math.round(file.file_size / 1024)} KB)`
                        : ""}
                    </Link>
                  ))}
                </VStack>
              ) : (
                <ReadOnlyValue>No attachments</ReadOnlyValue>
              )}
            </FormControl>

            {viewOnly && (
              <>
                <Divider my={2} />
                <Text fontWeight="semibold">Your Submission</Text>
                {mySubmission ? (
                  <VStack align="stretch" spacing={3}>
                    <FormControl>
                      <FormLabel>Status</FormLabel>
                      <Badge colorScheme={mySubmission.is_late ? "orange" : "green"}>
                        {mySubmission.status}
                      </Badge>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Submitted at</FormLabel>
                      <ReadOnlyValue>
                        {formatDateTime(
                          mySubmission.submitted_at || mySubmission.createdAt
                        )}
                      </ReadOnlyValue>
                    </FormControl>
                    {mySubmission.submission_text && (
                      <FormControl>
                        <FormLabel>Submission Text</FormLabel>
                        <ReadOnlyValue>
                          {mySubmission.submission_text}
                        </ReadOnlyValue>
                      </FormControl>
                    )}
                    {mySubmission.marks_obtained != null && (
                      <FormControl>
                        <FormLabel>Score</FormLabel>
                        <ReadOnlyValue>
                          {mySubmission.marks_obtained} / {assignment.max_marks}
                        </ReadOnlyValue>
                      </FormControl>
                    )}
                    {mySubmission.feedback && (
                      <FormControl>
                        <FormLabel>Feedback</FormLabel>
                        <ReadOnlyValue>{mySubmission.feedback}</ReadOnlyValue>
                      </FormControl>
                    )}
                    {mySubmission.files?.length > 0 && (
                      <FormControl>
                        <FormLabel>Submitted Files</FormLabel>
                        <VStack align="stretch" spacing={1}>
                          {mySubmission.files.map((file) => (
                            <Link
                              key={file._id || file.file_url}
                              href={file.file_url}
                              isExternal
                              color="blue.500"
                            >
                              {file.file_name}
                            </Link>
                          ))}
                        </VStack>
                      </FormControl>
                    )}
                  </VStack>
                ) : (
                  <>
                    <FormControl>
                      <FormLabel>Submission Text (optional)</FormLabel>
                      <Textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Upload Files</FormLabel>
                      <Input
                        type="file"
                        multiple
                        onChange={(e) =>
                          setSubmissionFiles(Array.from(e.target.files || []))
                        }
                      />
                    </FormControl>
                    <Button colorScheme="yellow" onClick={handleSubmit}>
                      Submit Assignment
                    </Button>
                  </>
                )}
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AssignmentDetailModal;
