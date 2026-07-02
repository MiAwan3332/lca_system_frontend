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

function AddStudnet({ isOpen, onClose }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [photoFile, setPhotoFile] = useState(null);
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
            const fee = Number(selected?.batch_fee) || 0;
            const amount = Number(value || 0);
            if (fee > 0 && amount >= fee) return true;
            if (amount < 1) {
              return this.createError({ message: "Enter amount greater than 0" });
            }
            return amount <= fee;
          }),
        payment_method: Yup.string().when([], {
          is: () => paymentOption === "partial" || paymentOption === "full",
          then: (schema) =>
            schema
              .oneOf(ADMISSION_PAYMENT_METHODS, "Select Cash or Online")
              .required("Payment method is required"),
          otherwise: (schema) => schema.notRequired(),
        }),
        remarks: Yup.string(),
      }),
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
      remarks: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const selected = batches.find((item) => item._id === values.batch);
      const fee = Number(selected?.batch_fee) || 0;
      const enteredAmount =
        paymentOption === "partial" ? Number(values.paying_now) || 0 : 0;
      const amountToPay =
        paymentOption === "full" || (fee > 0 && enteredAmount >= fee)
          ? fee
          : paymentOption === "partial"
            ? enteredAmount
            : 0;

      if (amountToPay > fee) {
        formik.setFieldError("paying_now", "Cannot be greater than batch fee");
        formik.setFieldTouched("paying_now", true, false);
        toast({
          title: "Invalid payment amount",
          description: `Paying amount cannot be greater than batch fee (${fee} Rs.).`,
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
      if (amountToPay > 0) {
        formData.append("payment_method", values.payment_method);
      }
      formData.append("remarks", values.remarks || "");
      if (photoFile) {
        formData.append("image", photoFile);
      }

      try {
        await dispatch(addStudent({ authToken, formData })).unwrap();
        dispatch(fetchStudents({ authToken }));
        formik.resetForm();
        setPhotoFile(null);
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
        } else if (/batch fee|payment amount|paying now/i.test(message)) {
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

  const batchFee = Number(selectedBatch?.batch_fee) || 0;
  const enteredPayAmount = Number(formik.values.paying_now) || 0;
  const isFullPayment =
    batchFee > 0 &&
    (paymentOption === "full" ||
      (paymentOption === "partial" && enteredPayAmount >= batchFee));
  const payingNow =
    paymentOption === "later"
      ? 0
      : isFullPayment
        ? batchFee
        : paymentOption === "partial"
          ? enteredPayAmount
          : 0;
  const resolvedPaymentOption = isFullPayment
    ? "full"
    : payingNow > 0
      ? "partial"
      : paymentOption;
  const remainingFee = Math.max(batchFee - payingNow, 0);
  const paymentStatus =
    batchFee <= 0
      ? "No fee"
      : payingNow <= 0
        ? "Unpaid"
        : payingNow >= batchFee
          ? "Fully paid"
          : "Partially paid";

  const paymentMethodLabel =
    payingNow > 0 ? formik.values.payment_method || "Cash" : "N/A";

  const handlePaymentOptionChange = (option) => {
    setPaymentOption(option);
    if (option === "later") {
      formik.setFieldValue("paying_now", "");
    } else if (option === "full") {
      formik.setFieldValue("paying_now", String(batchFee));
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
    setPaymentOption("later");
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

    const capped = Math.min(Math.max(0, parsed), batchFee);
    formik.setFieldValue("paying_now", String(capped));

    if (batchFee > 0 && capped >= batchFee) {
      setPaymentOption("full");
      formik.setFieldValue("paying_now", String(batchFee));
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

    if (paymentOption === "partial" && formik.values.paying_now) {
      const current = Number(formik.values.paying_now);
      if (!Number.isNaN(current) && batchFee > 0 && current >= batchFee) {
        setPaymentOption("full");
        formik.setFieldValue("paying_now", String(batchFee));
      } else if (!Number.isNaN(current) && current > batchFee) {
        formik.setFieldValue("paying_now", String(batchFee));
        setPaymentOption("full");
      }
    }
  }, [formik.values.batch, batchFee, paymentOption, formik.values.paying_now]);

  const handlePrintFeeSlip = async () => {
    const errors = await formik.validateForm();
    if (errors.name || errors.batch || errors.paying_now || errors.payment_method) {
      formik.setTouched({
        name: true,
        email: true,
        phone: true,
        batch: true,
        paying_now: true,
        payment_method: true,
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
          batchFee,
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

            {formik.values.batch && batchFee > 0 && (
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Box
                  border="1px solid"
                  borderColor="#E0E8EC"
                  borderRadius="xl"
                  p={4}
                  bg="#FAFBFC"
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
                        paymentStatus === "Fully paid"
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
                    templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
                    gap={3}
                    mb={4}
                  >
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Total batch fee
                      </Text>
                      <Text fontWeight="600">{batchFee} Rs.</Text>
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
                  </Grid>

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
                      {batchFee > 1 && (
                        <Button
                          size="sm"
                          borderRadius="lg"
                          variant={
                            resolvedPaymentOption === "partial" ? "solid" : "outline"
                          }
                          bg={resolvedPaymentOption === "partial" ? "#FFCB82" : "white"}
                          color={
                            resolvedPaymentOption === "partial" ? "#85652D" : "inherit"
                          }
                          onClick={() => handlePaymentOptionChange("partial")}
                          type="button"
                        >
                          Partial payment
                        </Button>
                      )}
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
                            onClick={() => formik.setFieldValue("payment_method", method)}
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
                        max={batchFee}
                        step="1"
                        borderRadius="0.5rem"
                        placeholder={`Enter amount (max ${batchFee} Rs.)`}
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
                </Box>
              </GridItem>
            )}

            {formik.values.batch && batchFee <= 0 && (
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
