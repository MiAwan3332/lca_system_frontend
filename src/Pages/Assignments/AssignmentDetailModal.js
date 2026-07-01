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
  Badge,
  Link,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  Divider,
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...responsiveModalProps} {...getResponsiveModalSize("2xl")}>
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>{assignment.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={3}>
            <HStackWrap>
              <Badge colorScheme="blue">{assignment.batch?.name || "Batch"}</Badge>
              <Badge colorScheme="purple">{assignment.course?.name || "Course"}</Badge>
              <Badge>{assignment.visibility_status}</Badge>
            </HStackWrap>
            {assignment.description && <Text>{assignment.description}</Text>}
            {assignment.instructions && (
              <>
                <Text fontWeight="semibold">Instructions</Text>
                <Text whiteSpace="pre-wrap">{assignment.instructions}</Text>
              </>
            )}
            <Text fontSize="sm" color="gray.600">
              Max marks: {assignment.max_marks} | Attempts: {assignment.max_attempts}
            </Text>
            {assignment.attachments?.length > 0 && (
              <>
                <Text fontWeight="semibold">Attachments</Text>
                {assignment.attachments.map((file) => (
                  <Link key={file._id || file.file_url} href={file.file_url} isExternal color="blue.500">
                    {file.file_name}
                  </Link>
                ))}
              </>
            )}

            {viewOnly && (
              <>
                <Divider my={2} />
                <Text fontWeight="semibold">Your Submission</Text>
                {mySubmission ? (
                  <VStack align="stretch" spacing={2}>
                    <Badge colorScheme={mySubmission.is_late ? "orange" : "green"}>
                      {mySubmission.status}
                    </Badge>
                    {mySubmission.marks_obtained != null && (
                      <Text>Score: {mySubmission.marks_obtained} / {assignment.max_marks}</Text>
                    )}
                    {mySubmission.feedback && (
                      <Text color="gray.700">Feedback: {mySubmission.feedback}</Text>
                    )}
                    {mySubmission.files?.map((file) => (
                      <Link key={file._id || file.file_url} href={file.file_url} isExternal>
                        {file.file_name}
                      </Link>
                    ))}
                  </VStack>
                ) : (
                  <>
                    <FormControl>
                      <FormLabel>Submission Text (optional)</FormLabel>
                      <Textarea value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Upload Files</FormLabel>
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => setSubmissionFiles(Array.from(e.target.files || []))}
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

function HStackWrap({ children }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export default AssignmentDetailModal;
