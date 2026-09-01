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
import {
  deleteQualifier,
  fetchQualifiers,
} from "../../Features/qualifierSlice";
import ActionButton from "../../Components/ActionButton";

function DeleteQualifierModal({ qualifierId }) {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const { deleteStatus } = useSelector((state) => state.qualifiers);
  const dispatch = useDispatch();

  const handleDelete = () => {
    dispatch(deleteQualifier({ qualifierId, authToken }))
      .unwrap()
      .then(() => {
        onClose();
        dispatch(fetchQualifiers({ authToken }));
      })
      .catch(() => {});
  };

  return (
    <>
      <ActionButton
        variant="red"
        icon={<Trash size={16} />}
        label="Delete"
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete qualifier</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>Are you sure you want to permanently delete this qualifier?</p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="0.75rem"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              borderRadius="0.75rem"
              backgroundColor="#FF8A8A"
              color="#6D1F1F"
              _hover={{ backgroundColor: "#E48080", color: "#561616" }}
              fontWeight="500"
              onClick={handleDelete}
              loadingText="Deleting"
              isLoading={deleteStatus === "loading"}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default DeleteQualifierModal;
