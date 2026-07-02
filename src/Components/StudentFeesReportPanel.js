import React from "react";
import moment from "moment";
import {
  Badge,
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import {
  CalendarRange,
  CircleDollarSign,
  HandCoins,
  Layers,
  Users,
  Wallet,
} from "lucide-react";
import { DataTableShell } from "./PageHeader";

const PERIOD_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const formatRs = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const SUMMARY_CARDS = [
  {
    key: "total_records",
    amountKey: "total_amount",
    label: "Total Records",
    help: "All fee entries in period",
    icon: CircleDollarSign,
    accent: "#82B4FF",
    bg: "linear-gradient(135deg, #f0f6ff 0%, #ffffff 100%)",
  },
  {
    key: "paid_count",
    amountKey: "paid_amount",
    label: "Paid Fees",
    help: "Successfully collected",
    icon: HandCoins,
    accent: "#48BB78",
    bg: "linear-gradient(135deg, #f0fff4 0%, #ffffff 100%)",
  },
  {
    key: "pending_count",
    amountKey: "pending_amount",
    label: "Pending Fees",
    help: "Still outstanding",
    icon: Wallet,
    accent: "#E53E3E",
    bg: "linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)",
  },
  {
    key: "fee_payers",
    label: "Fee Payers",
    help: "Unique students who paid",
    icon: Users,
    accent: "#D69E2E",
    bg: "linear-gradient(135deg, #fffaf0 0%, #ffffff 100%)",
    isCountOnly: true,
  },
];

function StudentFeesReportPanel({ report, period }) {
  if (!report) return null;

  const summary = report.summary || {};
  const batchWise = report.batch_wise || [];
  const activeBatchesTotal = report.active_batches_total;
  const periodLabel = PERIOD_LABELS[period] || "Daily";

  return (
    <Box mb={6}>
      <Box
        borderRadius="2xl"
        overflow="hidden"
        border="1px solid"
        borderColor="#E0E8EC"
        bg="white"
        boxShadow="sm"
        mb={4}
      >
        <Box
          px={{ base: 4, md: 6 }}
          py={5}
          bg="linear-gradient(135deg, #FFCB82 0%, #f5d9a8 55%, #ffffff 100%)"
          borderBottom="1px solid"
          borderColor="#E0E8EC"
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={4}
          >
            <VStack align="flex-start" spacing={1}>
              <HStack spacing={2}>
                <Box
                  bg="#85652D"
                  color="white"
                  fontSize="xs"
                  fontWeight="bold"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                >
                  LCA
                </Box>
                <Text fontSize="xs" fontWeight="semibold" color="#85652D" letterSpacing="wider">
                  FINANCE
                </Text>
              </HStack>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="#2D3748">
                Student Fees Report
              </Text>
              <Text fontSize="sm" color="#5A6A7A">
                Clear overview of collections by batch and period
              </Text>
            </VStack>

            <HStack spacing={3} flexWrap="wrap">
              <Badge
                px={3}
                py={1.5}
                borderRadius="full"
                bg="white"
                color="#85652D"
                border="1px solid #FFCB82"
                fontSize="sm"
              >
                <HStack spacing={1}>
                  <CalendarRange size={14} />
                  <Text>{periodLabel}</Text>
                </HStack>
              </Badge>
              <Badge
                px={3}
                py={1.5}
                borderRadius="full"
                bg="white"
                color="#2D4185"
                border="1px solid #82B4FF"
                fontSize="sm"
              >
                {moment(report.start_date).format("DD MMM YYYY")} –{" "}
                {moment(report.end_date).format("DD MMM YYYY")}
              </Badge>
              <Badge
                px={3}
                py={1.5}
                borderRadius="full"
                bg="white"
                color="#2D3748"
                border="1px solid #E0E8EC"
                fontSize="sm"
              >
                <HStack spacing={1}>
                  <Layers size={14} />
                  <Text>{report.batch?.name || "All Active Batches"}</Text>
                </HStack>
              </Badge>
            </HStack>
          </Flex>
        </Box>

        <Box px={{ base: 4, md: 6 }} py={5}>
          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
            {SUMMARY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Stat
                  key={card.key}
                  px={4}
                  py={4}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="#E0E8EC"
                  bg={card.bg}
                  position="relative"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    top={3}
                    right={3}
                    p={2}
                    borderRadius="lg"
                    bg="white"
                    boxShadow="sm"
                  >
                    <Icon size={20} color={card.accent} />
                  </Box>
                  <StatLabel color="#5A6A7A" fontSize="sm" fontWeight="medium">
                    {card.label}
                  </StatLabel>
                  <StatNumber color="#1A202C" fontSize="2xl">
                    {summary[card.key] || 0}
                  </StatNumber>
                  <StatHelpText color="#718096" mb={0}>
                    {card.isCountOnly
                      ? card.help
                      : `Rs. ${formatRs(summary[card.amountKey])}`}
                  </StatHelpText>
                </Stat>
              );
            })}
          </SimpleGrid>
        </Box>
      </Box>

      {batchWise.length > 0 && (
        <DataTableShell>
          <Box px={{ base: 3, md: 5 }} pt={4} pb={2}>
            <Text fontSize="lg" fontWeight="semibold" color="#2D3748">
              Batch-wise Breakdown
            </Text>
            <Text fontSize="sm" color="#718096">
              Compare collections and fee payers across each active batch
            </Text>
          </Box>
          <TableContainer px={{ base: 2, md: 4 }} pb={4}>
            <Table variant="simple" size="md">
              <Thead>
                <Tr bg="#F7FAFC">
                  <Th borderColor="#E0E8EC" color="#4A5568">
                    Batch
                  </Th>
                  <Th isNumeric borderColor="#E0E8EC" color="#4A5568">
                    Records
                  </Th>
                  <Th isNumeric borderColor="#E0E8EC" color="#4A5568">
                    Total
                  </Th>
                  <Th isNumeric borderColor="#E0E8EC" color="#4A5568">
                    Paid
                  </Th>
                  <Th isNumeric borderColor="#E0E8EC" color="#4A5568">
                    Pending
                  </Th>
                  <Th isNumeric borderColor="#E0E8EC" color="#4A5568">
                    Fee Payers
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {batchWise.map((row, index) => {
                  const hasData = (row.total_records || 0) > 0;
                  return (
                    <Tr
                      key={row.batch?._id || row.batch?.name}
                      bg={index % 2 === 0 ? "white" : "#FAFBFC"}
                      _hover={{ bg: "#FFFBF5" }}
                    >
                      <Td borderColor="#E0E8EC">
                        <HStack spacing={2}>
                          <Box
                            w="8px"
                            h="8px"
                            borderRadius="full"
                            bg={hasData ? "#48BB78" : "#CBD5E0"}
                          />
                          <Text fontWeight="semibold" color="#2D3748">
                            {row.batch?.name || "N/A"}
                          </Text>
                        </HStack>
                      </Td>
                      <Td isNumeric borderColor="#E0E8EC" color="#4A5568">
                        {row.total_records || 0}
                      </Td>
                      <Td isNumeric borderColor="#E0E8EC" fontWeight="medium">
                        Rs. {formatRs(row.total_amount)}
                      </Td>
                      <Td isNumeric borderColor="#E0E8EC">
                        <VStack align="flex-end" spacing={0}>
                          <Text fontWeight="medium" color="#276749">
                            {row.paid_count || 0}
                          </Text>
                          <Text fontSize="xs" color="#718096">
                            Rs. {formatRs(row.paid_amount)}
                          </Text>
                        </VStack>
                      </Td>
                      <Td isNumeric borderColor="#E0E8EC">
                        <VStack align="flex-end" spacing={0}>
                          <Text fontWeight="medium" color="#C53030">
                            {row.pending_count || 0}
                          </Text>
                          <Text fontSize="xs" color="#718096">
                            Rs. {formatRs(row.pending_amount)}
                          </Text>
                        </VStack>
                      </Td>
                      <Td isNumeric borderColor="#E0E8EC">
                        <Badge
                          colorScheme={row.fee_payers > 0 ? "yellow" : "gray"}
                          borderRadius="full"
                          px={3}
                        >
                          {row.fee_payers || 0}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
                {activeBatchesTotal && (
                  <Tr bg="linear-gradient(90deg, #FFCB82 0%, #FFE8C2 100%)">
                    <Td borderColor="#E0E8EC" fontWeight="bold" color="#654E26">
                      Total · {activeBatchesTotal.active_batch_count || 0} active batches
                    </Td>
                    <Td isNumeric borderColor="#E0E8EC" fontWeight="bold" color="#654E26">
                      {activeBatchesTotal.total_records || 0}
                    </Td>
                    <Td isNumeric borderColor="#E0E8EC" fontWeight="bold" color="#654E26">
                      Rs. {formatRs(activeBatchesTotal.total_amount)}
                    </Td>
                    <Td isNumeric borderColor="#E0E8EC" fontWeight="bold" color="#654E26">
                      <VStack align="flex-end" spacing={0}>
                        <Text>{activeBatchesTotal.paid_count || 0}</Text>
                        <Text fontSize="xs">
                          Rs. {formatRs(activeBatchesTotal.paid_amount)}
                        </Text>
                      </VStack>
                    </Td>
                    <Td isNumeric borderColor="#E0E8EC" fontWeight="bold" color="#654E26">
                      <VStack align="flex-end" spacing={0}>
                        <Text>{activeBatchesTotal.pending_count || 0}</Text>
                        <Text fontSize="xs">
                          Rs. {formatRs(activeBatchesTotal.pending_amount)}
                        </Text>
                      </VStack>
                    </Td>
                    <Td isNumeric borderColor="#E0E8EC">
                      <Badge
                        bg="#85652D"
                        color="white"
                        borderRadius="full"
                        px={3}
                        fontSize="sm"
                      >
                        {activeBatchesTotal.fee_payers || 0} payers
                      </Badge>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </DataTableShell>
      )}
    </Box>
  );
}

export default StudentFeesReportPanel;
