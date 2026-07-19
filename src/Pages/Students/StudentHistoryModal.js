import React, { useMemo, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Flex,
  Text,
  Badge,
  SimpleGrid,
  Spinner,
  VStack,
  HStack,
  Image,
  Divider,
  Link,
  Progress,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  Eye,
  User,
  Mail,
  Phone,
  Layers,
  CircleDollarSign,
  Receipt,
  Clock3,
  FileText,
  GraduationCap,
  Activity,
  MapPin,
  IdCard,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStudentHistory,
  selectStudentHistory,
} from "../../Features/studentSlice";
import { getMediaUrl } from "../../utlls/useful.js";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const formatRs = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  const m = moment(value);
  return m.isValid() ? m.format("DD MMM YYYY, hh:mm A") : String(value);
};

const formatShortDate = (value) => {
  if (!value) return "—";
  const m = moment(value);
  return m.isValid() ? m.format("DD MMM YYYY") : String(value);
};

const ACTION_STYLES = {
  Created: { color: "blue", label: "Created" },
  Paid: { color: "green", label: "Paid" },
  Discounted: { color: "orange", label: "Discounted" },
  Deleted: { color: "red", label: "Deleted" },
};

const StatCard = ({ label, value, hint, accent = "#85652D", bg = "#FFF8EE" }) => (
  <Box
    p={4}
    borderRadius="2xl"
    bg={bg}
    border="1px solid"
    borderColor="#F0E2C8"
    minH="96px"
  >
    <Text fontSize="xs" fontWeight="600" color="gray.500" letterSpacing="0.04em">
      {label}
    </Text>
    <Text mt={2} fontSize="xl" fontWeight="700" color={accent} lineHeight="1.2">
      {value}
    </Text>
    {hint ? (
      <Text mt={1} fontSize="xs" color="gray.500">
        {hint}
      </Text>
    ) : null}
  </Box>
);

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <Flex align="center" gap={3} mb={4}>
    <Flex
      align="center"
      justify="center"
      w="36px"
      h="36px"
      borderRadius="xl"
      bg="#FFCB82"
      color="#85652D"
      flexShrink={0}
    >
      <Icon size={18} />
    </Flex>
    <Box>
      <Text fontWeight="700" color="#2D3748">
        {title}
      </Text>
      {subtitle ? (
        <Text fontSize="sm" color="gray.500">
          {subtitle}
        </Text>
      ) : null}
    </Box>
  </Flex>
);

const EmptyState = ({ message }) => (
  <Box
    py={10}
    px={4}
    textAlign="center"
    borderRadius="2xl"
    border="1px dashed"
    borderColor="#E0E8EC"
    bg="gray.50"
  >
    <Text color="gray.500" fontSize="sm">
      {message}
    </Text>
  </Box>
);

const TimelineItem = ({ title, meta, badge, children, isLast }) => (
  <Flex gap={3} position="relative">
    <Flex direction="column" align="center" minW="18px">
      <Box
        w="12px"
        h="12px"
        borderRadius="full"
        bg="#FFCB82"
        border="2px solid"
        borderColor="#85652D"
        mt={1}
        zIndex={1}
      />
      {!isLast ? (
        <Box flex="1" w="2px" bg="#F0E2C8" my={1} minH="24px" />
      ) : null}
    </Flex>
    <Box pb={isLast ? 0 : 5} flex="1">
      <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap">
        <Box>
          <Text fontWeight="600" color="#2D3748" fontSize="sm">
            {title}
          </Text>
          {meta ? (
            <Text fontSize="xs" color="gray.500" mt={0.5}>
              {meta}
            </Text>
          ) : null}
        </Box>
        {badge}
      </Flex>
      {children}
    </Box>
  </Flex>
);

function StudentHistoryModal({ student }) {
  const [isOpen, setIsOpen] = useState(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const dispatch = useDispatch();

  const history = useSelector(selectStudentHistory);
  const { fetchStudentHistoryStatus } = useSelector((state) => state.students);
  const isLoading = fetchStudentHistoryStatus === "loading";
  const isReady =
    fetchStudentHistoryStatus === "succeeded" &&
    history?.student &&
    String(history.student._id) === String(student._id);

  const paidPercent = useMemo(() => {
    const total = Number(history?.summary?.total_fee) || 0;
    const paid = Number(history?.summary?.paid_fee) || 0;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((paid / total) * 100));
  }, [history]);

  const onOpen = () => {
    setIsOpen(true);
    dispatch(fetchStudentHistory({ authToken, studentId: student._id }));
  };

  const onClose = () => setIsOpen(false);

  const profile = isReady ? history.student : student;
  const summary = history?.summary;

  return (
    <>
      <button
        type="button"
        className="hover:bg-[#82B4FF] hover:text-[#2D4185] font-medium p-[10px] rounded-xl transition-colors duration-300"
        onClick={onOpen}
        title="View student history"
      >
        <Eye size={18} />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("5xl")}
      >
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
        <ModalContent
          {...responsiveModalContentProps}
          borderRadius={{ base: 0, sm: "2xl" }}
          overflow="hidden"
          display="flex"
          flexDirection="column"
          maxH={{ base: "100dvh", sm: "92vh" }}
        >
          <Box
            bg="linear-gradient(135deg, #FFF8EE 0%, #FFE7C2 45%, #E8F1FF 100%)"
            px={{ base: 4, md: 6 }}
            pt={5}
            pb={4}
            borderBottom="1px solid"
            borderColor="#F0E2C8"
            position="relative"
          >
            <ModalCloseButton top={3} right={3} />
            <Flex gap={4} align="flex-start" wrap="wrap">
              <Box
                w="72px"
                h="72px"
                borderRadius="2xl"
                overflow="hidden"
                border="3px solid white"
                boxShadow="md"
                bg="white"
                flexShrink={0}
              >
                {profile?.image ? (
                  <Image
                    src={getMediaUrl(profile.image)}
                    alt={profile?.name}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                ) : (
                  <Flex
                    w="100%"
                    h="100%"
                    align="center"
                    justify="center"
                    bg="#FFCB82"
                    color="#85652D"
                  >
                    <User size={28} />
                  </Flex>
                )}
              </Box>

              <Box flex="1" minW="220px">
                <HStack spacing={2} mb={1} flexWrap="wrap">
                  <Text fontSize="xl" fontWeight="800" color="#2D3748">
                    {profile?.name || "Student"}
                  </Text>
                  <Badge
                    colorScheme={profile?.is_active !== false ? "green" : "gray"}
                    borderRadius="full"
                    px={2}
                  >
                    {profile?.is_active !== false ? "Active" : "Inactive"}
                  </Badge>
                </HStack>
                <HStack spacing={4} flexWrap="wrap" color="gray.600" fontSize="sm">
                  <HStack spacing={1}>
                    <IdCard size={14} />
                    <Text>{profile?.roll_number || "No roll no"}</Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Layers size={14} />
                    <Text>{profile?.batch?.name || "No batch"}</Text>
                  </HStack>
                </HStack>
                <HStack
                  spacing={4}
                  flexWrap="wrap"
                  color="gray.600"
                  fontSize="sm"
                  mt={2}
                >
                  <HStack spacing={1}>
                    <Mail size={14} />
                    <Text>{profile?.email || "—"}</Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Phone size={14} />
                    <Text>{profile?.phone || "—"}</Text>
                  </HStack>
                  {profile?.city ? (
                    <HStack spacing={1}>
                      <MapPin size={14} />
                      <Text>{profile.city}</Text>
                    </HStack>
                  ) : null}
                </HStack>
              </Box>
            </Flex>

            {!isLoading && isReady ? (
              <Box mt={4}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="xs" fontWeight="600" color="#85652D">
                    Fee completion
                  </Text>
                  <Text fontSize="xs" fontWeight="700" color="#85652D">
                    {paidPercent}%
                  </Text>
                </Flex>
                <Progress
                  value={paidPercent}
                  size="sm"
                  borderRadius="full"
                  colorScheme="green"
                  bg="whiteAlpha.700"
                />
              </Box>
            ) : null}
          </Box>

          <ModalBody flex="1" overflowY="auto" px={{ base: 3, md: 6 }} py={5}>
            {isLoading ? (
              <Flex py={16} align="center" justify="center" direction="column" gap={3}>
                <Spinner size="lg" color="#85652D" thickness="3px" />
                <Text color="gray.500" fontSize="sm">
                  Loading full student history...
                </Text>
              </Flex>
            ) : !isReady ? (
              <EmptyState message="Unable to load student history. Please try again." />
            ) : (
              <>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={6}>
                  <StatCard
                    label="TOTAL FEE"
                    value={formatRs(summary?.total_fee)}
                    accent="#2D4185"
                    bg="#EEF4FF"
                  />
                  <StatCard
                    label="PAID"
                    value={formatRs(summary?.paid_fee)}
                    accent="#276749"
                    bg="#EAF8EF"
                  />
                  <StatCard
                    label="PENDING"
                    value={formatRs(summary?.pending_fee)}
                    accent="#C05621"
                    bg="#FFF5EB"
                  />
                  <StatCard
                    label="BATCHES"
                    value={summary?.batches_touched || 0}
                    hint={`${summary?.fee_records || 0} fee records`}
                    accent="#85652D"
                  />
                </SimpleGrid>

                <Tabs
                  variant="soft-rounded"
                  colorScheme="orange"
                  isLazy
                  size="sm"
                >
                  <TabList
                    gap={2}
                    flexWrap="wrap"
                    bg="#F7FAFC"
                    p={2}
                    borderRadius="2xl"
                  >
                    <Tab fontWeight="600">Overview</Tab>
                    <Tab fontWeight="600">Batches</Tab>
                    <Tab fontWeight="600">Fees</Tab>
                    <Tab fontWeight="600">Payments</Tab>
                    <Tab fontWeight="600">Activity</Tab>
                  </TabList>

                  <TabPanels mt={4}>
                    <TabPanel px={0}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Box
                          p={5}
                          borderRadius="2xl"
                          border="1px solid"
                          borderColor="#E0E8EC"
                          bg="white"
                        >
                          <SectionTitle
                            icon={User}
                            title="Profile"
                            subtitle="Core student details"
                          />
                          <VStack align="stretch" spacing={3} fontSize="sm">
                            <Flex justify="space-between" gap={3}>
                              <Text color="gray.500">Admission</Text>
                              <Text fontWeight="600" textAlign="right">
                                {formatShortDate(profile.admission_date)}
                              </Text>
                            </Flex>
                            <Flex justify="space-between" gap={3}>
                              <Text color="gray.500">Father</Text>
                              <Text fontWeight="600" textAlign="right">
                                {profile.father_name || "—"}
                              </Text>
                            </Flex>
                            <Flex justify="space-between" gap={3}>
                              <Text color="gray.500">CNIC</Text>
                              <Text fontWeight="600" textAlign="right">
                                {profile.cnic || "—"}
                              </Text>
                            </Flex>
                            <Flex justify="space-between" gap={3}>
                              <Text color="gray.500">Degree</Text>
                              <Text fontWeight="600" textAlign="right">
                                {profile.latest_degree || "—"}
                              </Text>
                            </Flex>
                            <Flex justify="space-between" gap={3}>
                              <Text color="gray.500">University</Text>
                              <Text fontWeight="600" textAlign="right">
                                {profile.university || "—"}
                              </Text>
                            </Flex>
                            {profile.remarks ? (
                              <>
                                <Divider />
                                <Box>
                                  <Text color="gray.500" mb={1}>
                                    Remarks
                                  </Text>
                                  <Text fontWeight="500">{profile.remarks}</Text>
                                </Box>
                              </>
                            ) : null}
                          </VStack>
                        </Box>

                        <Box
                          p={5}
                          borderRadius="2xl"
                          border="1px solid"
                          borderColor="#E0E8EC"
                          bg="white"
                        >
                          <SectionTitle
                            icon={CircleDollarSign}
                            title="Finance snapshot"
                            subtitle="Current outstanding status"
                          />
                          <VStack align="stretch" spacing={3}>
                            <Flex justify="space-between">
                              <Text fontSize="sm" color="gray.500">
                                Payment events
                              </Text>
                              <Badge colorScheme="purple" borderRadius="full">
                                {summary?.payment_events || 0}
                              </Badge>
                            </Flex>
                            <Flex justify="space-between">
                              <Text fontSize="sm" color="gray.500">
                                Pending fee slips
                              </Text>
                              <Badge colorScheme="orange" borderRadius="full">
                                {summary?.pending_fee_slips || 0}
                              </Badge>
                            </Flex>
                            <Flex justify="space-between">
                              <Text fontSize="sm" color="gray.500">
                                Enrollments
                              </Text>
                              <Badge colorScheme="blue" borderRadius="full">
                                {summary?.enrollments || 0}
                              </Badge>
                            </Flex>
                            <Flex justify="space-between">
                              <Text fontSize="sm" color="gray.500">
                                Activity events
                              </Text>
                              <Badge colorScheme="teal" borderRadius="full">
                                {summary?.activity_events || 0}
                              </Badge>
                            </Flex>
                          </VStack>
                        </Box>
                      </SimpleGrid>

                      {history.pending_fee_slips?.length > 0 ? (
                        <Box
                          mt={4}
                          p={5}
                          borderRadius="2xl"
                          border="1px solid"
                          borderColor="#F0E2C8"
                          bg="#FFFBF5"
                        >
                          <SectionTitle
                            icon={FileText}
                            title="Pending fee slips"
                            subtitle="Generated slips for outstanding balances"
                          />
                          <VStack align="stretch" spacing={3}>
                            {history.pending_fee_slips.map((slip) => (
                              <Flex
                                key={slip._id}
                                justify="space-between"
                                align="center"
                                gap={3}
                                p={3}
                                borderRadius="xl"
                                bg="white"
                                border="1px solid"
                                borderColor="#F0E2C8"
                                wrap="wrap"
                              >
                                <Box>
                                  <Text fontWeight="600" fontSize="sm">
                                    {formatRs(slip.pending_amount)}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {formatDate(slip.createdAt)}
                                    {slip.generated_by?.name
                                      ? ` · by ${slip.generated_by.name}`
                                      : ""}
                                  </Text>
                                </Box>
                                {slip.slip_url ? (
                                  <Link
                                    href={getMediaUrl(slip.slip_url)}
                                    isExternal
                                    fontSize="sm"
                                    fontWeight="600"
                                    color="#2D4185"
                                  >
                                    Open slip
                                  </Link>
                                ) : null}
                              </Flex>
                            ))}
                          </VStack>
                        </Box>
                      ) : null}
                    </TabPanel>

                    <TabPanel px={0}>
                      <SectionTitle
                        icon={Layers}
                        title="Batch history"
                        subtitle="Batches linked through current assignment, fees, and enrollments"
                      />
                      {!history.batch_history?.length ? (
                        <EmptyState message="No batch history found for this student." />
                      ) : (
                        <VStack align="stretch" spacing={0}>
                          {history.batch_history.map((batch, index) => (
                            <TimelineItem
                              key={String(batch.batch_id)}
                              title={batch.batch_name}
                              meta={`${formatShortDate(batch.first_seen_at)} → ${formatShortDate(
                                batch.last_seen_at
                              )}`}
                              badge={
                                <HStack spacing={2}>
                                  {batch.is_current ? (
                                    <Badge colorScheme="green" borderRadius="full">
                                      Current
                                    </Badge>
                                  ) : null}
                                  <Badge colorScheme="purple" borderRadius="full">
                                    {batch.sources?.join(", ") || "linked"}
                                  </Badge>
                                </HStack>
                              }
                              isLast={index === history.batch_history.length - 1}
                            >
                              <SimpleGrid
                                columns={{ base: 2, sm: 4 }}
                                spacing={2}
                                mt={2}
                              >
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg="gray.50"
                                  fontSize="xs"
                                >
                                  <Text color="gray.500">Fees</Text>
                                  <Text fontWeight="700">{batch.fee_count || 0}</Text>
                                </Box>
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg="green.50"
                                  fontSize="xs"
                                >
                                  <Text color="gray.500">Paid</Text>
                                  <Text fontWeight="700" color="green.700">
                                    {formatRs(batch.paid_amount)}
                                  </Text>
                                </Box>
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg="orange.50"
                                  fontSize="xs"
                                >
                                  <Text color="gray.500">Pending</Text>
                                  <Text fontWeight="700" color="orange.700">
                                    {formatRs(batch.pending_amount)}
                                  </Text>
                                </Box>
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg="blue.50"
                                  fontSize="xs"
                                >
                                  <Text color="gray.500">Created</Text>
                                  <Text fontWeight="700" color="blue.700">
                                    {formatRs(batch.created_amount)}
                                  </Text>
                                </Box>
                              </SimpleGrid>
                            </TimelineItem>
                          ))}
                        </VStack>
                      )}

                      {history.enrollments?.length > 0 ? (
                        <Box mt={6}>
                          <SectionTitle
                            icon={GraduationCap}
                            title="Enrollments"
                            subtitle="Course enrollments by batch"
                          />
                          <VStack align="stretch" spacing={3}>
                            {history.enrollments.map((enrollment) => (
                              <Box
                                key={enrollment._id}
                                p={4}
                                borderRadius="2xl"
                                border="1px solid"
                                borderColor="#E0E8EC"
                                bg="white"
                              >
                                <Text fontWeight="700" fontSize="sm">
                                  {enrollment.batch?.name || "Unknown batch"}
                                </Text>
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                  {(enrollment.courses || [])
                                    .map((course) => course.name)
                                    .filter(Boolean)
                                    .join(", ") || "No courses listed"}
                                </Text>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      ) : null}
                    </TabPanel>

                    <TabPanel px={0}>
                      <SectionTitle
                        icon={Receipt}
                        title="Fee records"
                        subtitle="All fee documents linked to this student"
                      />
                      {!history.fees?.length ? (
                        <EmptyState message="No fee records found." />
                      ) : (
                        <VStack align="stretch" spacing={3}>
                          {history.fees.map((fee) => (
                            <Box
                              key={fee._id}
                              p={4}
                              borderRadius="2xl"
                              border="1px solid"
                              borderColor="#E0E8EC"
                              bg="white"
                              _hover={{ borderColor: "#FFCB82", boxShadow: "sm" }}
                              transition="all 0.2s"
                            >
                              <Flex
                                justify="space-between"
                                align="flex-start"
                                gap={3}
                                wrap="wrap"
                              >
                                <Box>
                                  <Text fontWeight="700">
                                    {fee.batch?.name || "Unassigned batch"}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500" mt={1}>
                                    Due {formatShortDate(fee.due_date)} ·{" "}
                                    {fee.logs?.length || 0} log
                                    {(fee.logs?.length || 0) === 1 ? "" : "s"}
                                  </Text>
                                </Box>
                                <HStack>
                                  <Badge
                                    colorScheme={
                                      fee.status === "Paid" ? "green" : "orange"
                                    }
                                    borderRadius="full"
                                  >
                                    {fee.status}
                                  </Badge>
                                  <Text fontWeight="800" color="#2D4185">
                                    {formatRs(fee.amount)}
                                  </Text>
                                </HStack>
                              </Flex>
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </TabPanel>

                    <TabPanel px={0}>
                      <SectionTitle
                        icon={Clock3}
                        title="Payment timeline"
                        subtitle="Created, paid, discounted, and deleted fee events"
                      />
                      {!history.payment_logs?.length ? (
                        <EmptyState message="No payment history yet." />
                      ) : (
                        <VStack align="stretch" spacing={0}>
                          {history.payment_logs.map((log, index) => {
                            const style =
                              ACTION_STYLES[log.action_type] || ACTION_STYLES.Paid;
                            return (
                              <TimelineItem
                                key={log._id}
                                title={`${style.label}${
                                  log.fee?.batch?.name
                                    ? ` · ${log.fee.batch.name}`
                                    : ""
                                }`}
                                meta={`${formatDate(log.action_date)}${
                                  log.action_by?.name
                                    ? ` · ${log.action_by.name}`
                                    : ""
                                }`}
                                badge={
                                  <Badge colorScheme={style.color} borderRadius="full">
                                    {formatRs(
                                      log.action_type === "Created" ||
                                        log.action_type === "Deleted"
                                        ? log.amount
                                        : log.action_amount
                                    )}
                                  </Badge>
                                }
                                isLast={index === history.payment_logs.length - 1}
                              >
                                {log.description ? (
                                  <Text fontSize="xs" color="gray.600" mt={1}>
                                    {log.description}
                                  </Text>
                                ) : null}
                                {log.payment_method ? (
                                  <Text fontSize="xs" color="gray.500" mt={1}>
                                    Method: {log.payment_method}
                                  </Text>
                                ) : null}
                              </TimelineItem>
                            );
                          })}
                        </VStack>
                      )}
                    </TabPanel>

                    <TabPanel px={0}>
                      <SectionTitle
                        icon={Activity}
                        title="System activity"
                        subtitle="Recent actions linked to this student"
                      />
                      {!history.activity_logs?.length ? (
                        <EmptyState message="No activity logs recorded for this student." />
                      ) : (
                        <VStack align="stretch" spacing={0}>
                          {history.activity_logs.map((log, index) => (
                            <TimelineItem
                              key={log._id}
                              title={log.description || log.action}
                              meta={`${formatDate(log.created_at)} · ${
                                log.module || "general"
                              }${
                                log.actor_name || log.actor_user?.name
                                  ? ` · ${log.actor_name || log.actor_user?.name}`
                                  : ""
                              }`}
                              badge={
                                <Badge colorScheme="teal" borderRadius="full">
                                  {log.action}
                                </Badge>
                              }
                              isLast={index === history.activity_logs.length - 1}
                            />
                          ))}
                        </VStack>
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </>
            )}
          </ModalBody>

          <ModalFooter
            borderTopWidth="1px"
            borderColor="gray.100"
            bg="gray.50"
          >
            <Button borderRadius="xl" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default StudentHistoryModal;
