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
  Select,
  Textarea,
  VStack,
  Box,
  Grid,
  GridItem,
  useToast,
} from "@chakra-ui/react";
import { useFormik } from "formik";
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
import { getMediaUrl } from "../../utlls/useful";
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

function UpdateQualifierModal({ qualifier }) {
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
        queryParams: { limit: 200, page: 1, query: "", is_active: "true" },
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
    }),
    onSubmit: async (values) => {
      try {
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
        <ModalContent {...responsiveModalContentProps}>
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
        </ModalContent>
      </Modal>
    </>
  );
}

export default UpdateQualifierModal;
