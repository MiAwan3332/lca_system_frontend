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
  VStack,
  Box,
  Select
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector, useDispatch } from "react-redux";
import { fetchMcqs, addMcq } from "../../Features/mcqSlice";
import { fetchCourses , selectAllCourses  } from "../../Features/courseSlice";

function AddModel({ isOpen, onClose }) {
  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { addStatus } = useSelector((state) => state.mcqs);
  const dispatch = useDispatch();

  const courses = useSelector(selectAllCourses);
  const fetchStatus = useSelector((state) => state.courses.fetchStatus);
  
  useEffect(() => {
    if (fetchStatus === 'idle') {
      dispatch(fetchCourses({ authToken }));
    }
  }, [dispatch, fetchStatus, authToken]);

  // if (fetchStatus === 'loading') {
  //   return <div>Loading...</div>;
  // }

  // if (fetchStatus === 'failure') {
  //   return <div>Error loading courses</div>;
  // }

  const formik = useFormik({
    initialValues: {
      question: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correct_option: "",
      courseId: "",
    },
    validationSchema: Yup.object({
      question: Yup.string().required("Required"),
      option1: Yup.string().required("Required"),
      option2: Yup.string().required("Required"),
      option3: Yup.string().required("Required"),
      option4: Yup.string().required("Required"),
      correct_option: Yup.string().required("Required"),
      courseId: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      dispatch(addMcq({ mcqData: values, authToken }))
        .unwrap()
        .then(() => {
          formik.resetForm();
          onClose();
          dispatch(fetchMcqs({ authToken }));
        });
    },
  });
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="text-xl font-semibold">Add Mcq</ModalHeader>
        <ModalCloseButton />
        {fetchStatus === 'loading' && <div>Loading...</div>}
        {fetchStatus === 'failure' && <div>Error loading courses</div>}
        <form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl id="question">
                <FormLabel fontSize={14}>Question</FormLabel>
                <Input
                  type="text"
                  name="question"
                  borderRadius={"0.5rem"}
                  value={formik.values.question}
                  onChange={formik.handleChange}
                />
                {formik.touched.question && formik.errors.question ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.question}
                  </Box>
                ) : null}
              </FormControl>
              <FormControl id="option1">
                <FormLabel fontSize={14}>option-A</FormLabel>
                <Input
                  type="text"
                  name="option1"
                  borderRadius={"0.5rem"}
                  value={formik.values.option1}
                  onChange={formik.handleChange}
                />
                {formik.touched.option1 && formik.errors.option1 ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.option1}
                  </Box>
                ) : null}
              </FormControl>
              <FormControl id="option2">
                <FormLabel fontSize={14}>option-B</FormLabel>
                <Input
                  type="text"
                  name="option2"
                  borderRadius={"0.5rem"}
                  value={formik.values.option2}
                  onChange={formik.handleChange}
                />
                {formik.touched.option2 && formik.errors.option2 ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.option2}
                  </Box>
                ) : null}
              </FormControl>
              <FormControl id="option3">
                <FormLabel fontSize={14}>option-C</FormLabel>
                <Input
                  type="text"
                  name="option3"
                  borderRadius={"0.5rem"}
                  value={formik.values.option3}
                  onChange={formik.handleChange}
                />
                {formik.touched.option3 && formik.errors.option3 ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.option3}
                  </Box>
                ) : null}
              </FormControl>
              <FormControl id="option4">
                <FormLabel fontSize={14}>option-D</FormLabel>
                <Input
                  type="text"
                  name="option4"
                  borderRadius={"0.5rem"}
                  value={formik.values.option4}
                  onChange={formik.handleChange}
                />
                {formik.touched.option4 && formik.errors.option4 ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.option4}
                  </Box>
                ) : null}
              </FormControl>
              <FormControl id="correct_option">
                <FormLabel fontSize={14}>correct option</FormLabel>
                <Select
                  name="correct_option"
                  borderRadius={"0.5rem"}
                  value={formik.values.correct_option}
                  onChange={formik.handleChange}
                >
                  <option value='0'>A</option>
                  <option value='1'>B</option>
                  <option value='2'>C</option>
                  <option value='3'>D</option>
                </Select>
                {formik.touched.correct_option && formik.errors.correct_option ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.correct_option}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl id="courseId">
                <FormLabel fontSize={14}>courses</FormLabel>
                <Select
                  name="courseId"
                  borderRadius={"0.5rem"}
                  value={formik.values.courseId}
                  onChange={formik.handleChange}
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </Select>
                {formik.touched.courseId && formik.errors.courseId ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.courseId}
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
        </form>
      </ModalContent>
    </Modal>
  );
}

export default AddModel;
