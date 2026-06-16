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
  Select,
  Checkbox,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { selectAllBatches } from "../../Features/batchSlice.js";
import { Pen } from "lucide-react";
import { useDispatch } from "react-redux";
import { updateStudent, fetchStudents, basicUpdate } from "../../Features/studentSlice";
import { isStudentViewOnly } from "../../utlls/studentAccess";

function AddModel({ student }) {
  const batches = useSelector(selectAllBatches);
  const viewOnly = isStudentViewOnly();

  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  
  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { updateStatus } = useSelector((state) => state.students);
  const dispatch = useDispatch();
  
  const formik = useFormik({
    initialValues: {
      name: student.name,
      phone: student.phone,
      paid_fee: 0,
      skip_profile_completion: student.skip_profile_completion === true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      phone: Yup.string().required("Required"),
      paid_fee: Yup.number(),
    }),
    onSubmit: async (values) => {
      dispatch(
        basicUpdate({
          authToken,
          studentId: student._id,
          student: {
            name: values.name,
            phone: values.phone,
            paid_fee: values.paid_fee,
            ...(!viewOnly
              ? { skip_profile_completion: values.skip_profile_completion }
              : {}),
          },
        })
      )
        .unwrap()
        .then(() => {
          dispatch(fetchStudents({ authToken }));
          onClose();
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
            Update Student
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
                <FormControl id="phone">
                  <FormLabel fontSize={14}>Phone</FormLabel>
                  <Input
                    type="phone"
                    name="phone"
                    borderRadius={"0.5rem"}
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.password && formik.errors.phone ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.phone}
                    </Box>
                  ) : null}
                </FormControl>
                {/* <FormControl id="paid_fee">
                  <FormLabel fontSize={14}>Paid Fee</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    name="paid_fee"
                    borderRadius={"0.5rem"}
                    value={formik.values.paid_fee}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.password && formik.errors.paid_fee ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.paid_fee}
                    </Box>
                  ) : null}
                </FormControl> */}
                {!viewOnly && (
                  <FormControl>
                    <Checkbox
                      name="skip_profile_completion"
                      isChecked={formik.values.skip_profile_completion}
                      onChange={formik.handleChange}
                      colorScheme="orange"
                    >
                      Allow skip profile completion on first login
                    </Checkbox>
                    <Box fontSize="xs" color="gray.500" mt={1} ml={6}>
                      When enabled, this student is not required to complete
                      their profile before using the system.
                    </Box>
                  </FormControl>
                )}
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

export default AddModel;
