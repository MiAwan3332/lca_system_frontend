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
import { deletePanelist, fetchPanelists } from "../../Features/panelistSlice";
import ActionButton from "../../Components/ActionButton";

function DeletePanelistModal({ panelistId }) {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const { deleteStatus } = useSelector((state) => state.panelists);
  const dispatch = useDispatch();

  const handleDelete = () => {
    dispatch(deletePanelist({ panelistId, authToken }))
      .unwrap()
      .then(() => {
        onClose();
        dispatch(fetchPanelists({ authToken }));
      })
      .catch(() => {});
  };

  return (
    <>
      <ActionButton
        variant="red"
        icon={<Trash size={16} />}
        label="Deactivate"
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <AccessForm component={ModalContent}>
          <ModalHeader>Deactivate panelist</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>Deactivate this panelist’s interview access? Their login, other roles and interview history will be preserved.</p>
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
              loadingText="Deactivating"
              isLoading={deleteStatus === "loading"}
            >
              Deactivate
            </Button>
          </ModalFooter>
        </AccessForm>
      </Modal>
    </>
  );
}

export default DeletePanelistModal;
