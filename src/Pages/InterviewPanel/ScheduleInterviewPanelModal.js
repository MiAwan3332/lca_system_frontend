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
  VStack,
  Stack,
  Flex,
  Box,
  IconButton,
  Text,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { Plus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateInterviewPanel,
  fetchInterviewPanel,
  fetchInterviewPanels,
  fetchInterviewPanelScheduleBoard,
} from "../../Features/interviewPanelSlice";
import {
  createEmptyScheduleRow,
  formRowsToSchedulesPayload,
  getSchedulesValidationError,
  panelToScheduleRows,
} from "../../utlls/interviewPanel";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

function ScheduleInterviewPanelModal({ isOpen, onClose, panel }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [schedules, setSchedules] = useState(() => [createEmptyScheduleRow(0)]);
  const [schedulesError, setSchedulesError] = useState("");
  const { updateStatus } = useSelector((state) => state.interviewPanels);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isOpen || !panel) return;
    setSchedules(panelToScheduleRows(panel));
    setSchedulesError("");
  }, [isOpen, panel?._id, panel?.updatedAt, panel?.schedules?.length]);

  if (!panel) return null;

  const updateSchedule = (index, field, value) => {
    setSchedulesError("");
    setSchedules((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addSchedule = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSchedules((prev) => [
      ...prev,
      createEmptyScheduleRow(prev.length, { venue: panel.venue || "" }),
    ]);
  };

  const removeSchedule = (index) => {
    setSchedules((prev) => {
      if (prev.length <= 1) return [createEmptyScheduleRow(0)];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = getSchedulesValidationError(schedules);
    if (error) {
      setSchedulesError(error);
      return;
    }
    setSchedulesError("");
    try {
      await dispatch(
        updateInterviewPanel({
          authToken,
          id: panel._id,
          values: {
            schedules: formRowsToSchedulesPayload(schedules),
          },
        })
      ).unwrap();
      onClose();
      dispatch(fetchInterviewPanel({ authToken, id: panel._id }));
      dispatch(fetchInterviewPanels({ authToken }));
      dispatch(
        fetchInterviewPanelScheduleBoard({
          authToken,
          query: "",
          status: "",
          start_date: "",
          end_date: "",
        })
      );
    } catch {
      // toast handled in slice
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("2xl")}
    >
      <ModalOverlay />
      <ModalContent
        {...responsiveModalContentProps}
        as="form"
        onSubmit={handleSubmit}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        maxH={{ base: "100dvh", sm: "90vh" }}
        w={{ base: "100%", sm: "90%", md: "42rem", lg: "52rem" }}
        maxW={{ base: "100%", sm: "52rem" }}
        borderRadius={{ base: 0, sm: "2xl" }}
      >
        <ModalHeader
          className="text-xl font-semibold"
          pr={12}
          fontSize={{ base: "lg", sm: "xl" }}
          flexShrink={0}
        >
          Panel Schedules
          <Text fontSize="sm" fontWeight="400" color="gray.500" mt={1}>
            {panel.title}
          </Text>
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
          }}
        >
          <Flex
            direction={{ base: "column", sm: "row" }}
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
            gap={3}
            mb={4}
          >
            <Box>
              <Text fontWeight="600" fontSize="sm">
                Schedules
              </Text>
              <Text fontSize="xs" color="gray.500">
                {schedules.length} slot{schedules.length === 1 ? "" : "s"} — add
                as many as you need
              </Text>
            </Box>
            <Button
              type="button"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={addSchedule}
              variant="outline"
              borderRadius="0.6rem"
              colorScheme="purple"
              alignSelf={{ base: "stretch", sm: "auto" }}
            >
              Add Schedule
            </Button>
          </Flex>

          <VStack spacing={3} align="stretch">
            {schedules.map((row, index) => (
              <Box
                key={row.id}
                border="1px solid"
                borderColor="#E0E8EC"
                borderRadius="xl"
                p={{ base: 3, sm: 4 }}
                bg="#FAFBFC"
              >
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontWeight="600" fontSize="sm">
                    Schedule {index + 1}
                  </Text>
                  <IconButton
                    type="button"
                    aria-label="Remove schedule"
                    icon={<Trash2 size={16} />}
                    variant="ghost"
                    colorScheme="red"
                    size="sm"
                    isDisabled={schedules.length <= 1}
                    onClick={() => removeSchedule(index)}
                  />
                </Flex>

                <VStack spacing={3} align="stretch">
                  <FormControl isRequired>
                    <FormLabel fontSize={13}>Date</FormLabel>
                    <Input
                      type="date"
                      borderRadius="0.5rem"
                      value={row.date}
                      onChange={(e) =>
                        updateSchedule(index, "date", e.target.value)
                      }
                    />
                  </FormControl>

                  <Stack
                    direction={{ base: "column", sm: "row" }}
                    align="stretch"
                    spacing={3}
                  >
                    <FormControl>
                      <FormLabel fontSize={13}>From</FormLabel>
                      <Input
                        type="time"
                        borderRadius="0.5rem"
                        value={row.start_time}
                        onChange={(e) =>
                          updateSchedule(index, "start_time", e.target.value)
                        }
                      />
                      {row.start_time ? (
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          {formatTime12Hour(row.start_time)}
                        </Text>
                      ) : null}
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize={13}>To</FormLabel>
                      <Input
                        type="time"
                        borderRadius="0.5rem"
                        value={row.end_time}
                        onChange={(e) =>
                          updateSchedule(index, "end_time", e.target.value)
                        }
                      />
                      {row.end_time ? (
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          {formatTime12Hour(row.end_time)}
                        </Text>
                      ) : null}
                    </FormControl>
                  </Stack>

                  {row.start_time && row.end_time ? (
                    <Text fontSize="sm" fontWeight="600" color="#2D3748">
                      Duration:{" "}
                      {formatClassTimeRange(row.start_time, row.end_time)}
                    </Text>
                  ) : null}

                  <FormControl>
                    <FormLabel fontSize={13}>Venue</FormLabel>
                    <Input
                      borderRadius="0.5rem"
                      placeholder="e.g. Conference Room"
                      value={row.venue}
                      onChange={(e) =>
                        updateSchedule(index, "venue", e.target.value)
                      }
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize={13}>Notes</FormLabel>
                    <Textarea
                      borderRadius="0.5rem"
                      rows={2}
                      placeholder="Optional notes for this slot"
                      value={row.notes}
                      onChange={(e) =>
                        updateSchedule(index, "notes", e.target.value)
                      }
                    />
                  </FormControl>
                </VStack>
              </Box>
            ))}

            {schedulesError ? (
              <Text fontSize="sm" color="red.500">
                {schedulesError}
              </Text>
            ) : null}
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
            loadingText="Saving"
          >
            Save Schedules
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ScheduleInterviewPanelModal;
