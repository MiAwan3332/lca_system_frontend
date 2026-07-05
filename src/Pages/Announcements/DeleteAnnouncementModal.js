import React from "react";
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
import { useDispatch } from "react-redux";
import {
  deleteAnnouncement,
  fetchAnnouncements,
} from "../../Features/announcementSlice";

function DeleteAnnouncementModal({ announcement, isOpen, onClose }) {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();

  const handleDelete = () => {
    dispatch(deleteAnnouncement({ authToken, id: announcement._id }))
      .unwrap()
      .then(() => {
        onClose();
        dispatch(fetchAnnouncements({ authToken }));
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Delete Announcement</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          Are you sure you want to delete &quot;{announcement?.title}&quot;? This cannot be undone.
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" borderRadius="xl" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="red" borderRadius="xl" onClick={handleDelete}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DeleteAnnouncementModal;
