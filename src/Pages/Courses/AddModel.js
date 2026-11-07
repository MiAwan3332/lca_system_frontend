import { Input } from '../../Components/AccessInputs';
import AccessForm from '../../Components/AccessForm';
import FormControl from '../../Components/AccessFormControl';
import { useAccessCreateFormik as useFormik } from '../../utlls/accessForms';
import React, { useState } from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, FormLabel, VStack, Box } from '@chakra-ui/react';

import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector, useDispatch } from "react-redux";
import { fetchCourses, addCourse } from "../../Features/courseSlice";

function AddModel({ isOpen, onClose }) {
  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { addStatus } = useSelector((state) => state.courses);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      fee: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      description: Yup.string().required("Required"),
      fee: Yup.number().required("Required"),
    }),
    onSubmit: async (values) => {
      dispatch(addCourse({ authToken, course: values }))
        .unwrap()
        .then(() => {
          onClose();
          dispatch(fetchCourses({ authToken }));
        });
    },
  });
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <AccessForm component={ModalContent}>
        <ModalHeader className="text-xl font-semibold">Add Course</ModalHeader>
        <ModalCloseButton />
        <AccessForm onSubmit={formik.handleSubmit}>
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
              <FormControl id="fee">
                <FormLabel fontSize={14}>Fee</FormLabel>
                <Input
                  type="number"
                  min="0"
                  name="fee"
                  borderRadius={"0.5rem"}
                  value={formik.values.fee}
                  onChange={formik.handleChange}
                />
                {formik.touched.fee && formik.errors.fee ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.fee}
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
              loadingText="Adding..."
              isLoading={addStatus === "loading"}
            >
              Add
            </Button>
          </ModalFooter>
        </AccessForm>
      </AccessForm>
    </Modal>
  );
}

export default AddModel;
