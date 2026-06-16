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
  FormControl,
  FormLabel,
  Input,
  VStack,
  Box,
  Badge,
} from "@chakra-ui/react";
import { View } from "lucide-react";

const OPTION_LABELS = ["A", "B", "C", "D"];

const getCourseName = (courseId) => {
  if (!courseId) return "N/A";
  if (typeof courseId === "object" && courseId.name) return courseId.name;
  return "N/A";
};

const getCorrectOptionLabel = (correctOption) => {
  const index = parseInt(correctOption, 10);
  return OPTION_LABELS[index] || correctOption;
};

function ViewModal({ mcq }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const correctIndex = parseInt(mcq?.correct_option, 10);
  const options = [
    { label: "A", value: mcq?.option1 },
    { label: "B", value: mcq?.option2 },
    { label: "C", value: mcq?.option3 },
    { label: "D", value: mcq?.option4 },
  ];

  return (
    <>
      <button
        className="hover:bg-[#E8F0FF] hover:text-[#2D4185] font-medium p-[10px] rounded-xl transition-colors duration-300"
        onClick={onOpen}
        title="View MCQ"
      >
        <View size={18} />
      </button>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">View Mcq</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontSize={14}>Course</FormLabel>
                <Input
                  value={getCourseName(mcq?.courseId)}
                  isReadOnly
                  borderRadius="0.5rem"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={14}>Question</FormLabel>
                <Input
                  value={mcq?.question || ""}
                  isReadOnly
                  borderRadius="0.5rem"
                />
              </FormControl>

              {options.map((option, index) => (
                <FormControl key={option.label}>
                  <FormLabel fontSize={14} display="flex" alignItems="center" gap={2}>
                    Option {option.label}
                    {index === correctIndex && (
                      <Badge colorScheme="green">Correct</Badge>
                    )}
                  </FormLabel>
                  <Input
                    value={option.value || ""}
                    isReadOnly
                    borderRadius="0.5rem"
                    bg={index === correctIndex ? "green.50" : "white"}
                  />
                </FormControl>
              ))}

              <Box>
                <FormLabel fontSize={14}>Correct Answer</FormLabel>
                <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                  Option {getCorrectOptionLabel(mcq?.correct_option)}
                </Badge>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" borderRadius="0.75rem" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ViewModal;
