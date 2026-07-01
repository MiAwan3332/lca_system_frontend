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

function SubmissionsListModal({ isOpen, onClose, submissions, assignment, onGrade }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} {...responsiveModalProps} {...getResponsiveModalSize("2xl")}>
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>Submissions — {assignment?.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Student</Th>
                  <Th>Attempt</Th>
                  <Th>Status</Th>
                  <Th>Submitted</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {submissions.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center">No submissions yet</Td>
                  </Tr>
                ) : (
                  submissions.map((sub) => (
                    <Tr key={sub._id}>
                      <Td>{sub.student?.name}</Td>
                      <Td>{sub.attempt_number}</Td>
                      <Td><Badge>{sub.status}</Badge></Td>
                      <Td>{new Date(sub.submitted_at).toLocaleString()}</Td>
                      <Td>
                        <Button size="xs" onClick={() => onGrade(sub)}>Grade</Button>
                      </Td>
                    </Tr>
                  ))
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
