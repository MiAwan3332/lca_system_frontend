import AccessForm from '../../Components/AccessForm';
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
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import Cookies from "js-cookie";
import { Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { deleteMcq, fetchMcqs } from "../../Features/mcqSlice";

const DeleteModal = ({ mcqId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { deleteStatus } = useSelector((state) => state.mcqs);
  const dispatch = useDispatch();

  const handleDeleteMcq = () => {
    dispatch(deleteMcq({ authToken, mcqId }))
      .unwrap()
      .then(() => {
        onClose();
        dispatch(fetchMcqs({ authToken }));
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
            Delete Mcq
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>Are you sure you want to delete this mcq?</p>
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
              onClick={handleDeleteMcq}
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
