import React, { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  HStack,
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
import { Pencil } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import ActionButton from "../../Components/ActionButton";
import PaymentEvidenceUploader from "../../Components/PaymentEvidenceUploader";
import PaymentEvidenceGallery from "../../Components/PaymentEvidenceGallery";
import {
  fetchRefundRequests,
  updateRefundPayout,
} from "../../Features/refundRequestSlice";
import { canUpdateRefundPayout } from "../../utlls/refundAccess";
import {
  FEE_PAYMENT_METHODS,
  requiresPaymentEvidence,
} from "../../utlls/paymentMethods";
import { getPaymentEvidenceUrls } from "../../utlls/paymentEvidence";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

/**
 * Super Admin — edit Cash/Online payout and attach online screenshot
 * on already-refunded requests.
 */
function UpdateRefundPayoutAction({
  request,
  onUpdated,
  asButton = true,
  isOpen: controlledOpen,
  onClose: controlledClose,
}) {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const toast = useToast();
  const { updatePayoutStatus } = useSelector((state) => state.refundRequests);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const existingMethod =
    request?.refund_payment_method === "Online" ||
    request?.refund_payment_method === "Online Payment"
      ? "Online Payment"
      : request?.refund_payment_method === "Cash"
        ? "Cash"
        : "Cash";

  const [paymentMethod, setPaymentMethod] = useState(existingMethod);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidenceError, setEvidenceError] = useState("");

  const existingEvidence = getPaymentEvidenceUrls(request?.refund_evidence);
  const needsEvidence = requiresPaymentEvidence(paymentMethod);

  useEffect(() => {
    if (isOpen && request) {
      setPaymentMethod(existingMethod);
      setEvidenceFiles([]);
      setEvidenceError("");
    }
  }, [isOpen, request, existingMethod]);

  if (!canUpdateRefundPayout() || !request?.is_refunded || !request?._id) {
    return null;
  }

  const handleClose = () => {
    if (isControlled) {
      controlledClose?.();
    } else {
      setInternalOpen(false);
    }
    setEvidenceFiles([]);
    setEvidenceError("");
  };

  const handleSave = async () => {
    if (!FEE_PAYMENT_METHODS.includes(paymentMethod)) {
      setEvidenceError("Select Cash or Online");
      return;
    }
    if (
      needsEvidence &&
      evidenceFiles.length === 0 &&
      existingEvidence.length === 0
    ) {
      setEvidenceError("Screenshot / receipt is required for online refunds");
      return;
    }

    try {
      const updated = await dispatch(
        updateRefundPayout({
          authToken,
          requestId: request._id,
          payment_method: paymentMethod,
          payment_evidence: evidenceFiles,
        })
      ).unwrap();
      dispatch(fetchRefundRequests({ authToken }));
      onUpdated?.(updated);
      handleClose();
    } catch (err) {
      toast({
        title: "Update failed",
        description: typeof err === "string" ? err : "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      {asButton && !isControlled ? (
        <ActionButton
          variant="amber"
          icon={<Pencil size={16} />}
          label="Update Payout"
          onClick={() => setInternalOpen(true)}
        />
      ) : null}

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("lg")}
      >
        <ModalOverlay />
        <ModalContent {...responsiveModalContentProps}>
          <ModalHeader>Update refund payout</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Super Admin can change Cash / Online and attach a screenshot for{" "}
                <strong>
                  {request.student_name || request.student?.name || "student"}
                </strong>
                .
              </Text>

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
                <>
                  {existingEvidence.length > 0 ? (
                    <PaymentEvidenceGallery
                      value={request.refund_evidence}
                      paymentMethod="Online"
                      title="Current screenshot"
                    />
                  ) : null}
                  <PaymentEvidenceUploader
                    files={evidenceFiles}
                    onChange={(files) => {
                      setEvidenceFiles(files);
                      setEvidenceError("");
                    }}
                    error={evidenceError}
                    label={
                      existingEvidence.length
                        ? "Add another screenshot"
                        : "Online refund screenshot"
                    }
                  />
                </>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  Cash refund — no screenshot required. Any previous online
                  screenshot will be cleared.
                </Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="xl"
              onClick={handleClose}
              isDisabled={updatePayoutStatus === "loading"}
            >
              Cancel
            </Button>
            <Button
              borderRadius="xl"
              bg="#FFCB82"
              color="#654E26"
              _hover={{ bg: "#E3B574" }}
              onClick={handleSave}
              isLoading={updatePayoutStatus === "loading"}
              loadingText="Saving"
            >
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default UpdateRefundPayoutAction;
