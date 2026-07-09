import React, { useEffect, useState } from "react";
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
  Textarea,
  Grid,
  GridItem,
  Checkbox,
  Image,
  Text,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import {
  fetchBatches,
  selectActiveBatches,
} from "../../Features/batchSlice.js";
import { Pen } from "lucide-react";
import { useDispatch } from "react-redux";
import { basicUpdate, fetchStudents } from "../../Features/studentSlice";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import { getMediaUrl } from "../../utlls/useful.js";
import CameraCapture from "../../Components/CameraCapture";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

function UpdateModal({ student }) {
  const viewOnly = isStudentViewOnly();
  const [isOpen, setIsOpen] = useState(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const [photoFile, setPhotoFile] = useState(null);

  const batches = useSelector(selectActiveBatches);
  const { updateStatus } = useSelector((state) => state.students);
  const dispatch = useDispatch();

  const currentBatchId = student?.batch?._id || student?.batch || "";

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

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
    }
  }, [isOpen]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: student?.name || "",
      email: student?.email || "",
      phone: student?.phone || "",
      batch: currentBatchId,
      remarks: student?.remarks || "",
      skip_profile_completion: student?.skip_profile_completion === true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      email: Yup.string().email("Invalid email address").required("Required"),
      phone: Yup.string().required("Required"),
      batch: Yup.string().required("Please select a batch"),
      remarks: Yup.string(),
    }),
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("batch", values.batch);
      formData.append("remarks", values.remarks || "");
      if (!viewOnly) {
        formData.append(
          "skip_profile_completion",
          values.skip_profile_completion ? "true" : "false"
        );
      }
      if (photoFile) {
        formData.append("image", photoFile);
      }

      try {
        await dispatch(
          basicUpdate({
            authToken,
            studentId: student._id,
            formData,
          })
        ).unwrap();
        dispatch(fetchStudents({ authToken }));
        setPhotoFile(null);
        onClose();
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "Failed to update student";
        if (/email/i.test(message)) {
          formik.setFieldError("email", message);
          formik.setFieldTouched("email", true, false);
        }
      }
    },
  });

  return (
    <>
      <button
        type="button"
        className="hover:bg-[#FFCB82] hover:text-[#85652D] font-medium p-[10px] rounded-xl transition-colors duration-300"
        onClick={onOpen}
      >
        <Pen size={18} />
      </button>
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
            Update Student
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
                    onChange={(batchId) => formik.setFieldValue("batch", batchId)}
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

              {student?.image ? (
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    Current Photo
                  </Text>
                  <Image
                    src={getMediaUrl(student.image)}
                    alt={student.name}
                    maxH="180px"
                    borderRadius="lg"
                    objectFit="cover"
                  />
                </GridItem>
              ) : null}

              <GridItem colSpan={{ base: 1, md: 2 }}>
                <CameraCapture
                  onCapture={setPhotoFile}
                  label={
                    student?.image
                      ? "Replace Student Photo (Camera)"
                      : "Student Photo (Camera)"
                  }
                />
              </GridItem>

              {!viewOnly && (
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <FormControl>
                    <Checkbox
                      name="skip_profile_completion"
                      isChecked={formik.values.skip_profile_completion}
                      onChange={formik.handleChange}
                      colorScheme="orange"
                    >
                      Allow skip profile completion on first login
                    </Checkbox>
                    <Box fontSize="xs" color="gray.500" mt={1} ml={6}>
                      When enabled, this student is not required to complete their
                      profile before using the system.
                    </Box>
                  </FormControl>
                </GridItem>
              )}
            </Grid>
          </ModalBody>

          <ModalFooter
            flexShrink={0}
            borderTopWidth="1px"
            borderColor="gray.100"
          >
            <Button
              type="button"
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
              _hover={{
                backgroundColor: "#74A0E3",
                color: "#223163",
              }}
              fontWeight="500"
              type="submit"
              loadingText="Updating"
              isLoading={updateStatus === "loading"}
            >
              Update Student
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default UpdateModal;
