import React, { useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Image,
  Input,
  Radio,
  RadioGroup,
  SimpleGrid,
  Spinner,
  Stack,
  Tag,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { ArrowLeft, GraduationCap, UserRound } from "lucide-react";
import Cookies from "js-cookie";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../Components/PageHeader";
import {
  fetchConductInterview,
  submitInterviewEvaluation,
} from "../../Features/interviewPanelSlice";
import { getMediaUrl } from "../../utlls/useful";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import {
  INTERVIEW_SCORE_FIELDS,
  INTERVIEW_VERDICT_OPTIONS,
} from "../../utlls/interviewEvaluation";
import { normalizeEducationBackground } from "../../utlls/qualifierEducation";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

const sectionTitleStyles = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "lg",
  fontWeight: "700",
  color: "#2D3748",
};

const fieldLabelStyles = {
  fontSize: "xs",
  fontWeight: "700",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#718096",
  mb: 1,
};

const scoreSchemaShape = INTERVIEW_SCORE_FIELDS.reduce((acc, field) => {
  acc[field.key] = Yup.number()
    .transform((_value, original) => {
      if (original === "" || original === null || original === undefined) {
        return undefined;
      }
      const n = Number(original);
      return Number.isFinite(n) ? n : NaN;
    })
    .typeError("Must be a number")
    .min(0, "Min 0")
    .max(field.max, `Max ${field.max}`)
    .nullable();
  return acc;
}, {});

function InfoRow({ label, value }) {
  return (
    <Box>
      <Text {...fieldLabelStyles}>{label}</Text>
      <Text fontSize="sm" color="gray.800">
        {value || "—"}
      </Text>
    </Box>
  );
}

function ConductInterview() {
  const { panelId, scheduleIndex } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authToken = Cookies.get("authToken");
  const { conductData, conductStatus, submitEvaluationStatus } = useSelector(
    (state) => state.interviewPanels
  );

  const scheduleIdx = Number(scheduleIndex);
  const isCompleted =
    conductData?.evaluation?.status === "completed";

  useEffect(() => {
    if (authToken && panelId && Number.isInteger(scheduleIdx)) {
      dispatch(
        fetchConductInterview({
          authToken,
          panelId,
          scheduleIndex: scheduleIdx,
        })
      );
    }
  }, [authToken, panelId, scheduleIdx, dispatch]);

  const qualifier = conductData?.qualifier || null;
  const panel = conductData?.panel || null;
  const slot = conductData?.slot || null;
  const evaluation = conductData?.evaluation || null;
  const educationEntries = useMemo(
    () => normalizeEducationBackground(qualifier?.education_background),
    [qualifier]
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      schedule_index: scheduleIdx,
      knowledge: evaluation?.knowledge ?? "",
      analytical_ability: evaluation?.analytical_ability ?? "",
      communication: evaluation?.communication ?? "",
      confidence: evaluation?.confidence ?? "",
      personality: evaluation?.personality ?? "",
      body_language: evaluation?.body_language ?? "",
      current_affairs: evaluation?.current_affairs ?? "",
      ethics_decision: evaluation?.ethics_decision ?? "",
      key_strength: evaluation?.key_strength || "",
      major_weakness: evaluation?.major_weakness || "",
      improvement_since_last_mock: evaluation?.improvement_since_last_mock || "",
      verdict: evaluation?.verdict || "",
      final_remarks: evaluation?.final_remarks || "",
    },
    validationSchema: Yup.object({
      ...scoreSchemaShape,
      key_strength: Yup.string().trim(),
      major_weakness: Yup.string().trim(),
      improvement_since_last_mock: Yup.string().trim(),
      verdict: Yup.string().required("Select a verdict"),
      final_remarks: Yup.string().trim(),
    }),
    onSubmit: async (values) => {
      if (!authToken || !panelId || isCompleted) return;
      const result = await dispatch(
        submitInterviewEvaluation({
          authToken,
          panelId,
          values: {
            ...values,
            schedule_index: scheduleIdx,
          },
        })
      );
      if (submitInterviewEvaluation.fulfilled.match(result)) {
        dispatch(
          fetchConductInterview({
            authToken,
            panelId,
            scheduleIndex: scheduleIdx,
          })
        );
      }
    },
  });

  const slotTime =
    formatClassTimeRange(slot?.start_time, slot?.end_time) ||
    formatTime12Hour(slot?.start_time) ||
    "—";

  const headerSubtitle = useMemo(() => {
    if (!panel || !slot) return "Interview session";
    const parts = [panel.title, slot.date, slotTime].filter(Boolean);
    return parts.join(" · ");
  }, [panel, slot, slotTime]);

  if (conductStatus === "loading" && !conductData) {
    return (
      <Center py={20}>
        <Spinner size="lg" color="#85652D" />
      </Center>
    );
  }

  return (
    <Box w="full" maxW="100%" minW={0} pb={10}>
      <PageHeader title="Mock Interview Session" subtitle={headerSubtitle}>
        <Button
          leftIcon={<ArrowLeft size={16} />}
          variant="outline"
          borderRadius="0.75rem"
          borderColor="#E3B574"
          color="#85652D"
          onClick={() => navigate("/interview-panel-schedules")}
        >
          Back to Schedules
        </Button>
      </PageHeader>

      <Grid
        templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) minmax(0, 1.2fr)" }}
        gap={{ base: 5, xl: 6 }}
        mt={4}
      >
        <GridItem minW={0}>
          <Stack spacing={4}>
            <Box
              border="1px solid"
              borderColor="#E0E8EC"
              borderRadius="2xl"
              bg="white"
              p={{ base: 4, md: 5 }}
            >
              <Flex gap={4} align="start" direction={{ base: "column", sm: "row" }}>
                <Image
                  src={getMediaUrl(qualifier?.photo) || defaultAvatar}
                  alt={qualifier?.name || slot?.booked_for || "Candidate"}
                  boxSize={{ base: "88px", sm: "96px" }}
                  borderRadius="xl"
                  objectFit="cover"
                  border="2px solid"
                  borderColor="#FFCB82"
                  flexShrink={0}
                />
                <Box flex="1" minW={0}>
                  <Heading size="md" fontFamily="Georgia, serif">
                    {qualifier?.name || slot?.booked_for || "Candidate"}
                  </Heading>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {qualifier?.phone || slot?.booked_phone || "—"}
                  </Text>
                  {qualifier?.batch?.name ? (
                    <Tag mt={2} size="sm" colorScheme="orange" borderRadius="full">
                      {qualifier.batch.name}
                    </Tag>
                  ) : null}
                </Box>
              </Flex>
            </Box>

            <Box
              border="1px solid"
              borderColor="#E0E8EC"
              borderRadius="2xl"
              bg="white"
              p={{ base: 4, md: 5 }}
            >
              <Flex align="center" gap={2} mb={4}>
                <UserRound size={18} color="#85652D" />
                <Text {...sectionTitleStyles}>Qualifier Personal Info</Text>
              </Flex>
              {!qualifier ? (
                <Text fontSize="sm" color="orange.600" mb={3}>
                  Qualifier profile could not be linked. Showing booking details
                  only.
                </Text>
              ) : null}
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                <InfoRow
                  label="Full Name"
                  value={qualifier?.name || slot?.booked_for}
                />
                <InfoRow
                  label="Phone"
                  value={qualifier?.phone || slot?.booked_phone}
                />
                <InfoRow label="Email" value={qualifier?.email} />
                <InfoRow label="CNIC" value={qualifier?.cnic} />
                <InfoRow label="City" value={qualifier?.city} />
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
                <InfoRow
                  label="Interview Batch"
                  value={qualifier?.batch?.name}
                />
                <InfoRow label="Remarks" value={qualifier?.description} />
              </SimpleGrid>
            </Box>

            <Box
              border="1px solid"
              borderColor="#E0E8EC"
              borderRadius="2xl"
              bg="white"
              p={{ base: 4, md: 5 }}
            >
              <Text {...sectionTitleStyles} mb={3}>
                Optional Subjects
              </Text>
              {Array.isArray(qualifier?.optional_subjects) &&
              qualifier.optional_subjects.length > 0 ? (
                <Wrap spacing={2}>
                  {qualifier.optional_subjects.map((subject) => (
                    <WrapItem key={subject}>
                      <Tag size="md" borderRadius="full" bg="#FFF8EE" color="#85652D">
                        {subject}
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  No optional subjects listed.
                </Text>
              )}
            </Box>

            <Box
              border="1px solid"
              borderColor="#E0E8EC"
              borderRadius="2xl"
              bg="white"
              p={{ base: 4, md: 5 }}
            >
              <Flex align="center" gap={2} mb={2}>
                <GraduationCap size={18} color="#85652D" />
                <Text {...sectionTitleStyles}>Education</Text>
              </Flex>
              <Text fontSize="sm" color="gray.500" mb={4}>
                Latest degree and all qualifications from the qualifier profile.
              </Text>

              <Box
                border="1px solid"
                borderColor="#E8EDF2"
                borderRadius="xl"
                p={4}
                bg="#FAFBFC"
                mb={4}
              >
                <Text {...fieldLabelStyles}>Latest Degree</Text>
                <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap">
                  {qualifier?.latest_degree || "—"}
                </Text>
              </Box>

              <Text
                fontWeight="700"
                fontSize="sm"
                color="#2D3748"
                mb={3}
                letterSpacing="0.04em"
                textTransform="uppercase"
              >
                Qualifications ({educationEntries.length})
              </Text>

              {educationEntries.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                  {educationEntries.map((entry, index) => (
                    <Box
                      key={`${entry.qualification}_${entry.institution}_${index}`}
                      border="1px solid"
                      borderColor="#E8EDF2"
                      borderRadius="xl"
                      p={4}
                      bg="#FAFBFC"
                    >
                      <Flex justify="space-between" align="center" mb={2} gap={2}>
                        <Text fontWeight="600" fontSize="sm" color="#85652D">
                          {entry.qualification || `Qualification ${index + 1}`}
                        </Text>
                        <Tag size="sm" borderRadius="full" colorScheme="orange">
                          #{index + 1}
                        </Tag>
                      </Flex>
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                        <InfoRow label="Institution" value={entry.institution} />
                        <InfoRow
                          label="Board / University"
                          value={entry.board_or_university}
                        />
                        <InfoRow label="Year" value={entry.year} />
                        <InfoRow label="Grade / Division" value={entry.grade} />
                      </SimpleGrid>
                      {entry.details ? (
                        <Box mt={3}>
                          <Text {...fieldLabelStyles}>Details</Text>
                          <Text
                            fontSize="sm"
                            color="gray.800"
                            whiteSpace="pre-wrap"
                          >
                            {entry.details}
                          </Text>
                        </Box>
                      ) : null}
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  No qualifications listed on the qualifier profile yet.
                </Text>
              )}
            </Box>

            {slot?.booked_notes ? (
              <Box
                border="1px dashed"
                borderColor="#E3B574"
                borderRadius="2xl"
                bg="#FFFAF3"
                p={4}
              >
                <Text {...fieldLabelStyles}>Booking Notes</Text>
                <Text fontSize="sm">{slot.booked_notes}</Text>
              </Box>
            ) : null}
          </Stack>
        </GridItem>

        <GridItem minW={0}>
          <Box
            as="form"
            onSubmit={formik.handleSubmit}
            border="1px solid"
            borderColor="#E0E8EC"
            borderRadius="2xl"
            bg="white"
            p={{ base: 4, md: 6 }}
          >
            <Flex align="center" gap={3} mb={5}>
              <Heading size="md" fontFamily="Georgia, serif">
                1. Quantitative Scoring
              </Heading>
              <Divider flex="1" borderColor="#E0E8EC" />
            </Flex>

            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={8}>
              {INTERVIEW_SCORE_FIELDS.map((field) => (
                <FormControl key={field.key} isDisabled={isCompleted}>
                  <FormLabel {...fieldLabelStyles}>{field.label}</FormLabel>
                  <Input
                    type="number"
                    min={0}
                    max={field.max}
                    name={field.key}
                    value={formik.values[field.key]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder={`(Max ${field.max})`}
                    borderRadius="lg"
                    borderColor={
                      formik.touched[field.key] && formik.errors[field.key]
                        ? "red.300"
                        : "#E2E8F0"
                    }
                    _focus={{
                      borderColor: "#E3B574",
                      boxShadow: "0 0 0 1px #E3B574",
                    }}
                  />
                  {formik.touched[field.key] && formik.errors[field.key] ? (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {formik.errors[field.key]}
                    </Text>
                  ) : null}
                </FormControl>
              ))}
            </SimpleGrid>

            <Flex align="center" gap={3} mb={5}>
              <Heading size="md" fontFamily="Georgia, serif">
                2. Qualitative Feedback
              </Heading>
              <Divider flex="1" borderColor="#E0E8EC" />
            </Flex>

            <Stack spacing={4} mb={8}>
              <FormControl isDisabled={isCompleted}>
                <FormLabel {...fieldLabelStyles}>Key Strength</FormLabel>
                <Textarea
                  name="key_strength"
                  value={formik.values.key_strength}
                  onChange={formik.handleChange}
                  placeholder="What did the candidate do best?"
                  borderRadius="lg"
                  rows={3}
                />
              </FormControl>
              <FormControl isDisabled={isCompleted}>
                <FormLabel {...fieldLabelStyles}>Major Weakness</FormLabel>
                <Textarea
                  name="major_weakness"
                  value={formik.values.major_weakness}
                  onChange={formik.handleChange}
                  placeholder="What is the primary area for improvement?"
                  borderRadius="lg"
                  rows={3}
                />
              </FormControl>
              <FormControl isDisabled={isCompleted}>
                <FormLabel {...fieldLabelStyles}>
                  Improvement Since Last Mock (Optional)
                </FormLabel>
                <Textarea
                  name="improvement_since_last_mock"
                  value={formik.values.improvement_since_last_mock}
                  onChange={formik.handleChange}
                  placeholder="Has the candidate addressed previous feedback?"
                  borderRadius="lg"
                  rows={3}
                />
              </FormControl>
            </Stack>

            <Box
              border="1px solid"
              borderColor="#E3B574"
              borderRadius="2xl"
              bg="#FFFAF3"
              p={{ base: 4, md: 5 }}
              mb={6}
            >
              <Heading size="md" fontFamily="Georgia, serif" mb={1}>
                Lead Panelist Verdict
              </Heading>
              <Text fontSize="sm" color="gray.600" mb={4}>
                As the main panelist, provide the final board recommendation.
              </Text>

              <FormControl
                isInvalid={formik.touched.verdict && !!formik.errors.verdict}
                isDisabled={isCompleted}
              >
                <RadioGroup
                  value={formik.values.verdict}
                  onChange={(value) => formik.setFieldValue("verdict", value)}
                >
                  <Stack spacing={3}>
                    {INTERVIEW_VERDICT_OPTIONS.map((option) => (
                      <Radio
                        key={option.value}
                        value={option.value}
                        colorScheme="orange"
                      >
                        {option.label}
                      </Radio>
                    ))}
                  </Stack>
                </RadioGroup>
                {formik.touched.verdict && formik.errors.verdict ? (
                  <Text fontSize="sm" color="red.500" mt={2}>
                    {formik.errors.verdict}
                  </Text>
                ) : null}
              </FormControl>

              <FormControl mt={5} isDisabled={isCompleted}>
                <FormLabel {...fieldLabelStyles}>Final Remarks</FormLabel>
                <Textarea
                  name="final_remarks"
                  value={formik.values.final_remarks}
                  onChange={formik.handleChange}
                  placeholder="Pending board review..."
                  borderRadius="lg"
                  rows={4}
                />
              </FormControl>
            </Box>

            {!isCompleted ? (
              <Button
                type="submit"
                w="full"
                size="lg"
                borderRadius="xl"
                bg="#1A202C"
                color="#FFCB82"
                _hover={{ bg: "#2D3748" }}
                isLoading={submitEvaluationStatus === "loading"}
              >
                Submit Mock Evaluation
              </Button>
            ) : (
              <Box
                textAlign="center"
                py={4}
                borderRadius="xl"
                bg="#F0FFF4"
                border="1px solid"
                borderColor="#9AE6B4"
              >
                <Text fontWeight="600" color="green.700">
                  Evaluation submitted
                </Text>
              </Box>
            )}
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default ConductInterview;
