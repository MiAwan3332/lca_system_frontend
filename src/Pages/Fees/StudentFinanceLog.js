import React, { useEffect } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  Badge,
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  TableContainer,
  VStack,
} from "@chakra-ui/react";
import { FileX, HandCoins, Receipt, Wallet } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyFinance, selectMyFinance } from "../../Features/studentSlice";
import { getStudentId } from "../../utlls/studentAccess";
import FeesPageHero from "../../Components/FeesPageHero";
import { DataTableShell } from "../../Components/PageHeader";
import OverdueFeeAlert from "../../Components/OverdueFeeAlert";

const formatRs = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const ACTION_LABELS = {
  Created: "Fee Assigned",
  Paid: "Payment Received",
  Discounted: "Discount Applied",
  Deleted: "Fee Removed",
};

const ACTION_COLORS = {
  Created: "blue",
  Paid: "green",
  Discounted: "orange",
  Deleted: "red",
};

const getLogAmountLabel = (log) => {
  if (log.action_type === "Created" || log.action_type === "Deleted") {
    return `${formatRs(log.amount)} Rs.`;
  }
  const remaining = (Number(log.amount) || 0) - (Number(log.action_amount) || 0);
  return `${formatRs(log.amount)} − ${formatRs(log.action_amount)} = ${formatRs(remaining)} Rs.`;
};

function StudentFinanceLog() {
  const dispatch = useDispatch();
  const authToken = Cookies.get("authToken");
  const studentId = getStudentId();
  const { fetchMyFinanceStatus, error: financeError } = useSelector(
    (state) => state.students
  );
  const financeData = useSelector(selectMyFinance);

  useEffect(() => {
    if (authToken && studentId) {
      dispatch(fetchMyFinance({ authToken, studentId }));
    }
  }, [dispatch, authToken, studentId]);

  const isLoading = fetchMyFinanceStatus === "loading";
  const loadFailed = fetchMyFinanceStatus === "failure";
  const student = financeData?.student;
  const pendingFeeRecord = financeData?.pending_fee_record;
  const paymentLogs = financeData?.payment_logs || [];

  const summaryCards = [
    {
      label: "Total Fee",
      value: student?.total_fee || 0,
      help: "Assigned batch fee",
      icon: Receipt,
      accent: "#2D4185",
      bg: "linear-gradient(135deg, #f0f6ff 0%, #ffffff 100%)",
    },
    {
      label: "Paid",
      value: student?.paid_fee || 0,
      help: "Total amount paid",
      icon: HandCoins,
      accent: "#276749",
      bg: "linear-gradient(135deg, #f0fff4 0%, #ffffff 100%)",
    },
    {
      label: "Pending",
      value: student?.pending_fee || 0,
      help: "Outstanding balance",
      icon: Wallet,
      accent: "#C53030",
      bg: "linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)",
    },
  ];

  return (
    <Box pb={8}>
      <FeesPageHero viewOnly />

      <OverdueFeeAlert
        dueDate={pendingFeeRecord?.due_date}
        amount={pendingFeeRecord?.amount || student?.pending_fee}
        status={pendingFeeRecord?.status || "Pending"}
      />

      {student?.batch?.name && (
        <Box
          mb={4}
          px={4}
          py={3}
          borderRadius="xl"
          border="1px solid #E0E8EC"
          bg="#FAFBFC"
        >
          <Text fontSize="sm" color="gray.500">
            Current Batch
          </Text>
          <Text fontWeight="semibold" color="#2D3748">
            {student.batch.name}
          </Text>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Stat
              key={card.label}
              px={4}
              py={4}
              borderRadius="xl"
              border="1px solid #E0E8EC"
              bg={card.bg}
              position="relative"
              overflow="hidden"
            >
              <Box position="absolute" top={3} right={3} p={2} borderRadius="lg" bg="white">
                <Icon size={20} color={card.accent} />
              </Box>
              <StatLabel color="#5A6A7A" fontSize="sm">
                {card.label}
              </StatLabel>
              <StatNumber color="#1A202C" fontSize="2xl">
                Rs. {formatRs(card.value)}
              </StatNumber>
              <StatHelpText color="#718096" mb={0}>
                {card.help}
              </StatHelpText>
            </Stat>
          );
        })}
      </SimpleGrid>

      <DataTableShell>
        <Box px={{ base: 3, md: 5 }} pt={4} pb={2}>
          <Text fontSize="lg" fontWeight="semibold" color="#2D3748">
            Finance Log
          </Text>
          <Text fontSize="sm" color="#718096">
            Your complete fee and payment history
          </Text>
        </Box>

        {isLoading ? (
          <Flex justify="center" py={16}>
            <Spinner size="lg" color="#FFCB82" />
          </Flex>
        ) : !studentId ? (
          <Flex direction="column" align="center" py={16} gap={3} color="#A0AEC0">
            <Text fontWeight="medium" color="#718096">
              Could not load your student profile
            </Text>
            <Text fontSize="sm" textAlign="center" maxW="sm">
              Please sign out and sign in again. If the problem continues, contact administration.
            </Text>
          </Flex>
        ) : loadFailed ? (
          <Flex direction="column" align="center" py={16} gap={3} color="#A0AEC0">
            <Text fontWeight="medium" color="#C53030">
              Could not load finance log
            </Text>
            <Text fontSize="sm" textAlign="center" maxW="sm">
              {typeof financeError === "string"
                ? financeError
                : "Please try again later."}
            </Text>
          </Flex>
        ) : paymentLogs.length === 0 ? (
          <Flex direction="column" align="center" py={16} gap={3} color="#A0AEC0">
            <Box p={4} borderRadius="full" bg="#F7FAFC">
              <FileX size={32} />
            </Box>
            <Text fontWeight="medium" color="#718096">
              No finance records yet
            </Text>
            <Text fontSize="sm" textAlign="center" maxW="sm">
              Fee assignments and payments will appear here once they are recorded.
            </Text>
          </Flex>
        ) : (
          <TableContainer px={{ base: 2, md: 4 }} pb={4}>
            <Table variant="simple" size="md">
              <Thead>
                <Tr bg="#F7FAFC">
                  <Th borderColor="#E0E8EC">Date</Th>
                  <Th borderColor="#E0E8EC">Type</Th>
                  <Th borderColor="#E0E8EC">Batch</Th>
                  <Th borderColor="#E0E8EC">Details</Th>
                  <Th borderColor="#E0E8EC" isNumeric>
                    Amount
                  </Th>
                  <Th borderColor="#E0E8EC">Method</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paymentLogs.map((log) => (
                  <Tr key={log._id} _hover={{ bg: "#FFFBF5" }}>
                    <Td borderColor="#EDF2F7" fontSize="sm" whiteSpace="nowrap">
                      {moment(log.action_date).format("DD MMM YYYY")}
                      <Text fontSize="xs" color="gray.500">
                        {moment(log.action_date).format("hh:mm A")}
                      </Text>
                    </Td>
                    <Td borderColor="#EDF2F7">
                      <Badge
                        colorScheme={ACTION_COLORS[log.action_type] || "gray"}
                        borderRadius="full"
                        px={2}
                      >
                        {ACTION_LABELS[log.action_type] || log.action_type}
                      </Badge>
                    </Td>
                    <Td borderColor="#EDF2F7">
                      {log.fee?.batch?.name || student?.batch?.name || "N/A"}
                    </Td>
                    <Td borderColor="#EDF2F7" maxW="220px">
                      <VStack align="flex-start" spacing={0}>
                        <Text fontSize="sm" color="#4A5568">
                          {log.description || "—"}
                        </Text>
                        {log.action_by?.name && (
                          <Text fontSize="xs" color="gray.500">
                            By {log.action_by.name}
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td borderColor="#EDF2F7" isNumeric fontWeight="medium">
                      {getLogAmountLabel(log)}
                    </Td>
                    <Td borderColor="#EDF2F7">
                      {log.action_type === "Paid" ? (
                        <Badge variant="outline" colorScheme="yellow">
                          {log.payment_method || "Cash"}
                        </Badge>
                      ) : (
                        <Text color="gray.400">—</Text>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </DataTableShell>
    </Box>
  );
}

export default StudentFinanceLog;
