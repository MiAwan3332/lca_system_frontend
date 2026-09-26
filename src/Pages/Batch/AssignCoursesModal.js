import React, { useState, useEffect } from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Checkbox, VStack } from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Check } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  assignCoursesToBatch,
  fetchBatchCourses,
  fetchBatches,
  selectBatchCourses,
} from "../../Features/batchSlice";
import { fetchCourses, selectAllCourses, setLimitFilter } from "../../Features/courseSlice";
import LcaLogoLoading from "../../Components/LcaLogoLoading";

const AssignCoursesModal = ({ batchId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { assignCoursesStatus, fetchBatchCoursesStatus } = useSelector(
    (state) => state.batches
  );
  const batchCourses = useSelector(selectBatchCourses);
  const courses = useSelector(selectAllCourses);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      courses: batchCourses,
    },
    validationSchema: Yup.object({
      courses: Yup.array().required("Required"),
    }),
    onSubmit: async (values) => {
      dispatch(
        assignCoursesToBatch({ authToken, batchId, courseIds: values.courses })
      )
        .unwrap()
        .then(() => {
          onClose();
          dispatch(fetchBatches({ authToken }));
        });
    },
  });

  const handleOpenModal = () => {
    dispatch(fetchBatchCourses({ authToken, batchId }))
      .unwrap()
      .then((data) => {
        const courseIds = data.map((course) => course._id);
        formik.setFieldValue("courses", courseIds);
      });
    onOpen();
  };

  useEffect(() => {
    dispatch(setLimitFilter(999999));
    dispatch(fetchCourses({ authToken }));
  }, []);

  return (
    <>
      <button
        className="hover:bg-[#7AEF85] hover:text-[#257947] font-medium p-[10px] rounded-xl transition-colors duration-300 flex flex-nowrap items-center gap-1.5 pr-3"
        onClick={handleOpenModal}
      >
        <Check size={18} />
        <span>Courses</span>
      </button>

      <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Assign Courses to Batch
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={formik.handleSubmit}>
            <ModalBody>
              <div>
                {fetchBatchCoursesStatus === "loading" ? (
                  <LcaLogoLoading size="sm" />
                ) : (
                  <VStack spacing={2} align="stretch" w="full" maxH="60vh" overflowY="auto">
                    {courses.map((course) => (
                      <Checkbox
                        key={course._id}
                        colorScheme="green"
                        py={2}
                        px={3}
                        borderWidth="1px"
                        className="flex-1"
                        rounded="md"
                        type="checkbox"
                        id={course._id}
                        name="courses"
                        value={course._id}
                        onChange={formik.handleChange}
                        isChecked={formik.values.courses.includes(course._id)}
                        borderColor={
                          formik.values.courses.includes(course._id)
                            ? "#7AEF85"
                            : "#E0E8EC"
                        }
                      >
                        {course.name}
                      </Checkbox>
                    ))}
                  </VStack>
                )}
              </div>
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
                backgroundColor={"#7AEF85"}
                color={"#257947"}
                _hover={{
                  backgroundColor: "#65C76E",
                  color: "#184E2E",
                }}
                fontWeight={"500"}
                type="submit"
                loadingText="Assigning"
                isLoading={assignCoursesStatus === "loading"}
              >
                Assign
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AssignCoursesModal;
