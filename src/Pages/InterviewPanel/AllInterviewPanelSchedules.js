import React, { useEffect, useMemo, useState } from "react";
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
} from "@chakra-ui/react";
import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  ExternalLink,
  FilterX,
  MapPin,
  NotebookPen,
  Plus,
  Users,
} from "lucide-react";
import Cookies from "js-cookie";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PageHeader, { FilterStack } from "../../Components/PageHeader";
import { fetchInterviewPanelScheduleBoard } from "../../Features/interviewPanelSlice";
import {
  flattenAllPanelSchedules,
  getInterviewPanelStatusMeta,
} from "../../utlls/interviewPanel";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import AddPanelScheduleModal from "./AddPanelScheduleModal";
import BookInterviewModal from "./BookInterviewModal";

function AllInterviewPanelSchedules() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [authToken] = useState(Cookies.get("authToken"));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [bookingFilter, setBookingFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedScheduleRow, setSelectedScheduleRow] = useState(null);
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

  const { scheduleBoardPanels, fetchScheduleBoardStatus } = useSelector(
    (state) => state.interviewPanels
  );

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
  }, []);

  const allSchedules = useMemo(
    () => flattenAllPanelSchedules(scheduleBoardPanels),
    [scheduleBoardPanels]
  );

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
  }, [allSchedules, query, status, bookingFilter, startDate, endDate]);

  const handleClearFilters = () => {
    setQuery("");
    setStatus("");
    setBookingFilter("");
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
    setSelectedScheduleRow(row);
    onBookOpen();
  };

  const closeBookModal = () => {
    onBookClose();
    setSelectedScheduleRow(null);
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
      <PageHeader title="All Panel Schedules">
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
      </PageHeader>

      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        <FormControl className="responsive-input" w={{ base: "full", sm: "auto" }} minW={0}>
          <Input
            borderRadius="0.75rem"
            placeholder="Search panel, venue..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </FormControl>
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
                Select a panel and add a schedule to get started.
              </Text>
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
              const duration =
                formatClassTimeRange(row.start_time, row.end_time) ||
                formatTime12Hour(row.start_time) ||
                "—";
              const isBooked = row.booking_status === "booked";
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
                    <VStack align="flex-end" spacing={1} flexShrink={0}>
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
                    </VStack>
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
                        Booked for
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color="#276749"
                        noOfLines={2}
                        wordBreak="break-word"
                      >
                        {row.booked_for || "—"}
                      </Text>
                      {row.booked_phone ? (
                        <Text fontSize="xs" color="green.700" mt={1} wordBreak="break-word">
                          {row.booked_phone}
                        </Text>
                      ) : null}
                      {row.booked_notes ? (
                        <Text fontSize="xs" color="green.700" mt={1} noOfLines={2}>
                          {row.booked_notes}
                        </Text>
                      ) : null}
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
                    <Button
                      size="sm"
                      leftIcon={<CalendarCheck2 size={14} />}
                      borderRadius="lg"
                      backgroundColor={isBooked ? "white" : "#FFCB82"}
                      color="#85652D"
                      border="1px solid"
                      borderColor="#E3B574"
                      _hover={{ bg: "#FFF8EE" }}
                      w={{ base: "full", sm: "auto" }}
                      minW={{ sm: "11rem" }}
                      px={4}
                      onClick={() => openBookModal(row)}
                    >
                      {isBooked ? "View / Edit Booking" : "Book Interview"}
                    </Button>
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
                        navigate(`/interview-panel/${row.panel_id}/schedules`)
                      }
                    >
                      Schedules
                    </Button>
                  </Flex>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>

      <AddPanelScheduleModal
        isOpen={isAddOpen}
        onClose={onAddClose}
        panels={scheduleBoardPanels}
        boardFilters={boardFilters}
      />
      <BookInterviewModal
        isOpen={isBookOpen}
        onClose={closeBookModal}
        panel={selectedPanelForBooking}
        scheduleRow={selectedScheduleRow}
        boardFilters={boardFilters}
      />
    </Box>
  );
}

export default AllInterviewPanelSchedules;
