import { Input } from '../../Components/AccessInputs';
import AccessForm from '../../Components/AccessForm';
import FormControl from '../../Components/AccessFormControl';
import { useAccessUpdateFormik as useFormik } from '../../utlls/accessForms';
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { can } from '../../utlls/accessCapabilities';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, FormLabel, FormHelperText, VStack, Box, useToast } from '@chakra-ui/react';

import * as Yup from "yup";
import Cookies from "js-cookie";
import { Pen } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, updateUser } from "../../Features/userSlice";
import { accessRoleLabel } from '../../utlls/accessRoleLabel';
import axios from 'axios';
import { config } from '../../utlls/config';

export const MIN_PASSWORD_LENGTH = 8;

function UpdateModal({ user }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken] = useState(Cookies.get("authToken"));

  const { updateStatus } = useSelector((state) => state.users);
  const canSetPassword = can('users.set.user.password');
  const toast = useToast();
  const dispatch = useDispatch();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      email: Yup.string().email("Invalid email address").required("Required"),
      phone: Yup.string().trim().required("Contact number is required"),
      password: Yup.string().test("length", `At least ${MIN_PASSWORD_LENGTH} characters`, (value) => !value || value.trim().length >= MIN_PASSWORD_LENGTH),
    }),
    onSubmit: async (values) => {
      const { password, ...profileValues } = values;
      try {
        await dispatch(updateUser({ userId: user._id, values: profileValues, authToken })).unwrap();
      } catch { return; /* The shared request handler displays validation errors. */ }
      if (canSetPassword && password) {
        try {
          const { data } = await axios.post(`${config.BASE_URL}/users/${user._id}/password`, { newPassword: password }, { headers: { Authorization: `Bearer ${authToken}` } });
          toast({ title: data?.message || "Password updated", status: "success", duration: 4000, isClosable: true });
        } catch (error) {
          toast({ title: "Password not changed", description: error?.response?.data?.message || error.message, status: "error", duration: 8000, isClosable: true });
          return;
        }
      }
      onClose();
      dispatch(fetchUsers({ authToken }));
    },
  });

  return (
    <>
      <button
        aria-label={`Edit ${user.name}`}
        className="action-menu-btn action-menu-btn--gold"
        onClick={onOpen}
      >
        <Pen size={18} />
        <span>Edit User</span>
      </button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <AccessForm component={ModalContent}>
          <ModalHeader className="text-xl font-semibold">
            Update User
          </ModalHeader>
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
                <FormControl id="email">
                  <FormLabel fontSize={14}>Email</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    borderRadius={"0.5rem"}
                    value={formik.values.email}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.email}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl id="phone" isRequired>
                  <FormLabel fontSize={14}>Contact Number</FormLabel>
                  <Input
                    type="tel"
                    name="phone"
                    borderRadius={"0.5rem"}
                    placeholder="03XXXXXXXXX"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.phone && formik.errors.phone ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.phone}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl id="password">
                  <FormLabel fontSize={14}>New password</FormLabel>
                  <Input
                    type="password"
                    isDisabled={!canSetPassword}
                    autoComplete="new-password"
                    permissionField="newPassword"
                    permission="users.set.user.password"
                    placeholder={canSetPassword ? "Leave empty to keep the current password" : ""}
                    name="password"
                    borderRadius={"0.5rem"}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.password && formik.errors.password ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.password}
                    </Box>
                  ) : null}
                  <FormHelperText>{canSetPassword ? `At least ${MIN_PASSWORD_LENGTH} characters. Tell them the new password yourself.` : "Needs the \"Set passwords\" access."}</FormHelperText>
                </FormControl>
                <Box width="100%">
                  <Box fontSize={14} fontWeight="medium" mb={2}>Access role</Box>
                  <Box color="var(--dash-text)">{accessRoleLabel(user)}</Box>
                  {can('access.read') && can('access.assign') && <Button mt={3} type="button" className="table-action-btn" onClick={() => {
                    if (formik.dirty && !window.confirm('Leave without saving these profile changes?')) return;
                    onClose(); navigate(`/access-management/people/${user._id}?category=staff`);
                  }}>Manage Access</Button>}
                </Box>
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
          </AccessForm>
        </AccessForm>
      </Modal>
    </>
  );
}

export default UpdateModal;
