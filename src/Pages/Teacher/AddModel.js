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
import { Avatar } from "@files-ui/react";

const imageSrc =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function AddTeacher({ isOpen, onClose }) {
  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { addStatus } = useSelector((state) => state.teachers);
  const dispatch = useDispatch();

  const [imageSource, setImageSource] = useState(imageSrc);
  const [fileName, setFileName] = useState(null);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      image: null,
      resume: null,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      email: Yup.string().email("Invalid email address").required("Required"),
      phone: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("image", imageSource);
      formData.append("resume", fileName);

      dispatch(addTeacher({ formData, authToken }))
        .unwrap()
        .then(() => {
          onClose();
          dispatch(fetchTeachers({ authToken }));
        });
    },
  });

  const handleChangeSource = async (selectedFile) => {
    setImageSource(selectedFile);
  };

    const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      formik.setFieldValue('resume', file);
    }
  };

  return (
    <>
      {/* <Button onClick={onOpen}>Add Teacher</Button> */}
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
                <FormControl id="name">
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
                <FormControl id="email">
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
                  {formik.touched.phone && formik.errors.phone ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.phone}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl id="image">
                  <FormLabel fontSize={14}>Image</FormLabel>
                  {/* <Input
                    type="file"
                    accept="image/*"
                    name="image"
                    onChange={(e) =>
                      formik.setFieldValue("image", e.target.files[0])
                    }
                  /> */}
                  <Avatar
                    src={imageSource}
                    alt="Avatar"
                    changeLabel="Select Image"
                    onChange={handleChangeSource}
                  />
                </FormControl>
                
                <FormControl id="resume">
        <FormLabel fontSize={14}>Resume</FormLabel>
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, DOCX (Max. 10MB)
              </p>
              {fileName && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {fileName}
                </p>
              )}
            </div>
            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              name="resume"
              onChange={handleFileChange}
            />
          </label>
        </div>
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
