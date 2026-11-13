import { Input, Select, Textarea } from '../../Components/AccessInputs';
import AccessForm from '../../Components/AccessForm';
import FormControl from '../../Components/AccessFormControl';
import { useAccessUpdateFormik as useFormik } from '../../utlls/accessForms';
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
  FormLabel,
  VStack,
  Box,
  Grid,
  GridItem,
  Text,
  Flex,
  Badge,
  useToast,
} from '@chakra-ui/react';

import * as Yup from "yup";
import Cookies from "js-cookie";
import { Pen } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateQualifier,
  fetchQualifiers,
} from "../../Features/qualifierSlice";
import ActionButton from "../../Components/ActionButton";
import CameraCapture from "../../Components/CameraCapture";
import { getMediaUrl, hasPermission } from "../../utlls/useful";
import {
  fetchBatches,
  selectActiveInterviewBatches,
} from "../../Features/batchSlice";
import {
  educationEntriesToFormRows,
  formRowsToEducationPayload,
} from "../../utlls/qualifierEducation";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";
import QualifierProfileDetailsFields from "./QualifierProfileDetailsFields";
import { FEE_PAYMENT_METHODS } from "../../utlls/paymentMethods";

function UpdateQualifierModal({ qualifier }) {
  const canUpdate = hasPermission([
    "updateQualifier",
    "qualifiers.update.qualifier",
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();
  const onOpen = () => setIsOpen(true);
  const onClose = () => {
    setPhotoFile(null);
    setCustomSubject("");
    setIsOpen(false);
  };
  const [authToken] = useState(Cookies.get("authToken"));
  const [photoFile, setPhotoFile] = useState(null);
  const [customSubject, setCustomSubject] = useState("");
  const { updateStatus } = useSelector((state) => state.qualifiers);
  const interviewBatches = useSelector(selectActiveInterviewBatches);
  const dispatch = useDispatch();

  const currentBatchId = String(
    qualifier?.batch?._id || qualifier?.batch || ""
  );

  useEffect(() => {
    if (!isOpen || !authToken) return;
    dispatch(
      fetchBatches({
        authToken,
        queryParams: { limit: 100, page: 1, query: "", is_active: "true" },
      })
    );
  }, [isOpen, authToken, dispatch]);

  useEffect(() => {
    if (!isOpen) {
      setPhotoFile(null);
      setCustomSubject("");
    }
  }, [isOpen]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: qualifier?.name || "",
      phone: qualifier?.phone || "",
      email: qualifier?.email || "",
      cnic: qualifier?.cnic || "",
      css_pms_roll_no: qualifier?.css_pms_roll_no || "",
      exam_type: qualifier?.exam_type || "",
      class_type: qualifier?.class_type || "",
      city: qualifier?.city || "",
      province: qualifier?.province || "",
      father_name: qualifier?.father_name || "",
      father_phone: qualifier?.father_phone || "",
      description: qualifier?.description || "",
      latest_degree: qualifier?.latest_degree || "",
      no_of_attempts:
        qualifier?.no_of_attempts != null
          ? String(qualifier.no_of_attempts)
          : "0",
      education_entries: educationEntriesToFormRows(
        qualifier?.education_background
      ),
      optional_subjects: Array.isArray(qualifier?.optional_subjects)
        ? qualifier.optional_subjects.filter(Boolean)
        : [],
      batch: currentBatchId,
      is_active: qualifier?.is_active === false ? "false" : "true",
      total_fee:
        qualifier?.total_fee != null ? String(qualifier.total_fee) : "0",
      discount_amount:
        qualifier?.discount_amount != null
          ? String(qualifier.discount_amount)
          : "0",
      discount_description: qualifier?.discount_description || "",
      paid_fee:
        qualifier?.paid_fee != null ? String(qualifier.paid_fee) : "0",
      payment_method: qualifier?.payment_method || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().required("Required"),
      phone: Yup.string().trim().required("Required"),
      // Empty email must be allowed — Yup.email() rejects "" unless transformed.
      email: Yup.string()
        .trim()
        .transform((value) => (value === "" ? undefined : value))
        .email("Invalid email")
        .notRequired(),
      batch: Yup.string().required("Interview batch is required"),
      class_type: Yup.string().oneOf(
        ["", "Online", "On Campus"],
        "Select Online or On Campus"
      ),
      no_of_attempts: Yup.number()
        .transform((_value, original) => {
          if (original === "" || original === null || original === undefined) {
            return 0;
          }
          const n = Number(original);
          return Number.isFinite(n) ? n : NaN;
        })
        .typeError("Must be a number")
        .min(0, "Must be 0 or more")
        .integer("Must be a whole number"),
      total_fee: Yup.number()
        .transform((value, original) =>
          original === "" || original === null || original === undefined
            ? 0
            : value
        )
        .typeError("Must be a number")
        .min(0, "Cannot be negative"),
      discount_amount: Yup.number()
        .transform((value, original) =>
          original === "" || original === null || original === undefined
            ? 0
            : value
        )
        .typeError("Must be a number")
        .min(0, "Cannot be negative")
        .test(
          "max-total",
          "Cannot be greater than total fee",
          function (value) {
            const total = Number(this.parent.total_fee) || 0;
            return (Number(value) || 0) <= total;
          }
        ),
      paid_fee: Yup.number()
        .transform((value, original) =>
          original === "" || original === null || original === undefined
            ? 0
            : value
        )
        .typeError("Must be a number")
        .min(0, "Cannot be negative")
        .test(
          "max-payable",
          "Cannot be greater than payable fee",
          function (value) {
            const total = Number(this.parent.total_fee) || 0;
            const discount = Number(this.parent.discount_amount) || 0;
            const payable = Math.max(total - discount, 0);
            return (Number(value) || 0) <= payable;
          }
        ),
      payment_method: Yup.string().oneOf(
        ["", ...FEE_PAYMENT_METHODS],
        "Select a valid payment method"
      ),
    }),
    onSubmit: async (values) => {
      try {
        const totalFee = Math.max(0, Number(values.total_fee) || 0);
        const discountAmount = Math.min(
          Math.max(0, Number(values.discount_amount) || 0),
          totalFee
        );
        const payable = Math.max(totalFee - discountAmount, 0);
        const paidFee = Math.min(
          Math.max(0, Number(values.paid_fee) || 0),
          payable
        );
        const pendingFee = Math.max(payable - paidFee, 0);

        const formData = new FormData();
        formData.append("name", values.name.trim());
        formData.append("phone", values.phone.trim());
        formData.append("email", values.email?.trim() || "");
        formData.append("cnic", values.cnic?.trim() || "");
        formData.append(
          "css_pms_roll_no",
          values.css_pms_roll_no?.trim() || ""
        );
        formData.append("exam_type", values.exam_type || "");
        formData.append("class_type", values.class_type || "");
        formData.append("city", values.city?.trim() || "");
        formData.append("province", values.province?.trim() || "");
        formData.append("father_name", values.father_name?.trim() || "");
        formData.append("father_phone", values.father_phone?.trim() || "");
        formData.append("description", values.description?.trim() || "");
        formData.append("latest_degree", values.latest_degree?.trim() || "");
        formData.append(
          "no_of_attempts",
          String(Number(values.no_of_attempts) || 0)
        );
        formData.append(
          "education_background",
          JSON.stringify(formRowsToEducationPayload(values.education_entries))
        );
        formData.append(
          "optional_subjects",
          JSON.stringify(values.optional_subjects || [])
        );
        formData.append("batch", values.batch);
        formData.append("is_active", values.is_active);
        formData.append("total_fee", String(totalFee));
        formData.append("discount_amount", String(discountAmount));
        formData.append(
          "discount_description",
          discountAmount > 0
            ? values.discount_description?.trim() || ""
            : ""
        );
        formData.append("paid_fee", String(paidFee));
        formData.append("pending_fee", String(pendingFee));
        formData.append("payment_method", values.payment_method || "");
        if (photoFile instanceof File) {
          formData.append("photo", photoFile);
        }

        await dispatch(
          updateQualifier({
            qualifierId: qualifier._id,
            formData,
            authToken,
          })
        ).unwrap();
        onClose();
        dispatch(fetchQualifiers({ authToken }));
      } catch {
        // Error toast comes from the Redux slice.
      }
    },
  });

  const totalFee = Math.max(0, Number(formik.values.total_fee) || 0);
  const discountAmount = Math.min(
    Math.max(0, Number(formik.values.discount_amount) || 0),
    totalFee
  );
  const payableFee = Math.max(totalFee - discountAmount, 0);
  const paidFee = Math.min(
    Math.max(0, Number(formik.values.paid_fee) || 0),
    payableFee
  );
  const pendingFee = Math.max(payableFee - paidFee, 0);
  const paymentStatus =
    payableFee <= 0
      ? discountAmount > 0
        ? "Fully discounted"
        : "No fee"
      : pendingFee <= 0
        ? "Fully paid"
        : paidFee > 0
          ? "Partially paid"
          : "Unpaid";

  const handleSubmitClick = async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length) {
      formik.setTouched(
        Object.keys(formik.values).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {}),
        true
      );
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

  const batchOptions = useMemo(() => {
    const docs = [...interviewBatches];
    const current = qualifier?.batch;
    if (
      current?._id &&
      !docs.some((b) => String(b._id) === String(current._id))
    ) {
      docs.unshift(current);
    }
    return docs;
  }, [interviewBatches, qualifier?.batch]);

  const existingPhotoUrl = getMediaUrl(qualifier?.photo) || "";

  if (!canUpdate) {
    return null;
  }

  return (
    <>
      <ActionButton
        variant="blue"
        icon={<Pen size={16} />}
        label="Update"
        onClick={onOpen}
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("2xl")}
      >
        <ModalOverlay />
        <AccessForm component={ModalContent} {...responsiveModalContentProps}>
          <ModalHeader className="text-xl font-semibold">
            Update Qualifier
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            maxH={{ base: "70vh", md: "75vh" }}
            overflowY="auto"
          >
            <VStack spacing={4} align="stretch">
              <FormControl id="batch" isRequired>
                <FormLabel fontSize={14}>Interview Batch</FormLabel>
                <Select
                  name="batch"
                  placeholder="Select interview batch"
                  value={formik.values.batch}
                  onChange={formik.handleChange}
                >
                  {batchOptions.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name}
                      {batch.is_active === false ? " (Inactive)" : ""}
                      {batch.is_interview_batch !== true
                        ? " (Not interview)"
                        : ""}
                    </option>
                  ))}
                </Select>
                {formik.touched.batch && formik.errors.batch ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.batch}
                  </Box>
                ) : null}
              </FormControl>

              <Grid
                templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                gap={4}
              >
                <GridItem>
                  <FormControl id="name" isRequired>
                    <FormLabel fontSize={14}>Name</FormLabel>
                    <Input
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
                  <FormControl id="phone" isRequired>
                    <FormLabel fontSize={14}>Phone No</FormLabel>
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
                  <FormControl id="cnic">
                    <FormLabel fontSize={14}>CNIC</FormLabel>
                    <Input
                      name="cnic"
                      borderRadius="0.5rem"
                      value={formik.values.cnic}
                      onChange={formik.handleChange}
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl id="exam_type">
                    <FormLabel fontSize={14}>CSS or PMS</FormLabel>
                    <Select
                      name="exam_type"
                      borderRadius="0.5rem"
                      value={formik.values.exam_type}
                      onChange={formik.handleChange}
                    >
                      <option value="">Select</option>
                      <option value="CSS">CSS</option>
                      <option value="PMS">PMS</option>
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl id="css_pms_roll_no">
                    <FormLabel fontSize={14}>CSS/PMS Roll No</FormLabel>
                    <Input
                      name="css_pms_roll_no"
                      borderRadius="0.5rem"
                      placeholder="Optional"
                      value={formik.values.css_pms_roll_no}
                      onChange={formik.handleChange}
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl id="class_type">
                    <FormLabel fontSize={14}>Online / On Campus</FormLabel>
                    <Select
                      name="class_type"
                      borderRadius="0.5rem"
                      value={formik.values.class_type}
                      onChange={formik.handleChange}
                    >
                      <option value="">Select</option>
                      <option value="Online">Online</option>
                      <option value="On Campus">On Campus</option>
                    </Select>
                    {formik.touched.class_type && formik.errors.class_type ? (
                      <Box color="red" fontSize="sm">
                        {formik.errors.class_type}
                      </Box>
                    ) : null}
                  </FormControl>
                </GridItem>
                <GridItem>
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
                </GridItem>

                <QualifierProfileDetailsFields
                  formik={formik}
                  customSubject={customSubject}
                  setCustomSubject={setCustomSubject}
                  showEmail
                />
              </Grid>

              <FormControl id="description">
                <FormLabel fontSize={14}>Notes / Description</FormLabel>
                <Textarea
                  name="description"
                  rows={3}
                  borderRadius="0.5rem"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                />
              </FormControl>

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
                    Fee ledger
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
                  templateColumns={{ base: "1fr", sm: "1fr 1fr" }}
                  gap={3}
                  mb={3}
                >
                  <FormControl id="total_fee">
                    <FormLabel fontSize={14}>Total fee (Rs.)</FormLabel>
                    <Input
                      type="number"
                      name="total_fee"
                      min={0}
                      step="1"
                      borderRadius="0.5rem"
                      value={formik.values.total_fee}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.total_fee && formik.errors.total_fee ? (
                      <Box color="red" fontSize="sm" mt={1}>
                        {formik.errors.total_fee}
                      </Box>
                    ) : null}
                  </FormControl>
                  <FormControl id="discount_amount">
                    <FormLabel fontSize={14}>Discount (Rs.)</FormLabel>
                    <Input
                      type="number"
                      name="discount_amount"
                      min={0}
                      max={totalFee}
                      step="1"
                      borderRadius="0.5rem"
                      value={formik.values.discount_amount}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.discount_amount &&
                    formik.errors.discount_amount ? (
                      <Box color="red" fontSize="sm" mt={1}>
                        {formik.errors.discount_amount}
                      </Box>
                    ) : null}
                  </FormControl>
                  {discountAmount > 0 ? (
                    <FormControl id="discount_description" gridColumn="1 / -1">
                      <FormLabel fontSize={14}>Discount reason</FormLabel>
                      <Input
                        type="text"
                        name="discount_description"
                        borderRadius="0.5rem"
                        placeholder="Optional note for this discount"
                        value={formik.values.discount_description}
                        onChange={formik.handleChange}
                      />
                    </FormControl>
                  ) : null}
                  <FormControl id="paid_fee">
                    <FormLabel fontSize={14}>Paid fee (Rs.)</FormLabel>
                    <Input
                      type="number"
                      name="paid_fee"
                      min={0}
                      max={payableFee}
                      step="1"
                      borderRadius="0.5rem"
                      value={formik.values.paid_fee}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.paid_fee && formik.errors.paid_fee ? (
                      <Box color="red" fontSize="sm" mt={1}>
                        {formik.errors.paid_fee}
                      </Box>
                    ) : null}
                  </FormControl>
                  <FormControl id="payment_method">
                    <FormLabel fontSize={14}>Payment method</FormLabel>
                    <Select
                      name="payment_method"
                      borderRadius="0.5rem"
                      value={formik.values.payment_method}
                      onChange={formik.handleChange}
                    >
                      <option value="">None</option>
                      {FEE_PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid templateColumns="repeat(3, 1fr)" gap={3}>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Payable
                    </Text>
                    <Text fontWeight="600">{payableFee.toLocaleString()} Rs.</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Pending
                    </Text>
                    <Text
                      fontWeight="600"
                      color={pendingFee > 0 ? "red.500" : "green.600"}
                    >
                      {pendingFee.toLocaleString()} Rs.
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Paid
                    </Text>
                    <Text fontWeight="600">{paidFee.toLocaleString()} Rs.</Text>
                  </Box>
                </Grid>
              </Box>

              <CameraCapture
                key={isOpen ? `photo-${qualifier?._id}` : "closed"}
                onCapture={setPhotoFile}
                label="Qualifier Photo"
                enableCrop
                initialPreviewUrl={existingPhotoUrl}
                fileNamePrefix="qualifier-photo"
              />
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
              backgroundColor="#82B4FF"
              color="#2D4185"
              _hover={{ backgroundColor: "#74A0E3", color: "#223163" }}
              fontWeight="500"
              type="button"
              onClick={handleSubmitClick}
              loadingText="Updating"
              isLoading={updateStatus === "loading"}
            >
              Update
            </Button>
          </ModalFooter>
        </AccessForm>
      </Modal>
    </>
  );
}

export default UpdateQualifierModal;
