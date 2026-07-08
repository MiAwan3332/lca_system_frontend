import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Textarea,
} from "@chakra-ui/react";

function RejectModal({ isOpen, onClose, onReject, isLoading }) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    onReject(reason);
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Reject Expense</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel fontSize={14}>Reason (optional)</FormLabel>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this expense being rejected?"
              borderRadius="0.5rem"
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} borderRadius="0.75rem" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            borderRadius="0.75rem"
            backgroundColor="#FF8A8A"
            color="#6D1F1F"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Reject
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default RejectModal;
