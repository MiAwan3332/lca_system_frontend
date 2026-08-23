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
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  Stack,
  Flex,
  Box,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { Plus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addInterviewPanel,
  fetchInterviewPanels,
} from "../../Features/interviewPanelSlice";
import {
  INTERVIEW_PANEL_STATUSES,
  createEmptyMemberRow,
  formRowsToMembersPayload,
  getMembersValidationError,
} from "../../utlls/interviewPanel";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const validationSchema = Yup.object({
  title: Yup.string().required("Required"),
  description: Yup.string(),
  status: Yup.string().required("Required"),
});

const EMPTY_FORM = {
  title: "",
  description: "",
  status: "active",
};

function AddInterviewPanelModal({ isOpen, onClose }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [members, setMembers] = useState(() => [createEmptyMemberRow(0)]);
  const [membersError, setMembersError] = useState("");
  const { addStatus } = useSelector((state) => state.interviewPanels);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: EMPTY_FORM,
    validationSchema,
    onSubmit: async (values) => {
      const memberError = getMembersValidationError(members);
      if (memberError) {
        setMembersError(memberError);
        return;
      }
      setMembersError("");
      try {
        await dispatch(
          addInterviewPanel({
            authToken,
            values: {
              title: values.title,
              description: values.description,
              status: values.status,
              members: formRowsToMembersPayload(members),
              schedules: [],
            },
          })
        ).unwrap();
        resetAll();
        onClose();
        dispatch(fetchInterviewPanels({ authToken }));
      } catch {
        // toast handled in slice
      }
    },
  });

  const resetAll = () => {
    formik.resetForm({ values: EMPTY_FORM });
    setMembers([createEmptyMemberRow(0)]);
    setMembersError("");
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const updateMember = (index, field, value) => {
    setMembersError("");
    setMembers((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addMember = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setMembers((prev) => [...prev, createEmptyMemberRow(prev.length)]);
  };

  const removeMember = (index) => {
    setMembers((prev) => {
      if (prev.length <= 1) return [createEmptyMemberRow(0)];
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("xl")}
    >
      <ModalOverlay />
      <ModalContent
        {...responsiveModalContentProps}
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          formik.handleSubmit(e);
        }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        maxH={{ base: "100dvh", sm: "90vh" }}
      >
        <ModalHeader
          className="text-xl font-semibold"
          pr={12}
          fontSize={{ base: "lg", sm: "xl" }}
          flexShrink={0}
        >
          Create Interview Panel
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody
          flex="1"
          minH={0}
          overflowY="auto"
          overflowX="hidden"
          px={{ base: 4, sm: 6 }}
          py={4}
          css={{
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": {
              background: "#F1F5F9",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#CBD5E1",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#94A3B8",
            },
          }}
        >
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize={14}>Title</FormLabel>
              <Input
                name="title"
                borderRadius="0.5rem"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. CSS Interview Panel – Batch A"
              />
              {formik.touched.title && formik.errors.title ? (
                <Box color="red" fontSize="sm">
                  {formik.errors.title}
                </Box>
              ) : null}
            </FormControl>

            <FormControl>
              <FormLabel fontSize={14}>Description</FormLabel>
              <Textarea
                name="description"
                borderRadius="0.5rem"
                rows={3}
                value={formik.values.description}
                onChange={formik.handleChange}
                placeholder="Optional notes about this panel"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize={14}>Status</FormLabel>
              <Select
                name="status"
                borderRadius="0.5rem"
                value={formik.values.status}
                onChange={formik.handleChange}
              >
                {INTERVIEW_PANEL_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Box
              border="1px solid"
              borderColor="#E0E8EC"
              borderRadius="xl"
              p={{ base: 3, sm: 4 }}
              bg="#FAFBFC"
            >
              <Flex
                direction={{ base: "column", sm: "row" }}
                justify="space-between"
                align={{ base: "stretch", sm: "center" }}
                gap={3}
                mb={3}
              >
                <Box>
                  <Text fontWeight="600" fontSize="sm">
                    Panel Members
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {members.length} member{members.length === 1 ? "" : "s"} —
                    add as many as you need
                  </Text>
                </Box>
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={addMember}
                  variant="outline"
                  borderRadius="0.6rem"
                  colorScheme="purple"
                  alignSelf={{ base: "stretch", sm: "auto" }}
                >
                  Add Member
                </Button>
              </Flex>
              <VStack spacing={3} align="stretch">
                {members.map((row, index) => (
                  <Box
                    key={row.id}
                    border="1px solid"
                    borderColor="#E8EEF2"
                    borderRadius="lg"
                    p={{ base: 2.5, sm: 3 }}
                    bg="white"
                  >
                    <Stack
                      direction={{ base: "column", sm: "row" }}
                      align="stretch"
                      spacing={2}
                      mb={2}
                    >
                      <FormControl isRequired flex={1}>
                        <FormLabel fontSize={12}>Name</FormLabel>
                        <Input
                          borderRadius="0.5rem"
                          placeholder="Member name"
                          value={row.name}
                          onChange={(e) =>
                            updateMember(index, "name", e.target.value)
                          }
                        />
                      </FormControl>
                      <FormControl flex={1}>
                        <FormLabel fontSize={12}>Role</FormLabel>
                        <Input
                          borderRadius="0.5rem"
                          placeholder="Panelist"
                          value={row.role}
                          onChange={(e) =>
                            updateMember(index, "role", e.target.value)
                          }
                        />
                      </FormControl>
                      <IconButton
                        type="button"
                        aria-label="Remove member"
                        icon={<Trash2 size={16} />}
                        variant="ghost"
                        colorScheme="red"
                        alignSelf={{ base: "flex-end", sm: "flex-end" }}
                        mt={{ base: 0, sm: 7 }}
                        isDisabled={members.length <= 1}
                        onClick={() => removeMember(index)}
                      />
                    </Stack>
                    <FormControl isRequired>
                      <FormLabel fontSize={12}>Description</FormLabel>
                      <Textarea
                        borderRadius="0.5rem"
                        placeholder="Panelist description"
                        rows={2}
                        value={row.description}
                        onChange={(e) =>
                          updateMember(index, "description", e.target.value)
                        }
                      />
                    </FormControl>
                  </Box>
                ))}
                {membersError ? (
                  <Text fontSize="sm" color="red.500">
                    {membersError}
                  </Text>
                ) : null}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter
          flexShrink={0}
          flexDirection={{ base: "column-reverse", sm: "row" }}
          gap={2}
          px={{ base: 4, sm: 6 }}
        >
          <Button
            type="button"
            variant="ghost"
            borderRadius="0.75rem"
            w={{ base: "full", sm: "auto" }}
            onClick={handleClose}
          >
            Close
          </Button>
          <Button
            type="submit"
            borderRadius="0.75rem"
            backgroundColor="#FFCB82"
            color="#85652D"
            _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
            fontWeight="500"
            w={{ base: "full", sm: "auto" }}
            isLoading={addStatus === "loading"}
            loadingText="Creating"
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddInterviewPanelModal;
