import React, { useState } from "react";
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
  VStack,
  Box,
  Select,
  Checkbox,
  Text,
  HStack,
  IconButton,
  Flex,
  useToast,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { Pen, Plus, Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { fetchBatches, updateBatch } from "../../Features/batchSlice";
import BatchDeactivateConfirmModal from "./BatchDeactivateConfirmModal";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import {
  batchSpecialFeesToFormRows,
  createEmptySpecialFeeRow,
  formRowsToSpecialFeePayload,
} from "../../utlls/specialFeeOptions";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const getInitialValues = (batch) => ({
  name: batch?.name || "",
  description: batch?.description || "",
  batch_type: batch?.batch_type || "",
  batch_fee: batch?.batch_fee ?? "",
  is_special_batch: batch?.is_special_batch === true,
  is_interview_batch: batch?.is_interview_batch === true,
  is_paid_batch: batch?.is_paid_batch !== false,
  special_fee_rows: batchSpecialFeesToFormRows(batch?.special_fee_options),
  startdate: batch?.startdate || "",
  enddate: batch?.enddate || "",
  class_start_time: batch?.class_start_time || "",
  class_end_time: batch?.class_end_time || "",
  is_active: batch?.is_active !== false ? "true" : "false",
});

function AddModel({ batch }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState(null);
  const [authToken] = useState(Cookies.get("authToken"));
  const { updateStatus } = useSelector((state) => state.batches);
  const dispatch = useDispatch();
  const toast = useToast();

  const formik = useFormik({
    initialValues: getInitialValues(batch),
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      description: Yup.string().required("Required"),
      batch_type: Yup.string(),
      is_paid_batch: Yup.boolean(),
      is_special_batch: Yup.boolean(),
      is_interview_batch: Yup.boolean(),
      batch_fee: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null ? 0 : value
        )
        .typeError("Fee must be a number")
        .min(0, "Fee cannot be negative"),
      special_fee_rows: Yup.array().of(
        Yup.object({
          label: Yup.string(),
          fee: Yup.number()
            .transform((value, originalValue) =>
              originalValue === "" || originalValue === null ? 0 : value
            )
            .typeError("Must be a number")
            .min(0, "Fee cannot be negative"),
        })
      ),
      startdate: Yup.string().required("Required"),
      enddate: Yup.string().required("Required"),
      class_start_time: Yup.string(),
      class_end_time: Yup.string().test(
        "after-start",
        "End time must be after start time",
        function (value) {
          const start = this.parent.class_start_time;
          if (!start || !value) return true;
          return String(value) > String(start);
        }
      ),
    }).test(
      "special-fees-required",
      "Add at least one option with a fee greater than 0",
      function (values) {
        if (!values?.is_special_batch || values?.is_paid_batch === false) {
          return true;
        }
        const payload = formRowsToSpecialFeePayload(values.special_fee_rows);
        const hasValid = payload.some(
          (row) => row.label && Number(row.fee) > 0
        );
        if (hasValid) return true;
        return this.createError({
          path: "special_fee_rows",
          message:
            "Add at least one special option with a name and fee greater than 0",
        });
      }
    ),
    onSubmit: async (values) => {
      const deactivating =
        values.is_active === "false" && batch.is_active !== false;
      const enrolledCount = batch.enrolled_student_count || 0;

      if (deactivating && enrolledCount > 0) {
        setPendingValues(values);
        setShowDeactivateConfirm(true);
        return;
      }

      submitUpdate(values);
    },
  });

  const onOpen = () => {
    formik.resetForm({ values: getInitialValues(batch) });
    setShowDeactivateConfirm(false);
    setPendingValues(null);
    setIsOpen(true);
  };

  const onClose = () => {
    setIsOpen(false);
    setShowDeactivateConfirm(false);
    setPendingValues(null);
  };

  const submitUpdate = async (values) => {
    const isSpecial = values.is_special_batch === true;
    const isInterview = values.is_interview_batch === true;
    const isPaid = values.is_paid_batch === true;
    const payload = {
      name: values.name,
      description: values.description,
      batch_type: values.batch_type || "",
      startdate: values.startdate,
      enddate: values.enddate,
      class_start_time: values.class_start_time || "",
      class_end_time: values.class_end_time || "",
      is_special_batch: isSpecial,
      is_interview_batch: isInterview,
      is_paid_batch: isPaid,
      batch_fee: isSpecial ? "0" : String(values.batch_fee ?? "0"),
      special_fee_options: isSpecial
        ? formRowsToSpecialFeePayload(values.special_fee_rows)
        : [],
      is_active: values.is_active === "true",
    };
    try {
      await dispatch(
        updateBatch({ authToken, values: payload, id: batch._id })
      ).unwrap();
      onClose();
      dispatch(fetchBatches({ authToken }));
    } catch {
      // Error toast is handled by batchSlice
    }
  };

  const handlePaidBatchChange = (nextPaid) => {
    formik.setFieldValue("is_paid_batch", nextPaid === true);
  };

  const handleSpecialBatchChange = (e) => {
    const checked = e.target.checked;
    formik.setFieldValue("is_special_batch", checked);
    if (checked) {
      formik.setFieldValue("is_interview_batch", false);
      if (!formik.values.special_fee_rows?.length) {
        formik.setFieldValue("special_fee_rows", [createEmptySpecialFeeRow(0)]);
      }
    }
  };

  const handleInterviewBatchChange = (e) => {
    const checked = e.target.checked;
    formik.setFieldValue("is_interview_batch", checked);
    if (checked) {
      formik.setFieldValue("is_special_batch", false);
    }
  };

  const updateSpecialFeeRow = (index, field, value) => {
    const rows = [...(formik.values.special_fee_rows || [])];
    rows[index] = { ...rows[index], [field]: value };
    formik.setFieldValue("special_fee_rows", rows);
  };

  const addSpecialFeeRow = () => {
    const rows = [...(formik.values.special_fee_rows || [])];
    rows.push(createEmptySpecialFeeRow(rows.length));
    formik.setFieldValue("special_fee_rows", rows);
  };

  const removeSpecialFeeRow = (index) => {
    const rows = [...(formik.values.special_fee_rows || [])];
    if (rows.length <= 1) {
      formik.setFieldValue("special_fee_rows", [createEmptySpecialFeeRow(0)]);
      return;
    }
    rows.splice(index, 1);
    formik.setFieldValue("special_fee_rows", rows);
  };

  const confirmDeactivateUpdate = () => {
    if (pendingValues) {
      submitUpdate(pendingValues);
    }
    setShowDeactivateConfirm(false);
    setPendingValues(null);
  };

  const firstErrorMessage = (errors) => {
    if (!errors || typeof errors !== "object") return "";
    for (const value of Object.values(errors)) {
      if (typeof value === "string" && value) return value;
      if (value && typeof value === "object") {
        const nested = firstErrorMessage(value);
        if (nested) return nested;
      }
    }
    return "";
  };

  return (
    <>
      <button
        className="hover:bg-[#FFCB82] hover:text-[#85652D] font-medium p-[10px] rounded-xl transition-colors duration-300"
        onClick={onOpen}
      >
        <Pen size={18} />
      </button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
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
          maxW={{ base: "100%", sm: "560px", md: "640px" }}
          maxH={{ base: "100dvh", sm: "92vh" }}
          w={{ base: "100%", sm: "auto" }}
        >
          <ModalHeader
            className="text-xl font-semibold"
            flexShrink={0}
            pr={12}
            fontSize={{ base: "lg", sm: "xl" }}
          >
            Update batch
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            flex="1"
            minH={0}
            overflowY="auto"
            overflowX="hidden"
            px={{ base: 4, sm: 6 }}
            py={{ base: 3, sm: 4 }}
          >
            <VStack spacing={4} align="stretch" w="100%" minW={0}>
              <FormControl id="name" minW={0}>
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

              <FormControl id="description" minW={0}>
                <FormLabel fontSize={14}>Description</FormLabel>
                <Input
                  type="text"
                  name="description"
                  borderRadius="0.5rem"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                />
                {formik.touched.description && formik.errors.description ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.description}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl id="batch_type" minW={0}>
                <FormLabel fontSize={14}>Batch Type</FormLabel>
                <Input
                  type="text"
                  name="batch_type"
                  borderRadius="0.5rem"
                  value={formik.values.batch_type}
                  onChange={formik.handleChange}
                />
              </FormControl>

              <FormControl id="is_paid_batch" minW={0}>
                <FormLabel fontSize={14}>Fee type</FormLabel>
                <HStack spacing={3} flexWrap="wrap">
                  <Button
                    type="button"
                    size="sm"
                    borderRadius="0.6rem"
                    variant={formik.values.is_paid_batch ? "solid" : "outline"}
                    bg={formik.values.is_paid_batch ? "#C6F6D5" : "white"}
                    color={formik.values.is_paid_batch ? "#276749" : undefined}
                    _hover={{
                      bg: formik.values.is_paid_batch ? "#9AE6B4" : "gray.50",
                    }}
                    onClick={() => handlePaidBatchChange(true)}
                  >
                    Paid
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    borderRadius="0.6rem"
                    variant={!formik.values.is_paid_batch ? "solid" : "outline"}
                    bg={!formik.values.is_paid_batch ? "#E2E8F0" : "white"}
                    color={!formik.values.is_paid_batch ? "#2D3748" : undefined}
                    _hover={{
                      bg: !formik.values.is_paid_batch ? "#CBD5E0" : "gray.50",
                    }}
                    onClick={() => handlePaidBatchChange(false)}
                  >
                    Unpaid
                  </Button>
                </HStack>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Unpaid batches skip fee and payment when adding a student or
                  qualifier.
                </Text>
              </FormControl>

              <FormControl id="is_special_batch" minW={0}>
                <Checkbox
                  name="is_special_batch"
                  isChecked={formik.values.is_special_batch}
                  onChange={handleSpecialBatchChange}
                >
                  Special Batch
                </Checkbox>
                {formik.values.is_special_batch && (
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Set option fees here. At enrollment, admins only select
                    which options apply to each student.
                  </Text>
                )}
              </FormControl>

              <FormControl id="is_interview_batch" minW={0}>
                <Checkbox
                  name="is_interview_batch"
                  isChecked={formik.values.is_interview_batch}
                  onChange={handleInterviewBatchChange}
                >
                  Interview Batch
                </Checkbox>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Used for interviews / qualifiers. Cannot be combined with
                  Special Batch.
                </Text>
              </FormControl>

              {!formik.values.is_special_batch && (
                <FormControl id="batch_fee" minW={0}>
                  <FormLabel fontSize={14}>Batch Fee (Rs.)</FormLabel>
                  <Input
                    type="number"
                    name="batch_fee"
                    min={0}
                    step="1"
                    borderRadius="0.5rem"
                    value={formik.values.batch_fee}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.batch_fee && formik.errors.batch_fee ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.batch_fee}
                    </Box>
                  ) : null}
                </FormControl>
              )}

              {formik.values.is_special_batch && (
                <Box
                  w="100%"
                  minW={0}
                  border="1px solid"
                  borderColor="#E0E8EC"
                  borderRadius="xl"
                  p={{ base: 3, sm: 4 }}
                  bg="#FAFBFC"
                >
                  <Flex
                    justify="space-between"
                    align="center"
                    mb={3}
                    gap={2}
                    wrap="wrap"
                  >
                    <Text fontWeight="600" fontSize="sm">
                      Special Batch Option Fees
                    </Text>
                    <Button
                      size="sm"
                      leftIcon={<Plus size={14} />}
                      onClick={addSpecialFeeRow}
                      borderRadius="0.6rem"
                      variant="outline"
                      colorScheme="purple"
                    >
                      Add Option
                    </Button>
                  </Flex>
                  <VStack spacing={3} align="stretch">
                    {(formik.values.special_fee_rows || []).map(
                      (row, index) => (
                        <Flex
                          key={row.id}
                          direction={{ base: "column", sm: "row" }}
                          align={{ base: "stretch", sm: "flex-end" }}
                          gap={2}
                          p={3}
                          bg="white"
                          border="1px solid"
                          borderColor="#E0E8EC"
                          borderRadius="lg"
                          minW={0}
                        >
                          <FormControl flex={1.4} minW={0}>
                            <FormLabel fontSize={12}>Option name</FormLabel>
                            <Input
                              type="text"
                              borderRadius="0.5rem"
                              placeholder="e.g. Test Session"
                              value={row.label}
                              onChange={(e) =>
                                updateSpecialFeeRow(
                                  index,
                                  "label",
                                  e.target.value
                                )
                              }
                            />
                          </FormControl>
                          <FormControl flex={1} minW={0}>
                            <FormLabel fontSize={12}>Fee (Rs.)</FormLabel>
                            <Input
                              type="number"
                              min={0}
                              step="1"
                              borderRadius="0.5rem"
                              placeholder="0"
                              value={row.fee}
                              onChange={(e) =>
                                updateSpecialFeeRow(
                                  index,
                                  "fee",
                                  e.target.value
                                )
                              }
                            />
                          </FormControl>
                          <IconButton
                            aria-label="Remove option"
                            icon={<Trash2 size={16} />}
                            variant="ghost"
                            colorScheme="red"
                            flexShrink={0}
                            alignSelf={{ base: "flex-end", sm: "flex-end" }}
                            isDisabled={
                              (formik.values.special_fee_rows || []).length <= 1
                            }
                            onClick={() => removeSpecialFeeRow(index)}
                          />
                        </Flex>
                      )
                    )}
                  </VStack>
                  {typeof formik.errors.special_fee_rows === "string" ? (
                    <Box color="red" fontSize="sm" mt={3}>
                      {formik.errors.special_fee_rows}
                    </Box>
                  ) : null}
                </Box>
              )}

              <FormControl id="startdate" minW={0}>
                <FormLabel fontSize={14}>Start Date</FormLabel>
                <Input
                  size="md"
                  type="date"
                  borderRadius="0.5rem"
                  value={formik.values.startdate}
                  onChange={(e) =>
                    formik.setFieldValue("startdate", e.target.value)
                  }
                />
                {formik.touched.startdate && formik.errors.startdate ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.startdate}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl id="enddate" minW={0}>
                <FormLabel fontSize={14}>End Date</FormLabel>
                <Input
                  size="md"
                  type="date"
                  borderRadius="0.5rem"
                  value={formik.values.enddate}
                  onChange={(e) =>
                    formik.setFieldValue("enddate", e.target.value)
                  }
                />
                {formik.touched.enddate && formik.errors.enddate ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.enddate}
                  </Box>
                ) : null}
              </FormControl>

              <Box
                w="100%"
                minW={0}
                border="1px solid"
                borderColor="#E0E8EC"
                borderRadius="xl"
                p={{ base: 3, sm: 4 }}
                bg="#FAFBFC"
              >
                <Text fontWeight="600" fontSize="sm" mb={1}>
                  Daily Class Duration
                </Text>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  Class timing for each day (from – to), shown in 12-hour time.
                  Optional for interview batches.
                </Text>
                <Flex
                  direction={{ base: "column", sm: "row" }}
                  gap={3}
                  align="flex-start"
                  minW={0}
                >
                  <FormControl id="class_start_time" minW={0} flex={1}>
                    <FormLabel fontSize={13}>From</FormLabel>
                    <Input
                      type="time"
                      name="class_start_time"
                      borderRadius="0.5rem"
                      value={formik.values.class_start_time}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.values.class_start_time ? (
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {formatTime12Hour(formik.values.class_start_time)}
                      </Text>
                    ) : null}
                  </FormControl>
                  <FormControl id="class_end_time" minW={0} flex={1}>
                    <FormLabel fontSize={13}>To</FormLabel>
                    <Input
                      type="time"
                      name="class_end_time"
                      borderRadius="0.5rem"
                      value={formik.values.class_end_time}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.values.class_end_time ? (
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {formatTime12Hour(formik.values.class_end_time)}
                      </Text>
                    ) : null}
                    {formik.touched.class_end_time &&
                    formik.errors.class_end_time ? (
                      <Box color="red" fontSize="sm">
                        {formik.errors.class_end_time}
                      </Box>
                    ) : null}
                  </FormControl>
                </Flex>
                {formik.values.class_start_time &&
                formik.values.class_end_time ? (
                  <Text fontSize="sm" fontWeight="600" color="#2D3748" mt={3}>
                    Duration:{" "}
                    {formatClassTimeRange(
                      formik.values.class_start_time,
                      formik.values.class_end_time
                    )}
                  </Text>
                ) : null}
              </Box>

              <FormControl id="is_active" minW={0}>
                <FormLabel fontSize={14}>Status</FormLabel>
                <Select
                  name="is_active"
                  borderRadius="0.5rem"
                  value={formik.values.is_active}
                  onChange={formik.handleChange}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter
            flexShrink={0}
            borderTopWidth="1px"
            borderColor="gray.100"
            gap={2}
            flexWrap="wrap"
          >
            <Button
              variant="ghost"
              borderRadius="0.75rem"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              borderRadius="0.75rem"
              backgroundColor="#82B4FF"
              color="#2D4185"
              _hover={{
                backgroundColor: "#74A0E3",
                color: "#223163",
              }}
              fontWeight="500"
              type="button"
              loadingText="Updating"
              isLoading={updateStatus === "loading"}
              onClick={async () => {
                const errors = await formik.validateForm();
                formik.setTouched(
                  Object.keys(formik.values).reduce(
                    (acc, key) => ({ ...acc, [key]: true }),
                    {}
                  )
                );
                if (Object.keys(errors).length) {
                  toast({
                    title: "Please fix the highlighted fields",
                    description:
                      firstErrorMessage(errors) ||
                      "Check the form and try again.",
                    status: "warning",
                    duration: 4000,
                    isClosable: true,
                  });
                  return;
                }
                formik.handleSubmit();
              }}
            >
              Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <BatchDeactivateConfirmModal
        isOpen={showDeactivateConfirm}
        onClose={() => {
          setShowDeactivateConfirm(false);
          setPendingValues(null);
        }}
        batchName={batch.name}
        enrolledCount={batch.enrolled_student_count || 0}
        onConfirm={confirmDeactivateUpdate}
        isLoading={updateStatus === "loading"}
      />
    </>
  );
}

export default AddModel;
