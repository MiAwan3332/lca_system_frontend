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
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector, useDispatch } from "react-redux";
import { addTeacher, fetchTeachers } from "../../Features/teacherSlice";

function AddTeacher({ isOpen, onClose }) {
  const [authToken] = useState(Cookies.get("authToken"));

  const { addStatus } = useSelector((state) => state.teachers);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      image: null,
      resume: null,
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().required("Required"),
      email: Yup.string().email("Invalid email address").required("Required"),
      phone: Yup.string(),
    }),
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("email", values.email.trim());
      if (values.phone?.trim()) {
        formData.append("phone", values.phone.trim());
      }
      if (values.image) {
        formData.append("image", values.image);
      }
      if (values.resume) {
        formData.append("resume", values.resume);
      }

      dispatch(addTeacher({ formData, authToken }))
        .unwrap()
        .then(() => {
          formik.resetForm();
          onClose();
          dispatch(fetchTeachers({ authToken }));
        });
    },
  });

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Add Teacher
          </ModalHeader>
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
                <FormControl id="email" isRequired>
                  <FormLabel fontSize={14}>Email</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.email}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl id="phone">
                  <FormLabel fontSize={14}>Phone</FormLabel>
                  <Input
                    type="phone"
                    name="phone"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                  />
                </FormControl>
                <FormControl id="image">
                  <FormLabel fontSize={14}>Image</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    name="image"
                    onChange={(e) =>
                      formik.setFieldValue("image", e.target.files[0] || null)
                    }
                  />
                </FormControl>
                <FormControl id="resume">
                  <FormLabel fontSize={14}>Resume</FormLabel>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    name="resume"
                    onChange={(e) =>
                      formik.setFieldValue("resume", e.target.files[0] || null)
                    }
                  />
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
                Add Teacher
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}

export default AddTeacher;
