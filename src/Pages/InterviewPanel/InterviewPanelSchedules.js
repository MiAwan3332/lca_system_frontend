import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Text,
  Badge,
  HStack,
  VStack,
  Flex,
  Spinner,
  Center,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Stack,
  IconButton,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Cookies from "js-cookie";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader, { FilterStack } from "../../Components/PageHeader";
import {
  clearCurrentInterviewPanel,
  fetchInterviewPanel,
  fetchInterviewPanels,
  updateInterviewPanel,
} from "../../Features/interviewPanelSlice";
import {
  createEmptyScheduleRow,
  formRowsToSchedulesPayload,
  getInterviewPanelStatusMeta,
  getSchedulesValidationError,
  panelToScheduleRows,
} from "../../utlls/interviewPanel";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";

function InterviewPanelSchedules() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [authToken] = useState(Cookies.get("authToken"));
  const [schedules, setSchedules] = useState([]);
  const [schedulesError, setSchedulesError] = useState("");
  const [initializedFor, setInitializedFor] = useState("");

  const { currentPanel, fetchOneStatus, updateStatus } = useSelector(
    (state) => state.interviewPanels
  );

  useEffect(() => {
    if (!id || !authToken) return;
    dispatch(fetchInterviewPanel({ authToken, id }));
    return () => {
      dispatch(clearCurrentInterviewPanel());
    };
  }, [id, authToken, dispatch]);

  const panel = currentPanel?._id === id ? currentPanel : null;
  const statusMeta = panel ? getInterviewPanelStatusMeta(panel.status) : null;

  useEffect(() => {
    if (!panel?._id) return;
    const syncKey = `${panel._id}:${(panel.schedules || []).length}:${panel.updatedAt || ""}`;
    if (initializedFor === syncKey) return;
    setSchedules(panelToScheduleRows(panel));
    setSchedulesError("");
    setInitializedFor(syncKey);
  }, [panel, initializedFor]);

  const updateSchedule = (index, field, value) => {
    setSchedulesError("");
    setSchedules((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addSchedule = () => {
    setSchedulesError("");
    setSchedules((prev) => [
      ...prev,
      createEmptyScheduleRow(prev.length, {
        venue: panel?.venue || "",
      }),
    ]);
  };

  const removeSchedule = (index) => {
    setSchedulesError("");
    setSchedules((prev) => {
      if (prev.length <= 1) {
        return [createEmptyScheduleRow(0, { venue: panel?.venue || "" })];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    if (!panel?._id) return;
    const error = getSchedulesValidationError(schedules);
    if (error) {
      setSchedulesError(error);
      return;
    }
    setSchedulesError("");
    try {
      const payload = formRowsToSchedulesPayload(schedules);
      await dispatch(
        updateInterviewPanel({
          authToken,
          id: panel._id,
          values: { schedules: payload },
        })
      ).unwrap();
      setInitializedFor("");
      dispatch(fetchInterviewPanel({ authToken, id: panel._id }));
      dispatch(fetchInterviewPanels({ authToken }));
    } catch {
      // toast handled in slice
    }
  };

  return (
    <div>
      <PageHeader
        title={panel?.title ? `Schedules · ${panel.title}` : "Panel Schedules"}
      >
        <FilterStack className="filter-stack--actions">
          <button
            className="table-action-btn"
            type="button"
            onClick={() => navigate("/interview-panel")}
          >
            <ArrowLeft size={18} />
            Back to Panels
          </button>
          <button
            className="table-action-btn"
            type="button"
            onClick={() => navigate("/interview-panel-schedules")}
          >
            <CalendarDays size={18} />
            All Schedules
          </button>
          {panel ? (
            <>
              <button
                className="table-action-btn"
                type="button"
                onClick={addSchedule}
              >
                <Plus size={18} />
                Add Schedule
              </button>
              <button
                className="table-action-btn"
                type="button"
                onClick={handleSave}
                disabled={updateStatus === "loading"}
              >
                <Save size={18} />
                {updateStatus === "loading" ? "Saving..." : "Save All"}
              </button>
            </>
          ) : null}
        </FilterStack>
      </PageHeader>

      {fetchOneStatus === "loading" && !panel ? (
        <Center py={16}>
          <Spinner size="lg" color="#85652D" />
        </Center>
      ) : !panel ? (
        <Center
          py={16}
          border="1px dashed"
          borderColor="#E0E8EC"
          borderRadius="2xl"
          bg="#FAFBFC"
          mt={5}
        >
          <VStack spacing={3}>
            <Text fontWeight="600" color="gray.700">
              Interview panel not found
            </Text>
            <Button
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => navigate("/interview-panel")}
              borderRadius="0.75rem"
              backgroundColor="#FFCB82"
              color="#85652D"
              _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
            >
              Back to Panels
            </Button>
          </VStack>
        </Center>
      ) : (
        <>
          <Box
            mt={5}
            border="1px solid"
            borderColor="#E0E8EC"
            borderRadius="2xl"
            bg="white"
            p={{ base: 4, md: 5 }}
          >
            <Flex
              justify="space-between"
              align={{ base: "stretch", sm: "flex-start" }}
              gap={3}
              direction={{ base: "column", sm: "row" }}
            >
              <Box flex={1} minW={0}>
                <Text fontWeight="700" fontSize="xl" color="#2D3748">
                  {panel.title}
                </Text>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {panel.description || "No description"}
                </Text>
                <Text fontSize="sm" color="#85652D" mt={2} fontWeight="600">
                  This panel can have multiple schedules. Add as many date/time
                  slots as you need, then save.
                </Text>
              </Box>
              {statusMeta ? (
                <Badge
                  colorScheme={statusMeta.colorScheme}
                  borderRadius="md"
                  px={2}
                  py={1}
                  alignSelf={{ base: "flex-start", sm: "auto" }}
                >
                  {statusMeta.label}
                </Badge>
              ) : null}
            </Flex>
            <HStack
              mt={4}
              spacing={4}
              flexWrap="wrap"
              color="gray.600"
              fontSize="sm"
            >
              <HStack spacing={2}>
                <Box color="#85652D">
                  <CalendarDays size={15} />
                </Box>
                <Text>
                  Primary:{" "}
                  {panel.date
                    ? moment(panel.date).format("DD MMM YYYY")
                    : "—"}
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Box color="#85652D">
                  <MapPin size={15} />
                </Box>
                <Text>{panel.venue || "No venue"}</Text>
              </HStack>
              <Badge colorScheme="purple" borderRadius="md">
                {schedules.length} schedule
                {schedules.length === 1 ? "" : "s"}
              </Badge>
            </HStack>
          </Box>

          <VStack align="stretch" spacing={4} mt={5}>
            {schedules.map((row, index) => (
              <Box
                key={row.id}
                border="1px solid"
                borderColor="#E0E8EC"
                borderRadius="2xl"
                bg="white"
                p={{ base: 4, md: 5 }}
              >
                <Flex justify="space-between" align="center" mb={4} gap={2}>
                  <Text fontWeight="700" color="#2D3748">
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

            <Flex
              direction={{ base: "column", sm: "row" }}
              gap={3}
              justify="space-between"
              align={{ base: "stretch", sm: "center" }}
            >
              <Button
                type="button"
                leftIcon={<Plus size={16} />}
                onClick={addSchedule}
                variant="outline"
                borderRadius="0.75rem"
                colorScheme="purple"
                w={{ base: "full", sm: "auto" }}
              >
                Add another schedule
              </Button>
              <Button
                type="button"
                leftIcon={<Save size={16} />}
                onClick={handleSave}
                borderRadius="0.75rem"
                backgroundColor="#FFCB82"
                color="#85652D"
                _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                isLoading={updateStatus === "loading"}
                loadingText="Saving"
                w={{ base: "full", sm: "auto" }}
              >
                Save all schedules
              </Button>
            </Flex>
          </VStack>
        </>
      )}
    </div>
  );
}

export default InterviewPanelSchedules;
