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
  Select,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { Pen } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMcqs, updateMcq } from "../../Features/mcqSlice";
import { fetchCourses, selectAllCourses } from "../../Features/courseSlice";

function UpdateModal({ mcq }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));
  const { updateStatus } = useSelector((state) => state.mcqs);
  const dispatch = useDispatch();

  const courses = useSelector(selectAllCourses);
  const fetchStatus = useSelector((state) => state.courses.fetchStatus);

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchCourses({ authToken }));
    }
  }, [dispatch, fetchStatus, authToken]);

  const formik = useFormik({
    enableReinitialize: true, // This allows the form to reinitialize with new values when `mcq` changes.
    initialValues: {
      _id: mcq?._id || "",
      question: mcq?.question || "",
      option1: mcq?.option1 || "",
      option2: mcq?.option2 || "",
      option3: mcq?.option3 || "",
      option4: mcq?.option4 || "",
      correct_option: mcq?.correct_option?.toString() || "",
      courseId: mcq?.courseId?._id || mcq?.courseId || "",
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
      dispatch(updateMcq({ mcqId: mcq._id, mcqData: values, authToken  }))
        .unwrap()
        .then(() => {
          onClose();
          dispatch(fetchMcqs({ authToken }));
        });
    },
  });

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
            Update Mcq
          </ModalHeader>
          <ModalCloseButton />
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
                  <FormLabel fontSize={14}>Correct Option</FormLabel>
                  <Select
                    name="correct_option"
                    borderRadius={"0.5rem"}
                    value={formik.values.correct_option}
                    onChange={formik.handleChange}
                  >
                    <option value="0">A</option>
                    <option value="1">B</option>
                    <option value="2">C</option>
                    <option value="3">D</option>
                  </Select>
                  {formik.touched.correct_option &&
                  formik.errors.correct_option ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.correct_option}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl id="courseId">
                  <FormLabel fontSize={14}>Courses</FormLabel>
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
    </>
  );
}

export default UpdateModal;
