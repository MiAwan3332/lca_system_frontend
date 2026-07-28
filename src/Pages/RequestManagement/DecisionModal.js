import React, { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";

function DecisionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  mode = "approve",
  initialAmount = "",
}) {
  const [comment, setComment] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const isApprove = mode === "approve";

  useEffect(() => {
    if (isOpen) {
      setComment("");
      setError("");
      setAmount(
        initialAmount === null || initialAmount === undefined
          ? ""
          : String(initialAmount)
      );
    }
  }, [isOpen, initialAmount]);

  const handleClose = () => {
    setComment("");
    setAmount("");
    setError("");
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = comment.trim();
    if (!trimmed) {
      setError("Comment is required");
      return;
    }

    if (isApprove) {
      const approvedAmount = Number(amount);
      if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) {
        setError("Approved amount must be greater than 0");
        return;
      }
      onConfirm({ comment: trimmed, amount: approvedAmount });
    } else {
      onConfirm({ comment: trimmed });
    }

    setComment("");
    setAmount("");
    setError("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isApprove ? "Approve Refund Request" : "Reject Refund Request"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {isApprove ? (
              <FormControl isInvalid={Boolean(error) && error.includes("amount")}>
                <FormLabel fontSize={14}>
                  Refund Amount <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter approved refund amount"
                  borderRadius="0.5rem"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  You can change the requested amount before approving.
                </Text>
              </FormControl>
            ) : null}

            <FormControl isInvalid={Boolean(error) && !error.includes("amount")}>
              <FormLabel fontSize={14}>
                Comment <Text as="span" color="red.500">*</Text>
              </FormLabel>
              <Textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (error) setError("");
                }}
                placeholder={
                  isApprove
                    ? "Add approval comments (required)"
                    : "Add rejection comments (required)"
                }
                borderRadius="0.5rem"
                rows={4}
              />
              {error ? (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {error}
                </Text>
              ) : null}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} borderRadius="0.75rem" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            borderRadius="0.75rem"
            backgroundColor={isApprove ? "#82FFCB" : "#FF8A8A"}
            color={isApprove ? "#1F6D4A" : "#6D1F1F"}
            _hover={{
              backgroundColor: isApprove ? "#74E3B5" : "#E48080",
            }}
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {isApprove ? "Approve" : "Reject"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DecisionModal;
