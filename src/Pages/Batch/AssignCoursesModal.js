import { Checkbox } from '../../Components/AccessInputs';
import AccessForm from '../../Components/AccessForm';
import { useAccessCreateFormik as useFormik } from '../../utlls/accessForms';
import React, { useState } from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, VStack } from '@chakra-ui/react';
import Cookies from "js-cookie";

import * as Yup from "yup";
import { Check } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  assignCoursesToBatch,
  fetchBatchCourses,
  fetchBatches,
  selectBatchCourses,
} from "../../Features/batchSlice";
import axios from 'axios';
import { config } from '../../utlls/config';
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
  const [courses, setCourses] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
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

  const handleOpenModal = async () => {
    onOpen();
    setLoadError('');
    setLoadingOptions(true);
    try {
      const [options, data] = await Promise.all([
        axios.get(`${config.BASE_URL}/batches/assignment-options/${batchId}`, { headers: { Authorization: `Bearer ${authToken}` } }),
        dispatch(fetchBatchCourses({ authToken, batchId })).unwrap(),
      ]);
      setCourses(options.data.courses || []);
        const courseIds = data.map((course) => course._id);
        formik.setFieldValue("courses", courseIds);
    } catch (error) { setCourses([]); setLoadError(error.response?.data?.message || 'Could not load available courses.'); }
    finally { setLoadingOptions(false); }
  };

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
        <AccessForm component={ModalContent}>
          <ModalHeader className="text-xl font-semibold">
            Assign Courses to Batch
          </ModalHeader>
          <ModalCloseButton />
          <AccessForm onSubmit={formik.handleSubmit}>
            <ModalBody>
              {loadError && <p role="alert">{loadError}</p>}
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
                isDisabled={loadingOptions || Boolean(loadError)}
              >
                Assign
              </Button>
            </ModalFooter>
          </AccessForm>
        </AccessForm>
      </Modal>
    </>
  );
};

export default AssignCoursesModal;
