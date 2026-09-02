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
  Textarea,
  Box,
  Text,
  Grid,
  GridItem,
  HStack,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useDispatch, useSelector } from "react-redux";
import { addQualifier, fetchQualifiers } from "../../Features/qualifierSlice";
import {
  fetchBatches,
  selectActiveInterviewBatches,
} from "../../Features/batchSlice";
import CameraCapture from "../../Components/CameraCapture";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import { FEE_PAYMENT_METHODS } from "../../utlls/paymentMethods";
import { batchIsPaid } from "../../utlls/specialFeeOptions";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

function AddQualifierModal({ isOpen, onClose }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [photoFile, setPhotoFile] = useState(null);
  const [paymentOption, setPaymentOption] = useState("later");
  const { addStatus } = useSelector((state) => state.qualifiers);
  const interviewBatches = useSelector(selectActiveInterviewBatches);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isOpen || !authToken) return;
    dispatch(
      fetchBatches({
        authToken,
        queryParams: { limit: 200, page: 1, query: "", is_active: "true" },
      })
    );
  }, [isOpen, authToken, dispatch]);

  useEffect(() => {
    if (!isOpen) {
      setPhotoFile(null);
      setPaymentOption("later");
    }
  }, [isOpen]);

  const formik = useFormik({
    initialValues: {
      name: "",
      cnic: "",
      phone: "",
      batch: "",
      remarks: "",
      paying_now: "",
      payment_method: "Cash",
      discount_amount: "",
      discount_description: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().required("Required"),
      phone: Yup.string().trim().required("Required"),
      cnic: Yup.string(),
      batch: Yup.string().required("Please select a batch"),
      remarks: Yup.string(),
      discount_amount: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null ? 0 : value
        )
        .typeError("Must be a number")
        .min(0, "Cannot be negative")
        .test(
          "max-batch-fee",
          "Cannot be greater than batch fee",
          function (value) {
            const batchId = this.parent.batch;
            if (!batchId) return true;
            const selected = interviewBatches.find((b) => b._id === batchId);
            const fee = Number(selected?.batch_fee) || 0;
            return (Number(value) || 0) <= fee;
          }
        ),
      paying_now: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null ? 0 : value
        )
        .typeError("Must be a number")
        .test("max-fee", "Cannot be greater than payable fee", function (value) {
          if (paymentOption !== "partial") return true;
          const batchId = this.parent.batch;
          if (!batchId) return true;
          const selected = interviewBatches.find((b) => b._id === batchId);
          const gross = Number(selected?.batch_fee) || 0;
          const discount = Math.min(
            Math.max(0, Number(this.parent.discount_amount) || 0),
            gross
          );
          const payable = Math.max(gross - discount, 0);
          return (Number(value) || 0) <= payable;
        }),
      payment_method: Yup.string().when("batch", {
        is: (batchId) => {
          const selected = interviewBatches.find((b) => b._id === batchId);
          if (!batchIsPaid(selected)) return false;
          return paymentOption === "partial" || paymentOption === "full";
        },
        then: (schema) =>
          schema
            .oneOf(FEE_PAYMENT_METHODS, "Select a payment method")
            .required("Required"),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    onSubmit: async (values) => {
      const selected = interviewBatches.find((b) => b._id === values.batch);
      const unpaidBatch = !batchIsPaid(selected);
      const grossFee = unpaidBatch ? 0 : Number(selected?.batch_fee) || 0;
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
          "Cannot be greater than batch fee"
        );
        formik.setFieldTouched("discount_amount", true, false);
        return;
      }

      if (paymentOption === "partial" && amountToPay > fee) {
        formik.setFieldError("paying_now", "Cannot be greater than payable fee");
        formik.setFieldTouched("paying_now", true, false);
        return;
      }

      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("phone", values.phone.trim());
      formData.append("cnic", values.cnic?.trim() || "");
      formData.append("batch", values.batch);
      formData.append("description", values.remarks?.trim() || "");
      formData.append("is_active", "true");
      formData.append("total_fee", String(grossFee));
      formData.append("paying_now", String(amountToPay));
      if (discountAmount > 0) {
        formData.append("discount_amount", String(discountAmount));
        formData.append(
          "discount_description",
          values.discount_description?.trim() || ""
        );
      }
      if (amountToPay > 0) {
        formData.append("payment_method", values.payment_method || "Cash");
      }
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      dispatch(addQualifier({ formData, authToken }))
        .unwrap()
        .then(() => {
          formik.resetForm();
          setPhotoFile(null);
          setPaymentOption("later");
          onClose();
          dispatch(fetchQualifiers({ authToken }));
        })
        .catch(() => {});
    },
  });

  const selectedBatch = useMemo(
    () => interviewBatches.find((b) => b._id === formik.values.batch),
    [interviewBatches, formik.values.batch]
  );
  const isPaidBatch = batchIsPaid(selectedBatch);
  const batchFee = isPaidBatch ? Number(selectedBatch?.batch_fee) || 0 : 0;
  const discountAmount = Math.min(
    Math.max(0, Number(formik.values.discount_amount) || 0),
    batchFee
  );
  const payableFee = Math.max(batchFee - discountAmount, 0);
  const enteredPayAmount = Number(formik.values.paying_now) || 0;
  const isFullyPaid =
    payableFee > 0 &&
    (paymentOption === "full" ||
      (paymentOption === "partial" && enteredPayAmount >= payableFee));
  const payingNow =
    paymentOption === "later"
      ? 0
      : paymentOption === "full" || isFullyPaid
        ? payableFee
        : paymentOption === "partial"
          ? enteredPayAmount
          : 0;
  const remainingFee = Math.max(payableFee - payingNow, 0);
  const paymentStatus =
    payableFee <= 0
      ? batchFee > 0 && discountAmount >= batchFee
        ? "Fully discounted"
        : "No fee"
      : paymentOption === "later"
        ? "Pay later"
        : isFullyPaid || payingNow >= payableFee
          ? "Fully paid"
          : "Partially paid";

  const handleClose = () => {
    formik.resetForm();
    setPhotoFile(null);
    setPaymentOption("later");
    onClose();
  };

  const handleBatchChange = (batchId) => {
    formik.setFieldValue("batch", batchId || "");
    formik.setFieldValue("paying_now", "");
    formik.setFieldValue("discount_amount", "");
    formik.setFieldValue("discount_description", "");
    setPaymentOption("later");
  };

  const handleDiscountChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      formik.setFieldValue("discount_amount", "");
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      formik.setFieldValue("discount_amount", raw);
      return;
    }
    const capped = Math.min(Math.max(0, parsed), batchFee);
    formik.setFieldValue("discount_amount", String(capped));
  };

  const handlePaymentOptionChange = (option) => {
    setPaymentOption(option);
    if (option === "later") {
      formik.setFieldValue("paying_now", "");
    } else if (option === "full") {
      formik.setFieldValue("paying_now", String(payableFee));
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

  useEffect(() => {
    if (!formik.values.batch) {
      formik.setFieldValue("paying_now", "");
      setPaymentOption("later");
      return;
    }

    const currentDiscount = Number(formik.values.discount_amount) || 0;
    if (currentDiscount > batchFee) {
      formik.setFieldValue("discount_amount", String(batchFee));
    }

    if (paymentOption === "partial" && formik.values.paying_now) {
      const current = Number(formik.values.paying_now);
      if (!Number.isNaN(current) && payableFee > 0 && current >= payableFee) {
        setPaymentOption("full");
        formik.setFieldValue("paying_now", String(payableFee));
      } else if (!Number.isNaN(current) && current > payableFee) {
        formik.setFieldValue("paying_now", String(payableFee));
      }
    }

    if (paymentOption === "full") {
      formik.setFieldValue("paying_now", String(payableFee));
    }
  }, [formik.values.batch, batchFee, payableFee, paymentOption]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("lg")}
    >
      <ModalOverlay />
      <ModalContent
        {...responsiveModalContentProps}
        as="form"
        onSubmit={formik.handleSubmit}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        maxH={{ base: "100dvh", sm: "92vh" }}
        w={{ base: "100%", sm: "auto" }}
      >
        <ModalHeader
          className="text-xl font-semibold"
          flexShrink={0}
          pr={12}
          fontSize={{ base: "lg", sm: "xl" }}
        >
          Add Qualifier
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody
          flex="1"
          minH={0}
          overflowY="auto"
          overflowX="hidden"
          px={{ base: 4, sm: 6 }}
          py={{ base: 3, sm: 4 }}
          css={{
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": {
              background: "#F1F5F9",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#CBD5E1",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#94A3B8",
            },
          }}
        >
            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap={{ base: 3, md: 4 }}
            >
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
                <FormControl id="cnic">
                  <FormLabel fontSize={14}>CNIC</FormLabel>
                  <Input
                    type="text"
                    name="cnic"
                    borderRadius="0.5rem"
                    placeholder="Optional"
                    value={formik.values.cnic}
                    onChange={formik.handleChange}
                  />
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
                    batches={interviewBatches}
                    value={formik.values.batch}
                    onChange={handleBatchChange}
                    placeholder="Select batch"
                    width="100%"
                    activeOnly={false}
                  />
                  {!interviewBatches.length ? (
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      No active interview batches. Mark a batch as Interview
                      Batch first.
                    </Text>
                  ) : null}
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
                  label="Qualifier Photo"
                />
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Capture or upload the qualifier photo.
                </Text>
              </GridItem>

              <GridItem colSpan={{ base: 1, md: 2 }}>
                <FormControl id="remarks">
                  <FormLabel fontSize={14}>Remarks</FormLabel>
                  <Textarea
                    name="remarks"
                    borderRadius="0.5rem"
                    rows={2}
                    placeholder="Optional notes about this qualifier"
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </GridItem>

              {formik.values.batch && !isPaidBatch ? (
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <Box
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor="gray.200"
                    borderRadius="0.75rem"
                    p={{ base: 3, sm: 4 }}
                    bg="gray.50"
                  >
                    <Text fontWeight="600" fontSize="sm" color="#2D3748">
                      Unpaid batch
                    </Text>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      This interview batch is unpaid. No fee or payment is
                      collected.
                    </Text>
                  </Box>
                </GridItem>
              ) : null}

              {formik.values.batch && isPaidBatch ? (
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <Box
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="0.75rem"
                    p={{ base: 3, sm: 4 }}
                    bg="gray.50"
                  >
                    <Flex
                      align={{ base: "flex-start", sm: "center" }}
                      justify="space-between"
                      direction={{ base: "column", sm: "row" }}
                      gap={2}
                      mb={3}
                    >
                      <Text fontWeight="600" fontSize="sm" color="#2D3748">
                        Fee / payment
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
                      templateColumns={{
                        base: "1fr 1fr",
                        sm: "repeat(3, 1fr)",
                      }}
                      gap={3}
                      mb={4}
                    >
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Batch fee
                        </Text>
                        <Text fontWeight="600">{batchFee} Rs.</Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Discount
                        </Text>
                        <Text
                          fontWeight="600"
                          color={discountAmount > 0 ? "orange.500" : "inherit"}
                        >
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
                        <Text
                          fontWeight="600"
                          color={remainingFee > 0 ? "red.500" : "green.600"}
                        >
                          {remainingFee} Rs.
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Method
                        </Text>
                        <Text fontWeight="600">
                          {paymentOption === "later"
                            ? "N/A"
                            : formik.values.payment_method}
                        </Text>
                      </Box>
                    </Grid>

                    <FormControl id="discount_amount" mb={4}>
                      <FormLabel fontSize={14}>Discount (Rs.)</FormLabel>
                      <Input
                        type="number"
                        name="discount_amount"
                        min={0}
                        max={batchFee}
                        step="1"
                        borderRadius="0.5rem"
                        placeholder={`Optional (max ${batchFee} Rs.)`}
                        value={formik.values.discount_amount}
                        onChange={handleDiscountChange}
                        onBlur={formik.handleBlur}
                        isDisabled={batchFee <= 0}
                      />
                      {formik.touched.discount_amount &&
                      formik.errors.discount_amount ? (
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
                        <Button
                          size="sm"
                          borderRadius="lg"
                          variant={
                            paymentOption === "partial" ? "solid" : "outline"
                          }
                          bg={paymentOption === "partial" ? "#FFCB82" : "white"}
                          color={
                            paymentOption === "partial" ? "#85652D" : undefined
                          }
                          onClick={() => handlePaymentOptionChange("partial")}
                          type="button"
                          isDisabled={payableFee <= 0}
                        >
                          Partial
                        </Button>
                        <Button
                          size="sm"
                          borderRadius="lg"
                          variant={paymentOption === "full" ? "solid" : "outline"}
                          bg={paymentOption === "full" ? "#C6F6D5" : "white"}
                          onClick={() => handlePaymentOptionChange("full")}
                          type="button"
                          isDisabled={payableFee <= 0}
                        >
                          Full payment
                        </Button>
                      </HStack>
                    </FormControl>

                    {paymentOption === "partial" && (
                      <FormControl id="paying_now" mt={4} isRequired>
                        <FormLabel fontSize={14}>Amount paying now</FormLabel>
                        <Input
                          type="number"
                          name="paying_now"
                          min={0}
                          max={payableFee}
                          borderRadius="0.5rem"
                          value={formik.values.paying_now}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                        {formik.touched.paying_now && formik.errors.paying_now ? (
                          <Box color="red" fontSize="sm" mt={1}>
                            {formik.errors.paying_now}
                          </Box>
                        ) : null}
                      </FormControl>
                    )}

                    {(paymentOption === "partial" ||
                      paymentOption === "full") && (
                      <FormControl id="payment_method" mt={4} isRequired>
                        <FormLabel fontSize={14}>Payment method</FormLabel>
                        <HStack spacing={2} flexWrap="wrap">
                          {FEE_PAYMENT_METHODS.map((method) => (
                            <Button
                              key={method}
                              size="sm"
                              type="button"
                              borderRadius="lg"
                              variant={
                                formik.values.payment_method === method
                                  ? "solid"
                                  : "outline"
                              }
                              bg={
                                formik.values.payment_method === method
                                  ? method === "Cash"
                                    ? "#C6F6D5"
                                    : "#BEE3F8"
                                  : "white"
                              }
                              onClick={() =>
                                formik.setFieldValue("payment_method", method)
                              }
                            >
                              {method}
                            </Button>
                          ))}
                        </HStack>
                        {formik.touched.payment_method &&
                        formik.errors.payment_method ? (
                          <Box color="red" fontSize="sm" mt={1}>
                            {formik.errors.payment_method}
                          </Box>
                        ) : null}
                      </FormControl>
                    )}

                    {batchFee <= 0 && (
                      <Text fontSize="sm" color="orange.600" mt={3}>
                        This interview batch has no fee set. WhatsApp will still
                        send with 0 payment amounts.
                      </Text>
                    )}
                  </Box>
                </GridItem>
              ) : null}
            </Grid>
        </ModalBody>

        <ModalFooter
          flexShrink={0}
          borderTopWidth="1px"
          borderColor="gray.100"
          gap={2}
          flexWrap="wrap"
          px={{ base: 4, sm: 6 }}
          py={{ base: 3, sm: 4 }}
        >
          <Button
            variant="ghost"
            borderRadius="0.75rem"
            onClick={handleClose}
            w={{ base: "100%", sm: "auto" }}
            order={{ base: 2, sm: 1 }}
          >
            Close
          </Button>
          <Button
            borderRadius="0.75rem"
            backgroundColor="#FFCB82"
            color="#85652D"
            _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
            fontWeight="500"
            type="submit"
            loadingText="Adding"
            isLoading={addStatus === "loading"}
            w={{ base: "100%", sm: "auto" }}
            order={{ base: 1, sm: 2 }}
          >
            Add Qualifier
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddQualifierModal;
