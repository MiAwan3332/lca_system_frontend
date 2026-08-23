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
  updateInterviewPanel,
  fetchInterviewPanels,
} from "../../Features/interviewPanelSlice";
import {
  INTERVIEW_PANEL_STATUSES,
  createEmptyMemberRow,
  formRowsToMembersPayload,
  getMembersValidationError,
  getPanelTimeRange,
  membersToFormRows,
} from "../../utlls/interviewPanel";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const validationSchema = Yup.object({
  title: Yup.string().required("Required"),
  date: Yup.string().required("Required"),
  description: Yup.string(),
  start_time: Yup.string(),
  end_time: Yup.string().test(
    "after-start",
    "End time must be after start time",
    function (value) {
      const start = this.parent.start_time;
      if (!start || !value) return true;
      return String(value) > String(start);
    }
  ),
  venue: Yup.string(),
  status: Yup.string().required("Required"),
});

function UpdateInterviewPanelModal({ isOpen, onClose, panel }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [members, setMembers] = useState(() => [createEmptyMemberRow(0)]);
  const [membersError, setMembersError] = useState("");
  const { updateStatus } = useSelector((state) => state.interviewPanels);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      date: "",
      start_time: "",
      end_time: "",
      venue: "",
      status: "active",
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!panel?._id) return;
      const memberError = getMembersValidationError(members);
      if (memberError) {
        setMembersError(memberError);
        return;
      }
      setMembersError("");
      try {
        await dispatch(
          updateInterviewPanel({
            authToken,
            id: panel._id,
            values: {
              ...values,
              members: formRowsToMembersPayload(members),
            },
          })
        ).unwrap();
        onClose();
        dispatch(fetchInterviewPanels({ authToken }));
      } catch {
        // toast handled in slice
      }
    },
  });

  // Load panel into form only when opening / switching panel (not every render)
  useEffect(() => {
    if (!isOpen || !panel) return;
    const range = getPanelTimeRange(panel);
    formik.setValues({
      title: panel.title || "",
      description: panel.description || "",
      date: panel.date || "",
      start_time: range.start_time || "",
      end_time: range.end_time || "",
      venue: panel.venue || "",
      status: panel.status === "inactive" ? "inactive" : "active",
    });
    setMembers(membersToFormRows(panel.members));
    setMembersError("");
  }, [isOpen, panel?._id]);

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

  if (!panel) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
          Update Interview Panel
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
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize={14}>Date</FormLabel>
                <Input
                  type="date"
                  name="date"
                  borderRadius="0.5rem"
                  value={formik.values.date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.date && formik.errors.date ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.date}
                  </Box>
                ) : null}
              </FormControl>

              <Box
                border="1px solid"
                borderColor="#E0E8EC"
                borderRadius="xl"
                p={{ base: 3, sm: 4 }}
                bg="#FAFBFC"
              >
                <Text fontWeight="600" fontSize="sm" mb={1}>
                  Time Duration
                </Text>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  From – to (shown in 12-hour time)
                </Text>
                <Stack
                  direction={{ base: "column", sm: "row" }}
                  align="stretch"
                  spacing={3}
                >
                  <FormControl>
                    <FormLabel fontSize={13}>From</FormLabel>
                    <Input
                      type="time"
                      name="start_time"
                      borderRadius="0.5rem"
                      value={formik.values.start_time}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.values.start_time ? (
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {formatTime12Hour(formik.values.start_time)}
                      </Text>
                    ) : null}
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={13}>To</FormLabel>
                    <Input
                      type="time"
                      name="end_time"
                      borderRadius="0.5rem"
                      value={formik.values.end_time}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.values.end_time ? (
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {formatTime12Hour(formik.values.end_time)}
                      </Text>
                    ) : null}
                    {formik.touched.end_time && formik.errors.end_time ? (
                      <Box color="red" fontSize="sm">
                        {formik.errors.end_time}
                      </Box>
                    ) : null}
                  </FormControl>
                </Stack>
                {formik.values.start_time && formik.values.end_time ? (
                  <Text fontSize="sm" fontWeight="600" color="#2D3748" mt={3}>
                    Duration:{" "}
                    {formatClassTimeRange(
                      formik.values.start_time,
                      formik.values.end_time
                    )}
                  </Text>
                ) : null}
              </Box>

              <Stack
                direction={{ base: "column", sm: "row" }}
                align="stretch"
                spacing={3}
              >
                <FormControl>
                  <FormLabel fontSize={14}>Venue</FormLabel>
                  <Input
                    name="venue"
                    borderRadius="0.5rem"
                    value={formik.values.venue}
                    onChange={formik.handleChange}
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
              </Stack>

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
              onClick={onClose}
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
              isLoading={updateStatus === "loading"}
              loadingText="Updating"
            >
              Update
            </Button>
          </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default UpdateInterviewPanelModal;
