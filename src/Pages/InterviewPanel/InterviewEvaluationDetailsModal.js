import React, { useEffect, useMemo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Flex,
  Text,
  Badge,
  SimpleGrid,
  Spinner,
  Center,
  Image,
  Tag,
  Wrap,
  WrapItem,
  VStack,
  Divider,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInterviewEvaluationDetails,
  clearInterviewEvaluationDetails,
} from "../../Features/interviewPanelSlice";
import { getMediaUrl } from "../../utlls/useful";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import { normalizeEducationBackground } from "../../utlls/qualifierEducation";
import {
  INTERVIEW_SCORE_FIELDS,
  INTERVIEW_SCORE_MAX_TOTAL,
  getInterviewVerdictLabel,
} from "../../utlls/interviewEvaluation";
import {
  responsiveModalContentProps,
  responsiveModalProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

const labelStyles = {
  fontSize: "xs",
  fontWeight: "700",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#718096",
  mb: 1,
};

function InfoRow({ label, value }) {
  return (
    <Box minW={0}>
      <Text {...labelStyles}>{label}</Text>
      <Text fontSize="sm" color="gray.800" wordBreak="break-word">
        {value || "—"}
      </Text>
    </Box>
  );
}

function ScoreGrid({ source }) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
      {INTERVIEW_SCORE_FIELDS.map((field) => {
        const value = source?.[field.key];
        const numeric = Number(value);
        return (
          <Flex
            key={field.key}
            justify="space-between"
            align="center"
            gap={3}
            border="1px solid"
            borderColor="#F0E4D0"
            borderRadius="lg"
            px={3}
            py={2}
            bg="#FFFDF9"
          >
            <Text fontSize="sm" color="#2D3748" minW={0}>
              {field.label}
            </Text>
            <Text fontWeight="700" fontSize="sm" color="#85652D" flexShrink={0}>
              {Number.isFinite(numeric) ? numeric : "—"} / {field.max}
            </Text>
          </Flex>
        );
      })}
    </SimpleGrid>
  );
}

function InterviewEvaluationDetailsModal({ isOpen, onClose, scheduleRow }) {
  const dispatch = useDispatch();
  const authToken = Cookies.get("authToken");
  const { evaluationDetails, evaluationDetailsStatus } = useSelector(
    (state) => state.interviewPanels
  );

  const panelId = scheduleRow?.panel_id;
  const scheduleIndex = scheduleRow?.schedule_array_index;

  useEffect(() => {
    if (!isOpen || !authToken || !panelId || !Number.isInteger(scheduleIndex)) {
      return undefined;
    }
    dispatch(
      fetchInterviewEvaluationDetails({
        authToken,
        panelId,
        scheduleIndex,
      })
    );
    return () => {
      dispatch(clearInterviewEvaluationDetails());
    };
  }, [isOpen, authToken, panelId, scheduleIndex, dispatch]);

  const qualifier = evaluationDetails?.qualifier || null;
  const slot = evaluationDetails?.slot || scheduleRow || null;
  const panel = evaluationDetails?.panel || null;
  const evaluations = evaluationDetails?.evaluations || [];
  const averages = evaluationDetails?.averages || null;
  const educationEntries = useMemo(
    () => normalizeEducationBackground(qualifier?.education_background),
    [qualifier]
  );

  const interviewStatus = String(
    slot?.interview_status || scheduleRow?.interview_status || ""
  ).toLowerCase();
  const statusBadge =
    interviewStatus === "completed"
      ? { label: "Completed", colorScheme: "green" }
      : interviewStatus === "in_progress" || interviewStatus === "in-progress"
        ? { label: "In Progress", colorScheme: "orange" }
        : { label: "Booked", colorScheme: "green" };

  const slotTime =
    formatClassTimeRange(slot?.start_time, slot?.end_time) ||
    formatTime12Hour(slot?.start_time) ||
    "—";

  const handleClose = () => {
    dispatch(clearInterviewEvaluationDetails());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("4xl")}
    >
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
      <ModalContent
        {...responsiveModalContentProps}
        maxW={{ base: "100%", sm: "52rem", lg: "64rem" }}
        overflow="hidden"
      >
        <ModalHeader pr={12}>
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="700">
            Interview Details
          </Text>
          <Text fontSize="sm" color="gray.500" fontWeight="normal" mt={1}>
            {[panel?.title || scheduleRow?.panel_title, slot?.date, slotTime]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} px={{ base: 4, md: 6 }}>
          {evaluationDetailsStatus === "loading" && !evaluationDetails ? (
            <Center py={16}>
              <Spinner size="lg" color="#85652D" />
            </Center>
          ) : (
            <VStack align="stretch" spacing={5}>
              <Flex
                gap={4}
                align="start"
                direction={{ base: "column", sm: "row" }}
              >
                <Image
                  src={getMediaUrl(qualifier?.photo) || defaultAvatar}
                  alt={qualifier?.name || slot?.booked_for || "Candidate"}
                  boxSize={{ base: "80px", sm: "96px" }}
                  borderRadius="xl"
                  objectFit="cover"
                  border="2px solid"
                  borderColor="#FFCB82"
                  flexShrink={0}
                />
                <Box flex="1" minW={0}>
                  <Flex wrap="wrap" gap={2} align="center">
                    <Text fontSize="xl" fontWeight="700" color="#2D3748">
                      {qualifier?.name || slot?.booked_for || "Candidate"}
                    </Text>
                    <Badge colorScheme={statusBadge.colorScheme} borderRadius="md">
                      {statusBadge.label}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {qualifier?.phone || slot?.booked_phone || "—"}
                  </Text>
                  {qualifier?.batch?.name ? (
                    <Tag mt={2} size="sm" colorScheme="orange" borderRadius="full">
                      {qualifier.batch.name}
                    </Tag>
                  ) : null}
                  <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={2} mt={3}>
                    <InfoRow
                      label="Date"
                      value={
                        slot?.date
                          ? moment(slot.date).format("DD MMM YYYY")
                          : "—"
                      }
                    />
                    <InfoRow label="Time" value={slotTime} />
                    <InfoRow
                      label="Venue"
                      value={slot?.venue || scheduleRow?.venue}
                    />
                  </SimpleGrid>
                </Box>
              </Flex>

              <Box
                border="1px solid"
                borderColor="#C6F6D5"
                borderRadius="xl"
                bg="#F0FFF4"
                p={{ base: 4, md: 5 }}
              >
                <Text fontSize="xs" fontWeight="700" color="green.700" mb={1}>
                  OVERALL AVERAGE
                </Text>
                <Flex
                  align={{ base: "flex-start", sm: "flex-end" }}
                  justify="space-between"
                  gap={3}
                  wrap="wrap"
                >
                  <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="800" color="#276749">
                    {averages?.overall_average != null
                      ? averages.overall_average
                      : "—"}
                    <Text as="span" fontSize="lg" fontWeight="600" color="green.700">
                      {" "}
                      / {averages?.overall_max || INTERVIEW_SCORE_MAX_TOTAL}
                    </Text>
                  </Text>
                  <Text fontSize="sm" color="green.700">
                    Average of {averages?.evaluator_count || 0} panelist
                    {(averages?.evaluator_count || 0) === 1 ? "" : "s"}
                  </Text>
                </Flex>
                <Divider my={4} borderColor="#C6F6D5" />
                <Text fontSize="sm" fontWeight="700" color="#276749" mb={3}>
                  Average by category
                </Text>
                <ScoreGrid source={averages?.field_averages} />
              </Box>

              <Box
                border="1px solid"
                borderColor="#E0E8EC"
                borderRadius="xl"
                bg="white"
                p={{ base: 4, md: 5 }}
              >
                <Text fontWeight="700" mb={3} color="#2D3748">
                  Candidate details
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  <InfoRow label="CNIC" value={qualifier?.cnic} />
                  <InfoRow label="City" value={qualifier?.city} />
                  <InfoRow label="Province" value={qualifier?.province} />
                  <InfoRow label="Father Name" value={qualifier?.father_name} />
                  <InfoRow label="Father Phone" value={qualifier?.father_phone} />
                  <InfoRow
                    label="No. of Attempts"
                    value={
                      qualifier?.no_of_attempts != null
                        ? String(qualifier.no_of_attempts)
                        : ""
                    }
                  />
                  <InfoRow label="Latest Degree" value={qualifier?.latest_degree} />
                </SimpleGrid>
                {Array.isArray(qualifier?.optional_subjects) &&
                qualifier.optional_subjects.length > 0 ? (
                  <Box mt={4}>
                    <Text {...labelStyles}>Optional Subjects</Text>
                    <Wrap spacing={2}>
                      {qualifier.optional_subjects.map((subject) => (
                        <WrapItem key={subject}>
                          <Tag
                            size="md"
                            borderRadius="full"
                            bg="#FFF8EE"
                            color="#85652D"
                          >
                            {subject}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                ) : null}
                {educationEntries.length > 0 ? (
                  <VStack align="stretch" spacing={3} mt={4}>
                    {educationEntries.map((entry, index) => (
                      <Box
                        key={`${entry.qualification}_${index}`}
                        border="1px solid"
                        borderColor="#E8EDF2"
                        borderRadius="lg"
                        p={3}
                        bg="#FAFBFC"
                      >
                        <Text fontWeight="600" fontSize="sm" color="#85652D">
                          {entry.qualification || `Qualification ${index + 1}`}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {[entry.institution, entry.year, entry.grade]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                ) : null}
              </Box>

              <Box>
                <Text fontWeight="700" mb={3} color="#2D3748">
                  Panelist evaluations ({evaluations.length})
                </Text>
                {evaluations.length === 0 ? (
                  <Text fontSize="sm" color="gray.500">
                    No panelist evaluations have been submitted yet.
                  </Text>
                ) : (
                  <VStack align="stretch" spacing={4}>
                    {evaluations.map((evaluation, index) => (
                      <Box
                        key={evaluation._id || `evaluation_${index}`}
                        border="1px solid"
                        borderColor="#E0E8EC"
                        borderRadius="xl"
                        p={{ base: 4, md: 5 }}
                        bg="white"
                      >
                        <Flex
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                          mb={4}
                          wrap="wrap"
                        >
                          <Box minW={0}>
                            <Text fontWeight="700" color="#2D3748">
                              {evaluation.panelist_name || "Panelist"}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {evaluation.panelist_role || "Panelist"}
                            </Text>
                          </Box>
                          <Badge colorScheme="green" borderRadius="md">
                            {evaluation.total_score ?? 0} /{" "}
                            {evaluation.max_total || INTERVIEW_SCORE_MAX_TOTAL}
                          </Badge>
                        </Flex>
                        <ScoreGrid source={evaluation} />
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={4}>
                          <InfoRow
                            label="Key Strength"
                            value={evaluation.key_strength}
                          />
                          <InfoRow
                            label="Major Weakness"
                            value={evaluation.major_weakness}
                          />
                          <InfoRow
                            label="Improvement"
                            value={evaluation.improvement_since_last_mock}
                          />
                          <InfoRow
                            label="Verdict"
                            value={getInterviewVerdictLabel(evaluation.verdict)}
                          />
                        </SimpleGrid>
                        {evaluation.final_remarks ? (
                          <Box mt={3}>
                            <InfoRow
                              label="Final Remarks"
                              value={evaluation.final_remarks}
                            />
                          </Box>
                        ) : null}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default InterviewEvaluationDetailsModal;
