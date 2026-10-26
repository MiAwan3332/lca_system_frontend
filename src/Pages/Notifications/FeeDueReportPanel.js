import { Input, Select } from '../../Components/AccessInputs';
import FormControl from '../../Components/AccessFormControl';
import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Badge, Box, Button, Flex, FormLabel, HStack, Menu, MenuButton, MenuItem, MenuList, SimpleGrid, Stat, StatHelpText, StatLabel, StatNumber, Table, Tbody, Td, Text, Th, Thead, Tr, TableContainer, useToast } from '@chakra-ui/react';
import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  FilterX,
  Printer,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { generateFeeDueReport } from "../../utlls/generateFeeDueReport";
import { downloadFeeDueReportExcel } from "../../utlls/exportFeeDueReportExcel";
import {
  fetchBatches,
  selectActiveStudentBatches,
} from "../../Features/batchSlice";

const formatRs = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const DEFAULT_FILTERS = {
  batch_id: "",
  status: "all", // all | due | overdue
  search: "",
  min_amount: "",
  max_amount: "",
};

const matchesRowFilters = (row, filters) => {
  if (filters.batch_id) {
    const rowBatchId = String(row.batch_id || "");
    const selectedId = String(filters.batch_id);
    if (rowBatchId) {
      if (rowBatchId !== selectedId) return false;
    } else {
      const batchName = String(filters.batch_name || "")
        .trim()
        .toLowerCase();
      if (
        !batchName ||
        String(row.batch_name || "").trim().toLowerCase() !== batchName
      ) {
        return false;
      }
    }
  }

  const q = String(filters.search || "")
    .trim()
    .toLowerCase();
  if (q) {
    const haystack = [
      row.student_name,
      row.roll_number,
      row.student_phone,
      row.student_email,
      row.batch_name,
    ]
      .map((v) => String(v || "").toLowerCase())
      .join(" ");
    if (!haystack.includes(q)) return false;
  }

  const amount = Number(row.amount) || 0;
  if (filters.min_amount !== "" && filters.min_amount != null) {
    const min = Number(filters.min_amount);
    if (Number.isFinite(min) && amount < min) return false;
  }
  if (filters.max_amount !== "" && filters.max_amount != null) {
    const max = Number(filters.max_amount);
    if (Number.isFinite(max) && amount > max) return false;
  }

  return true;
};

const buildFilterSummary = (filters, batchName, reportDateLabel) => {
  const parts = [`Date: ${reportDateLabel || "—"}`];
  if (filters.batch_id) parts.push(`Batch: ${batchName || filters.batch_id}`);
  if (filters.status === "due") parts.push("Status: Due only");
  if (filters.status === "overdue") parts.push("Status: Overdue only");
  if (filters.search?.trim()) parts.push(`Search: ${filters.search.trim()}`);
  if (filters.min_amount !== "" && filters.min_amount != null) {
    parts.push(`Min: Rs. ${formatRs(filters.min_amount)}`);
  }
  if (filters.max_amount !== "" && filters.max_amount != null) {
    parts.push(`Max: Rs. ${formatRs(filters.max_amount)}`);
  }
  return parts.join(" · ");
};

export const applyFeeDueReportFilters = (
  report,
  filters,
  { batchName } = {}
) => {
  if (!report) return null;

  const includeDue = filters.status === "all" || filters.status === "due";
  const includeOverdue =
    filters.status === "all" || filters.status === "overdue";

  const filterOpts = {
    ...filters,
    batch_name: batchName || "",
  };

  const dueSource = report.due_today || report.due_on_date || [];
  const overdueSource = report.overdue || [];

  const due_today = includeDue
    ? dueSource.filter((row) => matchesRowFilters(row, filterOpts))
    : [];
  const overdue = includeOverdue
    ? overdueSource.filter((row) => matchesRowFilters(row, filterOpts))
    : [];

  const sumAmount = (items) =>
    items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return {
    ...report,
    due_today,
    due_on_date: due_today,
    overdue,
    filter_summary: buildFilterSummary(
      filters,
      batchName,
      report.report_date_label
    ),
    summary: {
      due_today_count: due_today.length,
      due_on_date_count: due_today.length,
      overdue_count: overdue.length,
      due_today_amount: sumAmount(due_today),
      due_on_date_amount: sumAmount(due_today),
      overdue_amount: sumAmount(overdue),
      total_pending_count: due_today.length + overdue.length,
      total_pending_amount: sumAmount(due_today) + sumAmount(overdue),
    },
  };
};

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
                <Th>Roll No</Th>
                <Th>Phone</Th>
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
                  <Td>{row.roll_number || "—"}</Td>
                  <Td>{row.student_phone || "—"}</Td>
                  <Td>{row.batch_name}</Td>
                  <Td isNumeric fontWeight="semibold">
                    Rs. {formatRs(row.amount)}
                  </Td>
                  <Td>{row.due_date_label}</Td>
                  <Td>
                    {isOverdue ? (
                      <Badge colorScheme="red" variant="solid">
                        {row.overdue_days} day
                        {row.overdue_days === 1 ? "" : "s"}
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

function FeeDueReportPanel({
  report,
  loading,
  reportDate,
  onReportDateChange,
  onRefresh,
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const batches = useSelector(selectActiveStudentBatches);
  const [authToken] = useState(Cookies.get("authToken"));
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    if (authToken) {
      dispatch(fetchBatches({ authToken }));
    }
  }, [authToken, dispatch]);

  const selectedBatchName = useMemo(() => {
    if (!filters.batch_id) return "";
    return (
      batches.find((b) => String(b._id) === String(filters.batch_id))?.name ||
      ""
    );
  }, [batches, filters.batch_id]);

  const filteredReport = useMemo(
    () =>
      applyFeeDueReportFilters(report, filters, {
        batchName: selectedBatchName,
      }),
    [report, filters, selectedBatchName]
  );

  const hasActiveFilters =
    Boolean(filters.batch_id) ||
    filters.status !== "all" ||
    Boolean(filters.search?.trim()) ||
    filters.min_amount !== "" ||
    filters.max_amount !== "";

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters({ ...DEFAULT_FILTERS });

  const handleExport = async (mode) => {
    if (!filteredReport) return;
    const total =
      (filteredReport.summary?.total_pending_count || 0);
    if (total === 0 && (mode === "pdf" || mode === "excel")) {
      toast({
        title: "Nothing to export",
        description: "No records match the current filters.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setExporting(mode);
    try {
      let fileName = "";
      if (mode === "excel") {
        fileName = downloadFeeDueReportExcel(filteredReport);
      } else {
        fileName = generateFeeDueReport(
          filteredReport,
          mode === "print" ? "print" : "download"
        );
      }
      toast({
        title:
          mode === "print"
            ? "Report opened for printing"
            : mode === "excel"
              ? "Excel downloaded"
              : "PDF downloaded",
        description:
          mode === "print"
            ? "Use your browser print dialog."
            : `${fileName} · ${total} record(s)`,
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
    } finally {
      setExporting("");
    }
  };

  const summary = filteredReport?.summary || {};
  const isToday = filteredReport?.is_today !== false;
  const dueSectionTitle = isToday
    ? "Fees Due Today"
    : `Fees Due on ${filteredReport?.report_date_label || "Selected Date"}`;
  const dueEmptyText = isToday
    ? "No fees due today for the selected filters."
    : "No fees due on the selected date for these filters.";
  const dueStatLabel = isToday ? "Due Today" : "Due on Date";

  if (loading) {
    return (
      <Box mb={6}>
        <div className="h-6 w-60 dash-skeleton rounded-md mb-4" />
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-[88px] dash-skeleton rounded-xl" />
          ))}
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
          <div className="h-[220px] dash-skeleton rounded-xl" />
          <div className="h-[220px] dash-skeleton rounded-xl" />
        </SimpleGrid>
      </Box>
    );
  }

  return (
    <Box mb={8}>
      <Flex
        justify="space-between"
        align="center"
        mb={4}
        flexWrap="wrap"
        gap={3}
        w="full"
      >
        <Box>
          <Text fontSize="lg" fontWeight="semibold" color="#2D3748">
            Fee Due Report
          </Text>
          <Text fontSize="sm" color="gray.600">
            {filteredReport?.report_date_label ||
              moment().format("DD MMM YYYY")}{" "}
            · Generated {filteredReport?.generated_at || "just now"}
            {hasActiveFilters ? " · Filtered view" : ""}
          </Text>
        </Box>
        <Flex
          gap={3}
          flexWrap="wrap"
          align="flex-end"
          justify={{ base: "flex-start", md: "flex-end" }}
          flexShrink={0}
        >
          <Button size="md" borderRadius="xl" variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
          <Menu>
            <MenuButton
              as={Button}
              size="md"
              leftIcon={<Download size={16} />}
              rightIcon={<ChevronDown size={16} />}
              borderRadius="xl"
              variant="outline"
              isDisabled={!filteredReport}
              isLoading={exporting === "pdf" || exporting === "excel"}
            >
              Download
            </MenuButton>
            <MenuList borderRadius="xl" minW="180px">
              <MenuItem
                icon={<FileText size={16} />}
                onClick={() => handleExport("pdf")}
              >
                PDF
              </MenuItem>
              <MenuItem
                icon={<FileSpreadsheet size={16} />}
                onClick={() => handleExport("excel")}
              >
                Excel
              </MenuItem>
            </MenuList>
          </Menu>
          <Button
            size="md"
            leftIcon={<Printer size={16} />}
            borderRadius="xl"
            onClick={() => handleExport("print")}
            isDisabled={!filteredReport}
            isLoading={exporting === "print"}
          >
            Print
          </Button>
        </Flex>
      </Flex>

      <Box
        mb={4}
        p={4}
        borderWidth="1px"
        borderColor="#E0E8EC"
        borderRadius="xl"
        bg="#FAFBFC"
      >
        <Text fontSize="sm" fontWeight="semibold" color="#4A5568" mb={3}>
          Filters
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 6 }} spacing={3}>
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={1}>
              Report date
            </FormLabel>
            <Input
              type="date"
              size="md"
              borderRadius="xl"
              bg="white"
              value={reportDate}
              onChange={(e) => onReportDateChange(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={1}>
              Batch
            </FormLabel>
            <Select
              size="md"
              borderRadius="xl"
              bg="white"
              value={filters.batch_id}
              onChange={(e) => updateFilter("batch_id", e.target.value)}
            >
              <option value="">All batches</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={1}>
              Status
            </FormLabel>
            <Select
              size="md"
              borderRadius="xl"
              bg="white"
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              <option value="all">Due + Overdue</option>
              <option value="due">Due on date only</option>
              <option value="overdue">Overdue only</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={1}>
              Search student
            </FormLabel>
            <Input
              size="md"
              borderRadius="xl"
              bg="white"
              placeholder="Name, roll no, phone, email, batch"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={1}>
              Min amount
            </FormLabel>
            <Input
              type="number"
              min={0}
              size="md"
              borderRadius="xl"
              bg="white"
              placeholder="0"
              value={filters.min_amount}
              onChange={(e) => updateFilter("min_amount", e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={1}>
              Max amount
            </FormLabel>
            <Input
              type="number"
              min={0}
              size="md"
              borderRadius="xl"
              bg="white"
              placeholder="Any"
              value={filters.max_amount}
              onChange={(e) => updateFilter("max_amount", e.target.value)}
            />
          </FormControl>
        </SimpleGrid>
        {hasActiveFilters && (
          <Button
            mt={3}
            size="sm"
            leftIcon={<FilterX size={14} />}
            borderRadius="lg"
            variant="ghost"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        )}
      </Box>

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
          <StatHelpText mb={0}>
            Rs. {formatRs(summary.due_today_amount)}
          </StatHelpText>
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
          <StatHelpText mb={0}>
            Rs. {formatRs(summary.overdue_amount)}
          </StatHelpText>
        </Stat>
        <Stat
          px={4}
          py={4}
          borderRadius="xl"
          border="1px solid #E0E8EC"
          bg="linear-gradient(135deg, #f7fafc 0%, #ffffff 100%)"
        >
          <StatLabel color="#4A5568">Total Action Required</StatLabel>
          <StatNumber color="#2D3748">
            {summary.total_pending_count || 0}
          </StatNumber>
          <StatHelpText mb={0}>
            Rs. {formatRs(summary.total_pending_amount)}
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
        <FeeReportTable
          title={dueSectionTitle}
          rows={filteredReport?.due_today || []}
          emptyText={dueEmptyText}
          variant="today"
          statusLabel={isToday ? "Due Today" : "Due on Date"}
          onRowClick={() => navigate("/fees")}
        />
        <FeeReportTable
          title={
            isToday
              ? "Overdue Fees"
              : `Overdue as of ${
                  filteredReport?.report_date_label || "Selected Date"
                }`
          }
          rows={filteredReport?.overdue || []}
          emptyText={
            isToday
              ? "No overdue fees for the selected filters."
              : "No overdue fees as of the selected date for these filters."
          }
          variant="overdue"
          onRowClick={() => navigate("/fees")}
        />
      </SimpleGrid>
    </Box>
  );
}

export default FeeDueReportPanel;
