import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  VStack,
  Text,
  Link,
  Badge,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { gradeSubmission } from "../../Features/assignmentSlice";
import {
  responsiveModalProps,
  responsiveModalContentProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

function GradeSubmissionModal({ isOpen, onClose, authToken, submission, maxMarks }) {
  const dispatch = useDispatch();
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [resubmissionRequested, setResubmissionRequested] = useState(false);

  const handleGrade = async () => {
    await dispatch(
      gradeSubmission({
        authToken,
        id: submission._id,
        gradeData: {
          marks_obtained: Number(marks),
          feedback,
          resubmission_requested: resubmissionRequested,
          status: resubmissionRequested ? undefined : "Graded",
        },
      })
    );
    onClose();
  };

  if (!submission) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...responsiveModalProps} {...getResponsiveModalSize("lg")}>
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>Grade Submission</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={3}>
            <Text>
              Student: <strong>{submission.student?.name}</strong>
            </Text>
            <Badge>{submission.status}</Badge>
            {submission.submission_text && (
              <Text whiteSpace="pre-wrap">{submission.submission_text}</Text>
            )}
            {submission.files?.map((file) => (
              <Link key={file._id || file.file_url} href={file.file_url} isExternal color="blue.500">
                {file.file_name}
              </Link>
            ))}
            <FormControl isRequired>
              <FormLabel>Marks (max {maxMarks})</FormLabel>
              <Input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Feedback</FormLabel>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Request Resubmission</FormLabel>
              <Switch
                isChecked={resubmissionRequested}
                onChange={(e) => setResubmissionRequested(e.target.checked)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="yellow" onClick={handleGrade}>Save Grade</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default GradeSubmissionModal;
