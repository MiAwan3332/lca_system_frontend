import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Spinner,
  Checkbox,
  VStack,
  Input,
  HStack,
} from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Check } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchStudentEnrollments,
  createEnrollment,
} from "../../Features/enrollmentSlice";
import {
  fetchBatches,
  selectActiveBatches,
  selectCurrentActiveBatch,
  setLimitFilter,
} from "../../Features/batchSlice";
import { fetchStudents } from "../../Features/studentSlice";
import { createFee } from "../../Features/feeSlice";

const EnrollmentModal = ({ studentId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const batches = useSelector(selectActiveBatches);
  const activeBatch = useSelector(selectCurrentActiveBatch);
  const studentEnrollments = useSelector(
    (state) => state.enrollments.studentEnrollments
  );
  const { fetchStudentEnrollmentsStatus, createEnrollmentStatus } = useSelector(
    (state) => state.enrollments
  );
  const dispatch = useDispatch();

  const handleOpenModal = () => {
    dispatch(fetchStudentEnrollments({ authToken, studentId }))
      .unwrap()
      .then((data) => {
        batches.forEach((batch) => {
          formik.setFieldValue(
            `batch-${batch._id}-courses`,
            data.find((enrollment) => enrollment.batch === batch._id)
              ?.courses || []
          );
          batch.courses.forEach((course) => {
            formik.setFieldValue(
              `fee-${batch._id}-${course._id}`,
              data.find((enrollment) => enrollment.batch === batch._id)?.fees[
                batch.courses.indexOf(course)
              ] ||
                course.fee ||
                0
            );
          });
        });
      });
    onOpen();
  };

  useEffect(() => {
    dispatch(setLimitFilter(999999));
    dispatch(fetchBatches({ authToken }));
  }, []);

  const prepareInitialValues = () => {
    const initialValues = batches.reduce((acc, batch) => {
      acc[`batch-${batch._id}-courses`] = [];
      batch.courses.reduce((acc, course) => {
        acc[`fee-${batch._id}-${course._id}`] = 0;
        return acc;
      }, acc);
      return acc;
    }, {});
    return initialValues;
  };

  const formik = useFormik({
    initialValues: prepareInitialValues(),
    enableReinitialize: true,
    validationSchema: Yup.object().shape({}),
    onSubmit: async (values) => {
      let enrollments = [];
      batches.map((batch) => {
        enrollments.push({
          batch: batch._id,
          courses: values[`batch-${batch._id}-courses`] || [],
          fees: batch.courses.map((course) => {
            return formik.values["batch-" + batch._id + "-courses"]?.includes(
              course._id
            )
              ? formik.values[`fee-${batch._id}-${course._id}`]
              : 0;
          }),
        });
      });
      dispatch(
        createEnrollment({
          authToken,
          studentId,
          enrollments,
        })
      ).then(() => {
        dispatch(fetchStudents({ authToken }));
        enrollments.forEach(enrollment => {
          dispatch(createFee({ authToken, studentId, batchId: enrollment.batch, amount: enrollment.fees.reduce((a, b) => a + b, 0) }));
        });
        onClose();
      });
    },
  });

  const handleCheckboxChange = (e, batchId, courseId, courseFee) => {
    const valueArray = formik.values[`batch-${batchId}-courses`] || [];
    if (e.target.checked) {
      formik.setFieldValue(`batch-${batchId}-courses`, [
        ...valueArray,
        courseId,
      ]);
      formik.setFieldValue(`fee-${batchId}-${courseId}`, courseFee);
    } else {
      formik.setFieldValue(
        `batch-${batchId}-courses`,
        valueArray.filter((id) => id !== courseId)
      );
      formik.setFieldValue(`fee-${batchId}-${courseId}`, 0);
    }
  };

  const handleInputChange = (e, batchId, courseId) => {
    formik.setFieldValue(`fee-${batchId}-${courseId}`, e.target.value);
  };

  return (
    <>
      <button
        className="hover:bg-[#7AEF85] hover:text-[#257947] font-medium p-[10px] rounded-xl transition-colors duration-300 flex flex-nowrap items-center gap-1.5 pr-3"
        onClick={handleOpenModal}
      >
        <Check size={18} />
        <span>Enrollments</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Course Enrollment
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={formik.handleSubmit}>
            <ModalBody>
              {fetchStudentEnrollmentsStatus === "loading" ? (
                <Spinner />
              ) : (
                <VStack
                  spacing={4}
                  align="stretch"
                  w="full"
                  maxH="60vh"
                  overflowY="auto"
                >
                  <Accordion allowToggle w="full">
                    {batches.map((batch) => (
                      <AccordionItem key={batch._id}>
                        <h2>
                          <AccordionButton
                            style={{
                              backgroundColor:
                                activeBatch?._id === batch?._id
                                  ? "#FFCB8280"
                                  : "",
                            }}
                          >
                            <Box as="span" flex="1" textAlign="left">
                              {batch.name}
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel py={4}>
                          <VStack spacing={2} align="stretch">
                            {batch?.courses.length === 0 && (
                              <Box py={2} px={3} borderWidth="1px" rounded="md">
                                No courses available
                              </Box>
                            )}
                            {batch?.courses.map((course) => (
                              <HStack
                                key={batch._id + "," + course._id}
                                spacing={2}
                              >
                                <Checkbox
                                  colorScheme="green"
                                  py={2}
                                  px={3}
                                  borderWidth="1px"
                                  className="flex-1"
                                  rounded="md"
                                  borderColor={
                                    formik.values[
                                      "batch-" + batch._id + "-courses"
                                    ]?.includes(course._id)
                                      ? "#7AEF85"
                                      : "#E0E8EC"
                                  }
                                  id={
                                    "batch-" +
                                    batch._id +
                                    "-courses-" +
                                    course._id
                                  }
                                  name={"batch-" + batch._id + "-courses"}
                                  value={course._id}
                                  onChange={(e) =>
                                    handleCheckboxChange(
                                      e,
                                      batch._id,
                                      course._id,
                                      course.fee
                                    )
                                  }
                                  isChecked={formik.values[
                                    "batch-" + batch._id + "-courses"
                                  ]?.includes(course._id)}
                                >
                                  {course.name}
                                </Checkbox>
                                <Input
                                  isDisabled={true}
                                  // isDisabled={
                                  //   !formik.values[
                                  //     "batch-" + batch._id + "-courses"
                                  //   ]?.includes(course._id)
                                  // }
                                  type="number"
                                  min="0"
                                  borderRadius={"0.5rem"}
                                  placeholder="Fee"
                                  className="max-w-24 w-full"
                                  id={"fee-" + batch._id + "-" + course._id}
                                  name={"fee-" + batch._id + "-" + course._id}
                                  value={
                                    formik.values[
                                      "batch-" + batch._id + "-courses"
                                    ]?.includes(course._id) ?
                                    formik.values[
                                      "fee-" + batch._id + "-" + course._id
                                    ] : 0
                                  }
                                  onChange={(e) =>
                                    handleInputChange(e, batch._id, course._id)
                                  }
                                />
                              </HStack>
                            ))}
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </VStack>
              )}
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
                isLoading={createEnrollmentStatus === "loading"}
              >
                Save
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EnrollmentModal;
