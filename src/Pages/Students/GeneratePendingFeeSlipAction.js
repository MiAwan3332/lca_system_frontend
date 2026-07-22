import React, { useMemo, useRef, useState } from "react";
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
import {
  FEE_PAYMENT_METHODS,
  requiresPaymentEvidence,
} from "../../utlls/paymentMethods";
import { generatePendingPaymentSlip } from "../../utlls/generatePendingPaymentSlip";
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
 * Opens a payment modal to collect outstanding student fees and print a slip first.
 */
function GeneratePendingFeeSlipAction({ student }) {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const toast = useToast();
  const evidenceInputRef = useRef(null);
  const { updateStatus } = useSelector((state) => state.fees);

  const [isOpen, setIsOpen] = useState(false);
  const [paymentOption, setPaymentOption] = useState("full");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceError, setEvidenceError] = useState("");
  const [hasPrintedSlip, setHasPrintedSlip] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const outstanding = Math.round(
    Math.max(Number(student?.pending_fee) || 0, 0)
  );

  const today = moment().format("YYYY-MM-DD");

  const validationSchema = useMemo(
    () =>
      Yup.object({
        amount: Yup.number().when([], {
          is: () => paymentOption === "partial",
          then: (schema) =>
            schema
              .typeError("Enter a valid amount")
              .required("Required")
              .min(1, "Amount must be greater than 0")
              .max(
                outstanding - 1,
                `Cannot exceed or equal outstanding balance (${outstanding})`
              ),
          otherwise: (schema) => schema.notRequired(),
        }),
        payment_method: Yup.string()
          .oneOf(FEE_PAYMENT_METHODS, "Select a payment method")
          .required("Required"),
        next_installment_date: Yup.string().when([], {
          is: () => paymentOption === "partial",
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
    [paymentOption, outstanding]
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      amount: "",
      payment_method: "Cash",
      next_installment_date: "",
      remarks: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!hasPrintedSlip) {
        toast({
          title: "Print fee slip first",
          description:
            "Please print or preview the fee slip before submitting the payment.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      if (requiresPaymentEvidence(values.payment_method) && !evidenceFile) {
        setEvidenceError("Online payment receipt/slip is required");
        return;
      }

      const payingNow =
        paymentOption === "full"
          ? outstanding
          : Math.round(Number(values.amount) || 0);

      try {
        await dispatch(
          collectPendingFee({
            authToken,
            studentId: student._id,
            amount: payingNow,
            payment_option: paymentOption,
            payment_method: values.payment_method,
            remarks: values.remarks.trim(),
            next_installment_date:
              paymentOption === "partial"
                ? values.next_installment_date
                : undefined,
            payment_evidence: evidenceFile || undefined,
          })
        ).unwrap();

        toast({
          title: "Payment recorded",
          description: `${formatAmount(payingNow)} collected. Student balance updated.`,
          status: "success",
          duration: 4500,
          isClosable: true,
        });

        dispatch(fetchStudents({ authToken }));
        handleClose();
      } catch (error) {
        toast({
          title: "Could not record payment",
          description: error?.message || "Please try again.",
          status: "error",
          duration: 4500,
          isClosable: true,
        });
      }
    },
  });

  const payingNow =
    paymentOption === "full"
      ? outstanding
      : Math.round(Number(formik.values.amount) || 0);
  const remainingAfter = Math.max(outstanding - payingNow, 0);

  const handleClose = () => {
    setIsOpen(false);
    setPaymentOption("full");
    setEvidenceFile(null);
    setEvidenceError("");
    setHasPrintedSlip(false);
    formik.resetForm();
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasPrintedSlip(false);
  };

  const selectPaymentOption = (option) => {
    setPaymentOption(option);
    setHasPrintedSlip(false);
    if (option === "full") {
      formik.setFieldValue("amount", "");
      formik.setFieldValue("next_installment_date", "");
    }
  };

  const handlePrintSlip = async () => {
    const errors = await formik.validateForm();
    const relevantErrors =
      paymentOption === "partial"
        ? errors
        : {
            payment_method: errors.payment_method,
            remarks: errors.remarks,
          };

    if (Object.keys(relevantErrors).filter((k) => relevantErrors[k]).length) {
      formik.setTouched({
        amount: true,
        payment_method: true,
        next_installment_date: true,
        remarks: true,
      });
      toast({
        title: "Complete required fields",
        description: "Fill payment details before printing the fee slip.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (requiresPaymentEvidence(formik.values.payment_method) && !evidenceFile) {
      setEvidenceError("Online payment receipt/slip is required");
      return;
    }

    if (paymentOption === "partial" && payingNow >= outstanding) {
      toast({
        title: "Invalid partial amount",
        description: "Partial payment must be less than the outstanding balance.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (!(payingNow > 0)) {
      toast({
        title: "Enter payment amount",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsPrinting(true);
    try {
      await generatePendingPaymentSlip(
        {
          name: student.name,
          phone: student.phone,
          rollNumber: student.roll_number,
          batchName: student.batch?.name || "N/A",
          outstandingBalance: outstanding,
          payingNow,
          remainingAfter,
          paymentOption,
          paymentMethod: formik.values.payment_method,
          nextInstallmentDate: formik.values.next_installment_date,
        },
        "print"
      );
      setHasPrintedSlip(true);
      toast({
        title: "Fee slip ready",
        description: "You can now submit the payment.",
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

  if (outstanding <= 0) {
    return null;
  }

  return (
    <>
      <Button
        leftIcon={<FileText size={14} />}
        onClick={handleOpen}
      >
        Generate Pending Fee Slip
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("2xl")}
      >
        <ModalOverlay />
        <ModalContent
          {...responsiveModalContentProps}
          as="form"
          onSubmit={formik.handleSubmit}
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

              <FormControl isRequired>
                <FormLabel fontSize={14}>Payment option</FormLabel>
                <HStack spacing={2} flexWrap="wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentOption === "full" ? "solid" : "outline"}
                    colorScheme="yellow"
                    onClick={() => selectPaymentOption("full")}
                  >
                    Pay Full Remaining Balance
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentOption === "partial" ? "solid" : "outline"}
                    colorScheme="orange"
                    onClick={() => selectPaymentOption("partial")}
                  >
                    Pay Partial Amount
                  </Button>
                </HStack>
              </FormControl>

              {paymentOption === "partial" && (
                <>
                  <FormControl isRequired>
                    <FormLabel fontSize={14}>Payment amount</FormLabel>
                    <Input
                      type="number"
                      name="amount"
                      borderRadius="0.5rem"
                      placeholder="Enter amount"
                      value={formik.values.amount}
                      onChange={(e) => {
                        setHasPrintedSlip(false);
                        formik.handleChange(e);
                      }}
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
                      value={formik.values.next_installment_date}
                      onChange={(e) => {
                        setHasPrintedSlip(false);
                        formik.handleChange(e);
                      }}
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
                  Paying now: <strong>{formatAmount(payingNow)}</strong>
                </Text>
                <Text fontSize="sm">
                  Remaining after payment:{" "}
                  <strong>{formatAmount(remainingAfter)}</strong>
                </Text>
              </Box>

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
                        setHasPrintedSlip(false);
                        formik.setFieldValue("payment_method", method);
                        if (!requiresPaymentEvidence(method)) {
                          setEvidenceFile(null);
                          setEvidenceError("");
                        }
                      }}
                    >
                      {method}
                    </Button>
                  ))}
                </HStack>
                {formik.touched.payment_method &&
                formik.errors.payment_method ? (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {formik.errors.payment_method}
                  </Text>
                ) : null}
              </FormControl>

              {requiresPaymentEvidence(formik.values.payment_method) && (
                <FormControl isRequired>
                  <FormLabel fontSize={14}>
                    Online payment receipt / slip
                  </FormLabel>
                  <Input
                    ref={evidenceInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    display="none"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setEvidenceFile(file);
                      setEvidenceError(file ? "" : "Online payment receipt/slip is required");
                      setHasPrintedSlip(false);
                      e.target.value = "";
                    }}
                  />
                  <HStack>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => evidenceInputRef.current?.click()}
                    >
                      {evidenceFile ? "Change attachment" : "Upload attachment"}
                    </Button>
                    {evidenceFile ? (
                      <Text fontSize="sm" color="gray.600" noOfLines={1}>
                        {evidenceFile.name}
                      </Text>
                    ) : null}
                  </HStack>
                  {evidenceError ? (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {evidenceError}
                    </Text>
                  ) : null}
                </FormControl>
              )}

              <FormControl isRequired>
                <FormLabel fontSize={14}>Remarks</FormLabel>
                <Textarea
                  name="remarks"
                  borderRadius="0.5rem"
                  placeholder="Required for all payment types"
                  value={formik.values.remarks}
                  onChange={(e) => {
                    setHasPrintedSlip(false);
                    formik.handleChange(e);
                  }}
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
                borderColor={hasPrintedSlip ? "green.300" : "gray.300"}
                bg={hasPrintedSlip ? "green.50" : "white"}
              >
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Print or preview the fee slip before submitting. Submit stays
                  disabled until the slip is printed.
                </Text>
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<Printer size={16} />}
                  colorScheme="yellow"
                  onClick={handlePrintSlip}
                  isLoading={isPrinting}
                  loadingText="Preparing"
                >
                  Print Fee Slip
                </Button>
                {hasPrintedSlip ? (
                  <Text fontSize="sm" color="green.700" mt={2}>
                    Slip printed / previewed — ready to submit.
                  </Text>
                ) : null}
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter flexShrink={0} gap={2}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              backgroundColor="#82B4FF"
              color="#2D4185"
              _hover={{ backgroundColor: "#74A0E3", color: "#223163" }}
              isLoading={updateStatus === "loading"}
              loadingText="Submitting"
              isDisabled={!hasPrintedSlip}
            >
              Submit Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default GeneratePendingFeeSlipAction;
