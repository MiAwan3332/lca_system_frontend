import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import { IdCard } from "lucide-react";
import StudentCard from "../StudentCard";
import ErrorBoundary from "../../ErrorBoundary";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../../utlls/responsiveModal";

function StudentCardModal({ student }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [qrCode] = useState(student?.qrcode || "");

  if (!student) {
    return null;
  }

  return (
    <>
      <IconButton
        onClick={onOpen}
        colorScheme="gray"
        aria-label="Student Card"
        title="Student Card"
        className="icon-action-btn icon-action-btn--card"
        icon={<IdCard size={18} />}
      />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("4xl")}
      >
        <ModalOverlay />
        <ModalContent {...responsiveModalContentProps}>
          <ModalHeader className="text-xl font-semibold">
            Student Card
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {!student.batch ? (
              <Text color="gray.500" py={4}>
                Student card cannot be generated because batch information is
                missing.
              </Text>
            ) : (
              <ErrorBoundary
                fallback={
                  <Text color="gray.500" py={4}>
                    Unable to display student card.
                  </Text>
                }
              >
                <StudentCard student={student} qrCode={qrCode} />
              </ErrorBoundary>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default StudentCardModal;
