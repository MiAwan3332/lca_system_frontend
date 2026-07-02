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
  Textarea,
  Select,
  VStack,
  Text,
  Badge,
  Divider,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { respondToComplaint } from "../../Features/complaintSlice";
import {
  COMPLAINT_STATUSES,
  getComplaintTargetLabel,
  getStatusColor,
} from "../../utlls/complaintConstants";
import {
  responsiveModalProps,
  responsiveModalContentProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

function ComplaintDetailModal({
  isOpen,
  onClose,
  authToken,
  complaint,
  canRespond,
  onUpdated,
}) {
  const dispatch = useDispatch();
  const { respondStatus } = useSelector((state) => state.complaints);
  const [status, setStatus] = useState("Open");
  const [response, setResponse] = useState("");

  useEffect(() => {
    if (!complaint) return;
    setStatus(complaint.status || "Open");
    setResponse(complaint.response || "");
  }, [complaint, isOpen]);

  if (!complaint) return null;

  const handleSave = async () => {
    await dispatch(
      respondToComplaint({
        authToken,
        id: complaint._id,
        responseData: { status, response },
      })
    ).unwrap();
    onUpdated?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...responsiveModalProps} {...getResponsiveModalSize("xl")}>
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>{complaint.subject}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={3}>
            <div className="flex flex-wrap gap-2">
              <Badge colorScheme={getStatusColor(complaint.status)}>{complaint.status}</Badge>
              <Badge>{complaint.category}</Badge>
              <Badge colorScheme="purple">
                To: {getComplaintTargetLabel(complaint.target_role)}
              </Badge>
            </div>
            <Text fontSize="sm" color="gray.600">
              Submitted by {complaint.submitted_by?.name} ({complaint.submitter_role})
              {complaint.submitted_by_student?.batch?.name
                ? ` — Batch: ${complaint.submitted_by_student.batch.name}`
                : ""}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {new Date(complaint.createdAt).toLocaleString()}
            </Text>
            <Divider />
            <Text whiteSpace="pre-wrap">{complaint.description}</Text>

            {complaint.response && !canRespond && (
              <>
                <Divider />
                <Text fontWeight="semibold">Response</Text>
                <Text whiteSpace="pre-wrap">{complaint.response}</Text>
                {complaint.responded_by?.name && (
                  <Text fontSize="sm" color="gray.500">
                    By {complaint.responded_by.name}
                    {complaint.responded_at
                      ? ` on ${new Date(complaint.responded_at).toLocaleString()}`
                      : ""}
                  </Text>
                )}
              </>
            )}

            {canRespond && (
              <>
                <Divider />
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select value={status} onChange={(e) => setStatus(e.target.value)} borderRadius="xl">
                    {COMPLAINT_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Response / Remarks</FormLabel>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    borderRadius="xl"
                    rows={4}
                    placeholder="Add your response or resolution notes"
                  />
                </FormControl>
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          {canRespond && (
            <Button colorScheme="yellow" onClick={handleSave} isLoading={respondStatus === "loading"}>
              Save Response
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ComplaintDetailModal;
