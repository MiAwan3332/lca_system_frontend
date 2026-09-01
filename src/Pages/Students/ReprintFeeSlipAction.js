import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
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
  Badge,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import axios from "axios";
import moment from "moment";
import { Printer } from "lucide-react";
import { useSelector } from "react-redux";
import ActionButton from "../../Components/ActionButton";
import { selectUser } from "../../Features/authSlice";
import { generatePendingPaymentSlip } from "../../utlls/generatePendingPaymentSlip";
import { saveLastFeeSlipPayload } from "../../utlls/feeSlipStorage";
import { issueSlipVerificationQr } from "../../utlls/slipVerification";
import { formatClassTimeRange } from "../../utlls/classTime";
import { config } from "../../utlls/config";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const formatAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

/**
 * Opens a modal of this student's Paid transactions, then prints a duplicate slip
 * for the selected payment.
 */
function ReprintFeeSlipAction({ student }) {
  const authToken = Cookies.get("authToken");
  const toast = useToast();
  const currentUser = useSelector(selectUser);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [paidLogs, setPaidLogs] = useState([]);
  const [selectedLogId, setSelectedLogId] = useState("");
  const [loadError, setLoadError] = useState("");

  const outstanding = Math.round(Math.max(Number(student?.pending_fee) || 0, 0));
  const paidFee = Math.round(Math.max(Number(student?.paid_fee) || 0, 0));

  const selectedLog = useMemo(
    () => paidLogs.find((log) => String(log._id) === String(selectedLogId)) || null,
    [paidLogs, selectedLogId]
  );

  if (!student || (outstanding <= 0 && paidFee <= 0)) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    setSelectedLogId("");
    setLoadError("");
    setPaidLogs([]);
  };

  const loadPaidTransactions = async () => {
    setIsLoading(true);
    setLoadError("");
    setPaidLogs([]);
    setSelectedLogId("");
    try {
      const response = await axios.get(
        `${config.BASE_URL}/students/history/${student._id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const logs = Array.isArray(response.data?.payment_logs)
        ? response.data.payment_logs
        : [];
      const paidOnly = logs
        .filter((log) => log.action_type === "Paid" && Number(log.action_amount) > 0)
        .sort(
          (a, b) =>
            new Date(b.action_date || 0).getTime() -
            new Date(a.action_date || 0).getTime()
        );
      setPaidLogs(paidOnly);
      if (!paidOnly.length) {
        setLoadError("No paid transactions found for this student.");
      }
    } catch (error) {
      setLoadError(
        error?.response?.data?.message ||
          error.message ||
          "Could not load paid transactions."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadPaidTransactions();
  };

  const buildSlipFromLog = (log) => {
    const payingNow = Math.round(Number(log.action_amount) || 0);
    const feeBefore = Math.round(Number(log.amount) || 0);
    const remainingAfter = Math.max(feeBefore - payingNow, 0);
    const batchName =
      log.fee?.batch?.name || student.batch?.name || "N/A";
    const batchFee =
      Number(log.fee?.batch?.batch_fee) ||
      Number(student.batch?.batch_fee) ||
      0;

    return {
      name: student.name,
      phone: student.phone,
      cnic: student.cnic || "",
      rollNumber: student.roll_number,
      batchName,
      batchFee,
      totalFee: Number(student.total_fee) || batchFee,
      paidFee: Number(student.paid_fee) || 0,
      outstandingBalance: feeBefore || payingNow,
      payingNow,
      remainingAfter,
      discountAmount: 0,
      paymentOption: remainingAfter > 0 ? "partial" : "full",
      paymentMethod: log.payment_method || "Cash",
      nextInstallmentDate: "",
      photoUrl: student.image || "",
      authorizedBy: currentUser?.name || log.action_by?.name || "",
      classStartTime: student.batch?.class_start_time || "",
      classEndTime: student.batch?.class_end_time || "",
      isDuplicate: true,
    };
  };

  const handlePrintSelected = async () => {
    if (!selectedLog) {
      toast({
        title: "Select a payment",
        description: "Choose a paid transaction to reprint.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsPrinting(true);
    try {
      const payload = buildSlipFromLog(selectedLog);
      const { qrDataUrl, verifyUrl } = await issueSlipVerificationQr({
        authToken,
        student_name: payload.name,
        cnic: payload.cnic,
        phone: payload.phone,
        batch_name: payload.batchName,
        total_fee: payload.totalFee,
        amount_received: payload.payingNow,
        remaining_fee: payload.remainingAfter,
        payment_option: payload.paymentOption,
        payment_method: payload.paymentMethod,
        class_time: formatClassTimeRange(
          payload.classStartTime,
          payload.classEndTime
        ),
        authorized_by: payload.authorizedBy,
        slip_type: "fee",
      });
      await generatePendingPaymentSlip(
        { ...payload, qrDataUrl, verifyUrl },
        "print"
      );
      saveLastFeeSlipPayload(student._id, payload);
      toast({
        title: "Duplicate slip ready",
        description: `Printed duplicate for ${formatAmount(payload.payingNow)} payment.`,
        status: "success",
        duration: 3500,
        isClosable: true,
      });
      handleClose();
    } catch (error) {
      toast({
        title: "Could not print duplicate slip",
        description: error?.message || "Please allow pop-ups and try again.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <>
      <ActionButton
        variant="slate"
        icon={<Printer size={16} />}
        label="Print Duplicate Slip"
        onClick={handleOpen}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("2xl")}
      >
        <ModalOverlay />
        <ModalContent
          {...responsiveModalContentProps}
          display="flex"
          flexDirection="column"
          maxH={{ base: "100dvh", sm: "90vh" }}
        >
          <ModalHeader flexShrink={0}>
            Print Duplicate Slip
            <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
              {student.name}
              {student.roll_number ? ` · ${student.roll_number}` : ""}
              {" · Select a paid transaction"}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody flex="1" overflowY="auto" py={4}>
            {isLoading ? (
              <HStack justify="center" py={10} spacing={3}>
                <Spinner size="sm" color="#85652D" />
                <Text fontSize="sm" color="gray.500">
                  Loading paid transactions...
                </Text>
              </HStack>
            ) : loadError ? (
              <Box
                p={6}
                borderRadius="lg"
                border="1px dashed"
                borderColor="gray.300"
                textAlign="center"
              >
                <Text fontSize="sm" color="gray.500">
                  {loadError}
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={2}>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  {paidLogs.length} paid transaction
                  {paidLogs.length === 1 ? "" : "s"}
                </Text>
                <Box
                  maxH="24rem"
                  overflowY="auto"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                >
                  {paidLogs.map((log) => {
                    const isSelected =
                      String(log._id) === String(selectedLogId);
                    return (
                      <Box
                        key={log._id}
                        as="button"
                        type="button"
                        w="100%"
                        textAlign="left"
                        px={4}
                        py={3}
                        bg={isSelected ? "#FFF6E8" : "white"}
                        borderBottom="1px solid"
                        borderColor="gray.100"
                        _hover={{ bg: isSelected ? "#FFF0D6" : "gray.50" }}
                        onClick={() => setSelectedLogId(log._id)}
                      >
                        <HStack justify="space-between" align="start">
                          <Box>
                            <Text fontWeight="600" fontSize="sm">
                              {formatAmount(log.action_amount)}
                            </Text>
                            <Text fontSize="xs" color="gray.500" mt={0.5}>
                              {log.action_date
                                ? moment(log.action_date).format(
                                    "DD MMM YYYY, hh:mm A"
                                  )
                                : "—"}
                              {log.fee?.batch?.name
                                ? ` · ${log.fee.batch.name}`
                                : ""}
                            </Text>
                            {log.description ? (
                              <Text fontSize="xs" color="gray.500" mt={1} noOfLines={2}>
                                {log.description}
                              </Text>
                            ) : null}
                          </Box>
                          <VStack align="end" spacing={1}>
                            <Badge colorScheme="green" borderRadius="full">
                              Paid
                            </Badge>
                            <Badge
                              colorScheme={
                                ["Online", "Online Payment"].includes(
                                  log.payment_method || ""
                                )
                                  ? "purple"
                                  : "teal"
                              }
                              borderRadius="full"
                            >
                              {log.payment_method || "Cash"}
                            </Badge>
                            {log.action_by?.name ? (
                              <Text fontSize="xs" color="gray.400">
                                {log.action_by.name}
                              </Text>
                            ) : null}
                          </VStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </Box>

                {selectedLog ? (
                  <Box
                    mt={2}
                    p={3}
                    borderRadius="lg"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Text fontSize="sm" color="gray.600">
                      Selected payment
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color="#85652D">
                      {formatAmount(selectedLog.action_amount)}
                      {" · "}
                      {selectedLog.payment_method || "Cash"}
                    </Text>
                  </Box>
                ) : null}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter flexShrink={0} gap={2}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              leftIcon={<Printer size={16} />}
              backgroundColor="#FFCB82"
              color="#85652D"
              _hover={{ backgroundColor: "#f0b965" }}
              onClick={handlePrintSelected}
              isLoading={isPrinting}
              loadingText="Printing"
              isDisabled={!selectedLog || isLoading}
            >
              Print Duplicate Slip
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ReprintFeeSlipAction;
