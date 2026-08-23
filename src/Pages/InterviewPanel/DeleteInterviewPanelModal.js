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
  Text,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteInterviewPanel,
  fetchInterviewPanels,
} from "../../Features/interviewPanelSlice";

function DeleteInterviewPanelModal({ isOpen, onClose, panel }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const { deleteStatus } = useSelector((state) => state.interviewPanels);
  const dispatch = useDispatch();

  const handleDelete = async () => {
    if (!panel?._id) return;
    try {
      await dispatch(
        deleteInterviewPanel({ authToken, id: panel._id })
      ).unwrap();
      onClose();
      dispatch(fetchInterviewPanels({ authToken }));
    } catch {
      // toast handled in slice
    }
  };

  if (!panel) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="text-xl font-semibold">
          Delete Interview Panel
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            Are you sure you want to delete{" "}
            <Text as="span" fontWeight="600">
              {panel.title}
            </Text>
            ? This action cannot be undone.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} borderRadius="0.75rem" onClick={onClose}>
            Close
          </Button>
          <Button
            borderRadius="0.75rem"
            backgroundColor="#FF8A8A"
            color="#6D1F1F"
            _hover={{ backgroundColor: "#E48080", color: "#561616" }}
            fontWeight="500"
            onClick={handleDelete}
            isLoading={deleteStatus === "loading"}
            loadingText="Deleting"
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DeleteInterviewPanelModal;
