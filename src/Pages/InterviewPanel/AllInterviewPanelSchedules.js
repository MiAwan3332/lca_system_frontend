import {
  Box,
  Button,
  SimpleGrid,
  Text,
  Badge,
  HStack,
  VStack,
  Flex,
  Spinner,
  Center,
  FormControl,
  Select,
  Input,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  ExternalLink,
  Eye,
  FilterX,
  MapPin,
  NotebookPen,
  Play,
  Plus,
  Users,
} from "lucide-react";
import Cookies from "js-cookie";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";
import PageHeader, { FilterStack } from "../../Components/PageHeader";
import {
  fetchInterviewPanelScheduleBoard,
  startInterviewSession,
} from "../../Features/interviewPanelSlice";
import {
  fetchQualifiers,
  selectAllQualifiers,
} from "../../Features/qualifierSlice";
import {
  flattenAllPanelSchedules,
  getInterviewPanelStatusMeta,
} from "../../utlls/interviewPanel";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import AddPanelScheduleModal from "./AddPanelScheduleModal";
import BookInterviewModal from "./BookInterviewModal";
import InterviewEvaluationDetailsModal from "./InterviewEvaluationDetailsModal";
import { isQualifierRole } from "../../utlls/qualifierAccess";
import { isPanelistRole } from "../../utlls/panelistAccess";
import {
  isQualifierProfileComplete,
  getQualifierProfileIncompleteFields,
  QUALIFIER_PROFILE_INCOMPLETE_MESSAGE,
} from "../../utlls/qualifierProfile";
import { getInterviewConductPath } from "../../utlls/interviewEvaluation";

const INTERVIEW_PROGRESS_OPTIONS = [
  { value: "", label: "All" },
  { value: "available", label: "Available" },
  { value: "booked", label: "Booked" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const getInterviewProgressMeta = (interviewStatus, bookingStatus) => {
  const status = String(interviewStatus || "not_started").toLowerCase();
  const booked =
    String(bookingStatus || "available").toLowerCase() === "booked";
  if (status === "completed") {
    return { value: "completed", label: "Completed", colorScheme: "green" };
  }
  if (status === "in_progress" || status === "in-progress") {
    return { value: "in_progress", label: "In Progress", colorScheme: "orange" };
  }
  if (booked) {
    return { value: "booked", label: "Booked", colorScheme: "green" };
  }
  return { value: "available", label: "Available", colorScheme: "gray" };
};

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

const phonesMatch = (a, b) => {
  const left = digitsOnly(a);
  const right = digitsOnly(b);
  if (!left || !right || left.length < 10 || right.length < 10) return false;
  return left === right || left.slice(-10) === right.slice(-10);
};

/** Qualifiers may see open slots and only their own booked/in-progress/completed ones. */
const isQualifierVisibleSchedule = (row, qualifier) => {
  if (String(row?.booking_status || "available").toLowerCase() !== "booked") {
    return true;
  }
  if (!qualifier) return false;
  if (
    row.booked_qualifier_id &&
    String(row.booked_qualifier_id) === String(qualifier._id)
  ) {
    return true;
  }
  if (phonesMatch(row.booked_phone, qualifier.phone)) return true;
  const bookedName = String(row.booked_for || "").trim().toLowerCase();
  const qualifierName = String(qualifier.name || "").trim().toLowerCase();
  return Boolean(bookedName && qualifierName && bookedName === qualifierName);
};

function AllInterviewPanelSchedules() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const isQualifier = isQualifierRole();
  const isPanelist = isPanelistRole();
  const isReadOnlyRole = isQualifier || isPanelist;
  const [authToken] = useState(Cookies.get("authToken"));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [bookingFilter, setBookingFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedScheduleRow, setSelectedScheduleRow] = useState(null);
  const [selectedDetailsRow, setSelectedDetailsRow] = useState(null);
  const [pendingStartRow, setPendingStartRow] = useState(null);
  const startConfirmRef = useRef(null);
  const {
    isOpen: isStartConfirmOpen,
    onOpen: onStartConfirmOpen,
    onClose: onStartConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isBookOpen,
    onOpen: onBookOpen,
    onClose: onBookClose,
  } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const { scheduleBoardPanels, fetchScheduleBoardStatus, startInterviewStatus } =
    useSelector((state) => state.interviewPanels);
  const qualifiers = useSelector(selectAllQualifiers);
  const myQualifier = isQualifier ? qualifiers[0] || null : null;
  const profileComplete = isQualifier
    ? isQualifierProfileComplete(myQualifier)
    : true;
  const missingProfileFields = isQualifier
    ? getQualifierProfileIncompleteFields(myQualifier)
    : [];

  const loadSchedules = (overrides = {}) => {
    dispatch(
      fetchInterviewPanelScheduleBoard({
        authToken,
        query: overrides.query ?? query,
        status: overrides.status ?? status,
        start_date: overrides.start_date ?? startDate,
        end_date: overrides.end_date ?? endDate,
      })
    );
  };

  useEffect(() => {
    loadSchedules();
    if (isQualifier && authToken) {
      dispatch(fetchQualifiers({ authToken }));
    }
  }, []);

  const allSchedules = useMemo(() => {
    const rows = flattenAllPanelSchedules(scheduleBoardPanels);
    if (!isQualifier) return rows;
    return rows.filter((row) => isQualifierVisibleSchedule(row, myQualifier));
  }, [scheduleBoardPanels, isQualifier, myQualifier]);

  const progressCounts = useMemo(() => {
    const counts = { available: 0, booked: 0, in_progress: 0, completed: 0 };
    allSchedules.forEach((row) => {
      const progress = getInterviewProgressMeta(
        row.interview_status,
        row.booking_status
      );
      if (counts[progress.value] != null) {
        counts[progress.value] += 1;
      }
    });
    return counts;
  }, [allSchedules]);

  const filteredSchedules = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    return allSchedules.filter((row) => {
      if (status) {
        const meta = getInterviewPanelStatusMeta(row.panel_status);
        if (meta.value !== status) return false;
      }
      if (bookingFilter === "booked" && row.booking_status !== "booked") {
        return false;
      }
      if (bookingFilter === "available" && row.booking_status === "booked") {
        return false;
      }
      if (progressFilter) {
        const progress = getInterviewProgressMeta(
          row.interview_status,
          row.booking_status
        );
        if (progress.value !== progressFilter) return false;
      }
      if (startDate && row.date && row.date < startDate) return false;
      if (endDate && row.date && row.date > endDate) return false;
      if (!q) return true;
      const memberMatch = (row.members || []).some(
        (member) =>
          String(member.name || "").toLowerCase().includes(q) ||
          String(member.role || "").toLowerCase().includes(q) ||
          String(member.description || "").toLowerCase().includes(q)
      );
      return (
        String(row.panel_title || "").toLowerCase().includes(q) ||
        String(row.venue || "").toLowerCase().includes(q) ||
        String(row.notes || "").toLowerCase().includes(q) ||
        String(row.booked_for || "").toLowerCase().includes(q) ||
        memberMatch
      );
    });
  }, [allSchedules, query, status, bookingFilter, progressFilter, startDate, endDate]);

  const handleClearFilters = () => {
    setQuery("");
    setStatus("");
    setBookingFilter("");
    setProgressFilter("");
    setStartDate("");
    setEndDate("");
    loadSchedules({
      query: "",
      status: "",
      start_date: "",
      end_date: "",
    });
  };

  const openBookModal = (row) => {
    if (isQualifier && !profileComplete) {
      toast({
        title: "Complete your profile first",
        description: `${QUALIFIER_PROFILE_INCOMPLETE_MESSAGE}${
          missingProfileFields.length
            ? ` Missing: ${missingProfileFields.join(", ")}.`
            : ""
        }`,
        status: "warning",
        duration: 6000,
        isClosable: true,
      });
      navigate("/qualifiers");
      return;
    }
    setSelectedScheduleRow(row);
    onBookOpen();
  };

  const closeBookModal = () => {
    onBookClose();
    setSelectedScheduleRow(null);
  };

  const openDetailsModal = (row) => {
    setSelectedDetailsRow(row);
    onDetailsOpen();
  };

  const closeDetailsModal = () => {
    onDetailsClose();
    setSelectedDetailsRow(null);
  };

  const getStartInterviewLabel = (row) => {
    const status = String(row.interview_status || "not_started");
    if (status === "completed") return "View Evaluation";
    if (status === "in_progress") return "Continue Interview";
    return "Start Interview";
  };

  const openConductPage = (row) => {
    navigate(
      getInterviewConductPath(row.panel_id, row.schedule_array_index)
    );
  };

  const handleStartInterviewClick = (row) => {
    const status = String(row.interview_status || "not_started");
    if (status === "in_progress" || status === "completed") {
      openConductPage(row);
      return;
    }
    setPendingStartRow(row);
    onStartConfirmOpen();
  };

  const confirmStartInterview = async () => {
    if (!pendingStartRow || !authToken) return;
    const row = pendingStartRow;
    const result = await dispatch(
      startInterviewSession({
        authToken,
        panelId: row.panel_id,
        schedule_index: row.schedule_array_index,
      })
    );
    onStartConfirmClose();
    setPendingStartRow(null);
    if (startInterviewSession.fulfilled.match(result)) {
      openConductPage(row);
    }
  };

  const selectedPanelForBooking = scheduleBoardPanels.find(
    (panel) => String(panel._id) === String(selectedScheduleRow?.panel_id)
  );

  const boardFilters = {
    query,
    status,
    start_date: startDate,
    end_date: endDate,
  };

  return (
    <Box w="full" maxW="100%" minW={0} overflowX="hidden">
      <PageHeader
        title={
          isQualifier
            ? "My Panel Schedules"
            : "All Panel Schedules"
        }
      >
        {!isReadOnlyRole && (
          <FilterStack className="filter-stack--actions">
            <button
              className="table-action-btn table-action-btn--primary"
              type="button"
              onClick={onAddOpen}
            >
              <Plus size={18} />
              <span>Add Schedule</span>
            </button>
            <button
              className="table-action-btn"
              type="button"
              onClick={() => navigate("/interview-panel")}
            >
              <span>Interview Panels</span>
            </button>
          </FilterStack>
        )}
      </PageHeader>

      <Box
        mt={3}
        w="full"
        minW={0}
        borderWidth="1px"
        borderColor="var(--dash-border)"
        borderRadius="xl"
        bg="var(--dash-surface)"
        boxShadow="var(--dash-shadow)"
        px={{ base: 3, sm: 4 }}
        py={{ base: 3, sm: 4 }}
      >
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.500"
          letterSpacing="wider"
          mb={2}
        >
          INTERVIEW STATUS
        </Text>
        <SimpleGrid columns={{ base: 2, sm: 3, lg: 5 }} spacing={2} w="full">
          {INTERVIEW_PROGRESS_OPTIONS.map((option) => {
            const isActive = progressFilter === option.value;
            const count = option.value
              ? progressCounts[option.value] || 0
              : allSchedules.length;
            return (
              <Button
                key={option.value || "all"}
                type="button"
                size="sm"
                w="full"
                minH="44px"
                px={{ base: 2, sm: 3 }}
                whiteSpace="normal"
                lineHeight="1.2"
                fontSize={{ base: "xs", sm: "sm" }}
                borderRadius="xl"
                border="1px solid"
                borderColor={isActive ? "#E3B574" : "#E0E8EC"}
                bg={isActive ? "#FFCB82" : "white"}
                color={isActive ? "#654E26" : "#4A5568"}
                _hover={{ bg: isActive ? "#E3B574" : "#FFFBF5" }}
                onClick={() => setProgressFilter(option.value)}
              >
                {option.label}
                <Text as="span" fontWeight="700" ml={1}>
                  ({count})
                </Text>
              </Button>
            );
          })}
        </SimpleGrid>
      </Box>

      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        <FormControl className="responsive-input" w={{ base: "full", sm: "auto" }} minW={0}>
          <Input
            borderRadius="0.75rem"
            placeholder="Search panel, venue..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </FormControl>
        {!isQualifier && (
          <>
            <FormControl className="responsive-input" w={{ base: "full", sm: "auto" }} minW={0}>
              <Select
                borderRadius="0.75rem"
                value={status}
                onChange={(e) => {
                  const next = e.target.value;
                  setStatus(next);
                  loadSchedules({ status: next });
                }}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormControl>
            <FormControl className="responsive-input" w={{ base: "full", sm: "auto" }} minW={0}>
              <Select
                borderRadius="0.75rem"
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
              >
                <option value="">All bookings</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
              </Select>
            </FormControl>
          </>
        )}
        <FormControl className="responsive-input" w={{ base: "full", sm: "auto" }} minW={0}>
          <Input
            type="date"
            borderRadius="0.75rem"
            value={startDate}
            onChange={(e) => {
              const next = e.target.value;
              setStartDate(next);
              loadSchedules({ start_date: next });
            }}
          />
        </FormControl>
        <FormControl className="responsive-input" w={{ base: "full", sm: "auto" }} minW={0}>
          <Input
            type="date"
            borderRadius="0.75rem"
            value={endDate}
            onChange={(e) => {
              const next = e.target.value;
              setEndDate(next);
              loadSchedules({ end_date: next });
            }}
          />
        </FormControl>
        <button className="table-action-btn" type="button" onClick={handleClearFilters}>
          <FilterX size={18} />
          Clear
        </button>
      </FilterStack>

      <Text mt={{ base: 3, md: 4 }} fontSize="sm" color="gray.600" px={{ base: 1, sm: 0 }}>
        Showing {filteredSchedules.length} schedule
        {filteredSchedules.length === 1 ? "" : "s"} across{" "}
        {scheduleBoardPanels.length} panel
        {scheduleBoardPanels.length === 1 ? "" : "s"}
      </Text>

      {isQualifier && !profileComplete ? (
        <Box
          mt={3}
          borderWidth="1px"
          borderColor="orange.200"
          borderRadius="xl"
          bg="orange.50"
          px={4}
          py={3}
        >
          <Text fontWeight="600" fontSize="sm" color="orange.800">
            Complete your profile to book an interview
          </Text>
          <Text fontSize="sm" color="orange.700" mt={1}>
            {QUALIFIER_PROFILE_INCOMPLETE_MESSAGE}
            {missingProfileFields.length
              ? ` Missing: ${missingProfileFields.join(", ")}.`
              : ""}
          </Text>
          <Button
            mt={3}
            size="sm"
            borderRadius="lg"
            backgroundColor="#FFCB82"
            color="#85652D"
            _hover={{ bg: "#E3B574" }}
            onClick={() => navigate("/qualifiers")}
          >
            Go to My Profile
          </Button>
        </Box>
      ) : null}

      <Box mt={{ base: 3, md: 4 }} w="full" minW={0}>
        {fetchScheduleBoardStatus === "loading" ? (
          <Center py={{ base: 12, md: 16 }}>
            <Spinner size="lg" color="#85652D" />
          </Center>
        ) : filteredSchedules.length === 0 ? (
          <Center
            py={{ base: 12, md: 16 }}
            px={4}
            border="1px dashed"
            borderColor="#E0E8EC"
            borderRadius="2xl"
            bg="#FAFBFC"
          >
            <VStack spacing={2} textAlign="center" px={2}>
              <Text fontWeight="600" color="gray.700">
                No schedules found
              </Text>
              <Text fontSize="sm" color="gray.500">
                {isQualifier
                  ? "No available panel schedules match your filters."
                  : isPanelist
                    ? "No panel schedules match your filters."
                    : "Select a panel and add a schedule to get started."}
              </Text>
              {!isReadOnlyRole && (
              <Flex
                direction={{ base: "column", sm: "row" }}
                gap={3}
                mt={2}
                w={{ base: "full", sm: "auto" }}
                justify="center"
              >
                <Button
                  w={{ base: "full", sm: "auto" }}
                  leftIcon={<Plus size={16} />}
                  onClick={onAddOpen}
                  borderRadius="0.75rem"
                  backgroundColor="#FFCB82"
                  color="#85652D"
                  _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                  isDisabled={scheduleBoardPanels.length === 0}
                >
                  Add Schedule
                </Button>
                <Button
                  w={{ base: "full", sm: "auto" }}
                  onClick={() => navigate("/interview-panel")}
                  borderRadius="0.75rem"
                  variant="outline"
                >
                  Go to Interview Panels
                </Button>
              </Flex>
              )}
            </VStack>
          </Center>
        ) : (
          <SimpleGrid
            columns={{ base: 1, md: 2, xl: 3 }}
            spacing={{ base: 3, md: 4 }}
            w="full"
          >
            {filteredSchedules.map((row) => {
              const statusMeta = getInterviewPanelStatusMeta(row.panel_status);
              const progressMeta = getInterviewProgressMeta(
                row.interview_status,
                row.booking_status
              );
              const showProgressBadge =
                progressMeta.value === "in_progress" ||
                progressMeta.value === "completed";
              const duration =
                formatClassTimeRange(row.start_time, row.end_time) ||
                formatTime12Hour(row.start_time) ||
                "—";
              const isBooked = row.booking_status === "booked";
              const isCompleted =
                String(row.interview_status || "").toLowerCase() ===
                "completed";
              return (
                <Box
                  key={row.id}
                  border="1px solid"
                  borderColor="#E0E8EC"
                  borderRadius="2xl"
                  bg="white"
                  p={{ base: 4, md: 5 }}
                  display="flex"
                  flexDirection="column"
                  gap={{ base: 3, md: 3 }}
                  minW={0}
                  w="full"
                  overflow="hidden"
                  transition="box-shadow 0.2s ease, border-color 0.2s ease"
                  _hover={{
                    borderColor: "#E3B574",
                    boxShadow: "0 8px 24px rgba(133, 101, 45, 0.08)",
                  }}
                >
                  <Flex justify="space-between" align="flex-start" gap={3}>
                    <Box flex={1} minW={0}>
                      <Text
                        fontWeight="700"
                        fontSize={{ base: "md", md: "lg" }}
                        color="#2D3748"
                        noOfLines={2}
                        wordBreak="break-word"
                      >
                        {row.panel_title}
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Schedule {row.schedule_index}
                      </Text>
                    </Box>
                    <Flex
                      wrap="wrap"
                      justify="flex-end"
                      gap={1}
                      flexShrink={0}
                      maxW={{ base: "48%", sm: "none" }}
                    >
                      <Badge
                        colorScheme={statusMeta.colorScheme}
                        borderRadius="md"
                        px={2}
                        py={1}
                      >
                        {statusMeta.label}
                      </Badge>
                      <Badge
                        colorScheme={isBooked ? "green" : "gray"}
                        borderRadius="md"
                        px={2}
                        py={1}
                      >
                        {isBooked ? "Booked" : "Available"}
                      </Badge>
                      {showProgressBadge ? (
                        <Badge
                          colorScheme={progressMeta.colorScheme}
                          borderRadius="md"
                          px={2}
                          py={1}
                        >
                          {progressMeta.label}
                        </Badge>
                      ) : null}
                    </Flex>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2} color="gray.600">
                    <HStack spacing={2} minW={0} align="flex-start">
                      <Box color="#85652D" flexShrink={0} mt="2px">
                        <CalendarDays size={15} />
                      </Box>
                      <Text fontSize="sm" noOfLines={2}>
                        {row.date ? moment(row.date).format("DD MMM YYYY") : "—"}
                      </Text>
                    </HStack>
                    <HStack spacing={2} minW={0} align="flex-start">
                      <Box color="#85652D" flexShrink={0} mt="2px">
                        <Clock3 size={15} />
                      </Box>
                      <Text fontSize="sm" noOfLines={2} wordBreak="break-word">
                        {duration}
                      </Text>
                    </HStack>
                    <HStack spacing={2} align="flex-start" minW={0} gridColumn={{ sm: "1 / -1" }}>
                      <Box color="#85652D" mt="2px" flexShrink={0}>
                        <MapPin size={15} />
                      </Box>
                      <Text fontSize="sm" noOfLines={2} wordBreak="break-word">
                        {row.venue || "No venue"}
                      </Text>
                    </HStack>
                    {row.notes ? (
                      <HStack spacing={2} align="flex-start" minW={0} gridColumn={{ sm: "1 / -1" }}>
                        <Box color="#85652D" mt="2px" flexShrink={0}>
                          <NotebookPen size={15} />
                        </Box>
                        <Text fontSize="sm" noOfLines={3} whiteSpace="pre-wrap" wordBreak="break-word">
                          {row.notes}
                        </Text>
                      </HStack>
                    ) : null}
                  </SimpleGrid>

                  {isBooked ? (
                    <Box
                      border="1px solid"
                      borderColor="#C6F6D5"
                      borderRadius="lg"
                      px={3}
                      py={2}
                      bg="#F0FFF4"
                      minW={0}
                    >
                      <Text fontSize="xs" color="green.700" fontWeight="700">
                        {row.booked_for ? "Booked for" : "Already booked"}
                      </Text>
                      {row.booked_for ? (
                        <>
                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            color="#276749"
                            noOfLines={2}
                            wordBreak="break-word"
                          >
                            {row.booked_for}
                          </Text>
                          {row.booked_phone ? (
                            <Text
                              fontSize="xs"
                              color="green.700"
                              mt={1}
                              wordBreak="break-word"
                            >
                              {row.booked_phone}
                            </Text>
                          ) : null}
                          {row.booked_notes ? (
                            <Text
                              fontSize="xs"
                              color="green.700"
                              mt={1}
                              noOfLines={2}
                            >
                              {row.booked_notes}
                            </Text>
                          ) : null}
                        </>
                      ) : (
                        <Text fontSize="sm" fontWeight="600" color="#276749">
                          This slot is taken. Choose an available time.
                        </Text>
                      )}
                    </Box>
                  ) : null}

                  <Box borderTop="1px solid" borderColor="#F0F2F5" pt={3} minW={0}>
                    <HStack spacing={2} mb={2} color="gray.600">
                      <Box color="#85652D" flexShrink={0}>
                        <Users size={15} />
                      </Box>
                      <Text fontSize="sm" fontWeight="600" color="#2D3748">
                        Members ({(row.members || []).length})
                      </Text>
                    </HStack>
                    {(row.members || []).length === 0 ? (
                      <Text fontSize="sm" color="gray.400">
                        No members on this panel
                      </Text>
                    ) : (
                      <VStack align="stretch" spacing={2} minW={0}>
                        {(row.members || []).map((member, memberIdx) => (
                          <Box
                            key={`${row.id}_member_${memberIdx}`}
                            border="1px solid"
                            borderColor="#F0E4D0"
                            borderRadius="lg"
                            px={3}
                            py={2}
                            bg="#FFFDF9"
                            minW={0}
                          >
                            <Flex
                              justify="space-between"
                              align="flex-start"
                              gap={2}
                            >
                              <Text
                                fontWeight="600"
                                fontSize="sm"
                                color="#2D3748"
                                noOfLines={1}
                                minW={0}
                              >
                                {member.name}
                              </Text>
                              {member.role ? (
                                <Badge
                                  variant="subtle"
                                  colorScheme="orange"
                                  borderRadius="md"
                                  fontSize="10px"
                                  flexShrink={0}
                                >
                                  {member.role}
                                </Badge>
                              ) : null}
                            </Flex>
                            {member.description ? (
                              <Text
                                fontSize="xs"
                                color="gray.500"
                                mt={1}
                                noOfLines={2}
                              >
                                {member.description}
                              </Text>
                            ) : null}
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>

                  <Flex
                    mt="auto"
                    direction={{ base: "column", sm: "row" }}
                    gap={2}
                    justify="flex-end"
                    align={{ base: "stretch", sm: "center" }}
                    pt={1}
                  >
                    {isCompleted && (
                      <Button
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        borderRadius="lg"
                        backgroundColor="#1A202C"
                        color="#FFCB82"
                        _hover={{ bg: "#2D3748" }}
                        w={{ base: "full", sm: "auto" }}
                        minW={{ sm: "10rem" }}
                        px={4}
                        onClick={() => openDetailsModal(row)}
                      >
                        View Detail
                      </Button>
                    )}
                    {!isQualifier && isBooked && !isCompleted && (
                      <Button
                        size="sm"
                        leftIcon={<Play size={14} />}
                        borderRadius="lg"
                        backgroundColor="#1A202C"
                        color="#FFCB82"
                        _hover={{ bg: "#2D3748" }}
                        w={{ base: "full", sm: "auto" }}
                        minW={{ sm: "10rem" }}
                        px={4}
                        isLoading={
                          startInterviewStatus === "loading" &&
                          pendingStartRow?.id === row.id
                        }
                        onClick={() => handleStartInterviewClick(row)}
                      >
                        {getStartInterviewLabel(row)}
                      </Button>
                    )}
                    {!isPanelist && (isQualifier ? !isBooked : true) && (
                      <Button
                        size="sm"
                        leftIcon={<CalendarCheck2 size={14} />}
                        borderRadius="lg"
                        backgroundColor={
                          isBooked ? "white" : profileComplete ? "#FFCB82" : "gray.100"
                        }
                        color="#85652D"
                        border="1px solid"
                        borderColor="#E3B574"
                        _hover={{ bg: "#FFF8EE" }}
                        w={{ base: "full", sm: "auto" }}
                        minW={{ sm: "11rem" }}
                        px={4}
                        onClick={() => openBookModal(row)}
                      >
                        {isQualifier
                          ? profileComplete
                            ? "Book Interview"
                            : "Complete Profile to Book"
                          : isBooked
                            ? "View / Edit Booking"
                            : "Book Interview"}
                      </Button>
                    )}
                    {!isReadOnlyRole && (
                      <Button
                        size="sm"
                        leftIcon={<ExternalLink size={14} />}
                        variant="outline"
                        borderRadius="lg"
                        borderColor="#E3B574"
                        color="#85652D"
                        _hover={{ bg: "#FFF8EE" }}
                        w={{ base: "full", sm: "auto" }}
                        onClick={() =>
                          navigate(
                            `/interview-panel/${row.panel_id}/schedules`
                          )
                        }
                      >
                        Schedules
                      </Button>
                    )}
                  </Flex>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>

      {!isReadOnlyRole && (
        <AddPanelScheduleModal
          isOpen={isAddOpen}
          onClose={onAddClose}
          panels={scheduleBoardPanels}
          boardFilters={boardFilters}
        />
      )}
      {!isPanelist && (
        <BookInterviewModal
          isOpen={isBookOpen}
          onClose={closeBookModal}
          panel={selectedPanelForBooking}
          scheduleRow={selectedScheduleRow}
          boardFilters={boardFilters}
          qualifierProfile={myQualifier}
        />
      )}
      <InterviewEvaluationDetailsModal
        isOpen={isDetailsOpen}
        onClose={closeDetailsModal}
        scheduleRow={selectedDetailsRow}
      />

      <AlertDialog
        isOpen={isStartConfirmOpen}
        leastDestructiveRef={startConfirmRef}
        onClose={onStartConfirmClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="2xl" mx={4}>
            <AlertDialogHeader fontFamily="Georgia, serif">
              Start Interview?
            </AlertDialogHeader>
            <AlertDialogBody>
              {pendingStartRow ? (
                <>
                  Start the mock interview with{" "}
                  <strong>{pendingStartRow.booked_for || "this candidate"}</strong>
                  ?
                  <Text mt={2} fontSize="sm" color="gray.600">
                    {pendingStartRow.panel_title} · {pendingStartRow.date}
                  </Text>
                </>
              ) : (
                "Start this interview session?"
              )}
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={startConfirmRef} onClick={onStartConfirmClose}>
                Cancel
              </Button>
              <Button
                backgroundColor="#FFCB82"
                color="#85652D"
                _hover={{ backgroundColor: "#E3B574" }}
                onClick={confirmStartInterview}
                isLoading={startInterviewStatus === "loading"}
              >
                Start Interview
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

export default AllInterviewPanelSchedules;
