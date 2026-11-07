import { can, accessSnapshot } from '../../utlls/accessCapabilities';
import { Checkbox, Textarea } from '../../Components/AccessInputs';
import AccessForm from '../../Components/AccessForm';
import FormControl from '../../Components/AccessFormControl';
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormLabel,
  Text,
  Box,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { ArrowRightLeft, FileText, Receipt } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBatches,
  selectActiveBatches,
} from "../../Features/batchSlice.js";
import {
  transferStudentBatch,
  getOrCreatePendingFeeSlip,
  fetchStudents,
} from "../../Features/studentSlice";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import {
  generatePendingFeeSlipPdf,
  openFeeSlipUrl,
} from "../../utlls/generatePendingFeeSlip";
import { getMediaUrl } from "../../utlls/useful.js";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";
import ActionButton from "../../Components/ActionButton";
import { canShiftStudentBatch } from "../../utlls/useful";
import {
  batchIsPaid,
  normalizeBatchSpecialFeeOptions,
} from "../../utlls/specialFeeOptions";

const formatPendingAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const formatDueDate = (value) => {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  return raw || "—";
};

function ShiftBatchModal({ student }) {
  if (!canShiftStudentBatch()) {
    return null;
  }
  const [isOpen, setIsOpen] = useState(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const [destinationBatchId, setDestinationBatchId] = useState("");
  const [pendingBlock, setPendingBlock] = useState(null);
  const [specialSelectedOptions, setSpecialSelectedOptions] = useState([]);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [transferRemarks, setTransferRemarks] = useState("");
  const toast = useToast();
  const dispatch = useDispatch();

  const batches = useSelector(selectActiveBatches);
  const { transferBatchStatus, pendingFeeSlipStatus } = useSelector(
    (state) => state.students
  );

  const currentBatchId = student?.batch?._id || student?.batch || "";
  const currentBatchName = student?.batch?.name || "No Batch";
  const pendingFeeAmount = Number(student?.pending_fee) || 0;
  const oldDuesNil = !(pendingFeeAmount > 0);

  const destinationBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          batch.is_active !== false &&
          String(batch._id) !== String(currentBatchId)
      ),
    [batches, currentBatchId]
  );

  const destinationBatch = useMemo(
    () =>
      destinationBatches.find(
        (batch) => String(batch._id) === String(destinationBatchId)
      ),
    [destinationBatches, destinationBatchId]
  );

  const isDestinationPaid = batchIsPaid(destinationBatch);
  const isDestinationSpecial = destinationBatch?.is_special_batch === true;
  const specialOptions = useMemo(
    () =>
      normalizeBatchSpecialFeeOptions(
        destinationBatch?.special_fee_options
      ).filter((item) => Number(item.fee) > 0),
    [destinationBatch]
  );

  const destinationFeeAmount = useMemo(() => {
    if (!destinationBatch || !isDestinationPaid) return 0;
    if (isDestinationSpecial) {
      const selected = new Set(specialSelectedOptions);
      return specialOptions.reduce(
        (sum, item) => (selected.has(item.key) ? sum + Number(item.fee || 0) : sum),
        0
      );
    }
    return Number(destinationBatch.batch_fee) || 0;
  }, [
    destinationBatch,
    isDestinationPaid,
    isDestinationSpecial,
    specialOptions,
    specialSelectedOptions,
  ]);

  const previousPending =
    Number(pendingBlock?.pending_amount) || pendingFeeAmount || 0;
  const previousBatchName =
    pendingBlock?.previous_batch_name || currentBatchName;
  const previousDueDate = pendingBlock?.due_date || "";

  const appliedDiscount = Math.max(destinationFeeAmount - previousPending, 0);
  const finalPayable = Math.max(destinationFeeAmount - appliedDiscount, 0);
  const pendingExceedsNewFee =
    !oldDuesNil &&
    destinationFeeAmount > 0 &&
    previousPending > destinationFeeAmount;

  const canGoWithNewFee =
    oldDuesNil &&
    Boolean(destinationBatchId) &&
    isDestinationPaid &&
    destinationFeeAmount > 0 &&
    (!isDestinationSpecial || specialSelectedOptions.length > 0);

  const canTransferPendingDues =
    (!accessSnapshot().managed || can('fees.discount.fee')) &&
    !oldDuesNil &&
    Boolean(destinationBatchId) &&
    isDestinationPaid &&
    destinationFeeAmount > 0 &&
    !pendingExceedsNewFee &&
    (!isDestinationSpecial || specialSelectedOptions.length > 0);

  const onOpen = () => setIsOpen(true);
  const onClose = () => {
    setIsOpen(false);
    setDestinationBatchId("");
    setPendingBlock(null);
    setSpecialSelectedOptions([]);
    setShowTransferConfirm(false);
    setTransferRemarks("");
  };

  useEffect(() => {
    if (isOpen) {
      dispatch(
        fetchBatches({
          authToken,
          queryParams: {
            limit: 100,
            page: 1,
            query: "",
            is_active: "true",
          },
        })
      );
    }
  }, [dispatch, authToken, isOpen]);

  useEffect(() => {
    if (!isOpen || oldDuesNil) return;

    setPendingBlock((prev) =>
      prev || {
        code: "PENDING_FEE_BLOCK",
        message:
          "This student has an outstanding fee balance from the previous batch.",
        pending_amount: pendingFeeAmount,
        previous_batch_name: currentBatchName,
        due_date: student?.pending_due_date || student?.due_date || "",
        can_transfer_pending_dues: true,
      }
    );

  }, [isOpen, oldDuesNil, pendingFeeAmount, currentBatchName, student?.pending_due_date, student?.due_date]);

  const handleTransfer = async ({
    assignNewFee = false,
    transferPendingDues = false,
  } = {}) => {
    if (!destinationBatchId) {
      toast({
        title: "Select a batch",
        description: "Choose the destination batch for this student.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (String(destinationBatchId) === String(currentBatchId)) {
      toast({
        title: "Same batch selected",
        description: "Please choose a different batch to transfer.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (transferPendingDues) {
      if (!canTransferPendingDues) {
        toast({
          title: pendingExceedsNewFee
            ? "Pending dues exceed new batch fee"
            : "Cannot transfer pending dues",
          description: pendingExceedsNewFee
            ? `Previous pending (${formatPendingAmount(
                previousPending
              )}) is greater than the new batch fee (${formatPendingAmount(
                destinationFeeAmount
              )}).`
            : isDestinationSpecial
              ? "Select at least one special batch option with a fee."
              : "Destination batch must have a fee greater than 0.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      const remarks = String(transferRemarks || "").trim();
      if (!remarks) {
        toast({
          title: "Remarks required",
          description:
            "Enter remarks explaining the pending dues transfer before confirming.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
    } else if (assignNewFee) {
      if (!canGoWithNewFee) {
        toast({
          title: "Cannot assign new fee",
          description: isDestinationSpecial
            ? "Select at least one special batch option with a fee."
            : "Destination batch must have a fee greater than 0.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      if (!oldDuesNil) {
        toast({
          title: "Clear old dues first",
          description:
            "Old dues must be nil before assigning a new fee on batch shift, or use Transfer Pending Dues.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
    }

    if (!transferPendingDues) {
      setPendingBlock(null);
    }

    try {
      await dispatch(
        transferStudentBatch({
          authToken,
          studentId: student._id,
          batch: destinationBatchId,
          assign_new_fee: assignNewFee || transferPendingDues,
          special_selected_options:
            assignNewFee || transferPendingDues
              ? specialSelectedOptions
              : undefined,
          transfer_pending_dues: transferPendingDues,
          remarks: transferPendingDues
            ? String(transferRemarks || "").trim()
            : undefined,
        })
      ).unwrap();

      dispatch(fetchStudents({ authToken }));
      onClose();
    } catch (error) {
      if (error?.code === "PENDING_FEE_BLOCK") {
        setPendingBlock(error);
        setShowTransferConfirm(false);
        return;
      }
      if (error?.code === "PENDING_EXCEEDS_NEW_FEE") {
        toast({
          title: "Transfer blocked",
          description:
            error.message ||
            "Previous pending dues exceed the new batch fee.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      // Error toast is handled by the Redux slice for other cases
    }
  };

  const handleGeneratePendingFeeSlip = async () => {
    try {
      if (pendingBlock?.has_pending_fee_slip && pendingBlock?.slip_url) {
        openFeeSlipUrl(getMediaUrl(pendingBlock.slip_url));
        toast({
          title: "Existing pending fee slip opened",
          description: `Pending Amount: ${formatPendingAmount(
            pendingBlock.pending_amount
          )}`,
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      let result;
      try {
        result = await dispatch(
          getOrCreatePendingFeeSlip({
            authToken,
            studentId: student._id,
          })
        ).unwrap();
      } catch (error) {
        if (
          error?.code !== "NEED_SLIP_FILE" &&
          !error?.message?.includes?.("PDF is required")
        ) {
          throw error;
        }
        result = error;
      }

      if (result?.reused && result?.slip_url) {
        openFeeSlipUrl(getMediaUrl(result.slip_url));
        setPendingBlock((prev) =>
          prev
            ? {
                ...prev,
                has_pending_fee_slip: true,
                slip_url: result.slip_url,
              }
            : prev
        );
        toast({
          title: "Existing pending fee slip opened",
          description: `Pending Amount: ${formatPendingAmount(
            result.pending_amount
          )}`,
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const pendingAmount =
        result?.pending_amount ||
        pendingBlock?.pending_amount ||
        Number(student.pending_fee) ||
        0;

      const slipFile = await generatePendingFeeSlipPdf({
        name: student.name,
        phone: student.phone,
        cnic: student.cnic,
        rollNumber: String(student.roll_number || "").trim(),
        batchName: currentBatchName,
        totalFee: student.total_fee,
        paidFee: student.paid_fee,
        pendingAmount,
        photoUrl: student.image ? getMediaUrl(student.image) : null,
      });

      const created = await dispatch(
        getOrCreatePendingFeeSlip({
          authToken,
          studentId: student._id,
          slipFile,
        })
      ).unwrap();

      openFeeSlipUrl(getMediaUrl(created.slip_url));
      setPendingBlock((prev) =>
        prev
          ? {
              ...prev,
              has_pending_fee_slip: true,
              slip_url: created.slip_url,
              pending_amount: created.pending_amount ?? prev.pending_amount,
            }
          : prev
      );

      toast({
        title: created.reused
          ? "Existing pending fee slip opened"
          : "Pending fee slip generated",
        description: `Pending Amount: ${formatPendingAmount(
          created.pending_amount
        )}`,
        status: created.reused ? "info" : "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      // Error toasts are handled by the Redux slice for rejected thunks.
    }
  };

  const toggleSpecialOption = (key) => {
    setSpecialSelectedOptions((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  return (
    <>
      <ActionButton
        variant="green"
        icon={<ArrowRightLeft size={16} />}
        label="Shift Batch"
        onClick={onOpen}
        title="Shift Batch"
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("4xl")}
      >
        <ModalOverlay />
        <AccessForm component={ModalContent}
          {...responsiveModalContentProps}
          w={{ base: "100%", sm: "90vw", md: "720px", lg: "820px" }}
          maxW={{ base: "100%", sm: "90vw", md: "820px" }}
          minH={{ base: "100dvh", sm: "520px" }}
          maxH={{ base: "100dvh", sm: "85vh" }}
          display="flex"
          flexDirection="column"
        >
          <ModalHeader className="text-xl font-semibold">
            Shift Batch
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody flex="1" overflowY="auto" py={5}>
            <VStack spacing={5} align="stretch" minH={{ base: "auto", sm: "340px" }}>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Student: <strong>{student.name}</strong>
                </Text>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Current batch: <strong>{currentBatchName}</strong>
                </Text>
                {student.roll_number ? (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Roll No: <strong>{student.roll_number}</strong>
                  </Text>
                ) : null}
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Old dues:{" "}
                  <strong>
                    {oldDuesNil
                      ? "Nil"
                      : formatPendingAmount(pendingFeeAmount)}
                  </strong>
                </Text>
              </Box>

              <FormControl isRequired>
                <FormLabel fontSize={14}>Destination batch</FormLabel>
                <SearchableBatchSelect
                  batches={destinationBatches}
                  value={destinationBatchId}
                  onChange={(batchId) => {
                    setDestinationBatchId(batchId);
                    setShowTransferConfirm(false);
                    setTransferRemarks("");
                    setSpecialSelectedOptions([]);
                  }}
                  placeholder="Select active destination batch"
                  width="100%"
                  activeOnly
                  showClearOption={false}
                />
              </FormControl>

              {destinationBatchId &&
              isDestinationSpecial &&
              specialOptions.length > 0 ? (
                <FormControl>
                  <FormLabel fontSize={14}>
                    Special fee options (for new fee)
                  </FormLabel>
                  <VStack align="stretch" spacing={2}>
                    {specialOptions.map((option) => (
                      <Checkbox
                        key={option.key}
                        isChecked={specialSelectedOptions.includes(option.key)}
                        onChange={() => toggleSpecialOption(option.key)}
                      >
                        {option.label} — {formatPendingAmount(option.fee)}
                      </Checkbox>
                    ))}
                  </VStack>
                </FormControl>
              ) : null}

              {oldDuesNil && destinationBatchId ? (
                <Alert
                  status="success"
                  borderRadius="xl"
                  alignItems="flex-start"
                >
                  <AlertIcon mt={1} />
                  <AlertDescription fontSize="sm">
                    Old dues are nil. You can transfer only, or{" "}
                    <strong>Go with new fee</strong>
                    {isDestinationPaid && destinationFeeAmount > 0
                      ? ` (${formatPendingAmount(destinationFeeAmount)})`
                      : isDestinationPaid
                        ? isDestinationSpecial
                          ? " after selecting special options"
                          : " once destination fee is configured"
                        : " — destination batch has no fee"}
                    .
                  </AlertDescription>
                </Alert>
              ) : null}

              {!oldDuesNil ? (
                <Alert
                  status="warning"
                  borderRadius="xl"
                  alignItems="flex-start"
                  flexDirection="column"
                >
                  <Box display="flex" alignItems="flex-start" w="100%">
                    <AlertIcon mt={1} />
                    <AlertDescription fontSize="sm" w="100%">
                      <Text fontWeight="semibold" mb={2}>
                        Previous batch payment history
                      </Text>
                      <Text>
                        Previous batch: <strong>{previousBatchName}</strong>
                      </Text>
                      <Text mt={1}>
                        Pending dues:{" "}
                        <strong>{formatPendingAmount(previousPending)}</strong>
                      </Text>
                      <Text mt={1}>
                        Due date: <strong>{formatDueDate(previousDueDate)}</strong>
                      </Text>
                      {pendingBlock?.message ? (
                        <Text mt={2} color="gray.700">
                          {pendingBlock.message}
                        </Text>
                      ) : null}
                    </AlertDescription>
                  </Box>
                  <HStack mt={3} spacing={2} flexWrap="wrap">
                    <Button
                      leftIcon={<FileText size={16} />}
                      borderRadius="xl"
                      backgroundColor="#FFCB82"
                      color="#85652D"
                      _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                      onClick={handleGeneratePendingFeeSlip}
                      isLoading={pendingFeeSlipStatus === "loading"}
                      loadingText={
                        pendingBlock?.has_pending_fee_slip
                          ? "Opening..."
                          : "Generating..."
                      }
                    >
                      {pendingBlock?.has_pending_fee_slip
                        ? "Open Pending Fee Slip"
                        : "Generate Pending Fee Slip"}
                    </Button>
                    <Button
                      borderRadius="xl"
                      backgroundColor="#7AEF85"
                      color="#257947"
                      _hover={{ backgroundColor: "#65C76E", color: "#184E2E" }}
                      onClick={() => setShowTransferConfirm(true)}
                      isDisabled={!canTransferPendingDues}
                    >
                      Transfer Pending Dues to New Batch
                    </Button>
                  </HStack>
                  {pendingExceedsNewFee && destinationBatchId ? (
                    <Text mt={3} fontSize="sm" color="red.600" fontWeight="500">
                      Previous pending dues (
                      {formatPendingAmount(previousPending)}) exceed the new
                      batch fee ({formatPendingAmount(destinationFeeAmount)}).
                      Transfer is blocked.
                    </Text>
                  ) : null}
                </Alert>
              ) : null}

              {showTransferConfirm && !oldDuesNil && canTransferPendingDues ? (
                <Box
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="xl"
                  p={4}
                  bg="gray.50"
                >
                  <Text fontWeight="semibold" mb={3}>
                    Fee breakdown before confirmation
                  </Text>
                  <TableContainer>
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Description</Th>
                          <Th isNumeric>Amount</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td>Original New Batch Fee</Td>
                          <Td isNumeric>
                            {formatPendingAmount(destinationFeeAmount)}
                          </Td>
                        </Tr>
                        <Tr>
                          <Td>Previous Batch Pending Dues</Td>
                          <Td isNumeric>
                            {formatPendingAmount(previousPending)}
                          </Td>
                        </Tr>
                        <Tr>
                          <Td>Applied Discount</Td>
                          <Td isNumeric>
                            {formatPendingAmount(appliedDiscount)}
                          </Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Final New Batch Payable</Td>
                          <Td isNumeric fontWeight="bold">
                            {formatPendingAmount(finalPayable)}
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                  <Text fontSize="sm" color="gray.600" mt={3}>
                    Previous batch outstanding will be set to Rs. 0 via
                    adjustment labeled{" "}
                    <strong>Pending Dues Transferred to New Batch</strong>. No
                    payment will be recorded.
                  </Text>
                  <FormControl isRequired mt={4}>
                    <FormLabel fontSize={14}>Remarks</FormLabel>
                    <Textarea
                      name="remarks"
                      value={transferRemarks}
                      onChange={(e) => setTransferRemarks(e.target.value)}
                      placeholder="Explain why pending dues are being transferred…"
                      rows={3}
                      borderRadius="xl"
                    />
                  </FormControl>
                </Box>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter flexWrap="wrap" gap={2}>
            <Button
              variant="ghost"
              borderRadius="0.75rem"
              onClick={onClose}
            >
              Close
            </Button>
            <HStack spacing={2} flexWrap="wrap">
              {oldDuesNil ? (
                <Button
                  leftIcon={<Receipt size={16} />}
                  borderRadius="0.75rem"
                  backgroundColor="#FFCB82"
                  color="#85652D"
                  _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                  fontWeight="500"
                  onClick={() => handleTransfer({ assignNewFee: true })}
                  isLoading={transferBatchStatus === "loading"}
                  loadingText="Assigning fee..."
                  isDisabled={!canGoWithNewFee}
                >
                  Go with new fee
                </Button>
              ) : null}
              {showTransferConfirm && canTransferPendingDues ? (
                <Button
                  borderRadius="0.75rem"
                  backgroundColor="#7AEF85"
                  color="#257947"
                  _hover={{ backgroundColor: "#65C76E", color: "#184E2E" }}
                  fontWeight="500"
                  onClick={() =>
                    handleTransfer({
                      assignNewFee: true,
                      transferPendingDues: true,
                    })
                  }
                  isLoading={transferBatchStatus === "loading"}
                  loadingText="Confirming..."
                  isDisabled={!String(transferRemarks || "").trim()}
                >
                  Confirm Transfer & Admission
                </Button>
              ) : (
                <Button
                  borderRadius="0.75rem"
                  backgroundColor="#7AEF85"
                  color="#257947"
                  _hover={{ backgroundColor: "#65C76E", color: "#184E2E" }}
                  fontWeight="500"
                  onClick={() => handleTransfer({ assignNewFee: false })}
                  isLoading={transferBatchStatus === "loading"}
                  loadingText="Transferring..."
                  isDisabled={!destinationBatchId || !oldDuesNil}
                >
                  Confirm Transfer
                </Button>
              )}
            </HStack>
          </ModalFooter>
        </AccessForm>
      </Modal>
    </>
  );
}

export default ShiftBatchModal;
