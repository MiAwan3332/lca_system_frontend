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
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  VStack,
  Text,
  Link,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { gradeSubmission } from "../../Features/assignmentSlice";
import {
  responsiveModalProps,
  responsiveModalContentProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

function GradeSubmissionModal({
  isOpen,
  onClose,
  authToken,
  submission,
  maxMarks,
  onGraded,
}) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [resubmissionRequested, setResubmissionRequested] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!submission) return;
    setMarks(
      submission.marks_obtained != null ? String(submission.marks_obtained) : ""
    );
    setFeedback(submission.feedback || "");
    setResubmissionRequested(Boolean(submission.resubmission_requested));
  }, [submission, isOpen]);

  const handleGrade = async () => {
    const marksValue = Number(marks);
    if (Number.isNaN(marksValue) || marks === "") {
      toast({
        title: "Marks required",
        description: "Enter marks for this submission.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    if (marksValue < 0) {
      toast({
        title: "Invalid marks",
        description: "Marks cannot be negative.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    if (maxMarks && marksValue > Number(maxMarks)) {
      toast({
        title: "Invalid marks",
        description: `Marks cannot exceed ${maxMarks}.`,
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(
        gradeSubmission({
          authToken,
          id: submission._id,
          gradeData: {
            marks_obtained: marksValue,
            feedback,
            resubmission_requested: resubmissionRequested,
            status: resubmissionRequested ? undefined : "Graded",
          },
        })
      ).unwrap();
      onGraded?.();
      onClose();
    } catch (error) {
      toast({
        title: "Grading failed",
        description: error.message || "Could not save marks.",
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!submission) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...responsiveModalProps} {...getResponsiveModalSize("lg")}>
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>
          {submission.marks_obtained != null ? "Edit Marks" : "Add Marks"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={3}>
            <Text>
              Student: <strong>{submission.student?.name}</strong>
            </Text>
            {submission.assignment?.title && (
              <Text fontSize="sm" color="gray.600">
                Assignment: {submission.assignment.title}
              </Text>
            )}
            <Badge w="fit-content">{submission.status}</Badge>
            {submission.submission_text && (
              <Text whiteSpace="pre-wrap" fontSize="sm">
                {submission.submission_text}
              </Text>
            )}
            {submission.files?.map((file) => (
              <Link
                key={file._id || file.file_url}
                href={file.file_url}
                isExternal
                color="blue.500"
              >
                {file.file_name}
              </Link>
            ))}
            <FormControl isRequired>
              <FormLabel>Marks{maxMarks ? ` (max ${maxMarks})` : ""}</FormLabel>
              <Input
                type="number"
                min={0}
                max={maxMarks || undefined}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
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
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="yellow" onClick={handleGrade} isLoading={isSaving}>
            Save Marks
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default GradeSubmissionModal;
