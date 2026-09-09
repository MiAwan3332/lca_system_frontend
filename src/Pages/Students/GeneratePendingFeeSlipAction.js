import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
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
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { FileText, Printer } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { collectPendingFee } from "../../Features/feeSlice";
import { fetchStudents } from "../../Features/studentSlice";
import { selectUser } from "../../Features/authSlice";
import ActionButton from "../../Components/ActionButton";
import PaymentEvidenceUploader from "../../Components/PaymentEvidenceUploader";
import {
  FEE_PAYMENT_METHODS,
  requiresPaymentEvidence,
} from "../../utlls/paymentMethods";
import { generatePendingPaymentSlip } from "../../utlls/generatePendingPaymentSlip";
import { saveLastFeeSlipPayload } from "../../utlls/feeSlipStorage";
import { issueSlipVerificationQr } from "../../utlls/slipVerification";
import { formatClassTimeRange } from "../../utlls/classTime";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const formatAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const parseRupees = (value) => {
  if (value === "" || value == null) return 0;
  const numeric = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric);
};

/**
 * Collect outstanding student fees, then allow printing the fee slip.
 * Can be opened from the row action menu or controlled by a parent wizard.
 */
function GeneratePendingFeeSlipAction({
  student,
  showTrigger = true,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpen: controlledOnOpen,
}) {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const toast = useToast();
  const { updateStatus } = useSelector((state) => state.fees);
  const currentUser = useSelector(selectUser);

  const isControlled = controlledIsOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? controlledIsOpen : internalOpen;

  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidenceError, setEvidenceError] = useState("");
  const [hasPaid, setHasPaid] = useState(false);
  const [paidSlipPayload, setPaidSlipPayload] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const outstanding = Math.round(
    Math.max(Number(student?.pending_fee) || 0, 0)
  );

  const today = moment().format("YYYY-MM-DD");

  const validationSchema = useMemo(
    () =>
      Yup.object({
        discount_amount: Yup.number()
          .transform((value, originalValue) =>
            originalValue === "" ||
            originalValue === null ||
            originalValue === undefined
              ? 0
              : value
          )
          .min(0, "Discount cannot be negative")
          .max(outstanding, `Discount cannot exceed ${outstanding}`)
          .nullable(),
        discount_description: Yup.string().trim(),
        amount: Yup.mixed().when("payment_option", {
          is: "partial",
          then: (schema) =>
            schema.test(
              "partial-amount",
              "Enter a valid amount",
              (value) => parseRupees(value) > 0
            ),
          otherwise: (schema) => schema.notRequired(),
        }),
        payment_option: Yup.string().oneOf(["full", "partial"]).required(),
        payment_method: Yup.string().oneOf(FEE_PAYMENT_METHODS).required("Required"),
        next_installment_date: Yup.string()
          .transform((value) => (value === "" ? undefined : value))
          .when("payment_option", {
            is: "partial",
            then: (schema) =>
              schema
                .required("Next installment due date is required")
                .test(
                  "not-past",
                  "Date must be today or in the future",
                  (value) => !value || !moment(value).isBefore(moment(), "day")
                ),
            otherwise: (schema) => schema.notRequired(),
          }),
        remarks: Yup.string().trim().required("Remarks are required"),
      }),
    [outstanding]
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      amount: "",
      discount_amount: "",
      discount_description: "",
      payment_method: "Cash",
      payment_option: "full",
      next_installment_date: "",
      remarks: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (hasPaid) {
        setSubmitting(false);
        return;
      }

      const option =
        values.payment_option === "partial" ? "partial" : "full";
      const discount = parseRupees(values.discount_amount);
      const payable = Math.max(outstanding - discount, 0);
      const payingNow =
        option === "full" ? payable : parseRupees(values.amount);

      if (discount > 0 && !String(values.discount_description || "").trim() && !String(values.remarks || "").trim()) {
        toast({
          title: "Discount description required",
          status: "warning",
          duration: 3500,
          isClosable: true,
        });
        setSubmitting(false);
        return;
      }

      if (!(payingNow > 0) && !(discount > 0)) {
        toast({
          title: "Invalid payment amount",
          description: "Enter a payment amount or discount.",
          status: "warning",
          duration: 3500,
          isClosable: true,
        });
        setSubmitting(false);
        return;
      }

      if (option === "partial" && payingNow > payable) {
        toast({
          title: "Amount too high",
          description: `Cannot exceed payable balance (${formatAmount(payable)}).`,
          status: "warning",
          duration: 3500,
          isClosable: true,
        });
        setSubmitting(false);
        return;
      }

      if (option === "partial" && payingNow >= payable && payable > 0) {
        toast({
          title: "Invalid partial amount",
          description: "Use Pay Full Remaining Balance when paying the entire remaining balance.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        setSubmitting(false);
        return;
      }

      if (
        payingNow > 0 &&
        requiresPaymentEvidence(values.payment_method) &&
        evidenceFiles.length === 0
      ) {
        setEvidenceError("Online payment receipt/slip is required");
        setSubmitting(false);
        return;
      }

      try {
        await dispatch(
          collectPendingFee({
            authToken,
            studentId: student._id,
            amount: payingNow,
            payment_option: option,
            payment_method: payingNow > 0 ? values.payment_method : undefined,
            remarks: values.remarks.trim(),
            next_installment_date:
              option === "partial" ? values.next_installment_date : undefined,
            payment_evidence: evidenceFiles,
            discount_amount: discount,
            discount_description:
              String(values.discount_description || "").trim() ||
              values.remarks.trim(),
          })
        ).unwrap();

        const slipPayload = {
          name: student.name,
          phone: student.phone,
          cnic: student.cnic || "",
          rollNumber: student.roll_number,
          batchName: student.batch?.name || "N/A",
          batchFee: Number(student.batch?.batch_fee) || 0,
          totalFee:
            Number(student.total_fee) || Number(student.batch?.batch_fee) || 0,
          paidFee: Number(student.paid_fee) || 0,
          outstandingBalance: outstanding,
          payingNow,
          remainingAfter: Math.max(
            Math.max(outstanding - discount, 0) - payingNow,
            0
          ),
          discountAmount: discount,
          paymentOption: option,
          paymentMethod: values.payment_method,
          nextInstallmentDate: values.next_installment_date,
          photoUrl: student.image || "",
          authorizedBy: currentUser?.name || "",
          classStartTime: student.batch?.class_start_time || "",
          classEndTime: student.batch?.class_end_time || "",
        };
        setPaidSlipPayload(slipPayload);
        setHasPaid(true);
        saveLastFeeSlipPayload(student._id, slipPayload);

        toast({
          title: "Payment recorded",
          description:
            discount > 0
              ? `${formatAmount(payingNow)} collected, ${formatAmount(discount)} discount applied. You can print the slip now.`
              : `${formatAmount(payingNow)} collected. You can print the slip now.`,
          status: "success",
          duration: 4500,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: "Could not record payment",
          description: error?.message || "Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setHasPaid(false);
    setPaidSlipPayload(null);
    setEvidenceFiles([]);
    setEvidenceError("");
    formik.resetForm();
  }, [isOpen, student?._id]);

  const paymentOption =
    formik.values.payment_option === "partial" ? "partial" : "full";
  const discount = parseRupees(formik.values.discount_amount);
  const payable = Math.max(outstanding - discount, 0);
  const payingNow =
    paymentOption === "full"
      ? payable
      : parseRupees(formik.values.amount);
  const remainingAfter = Math.max(payable - payingNow, 0);

  const handleClose = () => {
    if (hasPaid) {
      dispatch(fetchStudents({ authToken }));
    }
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalOpen(false);
    }
    setEvidenceFiles([]);
    setEvidenceError("");
    setHasPaid(false);
    setPaidSlipPayload(null);
    formik.resetForm();
  };

  const handleOpen = () => {
    if (isControlled) {
      controlledOnOpen?.();
    } else {
      setInternalOpen(true);
    }
    setHasPaid(false);
    setPaidSlipPayload(null);
  };

  const selectPaymentOption = (option) => {
    if (hasPaid) return;
    formik.setFieldValue("payment_option", option);
    if (option === "full") {
      formik.setFieldValue("amount", "");
      formik.setFieldValue("next_installment_date", "");
    }
  };

  const handlePrintSlip = async ({ duplicate = false } = {}) => {
    if (!hasPaid || !paidSlipPayload) {
      toast({
        title: "Record payment first",
        description: "Submit the payment, then print the fee slip.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsPrinting(true);
    try {
      const payload = { ...paidSlipPayload, isDuplicate: duplicate };
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
      toast({
        title: duplicate ? "Duplicate slip ready" : "Fee slip ready",
        description: duplicate
          ? "Duplicate slip opened for printing."
          : "Fee slip opened for printing.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not print fee slip",
        description: error?.message || "Please allow pop-ups and try again.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSubmitClick = async () => {
    const errors = await formik.validateForm();
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      formik.setTouched({
        amount: true,
        discount_amount: true,
        discount_description: true,
        payment_method: true,
        next_installment_date: true,
        remarks: true,
      });
      const firstError = Object.values(errors).find(Boolean);
      toast({
        title: "Complete required fields",
        description: String(firstError),
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    formik.handleSubmit();
  };

  if (!student || (outstanding <= 0 && !hasPaid)) {
    if (showTrigger) return null;
    return null;
  }

  return (
    <>
      {showTrigger ? (
        <ActionButton
          variant="amber"
          icon={<FileText size={16} />}
          label="Generate Pending Fee Slip"
          onClick={handleOpen}
        />
      ) : null}

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
          maxH={{ base: "100dvh", sm: "92vh" }}
        >
          <ModalHeader className="text-xl font-semibold" flexShrink={0}>
            Generate Pending Fee Slip
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody flex="1" overflowY="auto" py={4}>
            <VStack spacing={4} align="stretch">
              <Box
                p={4}
                borderRadius="xl"
                border="1px solid"
                borderColor="#E0E8EC"
                bg="gray.50"
              >
                <Text fontSize="sm" color="gray.600">
                  {student?.name}
                  {student?.roll_number ? ` · ${student.roll_number}` : ""}
                  {student?.batch?.name ? ` · ${student.batch.name}` : ""}
                </Text>
                <Text mt={2} fontSize="sm" color="gray.500">
                  Outstanding balance
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="#85652D">
                  {formatAmount(outstanding)}
                </Text>
                <HStack mt={3} spacing={4} fontSize="sm" color="gray.600">
                  <Text>Total: {formatAmount(student?.total_fee)}</Text>
                  <Text>Paid: {formatAmount(student?.paid_fee)}</Text>
                </HStack>
              </Box>

              <FormControl>
                <FormLabel fontSize={14}>Discount amount (optional)</FormLabel>
                <Input
                  type="number"
                  name="discount_amount"
                  borderRadius="0.5rem"
                  placeholder="0"
                  isDisabled={hasPaid}
                  value={formik.values.discount_amount}
                  onChange={formik.handleChange}
                />
                {formik.touched.discount_amount && formik.errors.discount_amount ? (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {formik.errors.discount_amount}
                  </Text>
                ) : null}
              </FormControl>

              {discount > 0 ? (
                <FormControl>
                  <FormLabel fontSize={14}>Discount description</FormLabel>
                  <Input
                    name="discount_description"
                    borderRadius="0.5rem"
                    placeholder="Reason for discount"
                    isDisabled={hasPaid}
                    value={formik.values.discount_description}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              ) : null}

              {discount > 0 ? (
                <Box
                  p={3}
                  borderRadius="lg"
                  bg="purple.50"
                  border="1px solid"
                  borderColor="purple.100"
                >
                  <Text fontSize="sm">
                    Payable after discount:{" "}
                    <strong>{formatAmount(payable)}</strong>
                  </Text>
                </Box>
              ) : null}

              <FormControl isRequired>
                <FormLabel fontSize={14}>Payment option</FormLabel>
                <HStack spacing={2} flexWrap="wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentOption === "full" ? "solid" : "outline"}
                    colorScheme="yellow"
                    onClick={() => selectPaymentOption("full")}
                    isDisabled={hasPaid}
                  >
                    Pay Full Remaining Balance
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentOption === "partial" ? "solid" : "outline"}
                    colorScheme="orange"
                    onClick={() => selectPaymentOption("partial")}
                    isDisabled={hasPaid || payable <= 0}
                  >
                    Pay Partial Amount
                  </Button>
                </HStack>
              </FormControl>

              {paymentOption === "partial" && payable > 0 && (
                <>
                  <FormControl isRequired>
                    <FormLabel fontSize={14}>Payment amount</FormLabel>
                    <Input
                      type="number"
                      name="amount"
                      borderRadius="0.5rem"
                      placeholder="Enter amount"
                      isDisabled={hasPaid}
                      value={formik.values.amount}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.amount && formik.errors.amount ? (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {formik.errors.amount}
                      </Text>
                    ) : null}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize={14}>Next installment due date</FormLabel>
                    <Input
                      type="date"
                      name="next_installment_date"
                      borderRadius="0.5rem"
                      min={today}
                      isDisabled={hasPaid}
                      value={formik.values.next_installment_date}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.next_installment_date &&
                    formik.errors.next_installment_date ? (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {formik.errors.next_installment_date}
                      </Text>
                    ) : null}
                  </FormControl>
                </>
              )}

              <Box
                p={3}
                borderRadius="lg"
                bg={remainingAfter > 0 ? "orange.50" : "green.50"}
                border="1px solid"
                borderColor={remainingAfter > 0 ? "orange.100" : "green.100"}
              >
                <Text fontSize="sm">
                  Discount: <strong>{formatAmount(discount)}</strong>
                </Text>
                <Text fontSize="sm">
                  Paying now: <strong>{formatAmount(payingNow)}</strong>
                </Text>
                <Text fontSize="sm">
                  Remaining after payment:{" "}
                  <strong>{formatAmount(remainingAfter)}</strong>
                </Text>
              </Box>

              {payingNow > 0 ? (
                <FormControl isRequired>
                  <FormLabel fontSize={14}>Payment method</FormLabel>
                  <HStack spacing={2} flexWrap="wrap">
                    {FEE_PAYMENT_METHODS.map((method) => (
                      <Button
                        key={method}
                        type="button"
                        size="sm"
                        variant={
                          formik.values.payment_method === method
                            ? "solid"
                            : "outline"
                        }
                        colorScheme={
                          method === "Online Payment" ? "blue" : "yellow"
                        }
                        onClick={() => {
                          if (hasPaid) return;
                          formik.setFieldValue("payment_method", method);
                          if (!requiresPaymentEvidence(method)) {
                            setEvidenceFiles([]);
                            setEvidenceError("");
                          }
                        }}
                        isDisabled={hasPaid}
                      >
                        {method}
                      </Button>
                    ))}
                  </HStack>
                </FormControl>
              ) : null}

              {payingNow > 0 &&
                requiresPaymentEvidence(formik.values.payment_method) && (
                <FormControl>
                  <PaymentEvidenceUploader
                    files={evidenceFiles}
                    onChange={(next) => {
                      if (hasPaid) return;
                      setEvidenceFiles(next);
                      setEvidenceError(
                        next.length
                          ? ""
                          : "Online payment receipt/slip is required"
                      );
                    }}
                    error={evidenceError}
                    label="Online payment receipt / slip"
                  />
                </FormControl>
              )}

              <FormControl isRequired>
                <FormLabel fontSize={14}>Remarks</FormLabel>
                <Textarea
                  name="remarks"
                  borderRadius="0.5rem"
                  placeholder="Required for all payment types"
                  isDisabled={hasPaid}
                  value={formik.values.remarks}
                  onChange={formik.handleChange}
                />
                {formik.touched.remarks && formik.errors.remarks ? (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {formik.errors.remarks}
                  </Text>
                ) : null}
              </FormControl>

              <Box
                p={3}
                borderRadius="lg"
                border="1px dashed"
                borderColor={hasPaid ? "green.300" : "gray.300"}
                bg={hasPaid ? "green.50" : "white"}
              >
                <Text fontSize="sm" color="gray.600" mb={2}>
                  {hasPaid
                    ? "Payment recorded. Print the fee slip now. Use Print Duplicate if the printer failed."
                    : "Submit the payment first. Printing is enabled after the payment is recorded."}
                </Text>
                <HStack spacing={2} flexWrap="wrap">
                  <Button
                    type="button"
                    size="sm"
                    leftIcon={<Printer size={16} />}
                    colorScheme="yellow"
                    onClick={() => handlePrintSlip({ duplicate: false })}
                    isLoading={isPrinting}
                    loadingText="Preparing"
                    isDisabled={!hasPaid}
                  >
                    Print Fee Slip
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Printer size={16} />}
                    onClick={() => handlePrintSlip({ duplicate: true })}
                    isLoading={isPrinting}
                    isDisabled={!hasPaid}
                  >
                    Print Duplicate
                  </Button>
                </HStack>
                {hasPaid ? (
                  <Text fontSize="sm" color="green.700" mt={2}>
                    Payment submitted — you can print the slip.
                  </Text>
                ) : null}
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter flexShrink={0} gap={2}>
            <Button variant="ghost" onClick={handleClose}>
              {hasPaid ? "Close" : "Cancel"}
            </Button>
            <Button
              type="button"
              backgroundColor="#82B4FF"
              color="#2D4185"
              _hover={{ backgroundColor: "#74A0E3", color: "#223163" }}
              isLoading={updateStatus === "loading" || formik.isSubmitting}
              loadingText="Submitting"
              isDisabled={hasPaid}
              onClick={handleSubmitClick}
            >
              {hasPaid ? "Payment Recorded" : "Submit Payment"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default GeneratePendingFeeSlipAction;
