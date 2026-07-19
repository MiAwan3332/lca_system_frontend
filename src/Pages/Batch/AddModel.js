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
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector, useDispatch } from "react-redux";
import { fetchBatches, addBatch } from "../../Features/batchSlice";

const SPECIAL_FEE_FIELDS = [
  { name: "test_session_fee", label: "Test Session fee (Rs.)" },
  { name: "optional_revision_fee", label: "Optional Revision fee (Rs.)" },
  { name: "compulsory_revision_fee", label: "Compulsory Revision fee (Rs.)" },
];

function AddModel({ isOpen, onClose }) {
  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));
  const { addStatus } = useSelector((state) => state.batches);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      batch_type: "",
      batch_fee: "",
      is_special_batch: false,
      test_session_fee: "",
      optional_revision_fee: "",
      compulsory_revision_fee: "",
      startdate: "",
      enddate: "",
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
        .when("is_special_batch", {
          is: true,
          then: (schema) => schema.notRequired(),
          otherwise: (schema) => schema.required("Required"),
        }),
      test_session_fee: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null ? 0 : value
        )
        .typeError("Must be a number")
        .min(0, "Fee cannot be negative"),
      optional_revision_fee: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null ? 0 : value
        )
        .typeError("Must be a number")
        .min(0, "Fee cannot be negative"),
      compulsory_revision_fee: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" || originalValue === null ? 0 : value
        )
        .typeError("Must be a number")
        .min(0, "Fee cannot be negative"),
      startdate: Yup.string().required("Required"),
      enddate: Yup.string().required("Required"),
    }).test(
      "special-fees-required",
      "Enter at least one special option fee greater than 0",
      function (values) {
        if (!values?.is_special_batch) return true;
        const total =
          (Number(values.test_session_fee) || 0) +
          (Number(values.optional_revision_fee) || 0) +
          (Number(values.compulsory_revision_fee) || 0);
        if (total > 0) return true;
        return this.createError({
          path: "test_session_fee",
          message: "Enter at least one special option fee greater than 0",
        });
      }
    ),
    onSubmit: async (values) => {
      const isSpecial = values.is_special_batch === true;
      dispatch(
        addBatch({
          authToken,
          values: {
            name: values.name,
            description: values.description,
            batch_type: values.batch_type,
            startdate: values.startdate,
            enddate: values.enddate,
            is_special_batch: isSpecial,
            batch_fee: isSpecial ? "0" : String(values.batch_fee),
            test_session_fee: isSpecial
              ? Number(values.test_session_fee) || 0
              : 0,
            optional_revision_fee: isSpecial
              ? Number(values.optional_revision_fee) || 0
              : 0,
            compulsory_revision_fee: isSpecial
              ? Number(values.compulsory_revision_fee) || 0
              : 0,
          },
        })
      )
        .unwrap()
        .then(() => {
          onClose();
          formik.resetForm();
          dispatch(fetchBatches({ authToken }));
        });
    },
  });

  const handleSpecialBatchChange = (e) => {
    const checked = e.target.checked;
    formik.setFieldValue("is_special_batch", checked);
    if (checked) {
      formik.setFieldValue("batch_fee", "0");
      formik.setFieldError("batch_fee", undefined);
    } else {
      formik.setFieldValue("test_session_fee", "");
      formik.setFieldValue("optional_revision_fee", "");
      formik.setFieldValue("compulsory_revision_fee", "");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
                <Input
                  type="text"
                  name="batch_type"
                  borderRadius={"0.5rem"}
                  value={formik.values.batch_type}
                  onChange={formik.handleChange}
                />
                {formik.touched.batch_type && formik.errors.batch_type ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.batch_type}
                  </Box>
                ) : null}
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
                    Set option fees here. At enrollment, admins only select which
                    options apply to each student.
                  </Text>
                )}
              </FormControl>

              {!formik.values.is_special_batch && (
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

              {formik.values.is_special_batch && (
                <Box
                  w="100%"
                  border="1px solid"
                  borderColor="#E0E8EC"
                  borderRadius="xl"
                  p={4}
                  bg="#FAFBFC"
                >
                  <Text fontWeight="600" fontSize="sm" mb={3}>
                    Special Batch Option Fees
                  </Text>
                  <VStack spacing={3} align="stretch">
                    {SPECIAL_FEE_FIELDS.map(({ name, label }) => (
                      <FormControl key={name} id={name}>
                        <FormLabel fontSize={13}>{label}</FormLabel>
                        <Input
                          type="number"
                          name={name}
                          min={0}
                          step="1"
                          borderRadius="0.5rem"
                          placeholder="0"
                          value={formik.values[name]}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                        {formik.touched[name] && formik.errors[name] ? (
                          <Box color="red" fontSize="sm" mt={1}>
                            {formik.errors[name]}
                          </Box>
                        ) : null}
                      </FormControl>
                    ))}
                  </VStack>
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

export default AddModel;
