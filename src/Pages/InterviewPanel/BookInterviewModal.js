import React, { useEffect, useRef, useState } from "react";
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
  VStack,
  Text,
  Box,
  Flex,
  HStack,
  Badge,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateInterviewPanel,
  bookInterviewPanelSlot,
  fetchInterviewPanelScheduleBoard,
  fetchInterviewPanels,
} from "../../Features/interviewPanelSlice";
import { fetchUserById, selectUser } from "../../Features/authSlice";
import {
  formRowsToSchedulesPayload,
  panelToScheduleRows,
} from "../../utlls/interviewPanel";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import { extractUserIdFromToken } from "../../utlls/useful";
import { isQualifierRole } from "../../utlls/qualifierAccess";
import {
  isQualifierProfileComplete,
  getQualifierProfileIncompleteFields,
  QUALIFIER_PROFILE_INCOMPLETE_MESSAGE,
} from "../../utlls/qualifierProfile";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";
import { useNavigate } from "react-router-dom";

function BookInterviewModal({
  isOpen,
  onClose,
  panel,
  scheduleRow,
  boardFilters = {},
  qualifierProfile = null,
}) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [bookedFor, setBookedFor] = useState("");
  const [bookedPhone, setBookedPhone] = useState("");
  const [bookedNotes, setBookedNotes] = useState("");
  const [bookedUserId, setBookedUserId] = useState(null);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // "book" | "clear"
  const confirmCancelRef = useRef();
  const {
    isOpen: isConfirmOpen,
    onOpen: onConfirmOpen,
    onClose: onConfirmClose,
  } = useDisclosure();
  const { updateStatus } = useSelector((state) => state.interviewPanels);
  const currentUser = useSelector(selectUser);
  const authStatus = useSelector((state) => state.auth.status);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isQualifier = isQualifierRole();

  const isBooked = scheduleRow?.booking_status === "booked";
  const duration =
    formatClassTimeRange(scheduleRow?.start_time, scheduleRow?.end_time) ||
    formatTime12Hour(scheduleRow?.start_time) ||
    "—";
  const loadingUser = authStatus === "loading" && !currentUser && !isQualifier;
  const profileComplete = isQualifier
    ? isQualifierProfileComplete(qualifierProfile)
    : true;
  const missingFields = isQualifier
    ? getQualifierProfileIncompleteFields(qualifierProfile)
    : [];

  useEffect(() => {
    if (!isOpen || !authToken) return;
    if (currentUser?._id) return;
    try {
      const userId = extractUserIdFromToken(authToken);
      if (userId) {
        dispatch(fetchUserById({ userId, authToken }));
      }
    } catch {
      // ignore token parse errors
    }
  }, [isOpen, authToken, currentUser?._id, dispatch]);

  useEffect(() => {
    if (!isOpen || !scheduleRow) return;

    setError("");
    setBookedNotes(scheduleRow.booked_notes || "");

    // Existing booking keeps its saved details
    if (scheduleRow.booking_status === "booked") {
      setBookedFor(scheduleRow.booked_for || "");
      setBookedPhone(scheduleRow.booked_phone || "");
      setBookedUserId(scheduleRow.booked_user_id || null);
      return;
    }

    // New booking: fill from qualifier profile or logged-in user
    if (isQualifier && qualifierProfile) {
      setBookedFor(String(qualifierProfile.name || "").trim());
      setBookedPhone(String(qualifierProfile.phone || "").trim());
      setBookedUserId(currentUser?._id || null);
      return;
    }

    if (currentUser) {
      setBookedFor(String(currentUser.name || "").trim());
      setBookedPhone(String(currentUser.email || "").trim());
      setBookedUserId(currentUser._id || null);
    } else {
      setBookedFor("");
      setBookedPhone("");
      setBookedUserId(null);
    }
  }, [
    isOpen,
    scheduleRow,
    currentUser,
    isQualifier,
    qualifierProfile,
  ]);

  if (!panel || !scheduleRow) return null;

  const handleClose = () => {
    setError("");
    setConfirmAction(null);
    onConfirmClose();
    onClose();
  };

  const closeConfirm = () => {
    setConfirmAction(null);
    onConfirmClose();
  };

  const buildUpdatedSchedules = (bookingPayload) => {
    const rows = panelToScheduleRows(panel);
    const index = Number(scheduleRow.schedule_array_index);
    if (Number.isNaN(index) || index < 0 || index >= rows.length) {
      return { error: "Could not find this schedule slot" };
    }
    rows[index] = {
      ...rows[index],
      ...bookingPayload,
    };
    return { schedules: formRowsToSchedulesPayload(rows) };
  };

  const saveSchedules = async (schedules) => {
    await dispatch(
      updateInterviewPanel({
        authToken,
        id: panel._id,
        values: { schedules },
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
  };

  const requestBookConfirm = (event) => {
    event.preventDefault();
    if (isQualifier && !profileComplete) {
      setError(
        `${QUALIFIER_PROFILE_INCOMPLETE_MESSAGE}${
          missingFields.length ? ` Missing: ${missingFields.join(", ")}.` : ""
        }`
      );
      return;
    }
    const name = String(bookedFor || "").trim();
    if (!name) {
      setError(
        "Logged-in user details are missing. Please refresh and try again."
      );
      return;
    }
    setError("");
    setConfirmAction("book");
    onConfirmOpen();
  };

  const requestClearConfirm = () => {
    if (isQualifier) {
      setError("Qualifiers cannot clear bookings. Contact the academy.");
      return;
    }
    setError("");
    setConfirmAction("clear");
    onConfirmOpen();
  };

  const executeBook = async () => {
    const name = String(bookedFor || "").trim();

    if (isQualifier) {
      const scheduleIndex =
        typeof scheduleRow.schedule_array_index === "number"
          ? scheduleRow.schedule_array_index
          : Number(scheduleRow.schedule_index) - 1;
      try {
        await dispatch(
          bookInterviewPanelSlot({
            authToken,
            id: panel._id,
            values: {
              schedule_index: scheduleIndex,
              booked_notes: String(bookedNotes || "").trim(),
              date: scheduleRow.date || "",
              start_time: scheduleRow.start_time || "",
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
      } catch (err) {
        setError(
          typeof err === "string"
            ? err
            : err?.message || "Could not book interview"
        );
        closeConfirm();
      }
      return;
    }

    const result = buildUpdatedSchedules({
      booking_status: "booked",
      booked_for: name,
      booked_phone: String(bookedPhone || "").trim(),
      booked_notes: String(bookedNotes || "").trim(),
      booked_user_id: bookedUserId || currentUser?._id || null,
      booked_at: new Date().toISOString(),
    });
    if (result.error) {
      setError(result.error);
      closeConfirm();
      return;
    }
    try {
      await saveSchedules(result.schedules);
    } catch {
      // toast handled in slice
    }
  };

  const executeClearBooking = async () => {
    const result = buildUpdatedSchedules({
      booking_status: "available",
      booked_for: "",
      booked_phone: "",
      booked_notes: "",
      booked_user_id: null,
      booked_at: null,
    });
    if (result.error) {
      setError(result.error);
      closeConfirm();
      return;
    }
    try {
      await saveSchedules(result.schedules);
    } catch {
      // toast handled in slice
    }
  };

  const handleConfirm = async () => {
    if (confirmAction === "clear") {
      await executeClearBooking();
      return;
    }
    await executeBook();
  };

  const scheduleDateLabel = scheduleRow.date
    ? moment(scheduleRow.date).format("DD MMM YYYY")
    : "—";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("2xl")}
      >
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
        <ModalContent
          {...responsiveModalContentProps}
          as="form"
          onSubmit={requestBookConfirm}
          display="flex"
          flexDirection="column"
          overflow="hidden"
          maxH={{ base: "100dvh", sm: "90vh" }}
          w={{ base: "100%", sm: "90%", md: "42rem", lg: "48rem" }}
          maxW={{ base: "100%", sm: "48rem" }}
          borderRadius={{ base: 0, sm: "2xl" }}
          border="1px solid"
          borderColor="#F0E4D0"
        >
          <Box
            flexShrink={0}
            px={{ base: 5, sm: 6 }}
            pt={{ base: 5, sm: 6 }}
            pb={4}
            bg="linear-gradient(135deg, #FFF8EE 0%, #FFE7C2 48%, #FFD9A0 100%)"
            position="relative"
          >
            <Flex align="flex-start" gap={3} pr={8}>
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
                <CalendarCheck2 size={24} />
              </Flex>
              <Box flex={1} minW={0}>
                <HStack spacing={2} mb={1} flexWrap="wrap">
                  <Text
                    fontSize={{ base: "lg", sm: "xl" }}
                    fontWeight="700"
                    color="#654E26"
                  >
                    {isBooked ? "Booked Interview" : "Book Interview"}
                  </Text>
                  <Badge
                    colorScheme={isBooked ? "green" : "gray"}
                    borderRadius="full"
                    textTransform="none"
                  >
                    {isBooked ? "Booked" : "Available"}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="#8A7349" noOfLines={2}>
                  {panel.title}
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
          >
            <VStack spacing={4} align="stretch">
              <Box
                border="1px solid"
                borderColor="#F0E4D0"
                borderRadius="xl"
                p={4}
                bg="white"
              >
                <Text fontWeight="600" fontSize="sm" mb={2} color="#2D3748">
                  Schedule {scheduleRow.schedule_index}
                </Text>
                <VStack align="stretch" spacing={2} fontSize="sm" color="gray.600">
                  <HStack spacing={2}>
                    <CalendarDays size={14} color="#85652D" />
                    <Text>{scheduleDateLabel}</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Clock3 size={14} color="#85652D" />
                    <Text>{duration}</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <MapPin size={14} color="#85652D" />
                    <Text>{scheduleRow.venue || "No venue"}</Text>
                  </HStack>
                </VStack>
              </Box>

              <Box
                border="1px solid"
                borderColor="#F0E4D0"
                borderRadius="xl"
                p={4}
                bg="white"
              >
                <HStack spacing={2} mb={2}>
                  <UserRound size={16} color="#85652D" />
                  <Text fontWeight="700" fontSize="sm" color="#2D3748">
                    Candidate details
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  {isQualifier
                    ? "Filled from your My Profile details."
                    : "Filled automatically from the logged-in user."}
                </Text>

                {!profileComplete ? (
                  <Box
                    mb={3}
                    borderWidth="1px"
                    borderColor="orange.200"
                    borderRadius="lg"
                    bg="orange.50"
                    p={3}
                  >
                    <Text fontSize="sm" color="orange.800" fontWeight="600">
                      Complete your profile to book
                    </Text>
                    <Text fontSize="xs" color="orange.700" mt={1}>
                      Missing: {missingFields.join(", ") || "required fields"}
                    </Text>
                    <Button
                      mt={2}
                      size="sm"
                      borderRadius="lg"
                      onClick={() => {
                        handleClose();
                        navigate("/qualifiers");
                      }}
                    >
                      Go to My Profile
                    </Button>
                  </Box>
                ) : null}

                {loadingUser ? (
                  <Flex py={6} justify="center" align="center" gap={2}>
                    <Spinner size="sm" color="#85652D" />
                    <Text fontSize="sm" color="gray.500">
                      Loading your profile...
                    </Text>
                  </Flex>
                ) : (
                  <VStack spacing={3} align="stretch">
                    <FormControl isRequired>
                      <FormLabel fontSize={13} color="#654E26">
                        Candidate name
                      </FormLabel>
                      <Input
                        borderRadius="0.75rem"
                        borderColor="#E6D5B8"
                        value={bookedFor}
                        isReadOnly
                        bg="#F7F3EC"
                        placeholder="Logged-in user name"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize={13} color="#654E26">
                        {isQualifier ? "Phone" : "Email"}
                      </FormLabel>
                      <Input
                        borderRadius="0.75rem"
                        borderColor="#E6D5B8"
                        value={bookedPhone}
                        isReadOnly
                        bg="#F7F3EC"
                        placeholder={
                          isQualifier
                            ? "Your phone number"
                            : "Logged-in user email"
                        }
                      />
                    </FormControl>

                    {!isQualifier && currentUser?.role ? (
                      <Text fontSize="xs" color="gray.500">
                        Role: {currentUser.role}
                      </Text>
                    ) : null}

                    <FormControl>
                      <FormLabel fontSize={13} color="#654E26">
                        Booking notes
                      </FormLabel>
                      <Textarea
                        borderRadius="0.75rem"
                        borderColor="#E6D5B8"
                        rows={3}
                        value={bookedNotes}
                        onChange={(e) => setBookedNotes(e.target.value)}
                        placeholder="Optional notes"
                        isReadOnly={isQualifier && isBooked}
                      />
                    </FormControl>
                  </VStack>
                )}
              </Box>

              {error ? (
                <Text fontSize="sm" color="red.500">
                  {error}
                </Text>
              ) : null}
            </VStack>
          </ModalBody>

          <ModalFooter
            flexShrink={0}
            flexDirection={{ base: "column-reverse", sm: "row" }}
            gap={2}
            px={{ base: 4, sm: 6 }}
            py={4}
            borderTop="1px solid"
            borderColor="#F0E4D0"
            bg="white"
          >
            <Button
              type="button"
              variant="ghost"
              borderRadius="0.85rem"
              w={{ base: "full", sm: "auto" }}
              onClick={handleClose}
            >
              Cancel
            </Button>
            {isBooked && !isQualifier ? (
              <Button
                type="button"
                variant="outline"
                borderRadius="0.85rem"
                colorScheme="red"
                w={{ base: "full", sm: "auto" }}
                minW={{ sm: "9rem" }}
                onClick={requestClearConfirm}
                isLoading={updateStatus === "loading"}
              >
                Clear booking
              </Button>
            ) : null}
            {!isBooked || !isQualifier ? (
              <Button
                type="submit"
                borderRadius="0.85rem"
                background="linear-gradient(135deg, #FFCB82 0%, #E3B574 100%)"
                color="#654E26"
                _hover={{
                  background:
                    "linear-gradient(135deg, #E3B574 0%, #D4A45F 100%)",
                }}
                fontWeight="700"
                w={{ base: "full", sm: "auto" }}
                minW={{ sm: "12rem" }}
                px={6}
                leftIcon={<CalendarCheck2 size={16} />}
                isLoading={updateStatus === "loading"}
                loadingText="Saving"
                isDisabled={
                  loadingUser ||
                  !bookedFor ||
                  (isQualifier && !profileComplete)
                }
              >
                {isBooked ? "Update booking" : "Book Interview"}
              </Button>
            ) : null}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={confirmCancelRef}
        onClose={closeConfirm}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            mx={4}
            borderRadius="xl"
            border="1px solid"
            borderColor="#F0E4D0"
          >
            <AlertDialogHeader fontSize="lg" fontWeight="700" color="#654E26">
              {confirmAction === "clear"
                ? "Clear this booking?"
                : isBooked
                  ? "Update this booking?"
                  : "Confirm interview booking?"}
            </AlertDialogHeader>
            <AlertDialogBody>
              {confirmAction === "clear" ? (
                <Text fontSize="sm" color="gray.600">
                  This will free the schedule slot and remove the candidate
                  booking details.
                </Text>
              ) : (
                <VStack align="stretch" spacing={2} fontSize="sm" color="gray.600">
                  <Text>
                    Book <strong>{bookedFor || "this candidate"}</strong> for{" "}
                    <strong>{panel.title}</strong>?
                  </Text>
                  <Text>
                    {scheduleDateLabel} · {duration}
                    {scheduleRow.venue ? ` · ${scheduleRow.venue}` : ""}
                  </Text>
                </VStack>
              )}
            </AlertDialogBody>
            <AlertDialogFooter gap={2} flexWrap="wrap">
              <Button
                ref={confirmCancelRef}
                borderRadius="0.75rem"
                onClick={closeConfirm}
                isDisabled={updateStatus === "loading"}
              >
                No, Cancel
              </Button>
              <Button
                borderRadius="0.75rem"
                backgroundColor={
                  confirmAction === "clear" ? undefined : "#FFCB82"
                }
                color={confirmAction === "clear" ? undefined : "#654E26"}
                colorScheme={confirmAction === "clear" ? "red" : undefined}
                _hover={
                  confirmAction === "clear"
                    ? undefined
                    : { backgroundColor: "#E3B574" }
                }
                onClick={handleConfirm}
                isLoading={updateStatus === "loading"}
                loadingText={confirmAction === "clear" ? "Clearing" : "Booking"}
                minW="8rem"
              >
                {confirmAction === "clear"
                  ? "Yes, Clear"
                  : isBooked
                    ? "Yes, Update"
                    : "Yes, Book"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

export default BookInterviewModal;
