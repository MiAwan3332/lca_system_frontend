import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { addComplaint } from "../../Features/complaintSlice";
import { COMPLAINT_CATEGORIES } from "../../utlls/complaintConstants";
import {
  responsiveModalProps,
  responsiveModalContentProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

function AddComplaintModal({ isOpen, onClose, authToken, onSubmitted }) {
  const dispatch = useDispatch();
  const { meta, addStatus } = useSelector((state) => state.complaints);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [targetRole, setTargetRole] = useState("");

  useEffect(() => {
    if (meta.allowed_targets?.length && !targetRole) {
      setTargetRole(meta.allowed_targets[0].value);
    }
  }, [meta.allowed_targets, targetRole]);

  useEffect(() => {
    if (!isOpen) {
      setSubject("");
      setDescription("");
      setCategory("General");
      setTargetRole(meta.allowed_targets?.[0]?.value || "");
    }
  }, [isOpen, meta.allowed_targets]);

  const handleSubmit = async () => {
    await dispatch(
      addComplaint({
        authToken,
        complaintData: {
          subject,
          description,
          category,
          target_role: targetRole,
        },
      })
    ).unwrap();
    onSubmitted?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...responsiveModalProps} {...getResponsiveModalSize("lg")}>
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>Submit Complaint</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Submit To</FormLabel>
              <Select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                borderRadius="xl"
              >
                {meta.allowed_targets?.map((target) => (
                  <option key={target.value} value={target.value}>
                    {target.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                borderRadius="xl"
              >
                {COMPLAINT_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Subject</FormLabel>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                borderRadius="xl"
                placeholder="Brief summary of the complaint"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                borderRadius="xl"
                rows={5}
                placeholder="Describe your complaint in detail"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="yellow"
            onClick={handleSubmit}
            isLoading={addStatus === "loading"}
            isDisabled={!subject.trim() || !description.trim() || !targetRole}
          >
            Submit Complaint
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddComplaintModal;
