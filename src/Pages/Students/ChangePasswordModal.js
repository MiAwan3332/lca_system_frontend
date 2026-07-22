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
  Text,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { KeyRound } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { changeStudentPassword } from "../../Features/studentSlice";
import { formatStudentEmail } from "../../utlls/studentEmail";

function ChangePasswordModal({ student }) {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken] = useState(Cookies.get("authToken"));
  const { changePasswordStatus } = useSelector((state) => state.students);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      dispatch(
        changeStudentPassword({
          authToken,
          studentId: student._id,
          password: values.password,
        })
      )
        .unwrap()
        .then(() => {
          formik.resetForm();
          onClose();
        });
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <>
      <button
        className="hover:bg-[#82B4FF] hover:text-[#2D4185] font-medium p-[10px] rounded-xl transition-colors duration-300"
        onClick={onOpen}
        title="Change Login Password"
      >
        <KeyRound size={18} />
      </button>
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Change Student Password
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={formik.handleSubmit}>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Student: <strong>{student.name}</strong>
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Login Phone: <strong>{student.phone || "N/A"}</strong>
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Email: <strong>{formatStudentEmail(student.email)}</strong>
                  </Text>
                </Box>
                <FormControl isRequired>
                  <FormLabel fontSize={14}>New Password</FormLabel>
                  <Input
                    type="password"
                    name="password"
                    borderRadius="0.5rem"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.password && formik.errors.password ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.password}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize={14}>Confirm Password</FormLabel>
                  <Input
                    type="password"
                    name="confirmPassword"
                    borderRadius="0.5rem"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.confirmPassword}
                    </Box>
                  ) : null}
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} borderRadius="0.75rem" onClick={handleClose}>
                Close
              </Button>
              <Button
                borderRadius="0.75rem"
                backgroundColor="#82B4FF"
                color="#2D4185"
                _hover={{ backgroundColor: "#74A0E3", color: "#223163" }}
                fontWeight="500"
                type="submit"
                loadingText="Updating..."
                isLoading={changePasswordStatus === "loading"}
              >
                Update Password
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ChangePasswordModal;
