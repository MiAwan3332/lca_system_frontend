import React, { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
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
  useToast,
  VStack,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { HandCoins } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import ActionButton from "../../Components/ActionButton";
import { processRefundRequest } from "../../Features/refundRequestSlice";
import { fetchStudents } from "../../Features/studentSlice";
import { canDecideRefundRequest } from "../../utlls/refundAccess";

const formatAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

/**
 * Shown on Students actions when the student has an approved,
 * not-yet-processed refund request.
 * Refund amount cannot exceed the approved amount.
 * Requires a second confirmation before processing.
 */
function ProcessRefundAction({ student }) {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const toast = useToast();
  const cancelRef = useRef();
  const { processStatus } = useSelector((state) => state.refundRequests);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const refundRequest = student?.approved_refund_request;
  const approvedMax = Math.round(Math.max(Number(refundRequest?.amount) || 0, 0));

  useEffect(() => {
    if (isOpen) {
      setAmount(approvedMax > 0 ? String(approvedMax) : "");
      setError("");
      setIsConfirmOpen(false);
    }
  }, [isOpen, approvedMax]);

  if (!canDecideRefundRequest() || !refundRequest?._id) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    setIsConfirmOpen(false);
    setError("");
  };

  const validateAmount = () => {
    const refundAmount = Number(amount);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      setError("Refund amount must be greater than 0");
      return null;
    }
    if (refundAmount > approvedMax) {
      setError(`Maximum allowed is the approved amount (${formatAmount(approvedMax)})`);
      return null;
    }
    return refundAmount;
  };

  const handleAskConfirmation = () => {
    const refundAmount = validateAmount();
    if (refundAmount == null) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmedProcess = async () => {
    const refundAmount = validateAmount();
    if (refundAmount == null) {
      setIsConfirmOpen(false);
      return;
    }

    try {
      await dispatch(
        processRefundRequest({
          authToken,
          requestId: refundRequest._id,
          amount: refundAmount,
        })
      ).unwrap();
      handleClose();
      dispatch(fetchStudents({ authToken }));
    } catch (err) {
      setIsConfirmOpen(false);
      toast({
        title: "Refund failed",
        description: typeof err === "string" ? err : "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <ActionButton
        variant="green"
        icon={<HandCoins size={16} />}
        label="Refund"
        onClick={() => setIsOpen(true)}
      />

      <Modal isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Process Refund</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <Text>
                Process refund for <strong>{student?.name || "student"}</strong>?
              </Text>
              <Text fontSize="sm" color="gray.600">
                Approved maximum: <strong>{formatAmount(approvedMax)}</strong>
              </Text>
              {refundRequest.reason ? (
                <Text fontSize="sm" color="gray.500">
                  Reason: {refundRequest.reason}
                </Text>
              ) : null}

              <FormControl isInvalid={Boolean(error)}>
                <FormLabel fontSize={14}>
                  Refund Amount <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Input
                  type="number"
                  min={1}
                  max={approvedMax}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder={`Max ${approvedMax}`}
                  borderRadius="0.5rem"
                />
                {error ? (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {error}
                  </Text>
                ) : (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    You can refund less, but not more than the approved amount.
                  </Text>
                )}
              </FormControl>

              <Text fontSize="sm" color="orange.600">
                This will deduct the amount from finance and mark the refund as
                completed.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="0.75rem"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              borderRadius="0.75rem"
              backgroundColor="#82FFCB"
              color="#1F6D4A"
              _hover={{ backgroundColor: "#74E3B5" }}
              onClick={handleAskConfirmation}
            >
              Confirm Refund
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsConfirmOpen(false)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Refund?
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to refund{" "}
              <strong>{formatAmount(Number(amount) || 0)}</strong> to{" "}
              <strong>{student?.name || "this student"}</strong>?
              <Text mt={3} fontSize="sm" color="gray.600">
                This action will deduct the amount from finance and cannot be
                undone easily.
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                borderRadius="0.75rem"
                onClick={() => setIsConfirmOpen(false)}
                isDisabled={processStatus === "loading"}
              >
                No, Cancel
              </Button>
              <Button
                ml={3}
                borderRadius="0.75rem"
                backgroundColor="#82FFCB"
                color="#1F6D4A"
                _hover={{ backgroundColor: "#74E3B5" }}
                onClick={handleConfirmedProcess}
                isLoading={processStatus === "loading"}
                loadingText="Refunding"
              >
                Yes, Refund
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

export default ProcessRefundAction;
