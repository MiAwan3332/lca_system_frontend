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
  Image,
  SimpleGrid,
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
import { getMediaUrl } from "../../utlls/useful";
import {
  fetchBatches,
  selectActiveInterviewBatches,
} from "../../Features/batchSlice";

function UpdateQualifierModal({ qualifier }) {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const [preview, setPreview] = useState("");
  const { updateStatus } = useSelector((state) => state.qualifiers);
  const interviewBatches = useSelector(selectActiveInterviewBatches);
  const dispatch = useDispatch();

  const currentBatchId =
    qualifier?.batch?._id || qualifier?.batch || "";

  useEffect(() => {
    if (!isOpen || !authToken) return;
    dispatch(
      fetchBatches({
        authToken,
        queryParams: { limit: 200, page: 1, query: "", is_active: "true" },
      })
    );
  }, [isOpen, authToken, dispatch]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: qualifier?.name || "",
      phone: qualifier?.phone || "",
      email: qualifier?.email || "",
      cnic: qualifier?.cnic || "",
      city: qualifier?.city || "",
      father_name: qualifier?.father_name || "",
      father_phone: qualifier?.father_phone || "",
      description: qualifier?.description || "",
      batch: currentBatchId,
      is_active: qualifier?.is_active === false ? "false" : "true",
      photo: null,
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().required("Required"),
      phone: Yup.string().trim().required("Required"),
      email: Yup.string().email("Invalid email").nullable(),
      batch: Yup.string().required("Interview batch is required"),
    }),
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("phone", values.phone.trim());
      formData.append("email", values.email?.trim() || "");
      formData.append("cnic", values.cnic?.trim() || "");
      formData.append("city", values.city?.trim() || "");
      formData.append("father_name", values.father_name?.trim() || "");
      formData.append("father_phone", values.father_phone?.trim() || "");
      formData.append("description", values.description?.trim() || "");
      formData.append("batch", values.batch);
      formData.append("is_active", values.is_active);
      if (values.photo) {
        formData.append("photo", values.photo);
      }

      dispatch(
        updateQualifier({
          qualifierId: qualifier._id,
          formData,
          authToken,
        })
      )
        .unwrap()
        .then(() => {
          onClose();
          dispatch(fetchQualifiers({ authToken }));
        })
        .catch(() => {});
    },
  });

  useEffect(() => {
    if (isOpen) {
      setPreview(getMediaUrl(qualifier?.photo) || "");
    }
  }, [isOpen, qualifier?.photo]);

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

  return (
    <>
      <ActionButton
        variant="blue"
        icon={<Pen size={16} />}
        label="Update"
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Update Qualifier
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={formik.handleSubmit}>
            <ModalBody>
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

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl id="name" isRequired>
                    <FormLabel fontSize={14}>Name</FormLabel>
                    <Input
                      name="name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.name && formik.errors.name ? (
                      <Box color="red" fontSize="sm">
                        {formik.errors.name}
                      </Box>
                    ) : null}
                  </FormControl>
                  <FormControl id="phone" isRequired>
                    <FormLabel fontSize={14}>Phone No</FormLabel>
                    <Input
                      type="tel"
                      name="phone"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.phone && formik.errors.phone ? (
                      <Box color="red" fontSize="sm">
                        {formik.errors.phone}
                      </Box>
                    ) : null}
                  </FormControl>
                  <FormControl id="email">
                    <FormLabel fontSize={14}>Email</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                    />
                  </FormControl>
                  <FormControl id="cnic">
                    <FormLabel fontSize={14}>CNIC</FormLabel>
                    <Input
                      name="cnic"
                      value={formik.values.cnic}
                      onChange={formik.handleChange}
                    />
                  </FormControl>
                  <FormControl id="city">
                    <FormLabel fontSize={14}>City</FormLabel>
                    <Input
                      name="city"
                      value={formik.values.city}
                      onChange={formik.handleChange}
                    />
                  </FormControl>
                  <FormControl id="is_active">
                    <FormLabel fontSize={14}>Status</FormLabel>
                    <Select
                      name="is_active"
                      value={formik.values.is_active}
                      onChange={formik.handleChange}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Select>
                  </FormControl>
                  <FormControl id="father_name">
                    <FormLabel fontSize={14}>Father Name</FormLabel>
                    <Input
                      name="father_name"
                      value={formik.values.father_name}
                      onChange={formik.handleChange}
                    />
                  </FormControl>
                  <FormControl id="father_phone">
                    <FormLabel fontSize={14}>Father Phone</FormLabel>
                    <Input
                      type="tel"
                      name="father_phone"
                      value={formik.values.father_phone}
                      onChange={formik.handleChange}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl id="description">
                  <FormLabel fontSize={14}>Notes / Description</FormLabel>
                  <Textarea
                    name="description"
                    rows={3}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                  />
                </FormControl>

                <FormControl id="photo">
                  <FormLabel fontSize={14}>Photo</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    name="photo"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      formik.setFieldValue("photo", file);
                      setPreview(
                        file
                          ? URL.createObjectURL(file)
                          : getMediaUrl(qualifier?.photo) || ""
                      );
                    }}
                  />
                  {preview ? (
                    <Image
                      src={preview}
                      alt={qualifier?.name || "Qualifier"}
                      mt={3}
                      boxSize="96px"
                      objectFit="cover"
                      borderRadius="full"
                    />
                  ) : null}
                </FormControl>
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
    </>
  );
}

export default UpdateQualifierModal;
