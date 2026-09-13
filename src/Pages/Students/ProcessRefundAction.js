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
  HStack,
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
import PaymentEvidenceUploader from "../../Components/PaymentEvidenceUploader";
import {
  processRefundRequest,
  fetchRefundRequests,
} from "../../Features/refundRequestSlice";
import { fetchStudents } from "../../Features/studentSlice";
import { canDecideRefundRequest } from "../../utlls/refundAccess";
import {
  FEE_PAYMENT_METHODS,
  requiresPaymentEvidence,
} from "../../utlls/paymentMethods";

const formatAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

/**
 * Shown on Students / Refund History when the student has an approved,
 * not-yet-processed refund request.
 * Requires Cash or Online method; Online requires a screenshot.
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
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [error, setError] = useState("");
  const [evidenceError, setEvidenceError] = useState("");

  const refundRequest = student?.approved_refund_request;
  const approvedMax = Math.round(
    Math.max(Number(refundRequest?.amount) || 0, 0)
  );
  const needsEvidence = requiresPaymentEvidence(paymentMethod);

  useEffect(() => {
    if (isOpen) {
      setAmount(approvedMax > 0 ? String(approvedMax) : "");
      setPaymentMethod("Cash");
      setEvidenceFiles([]);
      setError("");
      setEvidenceError("");
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
    setEvidenceError("");
    setEvidenceFiles([]);
  };

  const validateAmount = () => {
    const refundAmount = Number(amount);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      setError("Refund amount must be greater than 0");
      return null;
    }
    if (refundAmount > approvedMax) {
      setError(
        `Maximum allowed is the approved amount (${formatAmount(approvedMax)})`
      );
      return null;
    }
    return refundAmount;
  };

  const validateForm = () => {
    const refundAmount = validateAmount();
    if (refundAmount == null) return null;

    if (!paymentMethod || !FEE_PAYMENT_METHODS.includes(paymentMethod)) {
      setError("Select Cash or Online refund method");
      return null;
    }

    if (needsEvidence && evidenceFiles.length === 0) {
      setEvidenceError("Screenshot / receipt is required for online refunds");
      return null;
    }

    setEvidenceError("");
    return refundAmount;
  };

  const handleAskConfirmation = () => {
    const refundAmount = validateForm();
    if (refundAmount == null) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmedProcess = async () => {
    const refundAmount = validateForm();
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
          payment_method: paymentMethod,
          payment_evidence: evidenceFiles,
        })
      ).unwrap();
      handleClose();
      dispatch(fetchStudents({ authToken }));
      dispatch(fetchRefundRequests({ authToken }));
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

      <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
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

              <FormControl>
                <FormLabel fontSize={14}>
                  Refund via <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <HStack spacing={2} flexWrap="wrap">
                  {FEE_PAYMENT_METHODS.map((method) => {
                    const label =
                      method === "Online Payment" ? "Online" : method;
                    const selected = paymentMethod === method;
                    return (
                      <Button
                        key={method}
                        size="sm"
                        borderRadius="xl"
                        variant={selected ? "solid" : "outline"}
                        bg={selected ? "#FFCB82" : "white"}
                        color={selected ? "#654E26" : "gray.700"}
                        borderColor={selected ? "#E3B574" : "gray.200"}
                        onClick={() => {
                          setPaymentMethod(method);
                          setEvidenceError("");
                          if (!requiresPaymentEvidence(method)) {
                            setEvidenceFiles([]);
                          }
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </HStack>
              </FormControl>

              {needsEvidence ? (
                <PaymentEvidenceUploader
                  files={evidenceFiles}
                  onChange={(files) => {
                    setEvidenceFiles(files);
                    setEvidenceError("");
                  }}
                  error={evidenceError}
                  label="Online refund screenshot"
                />
              ) : null}

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
              <strong>{formatAmount(Number(amount) || 0)}</strong> via{" "}
              <strong>
                {paymentMethod === "Online Payment" ? "Online" : "Cash"}
              </strong>{" "}
              to <strong>{student?.name || "this student"}</strong>?
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
