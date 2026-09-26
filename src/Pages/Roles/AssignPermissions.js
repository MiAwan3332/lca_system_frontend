import React, { useState, useEffect } from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Checkbox, VStack } from "@chakra-ui/react";
import axios from "axios";
import Cookies from "js-cookie";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Check } from "lucide-react";
import {
  selectAllPermissions,
  setLimitFilter,
  fetchPermissions,
} from "../../Features/permissionSlice";
import { useSelector, useDispatch } from "react-redux";
import LcaLogoLoading from "../../Components/LcaLogoLoading";
import {
  selectAllAssignedPermissions,
  fetchAssignedPermissions,
  assignPermissions,
  fetchRoles,
} from "../../Features/roleSlice";

const AssignPermissions = ({ roleId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const permissions = useSelector(selectAllPermissions);
  const assignedPermissions = useSelector(selectAllAssignedPermissions);
  const { fetchAssignedPermissionsStatus, assignPermissionsStatus } =
    useSelector((state) => state.roles);
  const dispatch = useDispatch();

  const handleOpenModal = () => {
    dispatch(fetchAssignedPermissions({ authToken, id: roleId }))
      .unwrap()
      .then((data) => {
        const permissionIds = data.map((permission) => permission._id);
        formik.setFieldValue("permissions", permissionIds);
      });
    onOpen();
  };

  useEffect(() => {
    dispatch(setLimitFilter(999999));
    dispatch(fetchPermissions({ authToken }));
  }, []);

  const formik = useFormik({
    initialValues: {
      permissions: assignedPermissions,
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      permissions: Yup.array().required("Required"),
    }),
    onSubmit: async (values) => {
      dispatch(
        assignPermissions({
          authToken,
          roleId,
          permissions: values.permissions,
        })
      )
        .unwrap()
        .then((data) => {
          onClose();
          dispatch(fetchRoles({ authToken }));
        });
    },
  });

  return (
    <>
      <button
        className="hover:bg-[#7AEF85] hover:text-[#257947] font-medium p-[10px] rounded-xl transition-colors duration-300 flex flex-nowrap items-center gap-1.5 pr-3"
        onClick={handleOpenModal}
      >
        <Check size={18} />
        <span>Permissions</span>
      </button>

      <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Assign Permissions to Role
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={formik.handleSubmit}>
            <ModalBody>
              {fetchAssignedPermissionsStatus === "loading" ? (
                <LcaLogoLoading size="sm" />
              ) : (
                <VStack spacing={2} align="stretch" w="full" maxH="60vh" overflowY="auto">
                  {permissions.map((permission) => (
                    <Checkbox
                      key={permission._id}
                      colorScheme="green"
                      py={2}
                      px={3}
                      borderWidth="1px"
                      className="flex-1"
                      rounded="md"
                      id={permission._id}
                      name="permissions"
                      value={permission._id}
                      onChange={formik.handleChange}
                      isChecked={formik.values.permissions.includes(
                        permission._id
                      )}
                    >
                      {permission.name}
                    </Checkbox>
                  ))}
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
                isLoading={assignPermissionsStatus === "loading"}
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

export default AssignPermissions;
