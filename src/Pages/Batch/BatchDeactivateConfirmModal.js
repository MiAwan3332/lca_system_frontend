import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
} from "@chakra-ui/react";

function BatchDeactivateConfirmModal({
  isOpen,
  onClose,
  batchName,
  enrolledCount,
  onConfirm,
  isLoading,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="text-xl font-semibold">
          Deactivate batch
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            This batch has students enrollment still. Can you do this?
          </Text>
          <Text mt={3} color="gray.600" fontSize="sm">
            {enrolledCount} student{enrolledCount === 1 ? "" : "s"} enrolled in{" "}
            <strong>{batchName}</strong> will also be deactivated.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} borderRadius="0.75rem" onClick={onClose}>
            Cancel
          </Button>
          <Button
            borderRadius="0.75rem"
            backgroundColor="#FF8A8A"
            color="#6D1F1F"
            _hover={{ backgroundColor: "#E48080", color: "#561616" }}
            fontWeight="500"
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="Deactivating"
          >
            Yes, deactivate
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default BatchDeactivateConfirmModal;
