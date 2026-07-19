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
  FormControl,
  FormLabel,
  Text,
  Box,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  VStack,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { ArrowRightLeft, FileText } from "lucide-react";
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

const formatPendingAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

function ShiftBatchModal({ student }) {
  const [isOpen, setIsOpen] = useState(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const [destinationBatchId, setDestinationBatchId] = useState("");
  const [pendingBlock, setPendingBlock] = useState(null);
  const toast = useToast();
  const dispatch = useDispatch();

  const batches = useSelector(selectActiveBatches);
  const { transferBatchStatus, pendingFeeSlipStatus } = useSelector(
    (state) => state.students
  );

  const currentBatchId = student?.batch?._id || student?.batch || "";
  const currentBatchName = student?.batch?.name || "No Batch";

  const destinationBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          batch.is_active !== false &&
          String(batch._id) !== String(currentBatchId)
      ),
    [batches, currentBatchId]
  );

  const onOpen = () => setIsOpen(true);
  const onClose = () => {
    setIsOpen(false);
    setDestinationBatchId("");
    setPendingBlock(null);
  };

  useEffect(() => {
    if (isOpen) {
      dispatch(
        fetchBatches({
          authToken,
          queryParams: {
            limit: 200,
            page: 1,
            query: "",
            is_active: "true",
          },
        })
      );
    }
  }, [dispatch, authToken, isOpen]);

  const handleTransfer = async () => {
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

    setPendingBlock(null);

    try {
      await dispatch(
        transferStudentBatch({
          authToken,
          studentId: student._id,
          batch: destinationBatchId,
        })
      ).unwrap();
      dispatch(fetchStudents({ authToken }));
      onClose();
    } catch (error) {
      if (error?.code === "PENDING_FEE_BLOCK") {
        setPendingBlock(error);
        return;
      }
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
        email: student.email,
        phone: student.phone,
        rollNumber: student.roll_number,
        batchName: currentBatchName,
        totalFee: student.total_fee,
        paidFee: student.paid_fee,
        pendingAmount,
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

  return (
    <>
      <button
        type="button"
        className="hover:bg-[#7AEF85] hover:text-[#257947] font-medium p-[10px] rounded-xl transition-colors duration-300"
        onClick={onOpen}
        title="Shift Batch"
      >
        <ArrowRightLeft size={18} />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("4xl")}
      >
        <ModalOverlay />
        <ModalContent
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
              </Box>

              <FormControl isRequired>
                <FormLabel fontSize={14}>Destination batch</FormLabel>
                <SearchableBatchSelect
                  batches={destinationBatches}
                  value={destinationBatchId}
                  onChange={(batchId) => {
                    setDestinationBatchId(batchId);
                    setPendingBlock(null);
                  }}
                  placeholder="Select active destination batch"
                  width="100%"
                  activeOnly
                  showClearOption={false}
                />
              </FormControl>

              {pendingBlock ? (
                <Alert
                  status="warning"
                  borderRadius="xl"
                  alignItems="flex-start"
                  flexDirection="column"
                >
                  <Box display="flex" alignItems="flex-start" w="100%">
                    <AlertIcon mt={1} />
                    <AlertDescription fontSize="sm">
                      {pendingBlock.message}
                      <Text mt={2} fontWeight="bold">
                        Pending Amount:{" "}
                        {formatPendingAmount(pendingBlock.pending_amount)}
                      </Text>
                    </AlertDescription>
                  </Box>
                  <Button
                    mt={3}
                    leftIcon={<FileText size={16} />}
                    borderRadius="xl"
                    backgroundColor="#FFCB82"
                    color="#85652D"
                    _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                    onClick={handleGeneratePendingFeeSlip}
                    isLoading={pendingFeeSlipStatus === "loading"}
                    loadingText={
                      pendingBlock.has_pending_fee_slip
                        ? "Opening..."
                        : "Generating..."
                    }
                  >
                    {pendingBlock.has_pending_fee_slip
                      ? "Open Pending Fee Slip"
                      : "Generate Pending Fee Slip"}
                  </Button>
                </Alert>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="0.75rem"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              borderRadius="0.75rem"
              backgroundColor="#7AEF85"
              color="#257947"
              _hover={{ backgroundColor: "#65C76E", color: "#184E2E" }}
              fontWeight="500"
              onClick={handleTransfer}
              isLoading={transferBatchStatus === "loading"}
              loadingText="Transferring..."
              isDisabled={!destinationBatchId}
            >
              Confirm Transfer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ShiftBatchModal;
