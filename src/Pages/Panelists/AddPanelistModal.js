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
  Select,
  Textarea,
  VStack,
  Box,
  Image,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useDispatch, useSelector } from "react-redux";
import { addPanelist, fetchPanelists } from "../../Features/panelistSlice";

function AddPanelistModal({ isOpen, onClose }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [preview, setPreview] = useState("");
  const { addStatus } = useSelector((state) => state.panelists);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      name: "",
      phone: "",
      description: "",
      is_active: "true",
      photo: null,
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().required("Required"),
      phone: Yup.string().trim().required("Required"),
      description: Yup.string().trim().required("Required"),
    }),
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("phone", values.phone.trim());
      formData.append("description", values.description.trim());
      formData.append("is_active", values.is_active);
      if (values.photo) {
        formData.append("photo", values.photo);
      }

      dispatch(addPanelist({ formData, authToken }))
        .unwrap()
        .then(() => {
          formik.resetForm();
          setPreview("");
          onClose();
          dispatch(fetchPanelists({ authToken }));
        })
        .catch(() => {});
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setPreview("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="text-xl font-semibold">Add Panelist</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl id="name" isRequired>
                <FormLabel fontSize={14}>Name</FormLabel>
                <Input
                  type="text"
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

              <FormControl id="description" isRequired>
                <FormLabel fontSize={14}>Description</FormLabel>
                <Textarea
                  name="description"
                  rows={4}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                />
                {formik.touched.description && formik.errors.description ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.description}
                  </Box>
                ) : null}
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

              <FormControl id="photo">
                <FormLabel fontSize={14}>Photo</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  name="photo"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    formik.setFieldValue("photo", file);
                    setPreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                {preview ? (
                  <Image
                    src={preview}
                    alt="Preview"
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
              onClick={handleClose}
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
            >
              Add Panelist
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default AddPanelistModal;
