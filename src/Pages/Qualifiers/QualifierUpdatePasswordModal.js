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
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import axios from "axios";
import { createStandaloneToast } from "@chakra-ui/react";
import { KeyRound } from "lucide-react";
import { config } from "../../utlls/config";

const { toast } = createStandaloneToast();

/**
 * Self-service password update for logged-in qualifier (My Profile action).
 */
function QualifierUpdatePasswordModal({ qualifier }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [authToken] = useState(Cookies.get("authToken"));
  const [saving, setSaving] = useState(false);

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required("Required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      if (!qualifier?.email) {
        toast({
          title: "Login email missing",
          description: "Contact the academy to reset your password.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      setSaving(true);
      try {
        await axios.post(
          `${config.BASE_URL}/users/changePassword`,
          {
            email: qualifier.email,
            currentPassword: values.currentPassword,
            newPassword: values.password,
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        toast({
          title: "Password updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        formik.resetForm();
        onClose();
      } catch (error) {
        toast({
          title: "Could not update password",
          description:
            error.response?.data?.message ||
            error.message ||
            "Please try again.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setSaving(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <>
      <button
        className="table-action-btn"
        type="button"
        onClick={onOpen}
      >
        <KeyRound size={16} />
        <span>Update Password</span>
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={formik.handleSubmit}>
          <ModalHeader className="text-xl font-semibold">
            Update Password
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Change the password you use to log in with your phone number.
              </Text>
              <FormControl isRequired>
                <FormLabel fontSize={14}>Current Password</FormLabel>
                <Input
                  type="password"
                  name="currentPassword"
                  borderRadius="0.5rem"
                  value={formik.values.currentPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.currentPassword &&
                formik.errors.currentPassword ? (
                  <Text color="red" fontSize="sm">
                    {formik.errors.currentPassword}
                  </Text>
                ) : null}
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize={14}>New Password</FormLabel>
                <Input
                  type="password"
                  name="password"
                  borderRadius="0.5rem"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.password && formik.errors.password ? (
                  <Text color="red" fontSize="sm">
                    {formik.errors.password}
                  </Text>
                ) : null}
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize={14}>Confirm New Password</FormLabel>
                <Input
                  type="password"
                  name="confirmPassword"
                  borderRadius="0.5rem"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.confirmPassword &&
                formik.errors.confirmPassword ? (
                  <Text color="red" fontSize="sm">
                    {formik.errors.confirmPassword}
                  </Text>
                ) : null}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="0.75rem"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              borderRadius="0.75rem"
              backgroundColor="#FFCB82"
              color="#85652D"
              _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
              fontWeight="500"
              isLoading={saving}
              loadingText="Updating"
            >
              Update Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default QualifierUpdatePasswordModal;
