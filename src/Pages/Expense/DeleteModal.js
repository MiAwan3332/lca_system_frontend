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
import { deleteExpense } from "../../Features/expenseSlice";

function DeleteModal({ expenseId, onDeleted }) {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken] = useState(Cookies.get("authToken"));
  const { deleteStatus } = useSelector((state) => state.expenses);
  const dispatch = useDispatch();

  const handleDelete = () => {
    dispatch(deleteExpense({ authToken, expenseId }))
      .unwrap()
      .then(() => {
        onClose();
        onDeleted();
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
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">Delete Expense</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>Are you sure you want to delete this expense?</p>
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

export default DeleteModal;
