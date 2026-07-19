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
  Input,
  Box,
  Text,
  Textarea,
  Grid,
  GridItem,
  HStack,
  Badge,
  Flex,
  Checkbox,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { Printer } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { selectActiveBatches, fetchBatches } from "../../Features/batchSlice";
import { useDispatch } from "react-redux";
import { addStudent, fetchStudents } from "../../Features/studentSlice";
import CameraCapture from "../../Components/CameraCapture";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";
import { generateAdmissionFeeSlip } from "../../utlls/generateAdmissionFeeSlip";

const ADMISSION_PAYMENT_METHODS = ["Cash", "Online"];

const SPECIAL_OPTION_FIELDS = [
  {
    key: "test_session",
    selectedField: "special_test_session",
    label: "Test Session",
  },
  {
    key: "optional_revision",
    selectedField: "special_optional_revision",
    label: "Optional Revision",
  },
  {
    key: "compulsory_revision",
    selectedField: "special_compulsory_revision",
    label: "Compulsory Revision",
  },
];

const EMPTY_SPECIAL_VALUES = {
  special_test_session: false,
  special_optional_revision: false,
  special_compulsory_revision: false,
};

const getBatchOptionFee = (batch, key) =>
  Number(batch?.special_fee_options?.[key]) || 0;

const getSpecialTotalFromBatch = (batch, values) => {
  if (!batch || batch.is_special_batch !== true) return 0;
  let total = 0;
  if (values.special_test_session) {
    total += getBatchOptionFee(batch, "test_session");
  }
  if (values.special_optional_revision) {
    total += getBatchOptionFee(batch, "optional_revision");
  }
  if (values.special_compulsory_revision) {
    total += getBatchOptionFee(batch, "compulsory_revision");
  }
  return total;
};

function AddStudnet({ isOpen, onClose }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [photoFile, setPhotoFile] = useState(null);
  const [paymentEvidenceFile, setPaymentEvidenceFile] = useState(null);
  const [paymentEvidenceError, setPaymentEvidenceError] = useState("");
  const [paymentOption, setPaymentOption] = useState("later");
  const [isPrintingSlip, setIsPrintingSlip] = useState(false);
  const toast = useToast();

  const { addStatus } = useSelector((state) => state.students);
  const batches = useSelector(selectActiveBatches);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen) {
      dispatch(
        fetchBatches({ authToken, queryParams: { limit: 200, page: 1, query: "" } })
      );
    }
  }, [dispatch, authToken, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPhotoFile(null);
      setPaymentEvidenceFile(null);
      setPaymentEvidenceError("");
      setPaymentOption("later");
    }
  }, [isOpen]);

  const validationSchema = useMemo(
    () =>
      Yup.object({
        name: Yup.string().required("Required"),
        email: Yup.string().email("Invalid email address").required("Required"),
        phone: Yup.string().required("Required"),
        batch: Yup.string().required("Please select a batch"),
        special_test_session: Yup.boolean(),
        special_optional_revision: Yup.boolean(),
        special_compulsory_revision: Yup.boolean(),
        paying_now: Yup.number()
          .transform((value, originalValue) =>
            originalValue === "" || originalValue === null ? 0 : value
          )
          .typeError("Must be a number")
          .test("max-batch-fee", "Cannot be greater than batch fee", function (value) {
            if (paymentOption !== "partial") return true;
            const batchId = this.parent.batch;
            if (!batchId) return true;
            const selected = batches.find((item) => item._id === batchId);
            const isSpecial = selected?.is_special_batch === true;
            const gross = isSpecial
              ? getSpecialTotalFromBatch(selected, this.parent)
              : Number(selected?.batch_fee) || 0;
            const discount = Math.min(
              Math.max(0, Number(this.parent.discount_amount) || 0),
              gross
            );
            const fee = Math.max(gross - discount, 0);
            const amount = Number(value || 0);
            if (fee > 0 && amount >= fee) return true;
            if (amount < 1) {
              return this.createError({ message: "Enter amount greater than 0" });
            }
            return amount <= fee;
          }),
        discount_amount: Yup.number()
          .transform((value, originalValue) =>
            originalValue === "" || originalValue === null ? 0 : value
          )
          .typeError("Must be a number")
          .min(0, "Discount cannot be negative")
          .test(
            "max-discount",
            "Discount cannot exceed total fee",
            function (value) {
              const batchId = this.parent.batch;
              if (!batchId) return true;
              const selected = batches.find((item) => item._id === batchId);
              const isSpecial = selected?.is_special_batch === true;
              const gross = isSpecial
                ? getSpecialTotalFromBatch(selected, this.parent)
                : Number(selected?.batch_fee) || 0;
              return Number(value || 0) <= gross;
            }
          ),
        discount_description: Yup.string(),
        payment_method: Yup.string().when([], {
          is: () => paymentOption === "partial" || paymentOption === "full",
          then: (schema) =>
            schema
              .oneOf(ADMISSION_PAYMENT_METHODS, "Select Cash or Online")
              .required("Payment method is required"),
          otherwise: (schema) => schema.notRequired(),
        }),
        next_installment_date: Yup.string().when([], {
          is: () => paymentOption === "partial",
          then: (schema) =>
            schema.required("Next installment date is required for partial payment"),
          otherwise: (schema) => schema.notRequired(),
        }),
        remarks: Yup.string(),
      }).test(
        "special-options-required",
        "Select at least one special batch option",
        function (values) {
          const selected = batches.find((item) => item._id === values?.batch);
          if (selected?.is_special_batch !== true) return true;
          const hasOption =
            values.special_test_session ||
            values.special_optional_revision ||
            values.special_compulsory_revision;
          if (hasOption) return true;
          return this.createError({
            path: "special_test_session",
            message: "Select at least one special batch option",
          });
        }
      ),
    [paymentOption, batches]
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: "",
      email: "",
      phone: "",
      batch: "",
      paying_now: "",
      payment_method: "Cash",
      next_installment_date: "",
      discount_amount: "",
      discount_description: "",
      remarks: "",
      ...EMPTY_SPECIAL_VALUES,
    },
    validationSchema,
    onSubmit: async (values) => {
      const selected = batches.find((item) => item._id === values.batch);
      const isSpecial = selected?.is_special_batch === true;
      const grossFee = isSpecial
        ? getSpecialTotalFromBatch(selected, values)
        : Number(selected?.batch_fee) || 0;
      const discountAmount = Math.min(
        Math.max(0, Number(values.discount_amount) || 0),
        grossFee
      );
      const fee = Math.max(grossFee - discountAmount, 0);

      const enteredAmount =
        paymentOption === "partial" ? Number(values.paying_now) || 0 : 0;
      const amountToPay =
        paymentOption === "full" || (fee > 0 && enteredAmount >= fee)
          ? fee
          : paymentOption === "partial"
            ? enteredAmount
            : 0;

      if (discountAmount > grossFee) {
        formik.setFieldError(
          "discount_amount",
          "Discount cannot exceed total fee"
        );
        formik.setFieldTouched("discount_amount", true, false);
        toast({
          title: "Invalid discount",
          description: `Discount cannot be greater than total fee (${grossFee} Rs.).`,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      if (amountToPay > fee) {
        formik.setFieldError("paying_now", "Cannot be greater than payable fee");
        formik.setFieldTouched("paying_now", true, false);
        toast({
          title: "Invalid payment amount",
          description: `Paying amount cannot be greater than payable fee (${fee} Rs.).`,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const isPartialPayment =
        amountToPay > 0 && fee > 0 && amountToPay < fee;

      if (isPartialPayment && !values.next_installment_date) {
        formik.setFieldError(
          "next_installment_date",
          "Next installment date is required for partial payment"
        );
        formik.setFieldTouched("next_installment_date", true, false);
        toast({
          title: "Installment date required",
          description: "Select when the next fee installment is due.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      if (amountToPay > 0 && values.payment_method === "Online" && !paymentEvidenceFile) {
        setPaymentEvidenceError("Please attach online payment evidence");
        toast({
          title: "Payment evidence required",
          description: "Upload a screenshot or receipt for online payment.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("batch", values.batch);
      formData.append("paying_now", String(amountToPay));
      if (discountAmount > 0) {
        formData.append("discount_amount", String(discountAmount));
        formData.append(
          "discount_description",
          values.discount_description?.trim() ||
            "Discount applied on student admission"
        );
      }
      if (amountToPay > 0) {
        formData.append("payment_method", values.payment_method);
        if (values.payment_method === "Online" && paymentEvidenceFile) {
          formData.append("payment_evidence", paymentEvidenceFile);
        }
      }
      if (isPartialPayment) {
        formData.append("next_installment_date", values.next_installment_date);
      }
      formData.append("remarks", values.remarks || "");
      if (photoFile) {
        formData.append("image", photoFile);
      }

      if (isSpecial) {
        formData.append(
          "special_test_session",
          String(values.special_test_session === true)
        );
        formData.append(
          "special_optional_revision",
          String(values.special_optional_revision === true)
        );
        formData.append(
          "special_compulsory_revision",
          String(values.special_compulsory_revision === true)
        );
      }

      try {
        await dispatch(addStudent({ authToken, formData })).unwrap();
        dispatch(fetchStudents({ authToken }));
        formik.resetForm();
        setPhotoFile(null);
        setPaymentEvidenceFile(null);
        setPaymentEvidenceError("");
        setPaymentOption("later");
        onClose();
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "Failed to add student";
        if (/email/i.test(message)) {
          formik.setFieldError("email", message);
          formik.setFieldTouched("email", true, false);
        } else if (/installment date/i.test(message)) {
          formik.setFieldError("next_installment_date", message);
          formik.setFieldTouched("next_installment_date", true, false);
        } else if (/special batch option/i.test(message)) {
          formik.setFieldError("special_test_session", message);
          formik.setFieldTouched("special_test_session", true, false);
        } else if (/batch fee|payment amount|paying now|payment evidence|valid fee/i.test(message)) {
          if (/evidence/i.test(message)) {
            setPaymentEvidenceError(message);
          }
          formik.setFieldError("paying_now", message);
          formik.setFieldTouched("paying_now", true, false);
        }
      }
    },
  });

  const selectedBatch = useMemo(
    () => batches.find((item) => item._id === formik.values.batch),
    [batches, formik.values.batch]
  );

  const isSpecialBatch = selectedBatch?.is_special_batch === true;
  const batchFee = Number(selectedBatch?.batch_fee) || 0;

  const specialTotalFee = useMemo(() => {
    if (!isSpecialBatch) return 0;
    return getSpecialTotalFromBatch(selectedBatch, formik.values);
  }, [
    isSpecialBatch,
    selectedBatch,
    formik.values.special_test_session,
    formik.values.special_optional_revision,
    formik.values.special_compulsory_revision,
  ]);

  const admissionFee = isSpecialBatch ? specialTotalFee : batchFee;
  const discountAmount = Math.min(
    Math.max(0, Number(formik.values.discount_amount) || 0),
    admissionFee
  );
  const payableFee = Math.max(admissionFee - discountAmount, 0);
  const enteredPayAmount = Number(formik.values.paying_now) || 0;
  const isFullPayment =
    payableFee > 0 &&
    (paymentOption === "full" ||
      (paymentOption === "partial" && enteredPayAmount >= payableFee));
  const payingNow =
    paymentOption === "later"
      ? 0
      : isFullPayment
        ? payableFee
        : paymentOption === "partial"
          ? enteredPayAmount
          : 0;
  const resolvedPaymentOption = isFullPayment
    ? "full"
    : payingNow > 0
      ? "partial"
      : paymentOption;
  const remainingFee = Math.max(payableFee - payingNow, 0);
  const paymentStatus =
    payableFee <= 0
      ? admissionFee > 0 && discountAmount >= admissionFee
        ? "Fully discounted"
        : "No fee"
      : payingNow <= 0
        ? "Unpaid"
        : payingNow >= payableFee
          ? "Fully paid"
          : "Partially paid";

  const paymentMethodLabel =
    payingNow > 0 ? formik.values.payment_method || "Cash" : "N/A";
  const todayDate = new Date().toISOString().split("T")[0];

  const showFeePanel =
    formik.values.batch &&
    (isSpecialBatch ? specialTotalFee > 0 : batchFee > 0);

  const handlePaymentOptionChange = (option) => {
    setPaymentOption(option);
    if (option === "later") {
      formik.setFieldValue("paying_now", "");
      formik.setFieldValue("next_installment_date", "");
      setPaymentEvidenceFile(null);
      setPaymentEvidenceError("");
    } else if (option === "full") {
      formik.setFieldValue("paying_now", String(payableFee));
      formik.setFieldValue("next_installment_date", "");
      if (!formik.values.payment_method) {
        formik.setFieldValue("payment_method", "Cash");
      }
    } else {
      formik.setFieldValue("paying_now", "");
      if (!formik.values.payment_method) {
        formik.setFieldValue("payment_method", "Cash");
      }
    }
  };

  const handleBatchChange = (batchId) => {
    formik.setFieldValue("batch", batchId);
    formik.setFieldValue("paying_now", "");
    formik.setFieldValue("next_installment_date", "");
    formik.setFieldValue("discount_amount", "");
    formik.setFieldValue("discount_description", "");
    Object.entries(EMPTY_SPECIAL_VALUES).forEach(([field, value]) => {
      formik.setFieldValue(field, value);
    });
    setPaymentEvidenceFile(null);
    setPaymentEvidenceError("");
    setPaymentOption("later");
  };

  const handleSpecialOptionToggle = (selectedField, checked) => {
    formik.setFieldValue(selectedField, checked);
  };

  const handleDiscountChange = (event) => {
    const rawValue = event.target.value;
    if (rawValue === "") {
      formik.setFieldValue("discount_amount", "");
      return;
    }
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) return;
    const capped = Math.min(Math.max(0, parsed), admissionFee);
    formik.setFieldValue("discount_amount", String(capped));
  };

  const handlePayingNowChange = (event) => {
    const rawValue = event.target.value;
    if (rawValue === "") {
      formik.setFieldValue("paying_now", "");
      return;
    }

    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    const capped = Math.min(Math.max(0, parsed), payableFee);
    formik.setFieldValue("paying_now", String(capped));

    if (payableFee > 0 && capped >= payableFee) {
      setPaymentOption("full");
      formik.setFieldValue("paying_now", String(payableFee));
    } else if (capped > 0) {
      setPaymentOption("partial");
    }
  };

  useEffect(() => {
    if (!formik.values.batch) {
      formik.setFieldValue("paying_now", "");
      setPaymentOption("later");
      return;
    }

    const currentDiscount = Number(formik.values.discount_amount) || 0;
    if (currentDiscount > admissionFee) {
      formik.setFieldValue("discount_amount", String(admissionFee));
    }

    if (paymentOption === "partial" && formik.values.paying_now) {
      const current = Number(formik.values.paying_now);
      if (!Number.isNaN(current) && payableFee > 0 && current >= payableFee) {
        setPaymentOption("full");
        formik.setFieldValue("paying_now", String(payableFee));
      } else if (!Number.isNaN(current) && current > payableFee) {
        formik.setFieldValue("paying_now", String(payableFee));
        setPaymentOption("full");
      }
    }

    if (paymentOption === "full" && payableFee > 0) {
      formik.setFieldValue("paying_now", String(payableFee));
    }
  }, [
    formik.values.batch,
    admissionFee,
    payableFee,
    paymentOption,
    formik.values.paying_now,
    formik.values.discount_amount,
  ]);

  const handlePrintFeeSlip = async () => {
    const errors = await formik.validateForm();
    const specialErrors = isSpecialBatch
      ? Boolean(errors.special_test_session)
      : false;
    if (
      errors.name ||
      errors.batch ||
      errors.paying_now ||
      errors.payment_method ||
      specialErrors
    ) {
      formik.setTouched({
        name: true,
        email: true,
        phone: true,
        batch: true,
        paying_now: true,
        payment_method: true,
        special_test_session: true,
        special_optional_revision: true,
        special_compulsory_revision: true,
      });
      toast({
        title: "Complete required fields",
        description: "Enter student name, batch, and payment details before printing.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsPrintingSlip(true);
    try {
      const fileName = await generateAdmissionFeeSlip(
        {
          name: formik.values.name,
          email: formik.values.email,
          phone: formik.values.phone,
          batchName: selectedBatch?.name || "N/A",
          batchFee: payableFee,
          payingNow,
          remainingFee,
          paymentStatus,
          paymentOption: resolvedPaymentOption,
          paymentMethod: paymentMethodLabel,
          photoFile,
        },
        "print"
      );
      toast({
        title: "Fee slip opened for printing",
        description: photoFile
          ? "Use your browser print dialog to finish."
          : "Printed without photo. Capture student photo first to include it on the slip.",
        status: photoFile ? "success" : "info",
        duration: 4000,
        isClosable: true,
      });
      return fileName;
    } catch (error) {
      toast({
        title: "Could not print fee slip",
        description: error.message || "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPrintingSlip(false);
    }
  };

  const renderPaymentPanel = () => (
    <Box
      border="1px solid"
      borderColor="#E0E8EC"
      borderRadius="xl"
      p={4}
      bg="#FAFBFC"
      mt={isSpecialBatch ? 4 : 0}
    >
      <Flex
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        gap={2}
        mb={3}
      >
        <Text fontWeight="600" fontSize="sm" color="#2D3748">
          Fee at admission
        </Text>
        <Badge
          colorScheme={
            paymentStatus === "Fully paid" ||
            paymentStatus === "Fully discounted"
              ? "green"
              : paymentStatus === "Partially paid"
                ? "orange"
                : "gray"
          }
        >
          {paymentStatus}
        </Badge>
      </Flex>

      <Grid
        templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }}
        gap={3}
        mb={4}
      >
        <Box>
          <Text fontSize="xs" color="gray.500">
            {isSpecialBatch ? "Gross fee" : "Total batch fee"}
          </Text>
          <Text fontWeight="600">{admissionFee} Rs.</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500">
            Discount
          </Text>
          <Text fontWeight="600" color={discountAmount > 0 ? "orange.500" : "inherit"}>
            {discountAmount} Rs.
          </Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500">
            Payable fee
          </Text>
          <Text fontWeight="600">{payableFee} Rs.</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500">
            Paying now
          </Text>
          <Text fontWeight="600" color="#85652D">
            {payingNow} Rs.
          </Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500">
            Remaining
          </Text>
          <Text fontWeight="600" color={remainingFee > 0 ? "red.500" : "green.600"}>
            {remainingFee} Rs.
          </Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500">
            Payment method
          </Text>
          <Text fontWeight="600">
            {resolvedPaymentOption === "later" ? "N/A" : formik.values.payment_method}
          </Text>
        </Box>
        {paymentOption === "partial" && formik.values.next_installment_date && (
          <Box gridColumn={{ base: "1 / -1", sm: "span 2" }}>
            <Text fontSize="xs" color="gray.500">
              Next installment due
            </Text>
            <Text fontWeight="600" color="#C05621">
              {formik.values.next_installment_date}
            </Text>
          </Box>
        )}
      </Grid>

      <FormControl id="discount_amount" mb={4}>
        <FormLabel fontSize={14}>Discount (Rs.)</FormLabel>
        <Input
          type="number"
          name="discount_amount"
          min={0}
          max={admissionFee}
          step="1"
          borderRadius="0.5rem"
          placeholder={`Optional (max ${admissionFee} Rs.)`}
          value={formik.values.discount_amount}
          onChange={handleDiscountChange}
          onBlur={formik.handleBlur}
        />
        {formik.touched.discount_amount && formik.errors.discount_amount ? (
          <Box color="red" fontSize="sm" mt={1}>
            {formik.errors.discount_amount}
          </Box>
        ) : null}
      </FormControl>

      {discountAmount > 0 && (
        <FormControl id="discount_description" mb={4}>
          <FormLabel fontSize={14}>Discount reason</FormLabel>
          <Input
            type="text"
            name="discount_description"
            borderRadius="0.5rem"
            placeholder="Optional note for this discount"
            value={formik.values.discount_description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </FormControl>
      )}

      <FormControl>
        <FormLabel fontSize={14} mb={2}>
          Payment option
        </FormLabel>
        <HStack spacing={2} flexWrap="wrap">
          <Button
            size="sm"
            borderRadius="lg"
            variant={paymentOption === "later" ? "solid" : "outline"}
            bg={paymentOption === "later" ? "#E2E8F0" : "white"}
            onClick={() => handlePaymentOptionChange("later")}
            type="button"
          >
            Pay later
          </Button>
          {payableFee > 1 && (
            <Button
              size="sm"
              borderRadius="lg"
              variant={resolvedPaymentOption === "partial" ? "solid" : "outline"}
              bg={resolvedPaymentOption === "partial" ? "#FFCB82" : "white"}
              color={resolvedPaymentOption === "partial" ? "#85652D" : "inherit"}
              onClick={() => handlePaymentOptionChange("partial")}
              type="button"
            >
              Partial payment
            </Button>
          )}
          {payableFee > 0 && (
            <Button
              size="sm"
              borderRadius="lg"
              variant={resolvedPaymentOption === "full" ? "solid" : "outline"}
              bg={resolvedPaymentOption === "full" ? "#48BB78" : "white"}
              color={resolvedPaymentOption === "full" ? "white" : "inherit"}
              onClick={() => handlePaymentOptionChange("full")}
              type="button"
            >
              Pay full amount
            </Button>
          )}
        </HStack>
      </FormControl>

      {resolvedPaymentOption !== "later" && (
        <FormControl id="payment_method" mt={4} isRequired>
          <FormLabel fontSize={14}>Payment Method</FormLabel>
          <HStack spacing={2} flexWrap="wrap">
            {ADMISSION_PAYMENT_METHODS.map((method) => (
              <Button
                key={method}
                size="sm"
                borderRadius="lg"
                variant={
                  formik.values.payment_method === method ? "solid" : "outline"
                }
                bg={
                  formik.values.payment_method === method
                    ? method === "Cash"
                      ? "#FFCB82"
                      : "#82B4FF"
                    : "white"
                }
                color={
                  formik.values.payment_method === method
                    ? method === "Cash"
                      ? "#85652D"
                      : "#2D4185"
                    : "inherit"
                }
                onClick={() => {
                  formik.setFieldValue("payment_method", method);
                  if (method === "Cash") {
                    setPaymentEvidenceFile(null);
                    setPaymentEvidenceError("");
                  }
                }}
                type="button"
              >
                {method}
              </Button>
            ))}
          </HStack>
          {formik.touched.payment_method && formik.errors.payment_method ? (
            <Box color="red" fontSize="sm" mt={1}>
              {formik.errors.payment_method}
            </Box>
          ) : null}
        </FormControl>
      )}

      {resolvedPaymentOption !== "later" &&
        formik.values.payment_method === "Online" && (
          <FormControl mt={4} isRequired>
            <FormLabel fontSize={14}>Online Payment Evidence</FormLabel>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              borderRadius="0.5rem"
              pt={1}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setPaymentEvidenceFile(file);
                setPaymentEvidenceError("");
              }}
            />
            <Text fontSize="xs" color="gray.500" mt={2}>
              Upload payment screenshot, bank receipt, or transfer proof (image or PDF).
            </Text>
            {paymentEvidenceFile && (
              <Text fontSize="sm" color="green.600" mt={1}>
                Selected: {paymentEvidenceFile.name}
              </Text>
            )}
            {paymentEvidenceError ? (
              <Box color="red" fontSize="sm" mt={1}>
                {paymentEvidenceError}
              </Box>
            ) : null}
          </FormControl>
        )}

      <Button
        mt={4}
        size="sm"
        leftIcon={<Printer size={14} />}
        variant="outline"
        borderRadius="lg"
        borderColor="#E0E8EC"
        onClick={handlePrintFeeSlip}
        isLoading={isPrintingSlip}
        loadingText="Preparing"
        type="button"
        isDisabled={!formik.values.name}
      >
        Print fee slip
      </Button>

      {resolvedPaymentOption === "partial" && (
        <FormControl id="paying_now" mt={4}>
          <FormLabel fontSize={14}>Amount paying now (Rs.)</FormLabel>
          <Input
            type="number"
            name="paying_now"
            min={1}
            max={payableFee}
            step="1"
            borderRadius="0.5rem"
            placeholder={`Enter amount (max ${payableFee} Rs.)`}
            value={formik.values.paying_now}
            onChange={handlePayingNowChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.paying_now && formik.errors.paying_now ? (
            <Box color="red" fontSize="sm" mt={1}>
              {formik.errors.paying_now}
            </Box>
          ) : null}
        </FormControl>
      )}

      {paymentOption === "partial" && (
        <FormControl id="next_installment_date" mt={4} isRequired>
          <FormLabel fontSize={14}>Next installment due date</FormLabel>
          <Input
            type="date"
            name="next_installment_date"
            min={todayDate}
            borderRadius="0.5rem"
            value={formik.values.next_installment_date}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Text fontSize="xs" color="gray.500" mt={2}>
            Student and admin will receive daily reminders starting 1 week before this date.
          </Text>
          {formik.touched.next_installment_date &&
          formik.errors.next_installment_date ? (
            <Box color="red" fontSize="sm" mt={1}>
              {formik.errors.next_installment_date}
            </Box>
          ) : null}
        </FormControl>
      )}
    </Box>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
          Add Student
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody flex="1" overflowY="auto" py={4}>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
            <GridItem>
              <FormControl id="name" isRequired>
                <FormLabel fontSize={14}>Name</FormLabel>
                <Input
                  type="text"
                  name="name"
                  borderRadius="0.5rem"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                />
                {formik.touched.name && formik.errors.name ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.name}
                  </Box>
                ) : null}
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl id="email" isRequired>
                <FormLabel fontSize={14}>Email</FormLabel>
                <Input
                  type="email"
                  name="email"
                  borderRadius="0.5rem"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                />
                {formik.touched.email && formik.errors.email ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.email}
                  </Box>
                ) : null}
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl id="phone" isRequired>
                <FormLabel fontSize={14}>Phone</FormLabel>
                <Input
                  type="tel"
                  name="phone"
                  borderRadius="0.5rem"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                />
                {formik.touched.phone && formik.errors.phone ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.phone}
                  </Box>
                ) : null}
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl id="batch" isRequired>
                <FormLabel fontSize={14}>Batch</FormLabel>
                <SearchableBatchSelect
                  batches={batches}
                  value={formik.values.batch}
                  onChange={handleBatchChange}
                  placeholder="Select batch"
                  width="100%"
                />
                {formik.touched.batch && formik.errors.batch ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.batch}
                  </Box>
                ) : null}
              </FormControl>
            </GridItem>

            <GridItem colSpan={{ base: 1, md: 2 }}>
              <CameraCapture
                onCapture={setPhotoFile}
                label="Student Photo (included on fee slip)"
              />
              <Text fontSize="xs" color="gray.500" mt={2}>
                Capture the student photo before printing the admission fee slip.
              </Text>
            </GridItem>

            {formik.values.batch && isSpecialBatch && (
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Box
                  border="1px solid"
                  borderColor="#E0E8EC"
                  borderRadius="xl"
                  p={4}
                  bg="#FAFBFC"
                >
                  <Flex justify="space-between" align="center" mb={3} gap={2}>
                    <Text fontWeight="600" fontSize="sm" color="#2D3748">
                      Special Batch Options
                    </Text>
                    <Badge colorScheme="purple">Special</Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    Select the options that apply to this student. Fees come from
                    the batch configuration and are totaled automatically.
                  </Text>

                  <VStack spacing={3} align="stretch">
                    {SPECIAL_OPTION_FIELDS.map(({ key, selectedField, label }) => {
                      const optionFee = getBatchOptionFee(selectedBatch, key);
                      if (optionFee <= 0) return null;
                      return (
                        <Flex
                          key={selectedField}
                          justify="space-between"
                          align="center"
                          gap={3}
                          p={3}
                          border="1px solid"
                          borderColor="#E0E8EC"
                          borderRadius="lg"
                          bg="white"
                        >
                          <Checkbox
                            isChecked={formik.values[selectedField]}
                            onChange={(e) =>
                              handleSpecialOptionToggle(
                                selectedField,
                                e.target.checked
                              )
                            }
                          >
                            {label}
                          </Checkbox>
                          <Text fontWeight="600" fontSize="sm" color="#85652D">
                            {optionFee} Rs.
                          </Text>
                        </Flex>
                      );
                    })}
                  </VStack>

                  {formik.touched.special_test_session &&
                  formik.errors.special_test_session ? (
                    <Box color="red" fontSize="sm" mt={3}>
                      {formik.errors.special_test_session}
                    </Box>
                  ) : null}

                  <Box
                    mt={4}
                    pt={3}
                    borderTop="1px solid"
                    borderColor="#E0E8EC"
                  >
                    <Text fontSize="xs" color="gray.500">
                      Calculated total fee
                    </Text>
                    <Text fontWeight="700" fontSize="lg">
                      {specialTotalFee} Rs.
                    </Text>
                  </Box>

                  {showFeePanel && renderPaymentPanel()}
                </Box>
              </GridItem>
            )}

            {formik.values.batch && !isSpecialBatch && batchFee > 0 && (
              <GridItem colSpan={{ base: 1, md: 2 }}>
                {renderPaymentPanel()}
              </GridItem>
            )}

            {formik.values.batch && !isSpecialBatch && batchFee <= 0 && (
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Box
                  border="1px dashed"
                  borderColor="#E0E8EC"
                  borderRadius="xl"
                  p={4}
                  bg="#FAFBFC"
                >
                  <Text fontSize="sm" color="gray.500">
                    This batch has no fee configured. Student will be added with zero fee.
                  </Text>
                </Box>
              </GridItem>
            )}

            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl id="remarks">
                <FormLabel fontSize={14}>Remarks</FormLabel>
                <Textarea
                  name="remarks"
                  borderRadius="0.5rem"
                  rows={2}
                  placeholder="Optional notes about this student"
                  value={formik.values.remarks}
                  onChange={formik.handleChange}
                />
              </FormControl>
            </GridItem>

          </Grid>
        </ModalBody>

        <ModalFooter
          flexShrink={0}
          borderTopWidth="1px"
          borderColor="gray.100"
          flexWrap="wrap"
          gap={2}
        >
          <Button variant="ghost" borderRadius="0.75rem" onClick={onClose}>
            Close
          </Button>
          <Button
            leftIcon={<Printer size={16} />}
            variant="outline"
            borderRadius="0.75rem"
            borderColor="#E0E8EC"
            onClick={handlePrintFeeSlip}
            isLoading={isPrintingSlip}
            loadingText="Preparing"
            isDisabled={!formik.values.name || !formik.values.batch}
            type="button"
          >
            Print Fee Slip
          </Button>
          <Button
            borderRadius="0.75rem"
            backgroundColor="#FFCB82"
            color="#85652D"
            _hover={{
              backgroundColor: "#E3B574",
              color: "#654E26",
            }}
            fontWeight="500"
            type="submit"
            loadingText="Adding"
            isLoading={addStatus === "loading"}
            ml={{ base: 0, sm: "auto" }}
          >
            Add Student
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddStudnet;
