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
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, addUser } from "../../Features/userSlice";
import { config } from "../../utlls/config";

const isExcludedUserFormRole = (roleName) => {
  const name = String(roleName || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  return name === "teacher" || name === "student";
};

function AddModel({ isOpen, onClose }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const { addStatus } = useSelector((state) => state.users);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isOpen || !authToken) return;

    let cancelled = false;
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await axios.get(`${config.BASE_URL}/roles`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { page: 1, limit: 1000, query: "" },
        });
        if (!cancelled) {
          setRoles(
            (response.data?.docs || []).filter(
              (role) => !isExcludedUserFormRole(role.name)
            )
          );
        }
      } catch {
        if (!cancelled) setRoles([]);
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    };

    loadRoles();
    return () => {
      cancelled = true;
    };
  }, [isOpen, authToken]);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      // password: "",
      role: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      email: Yup.string().email("Invalid email address").required("Required"),
      // password: Yup.string().required("Required"),
      role: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      dispatch(addUser({ formData: values, authToken }))
        .unwrap()
        .then(() => {
          onClose();
          dispatch(fetchUsers({ authToken }));
        });
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="text-xl font-semibold">Add User</ModalHeader>
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
              {/* <FormControl id="password">
                <FormLabel fontSize={14}>Password</FormLabel>
                <Input
                  type="password"
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
              </FormControl> */}
              <FormControl id="role">
                <FormLabel fontSize={14}>Role</FormLabel>
                <Select
                  placeholder={rolesLoading ? "Loading roles..." : "Select Role"}
                  borderRadius={"0.5rem"}
                  name="role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  isDisabled={rolesLoading}
                >
                  {roles.map((role) => (
                    <option key={role._id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </Select>
                {formik.touched.role && formik.errors.role ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.role}
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
              loadingText="Adding"
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
