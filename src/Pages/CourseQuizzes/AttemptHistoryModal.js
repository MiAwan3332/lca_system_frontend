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

function AttemptHistoryModal({ isOpen, onClose, attempts }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} {...responsiveModalProps} {...getResponsiveModalSize("xl")}>
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>Quiz Attempt History</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Quiz</Th>
                  <Th>Attempt</Th>
                  <Th>Status</Th>
                  <Th>Score</Th>
                  <Th>Submitted</Th>
                </Tr>
              </Thead>
              <Tbody>
                {attempts.length === 0 ? (
                  <Tr><Td colSpan={5} textAlign="center">No attempts yet</Td></Tr>
                ) : (
                  attempts.map((a) => (
                    <Tr key={a._id}>
                      <Td>{a.quiz?.title}</Td>
                      <Td>{a.attempt_number}</Td>
                      <Td><Badge>{a.status}</Badge></Td>
                      <Td>
                        {a.result_visible
                          ? `${a.total_score}/${a.max_score} (${a.percentage}%)`
                          : "Pending"}
                      </Td>
                      <Td>{a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "-"}</Td>
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

export default AttemptHistoryModal;
