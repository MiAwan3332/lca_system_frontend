import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
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
  Text,
  Box,
  Flex,
  HStack,
  Badge,
  Spinner,
  Divider,
  IconButton,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import axios from "axios";
import moment from "moment";
import {
  CalendarDays,
  CalendarPlus,
  Clock3,
  MapPin,
  NotebookPen,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateInterviewPanel,
  fetchInterviewPanelScheduleBoard,
  fetchInterviewPanels,
} from "../../Features/interviewPanelSlice";
import {
  createEmptyScheduleRow,
  formRowsToSchedulesPayload,
  getSchedulesValidationError,
} from "../../utlls/interviewPanel";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import { config } from "../../utlls/config";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const createInitialSchedules = (venue = "") => [
  createEmptyScheduleRow(0, {
    date: "",
    start_time: "",
    end_time: "",
    venue: venue || "",
    notes: "",
  }),
];

const fieldStyles = {
  borderRadius: "0.75rem",
  borderColor: "#E6D5B8",
  bg: "white",
  _hover: { borderColor: "#E3B574" },
  _focus: {
    borderColor: "#E3B574",
    boxShadow: "0 0 0 1px #E3B574",
  },
};

function FieldIcon({ icon }) {
  return (
    <Flex
      w="34px"
      h="34px"
      align="center"
      justify="center"
      borderRadius="lg"
      bg="rgba(255, 203, 130, 0.35)"
      color="#85652D"
      flexShrink={0}
    >
      {icon}
    </Flex>
  );
}

function AddPanelScheduleModal({
  isOpen,
  onClose,
  panels = [],
  initialPanelId = "",
  boardFilters = {},
}) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [panelId, setPanelId] = useState("");
  const [schedules, setSchedules] = useState(() => createInitialSchedules());
  const [error, setError] = useState("");
  const [panelOptions, setPanelOptions] = useState([]);
  const [loadingPanels, setLoadingPanels] = useState(false);
  const { updateStatus } = useSelector((state) => state.interviewPanels);
  const dispatch = useDispatch();

  const selectedPanel = (panelOptions || []).find(
    (panel) => String(panel._id) === String(panelId)
  );

  const filledCount = useMemo(
    () => formRowsToSchedulesPayload(schedules).length,
    [schedules]
  );

  const previewSlots = useMemo(() => {
    return schedules.map((row, index) => ({
      id: row.id,
      index: index + 1,
      dateLabel: row.date
        ? moment(row.date).format("ddd, DD MMM YYYY")
        : "Pick a date",
      duration:
        formatClassTimeRange(row.start_time, row.end_time) ||
        formatTime12Hour(row.start_time) ||
        "Set time",
      venue: row.venue || selectedPanel?.venue || "Venue optional",
    }));
  }, [schedules, selectedPanel]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const loadPanels = async () => {
      setLoadingPanels(true);
      setError("");
      try {
        const response = await axios.get(
          `${config.BASE_URL}/interview-panels`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { page: 1, limit: 500 },
          }
        );
        if (cancelled) return;
        const docs = response.data?.docs || [];
        setPanelOptions(docs.length > 0 ? docs : panels || []);
        const preferred =
          initialPanelId ||
          (docs.length === 1 ? docs[0]._id : "") ||
          "";
        setPanelId(preferred ? String(preferred) : "");
      } catch {
        if (cancelled) return;
        setPanelOptions(panels || []);
        setPanelId(initialPanelId ? String(initialPanelId) : "");
      } finally {
        if (!cancelled) setLoadingPanels(false);
      }
    };

    setSchedules(createInitialSchedules());
    loadPanels();

    return () => {
      cancelled = true;
    };
  }, [isOpen, initialPanelId, authToken]);

  useEffect(() => {
    if (!isOpen || !selectedPanel) return;
    setSchedules((prev) =>
      prev.map((row) =>
        row.venue ? row : { ...row, venue: selectedPanel.venue || "" }
      )
    );
  }, [isOpen, selectedPanel?._id]);

  const updateSchedule = (index, field, value) => {
    setError("");
    setSchedules((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addSchedule = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setError("");
    setSchedules((prev) => [
      ...prev,
      createEmptyScheduleRow(prev.length, {
        venue: selectedPanel?.venue || "",
      }),
    ]);
  };

  const removeSchedule = (index) => {
    setError("");
    setSchedules((prev) => {
      if (prev.length <= 1) {
        return createInitialSchedules(selectedPanel?.venue || "");
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClose = () => {
    setPanelId("");
    setSchedules(createInitialSchedules());
    setError("");
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!panelId) {
      setError("Please select a panel");
      return;
    }

    const validationError = getSchedulesValidationError(schedules);
    if (validationError) {
      setError(validationError);
      return;
    }

    const nextSchedules = formRowsToSchedulesPayload(schedules);
    if (nextSchedules.length === 0) {
      setError("Add at least one schedule with a date");
      return;
    }

    try {
      await dispatch(
        updateInterviewPanel({
          authToken,
          id: panelId,
          values: {
            // Server merges onto the latest DB schedules (avoids stale client overwrite)
            append_schedules: true,
            schedules: nextSchedules,
          },
        })
      ).unwrap();
      handleClose();
      dispatch(
        fetchInterviewPanelScheduleBoard({
          authToken,
          query: boardFilters.query || "",
          status: boardFilters.status || "",
          start_date: boardFilters.start_date || "",
          end_date: boardFilters.end_date || "",
        })
      );
      dispatch(fetchInterviewPanels({ authToken }));
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : err?.message || "Could not save schedule. Please try again."
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("xl")}
    >
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
      <ModalContent
        {...responsiveModalContentProps}
        as="form"
        noValidate
        onSubmit={handleSubmit}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        maxH={{ base: "100dvh", sm: "92vh" }}
        borderRadius={{ base: 0, sm: "2xl" }}
        border="1px solid"
        borderColor="#F0E4D0"
        boxShadow="0 24px 60px rgba(101, 78, 38, 0.18)"
      >
        <Box
          flexShrink={0}
          px={{ base: 5, sm: 6 }}
          pt={{ base: 5, sm: 6 }}
          pb={4}
          bg="linear-gradient(135deg, #FFF8EE 0%, #FFE7C2 48%, #FFD9A0 100%)"
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="-40px"
            right="-30px"
            w="160px"
            h="160px"
            borderRadius="full"
            bg="rgba(255,255,255,0.35)"
            pointerEvents="none"
          />
          <Flex align="flex-start" gap={3} position="relative" pr={8}>
            <Flex
              w="48px"
              h="48px"
              align="center"
              justify="center"
              borderRadius="xl"
              bg="white"
              color="#85652D"
              boxShadow="0 8px 20px rgba(133, 101, 45, 0.12)"
              flexShrink={0}
            >
              <CalendarPlus size={24} />
            </Flex>
            <Box flex={1} minW={0}>
              <HStack spacing={2} mb={1} flexWrap="wrap">
                <Text
                  fontSize={{ base: "lg", sm: "xl" }}
                  fontWeight="700"
                  color="#654E26"
                  letterSpacing="-0.02em"
                >
                  Add Panel Schedule
                </Text>
                <Badge
                  bg="rgba(133, 101, 45, 0.12)"
                  color="#85652D"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="10px"
                  textTransform="none"
                >
                  {schedules.length} slot{schedules.length === 1 ? "" : "s"}
                </Badge>
              </HStack>
              <Text fontSize="sm" color="#8A7349" lineHeight="1.45">
                Choose a panel, then add one or more schedule details before
                saving.
              </Text>
            </Box>
          </Flex>
          <ModalCloseButton top={4} right={4} color="#85652D" />
        </Box>

        <ModalBody
          flex="1"
          minH={0}
          overflowY="auto"
          px={{ base: 4, sm: 6 }}
          py={5}
          bg="#FFFDF9"
          css={{
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-thumb": {
              background: "#E3B574",
              borderRadius: "8px",
            },
          }}
        >
          {loadingPanels ? (
            <Flex py={14} direction="column" align="center" gap={3}>
              <Spinner color="#85652D" thickness="3px" size="lg" />
              <Text fontSize="sm" color="gray.500">
                Loading panels...
              </Text>
            </Flex>
          ) : (
            <VStack spacing={5} align="stretch">
              <Box
                border="1px solid"
                borderColor="#F0E4D0"
                borderRadius="2xl"
                p={4}
                bg="white"
                boxShadow="0 6px 18px rgba(133, 101, 45, 0.05)"
              >
                <HStack spacing={3} mb={3}>
                  <FieldIcon icon={<Sparkles size={16} />} />
                  <Box>
                    <Text fontWeight="700" fontSize="sm" color="#2D3748">
                      Interview Panel
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Required — which panel are these schedules for?
                    </Text>
                  </Box>
                </HStack>
                <FormControl isRequired>
                  <Select
                    placeholder="Choose interview panel"
                    value={panelId}
                    onChange={(e) => {
                      setError("");
                      setPanelId(e.target.value);
                    }}
                    {...fieldStyles}
                    h="44px"
                  >
                    {panelOptions.map((panel) => (
                      <option key={panel._id} value={panel._id}>
                        {panel.title}
                        {panel.status === "inactive" ? " (Inactive)" : ""}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                {panelOptions.length === 0 ? (
                  <Text fontSize="xs" color="red.500" mt={2}>
                    No panels available. Create a panel first.
                  </Text>
                ) : null}
                {selectedPanel ? (
                  <Box
                    mt={3}
                    p={3}
                    borderRadius="xl"
                    bg="linear-gradient(90deg, #FFF8EE 0%, #FFFFFF 100%)"
                    border="1px solid"
                    borderColor="#F0E4D0"
                  >
                    <Text fontWeight="600" fontSize="sm" color="#654E26">
                      {selectedPanel.title}
                    </Text>
                    {selectedPanel.description ? (
                      <Text fontSize="xs" color="gray.500" mt={1} noOfLines={2}>
                        {selectedPanel.description}
                      </Text>
                    ) : (
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        No description on this panel
                      </Text>
                    )}
                  </Box>
                ) : null}
              </Box>

              <Flex
                direction={{ base: "column", sm: "row" }}
                justify="space-between"
                align={{ base: "stretch", sm: "center" }}
                gap={3}
              >
                <Box>
                  <Text fontWeight="700" fontSize="sm" color="#2D3748">
                    Schedule details
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Add 1 or more slots for this panel
                  </Text>
                </Box>
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={addSchedule}
                  variant="outline"
                  borderRadius="0.75rem"
                  borderColor="#E3B574"
                  color="#85652D"
                  bg="white"
                  _hover={{ bg: "#FFF8EE" }}
                  alignSelf={{ base: "stretch", sm: "auto" }}
                >
                  Add another schedule
                </Button>
              </Flex>

              <VStack spacing={4} align="stretch">
                {schedules.map((row, index) => (
                  <Box
                    key={row.id}
                    border="1px solid"
                    borderColor="#F0E4D0"
                    borderRadius="2xl"
                    overflow="hidden"
                    bg="white"
                    boxShadow="0 6px 18px rgba(133, 101, 45, 0.05)"
                  >
                    <Flex
                      px={4}
                      py={3}
                      align="center"
                      justify="space-between"
                      gap={2}
                      bg="linear-gradient(90deg, #FFF1DC 0%, #FFF8EE 100%)"
                      borderBottom="1px solid"
                      borderColor="#F0E4D0"
                    >
                      <HStack spacing={3}>
                        <FieldIcon icon={<CalendarDays size={16} />} />
                        <Box>
                          <Text fontWeight="700" fontSize="sm" color="#2D3748">
                            Schedule {index + 1}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Date, duration, venue and notes
                          </Text>
                        </Box>
                      </HStack>
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

                    <VStack spacing={4} align="stretch" p={4}>
                      <FormControl isRequired>
                        <FormLabel
                          fontSize={13}
                          color="#654E26"
                          display="flex"
                          alignItems="center"
                          gap={2}
                        >
                          <CalendarDays size={14} />
                          Date
                        </FormLabel>
                        <Input
                          type="date"
                          value={row.date}
                          onChange={(e) =>
                            updateSchedule(index, "date", e.target.value)
                          }
                          {...fieldStyles}
                          h="44px"
                        />
                      </FormControl>

                      <Stack
                        direction={{ base: "column", sm: "row" }}
                        align="stretch"
                        spacing={3}
                      >
                        <FormControl>
                          <FormLabel
                            fontSize={13}
                            color="#654E26"
                            display="flex"
                            alignItems="center"
                            gap={2}
                          >
                            <Clock3 size={14} />
                            From
                          </FormLabel>
                          <Input
                            type="time"
                            value={row.start_time}
                            onChange={(e) =>
                              updateSchedule(
                                index,
                                "start_time",
                                e.target.value
                              )
                            }
                            {...fieldStyles}
                            h="44px"
                          />
                          {row.start_time ? (
                            <Text
                              fontSize="xs"
                              color="#85652D"
                              mt={1}
                              fontWeight="600"
                            >
                              {formatTime12Hour(row.start_time)}
                            </Text>
                          ) : null}
                        </FormControl>
                        <FormControl>
                          <FormLabel
                            fontSize={13}
                            color="#654E26"
                            display="flex"
                            alignItems="center"
                            gap={2}
                          >
                            <Clock3 size={14} />
                            To
                          </FormLabel>
                          <Input
                            type="time"
                            value={row.end_time}
                            onChange={(e) =>
                              updateSchedule(index, "end_time", e.target.value)
                            }
                            {...fieldStyles}
                            h="44px"
                          />
                          {row.end_time ? (
                            <Text
                              fontSize="xs"
                              color="#85652D"
                              mt={1}
                              fontWeight="600"
                            >
                              {formatTime12Hour(row.end_time)}
                            </Text>
                          ) : null}
                        </FormControl>
                      </Stack>

                      {row.start_time && row.end_time ? (
                        <Flex
                          align="center"
                          gap={2}
                          px={3}
                          py={2}
                          borderRadius="lg"
                          bg="#FFF8EE"
                          border="1px dashed"
                          borderColor="#E3B574"
                        >
                          <Clock3 size={14} color="#85652D" />
                          <Text fontSize="sm" fontWeight="700" color="#654E26">
                            Duration:{" "}
                            {formatClassTimeRange(row.start_time, row.end_time)}
                          </Text>
                        </Flex>
                      ) : null}

                      <FormControl>
                        <FormLabel
                          fontSize={13}
                          color="#654E26"
                          display="flex"
                          alignItems="center"
                          gap={2}
                        >
                          <MapPin size={14} />
                          Venue
                        </FormLabel>
                        <Input
                          placeholder="e.g. Conference Room"
                          value={row.venue}
                          onChange={(e) =>
                            updateSchedule(index, "venue", e.target.value)
                          }
                          {...fieldStyles}
                          h="44px"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel
                          fontSize={13}
                          color="#654E26"
                          display="flex"
                          alignItems="center"
                          gap={2}
                        >
                          <NotebookPen size={14} />
                          Notes
                        </FormLabel>
                        <Textarea
                          rows={2}
                          placeholder="Optional notes for this slot"
                          value={row.notes}
                          onChange={(e) =>
                            updateSchedule(index, "notes", e.target.value)
                          }
                          {...fieldStyles}
                        />
                      </FormControl>
                    </VStack>
                  </Box>
                ))}
              </VStack>

              <Button
                type="button"
                leftIcon={<Plus size={16} />}
                onClick={addSchedule}
                variant="outline"
                borderRadius="0.85rem"
                borderColor="#E3B574"
                color="#85652D"
                bg="white"
                _hover={{ bg: "#FFF8EE" }}
                w="full"
              >
                Add another schedule
              </Button>

              <Box
                borderRadius="2xl"
                p={4}
                bg="linear-gradient(135deg, #2F2416 0%, #5A4528 55%, #85652D 100%)"
                color="white"
                boxShadow="0 12px 28px rgba(47, 36, 22, 0.25)"
              >
                <Flex justify="space-between" align="center" mb={2} gap={2}>
                  <Text fontSize="xs" letterSpacing="0.08em" opacity={0.7}>
                    LIVE PREVIEW
                  </Text>
                  <Badge
                    bg="whiteAlpha.200"
                    color="white"
                    borderRadius="full"
                    textTransform="none"
                  >
                    {filledCount || schedules.length} schedule
                    {(filledCount || schedules.length) === 1 ? "" : "s"}
                  </Badge>
                </Flex>
                <Text fontWeight="700" fontSize="md" mb={3} noOfLines={1}>
                  {selectedPanel?.title || "Select a panel"}
                </Text>
                <Divider borderColor="whiteAlpha.300" mb={3} />
                <VStack align="stretch" spacing={3} fontSize="sm">
                  {previewSlots.map((slot) => (
                    <Box
                      key={slot.id}
                      borderRadius="lg"
                      px={3}
                      py={2}
                      bg="whiteAlpha.100"
                    >
                      <Text fontWeight="700" mb={1}>
                        Schedule {slot.index}
                      </Text>
                      <HStack spacing={2} opacity={0.95}>
                        <CalendarDays size={13} />
                        <Text>{slot.dateLabel}</Text>
                      </HStack>
                      <HStack spacing={2} mt={1} opacity={0.95}>
                        <Clock3 size={13} />
                        <Text>{slot.duration}</Text>
                      </HStack>
                      <HStack spacing={2} mt={1} align="flex-start" opacity={0.95}>
                        <Box mt="2px">
                          <MapPin size={13} />
                        </Box>
                        <Text noOfLines={1}>{slot.venue}</Text>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {error ? (
                <Box
                  borderRadius="xl"
                  px={3}
                  py={2}
                  bg="red.50"
                  border="1px solid"
                  borderColor="red.100"
                >
                  <Text fontSize="sm" color="red.500">
                    {error}
                  </Text>
                </Box>
              ) : null}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter
          flexShrink={0}
          flexDirection={{ base: "column-reverse", sm: "row" }}
          gap={2}
          px={{ base: 4, sm: 6 }}
          py={4}
          bg="white"
          borderTop="1px solid"
          borderColor="#F0E4D0"
        >
          <Button
            type="button"
            variant="ghost"
            borderRadius="0.85rem"
            w={{ base: "full", sm: "auto" }}
            color="#85652D"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            borderRadius="0.85rem"
            background="linear-gradient(135deg, #FFCB82 0%, #E3B574 100%)"
            color="#654E26"
            _hover={{
              background: "linear-gradient(135deg, #E3B574 0%, #D4A45F 100%)",
              color: "#4E3B1C",
            }}
            fontWeight="700"
            w={{ base: "full", sm: "auto" }}
            minW={{ sm: "180px" }}
            leftIcon={<CalendarPlus size={16} />}
            isLoading={updateStatus === "loading"}
            loadingText="Saving"
            isDisabled={loadingPanels || panelOptions.length === 0}
            boxShadow="0 8px 18px rgba(227, 181, 116, 0.45)"
          >
            Save {schedules.length} schedule
            {schedules.length === 1 ? "" : "s"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddPanelScheduleModal;
