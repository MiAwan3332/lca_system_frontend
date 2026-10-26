import AccessForm from '../../Components/AccessForm';
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
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser, fetchUsers } from "../../Features/userSlice";

const DeleteModal = ({ userId, getUsers }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { deleteStatus } = useSelector((state) => state.users);
  const dispatch = useDispatch();

  const handleDeleteUser = () => {
    dispatch(deleteUser({ userId, authToken }))
      .unwrap()
      .then(() => {
        onClose();
        dispatch(fetchUsers({ authToken }));
      });
  };

  return (
    <>
      <button
        className="hover:bg-[#FF8A8A] hover:text-[#6D1F1F] font-medium p-[10px] rounded-xl transition-colors duration-300"
        onClick={onOpen}
      >
        <Trash size={18} />
      </button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <AccessForm component={ModalContent}>
          <ModalHeader className="text-xl font-semibold">
            Delete User
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>Are you sure you want to delete this user?</p>
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
              backgroundColor={"#FF8A8A"}
              color={"#6D1F1F"}
              _hover={{
                backgroundColor: "#E48080",
                color: "#561616",
              }}
              fontWeight={"500"}
              onClick={handleDeleteUser}
              loadingText="Deleting"
              isLoading={deleteStatus === "loading"}
            >
              Delete
            </Button>
          </ModalFooter>
        </AccessForm>
      </Modal>
    </>
  );
};

export default DeleteModal;
