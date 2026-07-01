import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  TableContainer,
} from "@chakra-ui/react";
import {
  responsiveModalProps,
  responsiveModalContentProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

const statusColor = {
  Submitted: "blue",
  "Late Submitted": "orange",
  "Under Review": "yellow",
  Graded: "purple",
  Completed: "teal",
  "Resubmission Requested": "red",
};

function SubmissionsListModal({ isOpen, onClose, submissions, assignment, onGrade }) {
  const maxMarks = assignment?.max_marks;

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...responsiveModalProps} {...getResponsiveModalSize("3xl")}>
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>
          Submissions — {assignment?.title}
          {maxMarks ? ` (Max ${maxMarks} marks)` : ""}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Student</Th>
                  <Th>Attempt</Th>
                  <Th>Status</Th>
                  <Th>Marks</Th>
                  <Th>Submitted</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {submissions.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center">
                      No submissions yet
                    </Td>
                  </Tr>
                ) : (
                  submissions.map((sub) => {
                    const marksLabel =
                      sub.marks_obtained != null
                        ? `${sub.marks_obtained}${maxMarks ? ` / ${maxMarks}` : ""}`
                        : "—";
                    const needsReview = ["Submitted", "Late Submitted", "Under Review"].includes(
                      sub.status
                    );

                    return (
                      <Tr key={sub._id}>
                        <Td>{sub.student?.name}</Td>
                        <Td>{sub.attempt_number}</Td>
                        <Td>
                          <Badge colorScheme={statusColor[sub.status] || "gray"}>
                            {sub.status}
                          </Badge>
                        </Td>
                        <Td fontWeight={sub.marks_obtained != null ? "semibold" : "normal"}>
                          {marksLabel}
                        </Td>
                        <Td>{new Date(sub.submitted_at).toLocaleString()}</Td>
                        <Td>
                          <Button
                            size="xs"
                            colorScheme={needsReview ? "yellow" : "gray"}
                            variant={needsReview ? "solid" : "outline"}
                            onClick={() => onGrade(sub)}
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
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default SubmissionsListModal;
