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
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { Pen } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { fetchBatches, updateBatch } from "../../Features/batchSlice";
import BatchDeactivateConfirmModal from "./BatchDeactivateConfirmModal";

const SPECIAL_FEE_FIELDS = [
  { name: "test_session_fee", label: "Test Session fee (Rs.)" },
  { name: "optional_revision_fee", label: "Optional Revision fee (Rs.)" },
  { name: "compulsory_revision_fee", label: "Compulsory Revision fee (Rs.)" },
];

function AddModel({ batch }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState(null);
  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));
  const { updateStatus } = useSelector((state) => state.batches);
  const dispatch = useDispatch();

  const onOpen = () => setIsOpen(true);
  const onClose = () => {
    setIsOpen(false);
    setShowDeactivateConfirm(false);
    setPendingValues(null);
  };

  const submitUpdate = (values) => {
    const isSpecial = values.is_special_batch === true;
    const payload = {
      name: values.name,
      description: values.description,
      batch_type: values.batch_type,
      startdate: values.startdate,
      enddate: values.enddate,
      is_special_batch: isSpecial,
      batch_fee: isSpecial ? "0" : String(values.batch_fee),
      test_session_fee: isSpecial ? Number(values.test_session_fee) || 0 : 0,
      optional_revision_fee: isSpecial
        ? Number(values.optional_revision_fee) || 0
        : 0,
      compulsory_revision_fee: isSpecial
        ? Number(values.compulsory_revision_fee) || 0
        : 0,
      is_active: values.is_active === "true",
    };
    dispatch(updateBatch({ authToken, values: payload, id: batch._id }))
      .unwrap()
      .then(() => {
        onClose();
        dispatch(fetchBatches({ authToken }));
      });
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: batch.name,
      description: batch.description,
      batch_type: batch.batch_type,
      batch_fee: batch.batch_fee ?? "",
      is_special_batch: batch.is_special_batch === true,
      test_session_fee:
        batch.special_fee_options?.test_session != null
          ? String(batch.special_fee_options.test_session)
          : "",
      optional_revision_fee:
        batch.special_fee_options?.optional_revision != null
          ? String(batch.special_fee_options.optional_revision)
          : "",
      compulsory_revision_fee:
        batch.special_fee_options?.compulsory_revision != null
          ? String(batch.special_fee_options.compulsory_revision)
          : "",
      startdate: batch.startdate,
      enddate: batch.enddate,
      is_active: batch.is_active !== false ? "true" : "false",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      description: Yup.string().required("Required"),
      batch_type: Yup.string().required("Required"),
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

  const confirmDeactivateUpdate = () => {
    if (pendingValues) {
      submitUpdate(pendingValues);
    }
    setShowDeactivateConfirm(false);
    setPendingValues(null);
  };

  return (
    <>
      <button
        className="hover:bg-[#FFCB82] hover:text-[#85652D] font-medium p-[10px] rounded-xl transition-colors duration-300"
        onClick={onOpen}
      >
        <Pen size={18} />
      </button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Update batch
          </ModalHeader>
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
                      Set option fees here. At enrollment, admins only select
                      which options apply to each student.
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

                <FormControl id="is_active">
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
                backgroundColor={"#82B4FF"}
                color={"#2D4185"}
                _hover={{
                  backgroundColor: "#74A0E3",
                  color: "#223163",
                }}
                fontWeight={"500"}
                type="submit"
                loadingText="Updating"
                isLoading={updateStatus === "loading"}
              >
                Update
              </Button>
            </ModalFooter>
          </form>
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
