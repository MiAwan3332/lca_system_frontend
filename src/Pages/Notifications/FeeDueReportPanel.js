import React from "react";
import moment from "moment";
import {
  Badge,
  Box,
  Button,
  FormControl,
  HStack,
  Input,
  SimpleGrid,
  Skeleton,
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
  useToast,
} from "@chakra-ui/react";
import { AlertTriangle, CalendarClock, Download, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateFeeDueReport } from "../../utlls/generateFeeDueReport";

const formatRs = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

function FeeReportTable({
  title,
  rows,
  emptyText,
  variant = "today",
  statusLabel = "Due Today",
  onRowClick,
}) {
  const isOverdue = variant === "overdue";

  return (
    <Box
      borderWidth="1px"
      borderColor={isOverdue ? "#FCA5A5" : "#E0E8EC"}
      borderRadius="xl"
      bg="white"
      overflow="hidden"
    >
      <Box
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor={isOverdue ? "#FECACA" : "#E0E8EC"}
        bg={isOverdue ? "#FFF5F5" : "#FFFBF5"}
      >
        <HStack spacing={2}>
          {isOverdue ? (
            <AlertTriangle size={18} color="#DC2626" />
          ) : (
            <CalendarClock size={18} color="#85652D" />
          )}
          <Text fontWeight="semibold" color={isOverdue ? "#991B1B" : "#85652D"}>
            {title}
          </Text>
          <Badge colorScheme={isOverdue ? "red" : "orange"} ml="auto">
            {rows.length}
          </Badge>
        </HStack>
      </Box>

      {rows.length === 0 ? (
        <Box py={8} px={4} textAlign="center">
          <Text fontSize="sm" color="gray.500">
            {emptyText}
          </Text>
        </Box>
      ) : (
        <TableContainer>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr bg="#F7FAFC">
                <Th>Student</Th>
                <Th>Batch</Th>
                <Th isNumeric>Amount</Th>
                <Th>Due Date</Th>
                <Th>{isOverdue ? "Overdue By" : "Status"}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr
                  key={row.fee_id}
                  cursor="pointer"
                  _hover={{ bg: isOverdue ? "#FEE2E2" : "#FFFBF5" }}
                  onClick={() => onRowClick?.(row)}
                >
                  <Td fontWeight="medium">{row.student_name}</Td>
                  <Td>{row.batch_name}</Td>
                  <Td isNumeric fontWeight="semibold">
                    Rs. {formatRs(row.amount)}
                  </Td>
                  <Td>{row.due_date_label}</Td>
                  <Td>
                    {isOverdue ? (
                      <Badge colorScheme="red" variant="solid">
                        {row.overdue_days} day{row.overdue_days === 1 ? "" : "s"}
                      </Badge>
                    ) : (
                      <Badge colorScheme="orange">{statusLabel}</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

function FeeDueReportPanel({ report, loading, reportDate, onReportDateChange, onRefresh }) {
  const toast = useToast();
  const navigate = useNavigate();

  const handleExport = (mode) => {
    if (!report) return;
    try {
      const fileName = generateFeeDueReport(report, mode);
      toast({
        title: mode === "print" ? "Report opened for printing" : "Report downloaded",
        description: mode === "print" ? "Use your browser print dialog." : fileName,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not generate report",
        description: error.message || "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const summary = report?.summary || {};
  const isToday = report?.is_today !== false;
  const dueSectionTitle = isToday
    ? "Fees Due Today"
    : `Fees Due on ${report?.report_date_label || "Selected Date"}`;
  const dueEmptyText = isToday
    ? "No fees due today."
    : "No fees due on the selected date.";
  const dueStatLabel = isToday ? "Due Today" : "Due on Date";

  if (loading) {
    return (
      <Box mb={6}>
        <Skeleton height="24px" width="240px" mb={4} borderRadius="md" />
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} height="88px" borderRadius="xl" />
          ))}
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
          <Skeleton height="220px" borderRadius="xl" />
          <Skeleton height="220px" borderRadius="xl" />
        </SimpleGrid>
      </Box>
    );
  }

  return (
    <Box mb={8}>
      <HStack justify="space-between" align="flex-start" mb={4} flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="lg" fontWeight="semibold" color="#2D3748">
            Fee Due Report
          </Text>
          <Text fontSize="sm" color="gray.600">
            {report?.report_date_label || moment().format("DD MMM YYYY")} · Generated{" "}
            {report?.generated_at || "just now"}
          </Text>
        </Box>
        <HStack spacing={2} flexWrap="wrap" align="flex-end">
          <FormControl maxW="180px">
            <Text fontSize="xs" color="gray.500" mb={1}>
              Report date
            </Text>
            <Input
              type="date"
              size="sm"
              borderRadius="lg"
              bg="white"
              value={reportDate}
              onChange={(e) => onReportDateChange(e.target.value)}
            />
          </FormControl>
          <Button size="sm" variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
          <Button
            size="sm"
            leftIcon={<Download size={16} />}
            colorScheme="blue"
            variant="outline"
            onClick={() => handleExport("download")}
            isDisabled={!report}
          >
            Download PDF
          </Button>
          <Button
            size="sm"
            leftIcon={<Printer size={16} />}
            colorScheme="blue"
            onClick={() => handleExport("print")}
            isDisabled={!report}
          >
            Print
          </Button>
        </HStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
        <Stat
          px={4}
          py={4}
          borderRadius="xl"
          border="1px solid #FFCB82"
          bg="linear-gradient(135deg, #fffaf0 0%, #ffffff 100%)"
        >
          <StatLabel color="#85652D">{dueStatLabel}</StatLabel>
          <StatNumber color="#85652D">{summary.due_today_count || 0}</StatNumber>
          <StatHelpText mb={0}>Rs. {formatRs(summary.due_today_amount)}</StatHelpText>
        </Stat>
        <Stat
          px={4}
          py={4}
          borderRadius="xl"
          border="1px solid #FCA5A5"
          bg="linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)"
        >
          <StatLabel color="#991B1B">Overdue</StatLabel>
          <StatNumber color="#DC2626">{summary.overdue_count || 0}</StatNumber>
          <StatHelpText mb={0}>Rs. {formatRs(summary.overdue_amount)}</StatHelpText>
        </Stat>
        <Stat
          px={4}
          py={4}
          borderRadius="xl"
          border="1px solid #E0E8EC"
          bg="linear-gradient(135deg, #f7fafc 0%, #ffffff 100%)"
        >
          <StatLabel color="#4A5568">Total Action Required</StatLabel>
          <StatNumber color="#2D3748">{summary.total_pending_count || 0}</StatNumber>
          <StatHelpText mb={0}>Rs. {formatRs(summary.total_pending_amount)}</StatHelpText>
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
        <FeeReportTable
          title={dueSectionTitle}
          rows={report?.due_today || report?.due_on_date || []}
          emptyText={dueEmptyText}
          variant="today"
          statusLabel={isToday ? "Due Today" : "Due on Date"}
          onRowClick={() => navigate("/fees")}
        />
        <FeeReportTable
          title={
            isToday
              ? "Overdue Fees"
              : `Overdue as of ${report?.report_date_label || "Selected Date"}`
          }
          rows={report?.overdue || []}
          emptyText={
            isToday
              ? "No overdue fees."
              : "No overdue fees as of the selected date."
          }
          variant="overdue"
          onRowClick={() => navigate("/fees")}
        />
      </SimpleGrid>
    </Box>
  );
}

export default FeeDueReportPanel;
