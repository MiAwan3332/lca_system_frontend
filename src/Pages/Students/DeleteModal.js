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
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import Cookies from "js-cookie";
import { Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { deleteStudent, fetchStudents } from "../../Features/studentSlice";
import ActionButton from "../../Components/ActionButton";
import { isPlatformSuperAdminRole } from "../../utlls/useful";

const DeleteModal = ({ studentId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken] = useState(Cookies.get("authToken"));

  const { deleteStatus } = useSelector((state) => state.students);
  const dispatch = useDispatch();

  if (!isPlatformSuperAdminRole()) {
    return null;
  }

  const handleDeleteStudent = () => {
    dispatch(deleteStudent({ authToken, studentId }))
      .unwrap()
      .then(() => {
        dispatch(fetchStudents({ authToken }));
        onClose();
      });
  };

  return (
    <>
      <ActionButton
        variant="red"
        icon={<Trash size={16} />}
        label="Delete Student"
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Delete student
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>
              Are you sure you want to permanently delete this student? This also
              removes their login account, fees, fee logs, pending slips, refunds,
              enrollments, attendance, submissions, quizzes, notifications, and
              related records. This cannot be undone.
            </p>
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
              onClick={handleDeleteStudent}
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
};

export default DeleteModal;
