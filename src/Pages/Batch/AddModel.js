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
  Checkbox,
  Text,
  HStack,
  IconButton,
  Select,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { Plus, Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { fetchBatches, addBatch } from "../../Features/batchSlice";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import {
  createEmptySpecialFeeRow,
  formRowsToSpecialFeePayload,
} from "../../utlls/specialFeeOptions";

function AddModel({ isOpen, onClose }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const { addStatus } = useSelector((state) => state.batches);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      batch_type: "",
      batch_fee: "",
      is_special_batch: false,
      is_interview_batch: false,
      is_paid_batch: true,
      special_fee_rows: [createEmptySpecialFeeRow(0)],
      startdate: "",
      enddate: "",
      class_start_time: "",
      class_end_time: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      description: Yup.string().required("Required"),
      batch_fee: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null ? undefined : value
        )
        .typeError("Fee must be a number")
        .min(0, "Fee cannot be negative")
        .when(["is_special_batch", "is_paid_batch"], {
          is: (isSpecial, isPaid) => isSpecial === true || isPaid === false,
          then: (schema) => schema.notRequired(),
          otherwise: (schema) => schema.required("Required"),
        }),
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
      class_start_time: Yup.string().when("is_interview_batch", {
        is: true,
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.required("Required"),
      }),
      class_end_time: Yup.string()
        .when("is_interview_batch", {
          is: true,
          then: (schema) => schema.notRequired(),
          otherwise: (schema) => schema.required("Required"),
        })
        .test(
          "after-start",
          "End time must be after start time",
          function (value) {
            if (this.parent.is_interview_batch) return true;
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
      const isSpecial = values.is_special_batch === true;
      const isPaid = values.is_paid_batch !== false;
      try {
        await dispatch(
          addBatch({
            authToken,
            values: {
              name: values.name,
              description: values.description,
              batch_type: values.batch_type,
              startdate: values.startdate,
              enddate: values.enddate,
              class_start_time:
                values.is_interview_batch === true
                  ? ""
                  : values.class_start_time,
              class_end_time:
                values.is_interview_batch === true
                  ? ""
                  : values.class_end_time,
              is_special_batch: isSpecial,
              is_interview_batch: values.is_interview_batch === true,
              is_paid_batch: isPaid,
              batch_fee: !isPaid || isSpecial ? "0" : String(values.batch_fee),
              special_fee_options:
                isSpecial && isPaid
                  ? formRowsToSpecialFeePayload(values.special_fee_rows)
                  : [],
            },
          })
        ).unwrap();
        onClose();
        formik.resetForm();
        dispatch(fetchBatches({ authToken }));
      } catch {
        // Error toast is handled by batchSlice
      }
    },
  });

  const handlePaidBatchChange = (e) => {
    const paid = e.target.value === "true";
    formik.setFieldValue("is_paid_batch", paid);
    if (!paid) {
      formik.setFieldValue("batch_fee", "0");
      formik.setFieldError("batch_fee", undefined);
    }
  };

  const handleSpecialBatchChange = (e) => {
    const checked = e.target.checked;
    formik.setFieldValue("is_special_batch", checked);
    if (checked) {
      formik.setFieldValue("is_interview_batch", false);
      formik.setFieldValue("batch_fee", "0");
      formik.setFieldError("batch_fee", undefined);
      if (!formik.values.special_fee_rows?.length) {
        formik.setFieldValue("special_fee_rows", [createEmptySpecialFeeRow(0)]);
      }
    } else {
      formik.setFieldValue("special_fee_rows", [createEmptySpecialFeeRow(0)]);
    }
  };

  const handleInterviewBatchChange = (e) => {
    const checked = e.target.checked;
    formik.setFieldValue("is_interview_batch", checked);
    if (checked) {
      formik.setFieldValue("is_special_batch", false);
      formik.setFieldValue("special_fee_rows", [createEmptySpecialFeeRow(0)]);
      formik.setFieldValue("class_start_time", "");
      formik.setFieldValue("class_end_time", "");
      formik.setFieldError("class_start_time", undefined);
      formik.setFieldError("class_end_time", undefined);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="text-xl font-semibold">Add Batch</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl id="name">
                <FormLabel fontSize={14}>Name</FormLabel>
                <Input
                  type="text"
                  name="name"
                  borderRadius={"0.5rem"}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                />
                {formik.touched.name && formik.errors.name ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.name}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl id="description">
                <FormLabel fontSize={14}>Description</FormLabel>
                <Input
                  type="description"
                  name="description"
                  borderRadius={"0.5rem"}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                />
                {formik.touched.description && formik.errors.description ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.description}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl id="batch_type">
                <FormLabel fontSize={14}>Batch Type</FormLabel>
                <Select
                  name="batch_type"
                  borderRadius={"0.5rem"}
                  value={formik.values.batch_type}
                  onChange={formik.handleChange}
                >
                  <option value="">Select Type</option>
                  <option value="Online">Online</option>
                  <option value="On Campus">On Campus</option>
                </Select>
                {formik.touched.batch_type && formik.errors.batch_type ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.batch_type}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl id="is_paid_batch">
                <FormLabel fontSize={14}>Fee type</FormLabel>
                <Select
                  name="is_paid_batch"
                  borderRadius="0.5rem"
                  value={formik.values.is_paid_batch ? "true" : "false"}
                  onChange={handlePaidBatchChange}
                >
                  <option value="true">Paid</option>
                  <option value="false">Unpaid</option>
                </Select>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Unpaid batches skip fee and payment when adding a student or
                  qualifier.
                </Text>
              </FormControl>

              <FormControl id="is_special_batch">
                <Checkbox
                  name="is_special_batch"
                  isChecked={formik.values.is_special_batch}
                  onChange={handleSpecialBatchChange}
                >
                  Special Batch
                </Checkbox>
                {formik.values.is_special_batch && (
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {formik.values.is_paid_batch === false
                      ? "Option fees are not used for unpaid batches."
                      : "Add one or more option fees. At enrollment, admins select which options apply to each student."}
                  </Text>
                )}
              </FormControl>

              <FormControl id="is_interview_batch">
                <Checkbox
                  name="is_interview_batch"
                  isChecked={formik.values.is_interview_batch}
                  onChange={handleInterviewBatchChange}
                >
                  Interview Batch
                </Checkbox>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Mark this batch as used for interviews / qualifiers. Cannot
                  be combined with Special Batch.
                </Text>
              </FormControl>

              {formik.values.is_paid_batch !== false &&
                !formik.values.is_special_batch && (
                <FormControl id="batch_fee">
                  <FormLabel fontSize={14}>Batch Fee (Rs.)</FormLabel>
                  <Input
                    type="number"
                    name="batch_fee"
                    min={0}
                    step="1"
                    borderRadius={"0.5rem"}
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

              {formik.values.is_paid_batch !== false &&
                formik.values.is_special_batch && (
                <Box
                  w="100%"
                  border="1px solid"
                  borderColor="#E0E8EC"
                  borderRadius="xl"
                  p={4}
                  bg="#FAFBFC"
                >
                  <FlexHeader
                    onAdd={addSpecialFeeRow}
                  />
                  <VStack spacing={3} align="stretch">
                    {(formik.values.special_fee_rows || []).map((row, index) => (
                      <HStack
                        key={row.id}
                        align="flex-start"
                        spacing={2}
                        p={3}
                        bg="white"
                        border="1px solid"
                        borderColor="#E0E8EC"
                        borderRadius="lg"
                      >
                        <FormControl flex={1.4}>
                          <FormLabel fontSize={12}>Option name</FormLabel>
                          <Input
                            type="text"
                            borderRadius="0.5rem"
                            placeholder={`e.g. Test Session`}
                            value={row.label}
                            onChange={(e) =>
                              updateSpecialFeeRow(index, "label", e.target.value)
                            }
                          />
                        </FormControl>
                        <FormControl flex={1}>
                          <FormLabel fontSize={12}>Fee (Rs.)</FormLabel>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            borderRadius="0.5rem"
                            placeholder="0"
                            value={row.fee}
                            onChange={(e) =>
                              updateSpecialFeeRow(index, "fee", e.target.value)
                            }
                          />
                        </FormControl>
                        <IconButton
                          aria-label="Remove option"
                          icon={<Trash2 size={16} />}
                          variant="ghost"
                          colorScheme="red"
                          mt={7}
                          isDisabled={
                            (formik.values.special_fee_rows || []).length <= 1
                          }
                          onClick={() => removeSpecialFeeRow(index)}
                        />
                      </HStack>
                    ))}
                  </VStack>
                  {typeof formik.errors.special_fee_rows === "string" ? (
                    <Box color="red" fontSize="sm" mt={3}>
                      {formik.errors.special_fee_rows}
                    </Box>
                  ) : null}
                </Box>
              )}

              <FormControl id="startdate">
                <FormLabel fontSize={14}>Start Date</FormLabel>
                <Input
                  placeholder="Select Start Date"
                  size="md"
                  type="date"
                  borderRadius={"0.5rem"}
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

              <FormControl id="enddate">
                <FormLabel fontSize={14}>End Date</FormLabel>
                <Input
                  placeholder="Select End Date"
                  size="md"
                  type="date"
                  borderRadius={"0.5rem"}
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

              {!formik.values.is_interview_batch && (
              <Box
                w="100%"
                border="1px solid"
                borderColor="#E0E8EC"
                borderRadius="xl"
                p={4}
                bg="#FAFBFC"
              >
                <Text fontWeight="600" fontSize="sm" mb={1}>
                  Daily Class Duration
                </Text>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  Class timing for each day (from – to), shown in 12-hour time
                </Text>
                <HStack spacing={3} align="flex-start">
                  <FormControl id="class_start_time">
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
                    {formik.touched.class_start_time &&
                    formik.errors.class_start_time ? (
                      <Box color="red" fontSize="sm">
                        {formik.errors.class_start_time}
                      </Box>
                    ) : null}
                  </FormControl>
                  <FormControl id="class_end_time">
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
                </HStack>
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
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius={"0.75rem"}
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              borderRadius={"0.75rem"}
              backgroundColor={"#FFCB82"}
              color={"#85652D"}
              _hover={{
                backgroundColor: "#E3B574",
                color: "#654E26",
              }}
              fontWeight={"500"}
              type="submit"
              loadingText="Adding"
              isLoading={addStatus === "loading"}
            >
              Add
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

function FlexHeader({ onAdd }) {
  return (
    <HStack justify="space-between" align="center" mb={3}>
      <Text fontWeight="600" fontSize="sm">
        Special Batch Option Fees
      </Text>
      <Button
        size="sm"
        leftIcon={<Plus size={14} />}
        onClick={onAdd}
        borderRadius="0.6rem"
        variant="outline"
        colorScheme="purple"
      >
        Add Option
      </Button>
    </HStack>
  );
}

export default AddModel;
