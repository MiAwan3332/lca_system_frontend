import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  Badge,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertTriangle,
  ArrowDown01,
  Banknote,
  CircleDollarSign,
  DollarSign,
  FilterX,
  HandCoins,
  RotateCw,
  Receipt,
  Wallet,
  Clock,
  Search,
  FileText,
  FileDown,
  Printer,
  Smartphone,
} from "lucide-react";
import { fetchFinanceReport } from "../../Features/financeReportSlice";
import {
  fetchBatches,
  selectActiveBatches,
  setLimitFilter,
} from "../../Features/batchSlice";
import {
  fetchUsers,
  selectAllUsers,
  setLimitFilter as setUserLimitFilter,
} from "../../Features/userSlice";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import FilterMultiSelect from "../../Components/FilterMultiSelect";
import FinanceReportChart from "../../Components/FinanceReportChart";
import TableRowLoading from "../../Components/TableRowLoading";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import VoucherPreviewModal from "../../Components/FinanceReport/VoucherPreviewModal";
import { exportFinanceTransactionsExcel } from "../../utlls/generateFinanceTransactionsReport";
import { exportFinanceTransactionsPdf } from "../../utlls/generateFinanceTransactionsPdf";

const ALL_ADMIN_USERS_VALUE = "";

const isExcludedExportRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  return (
    normalized === "student" ||
    normalized === "teacher" ||
    normalized === "secrateadmin" ||
    normalized === "secrate admin"
  );
};

const TRANSACTION_TYPE_OPTIONS = [
  { value: "fee", label: "Fee" },
  { value: "expense", label: "Expense" },
];

const ACTION_TYPE_OPTIONS = [
  { value: "Paid", label: "Paid" },
  { value: "Pending", label: "Pending" },
  { value: "Expense", label: "Expense" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Online Payment", label: "Online Payment" },
  { value: "Online", label: "Online (legacy)" },
];

const PENDING_DUES_OPTIONS = [
  { value: "pending", label: "Pending Dues" },
  { value: "cleared", label: "No Pending / Paid" },
];

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const formatRs = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const SUMMARY_CARDS = [
  {
    key: "total_fee_created",
    title: "Fee Created",
    helpText: "Total fees created in period",
    icon: <DollarSign size={32} color="#d69e2e" />,
  },
  {
    key: "total_fee_recovered",
    title: "Fee Recovered",
    helpText: "Total payments received in period",
    icon: <HandCoins size={32} color="#d69e2e" />,
  },
  {
    key: "total_fee_discounted",
    title: "Fee Discounted",
    helpText: "Total discounts applied in period",
    icon: <CircleDollarSign size={32} color="#d69e2e" />,
  },
  {
    key: "total_fee_pending",
    title: "Net Pending",
    helpText: "Created minus recovered in period",
    icon: <ArrowDown01 size={32} color="#d69e2e" />,
  },
  {
    key: "total_pending_amount",
    title: "Outstanding Amount",
    helpText: "Current pending fee balance",
    icon: <ArrowDown01 size={32} color="#d69e2e" />,
  },
  {
    key: "total_fee_defaulters",
    title: "Fee Defaulters",
    helpText: "Students with overdue pending fees",
    icon: <AlertTriangle size={32} color="#d69e2e" />,
  },
  {
    key: "total_approved_expenses",
    title: "Approved Expenses",
    helpText: "Deducted from finance after approval",
    icon: <Receipt size={32} color="#d69e2e" />,
  },
  {
    key: "total_fee_refunded",
    title: "Refunds",
    helpText: "Student refunds deducted from finance",
    icon: <HandCoins size={32} color="#d69e2e" />,
  },
  {
    key: "total_pending_expenses",
    title: "Pending Expenses",
    helpText: "Awaiting approval, not yet deducted",
    icon: <Clock size={32} color="#d69e2e" />,
  },
  {
    key: "net_balance",
    title: "Net Balance",
    helpText: "Recovered minus expenses and refunds",
    icon: <Wallet size={32} color="#d69e2e" />,
  },
];

function FinanceReport() {
  const toast = useToast();
  const [authToken] = useState(Cookies.get("authToken"));
  const [period, setPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(moment().format("YYYY-MM-DD"));
  const [formBatch, setFormBatch] = useState([]);
  const [formChangedBy, setFormChangedBy] = useState(ALL_ADMIN_USERS_VALUE);
  const [txnTypeFilter, setTxnTypeFilter] = useState([]);
  const [txnActionFilter, setTxnActionFilter] = useState([]);
  const [txnPaymentMethodFilter, setTxnPaymentMethodFilter] = useState([]);
  const [txnPendingDuesFilter, setTxnPendingDuesFilter] = useState([]);
  const [txnSearch, setTxnSearch] = useState("");
  const [previewTransaction, setPreviewTransaction] = useState(null);
  const [isVoucherPreviewOpen, setIsVoucherPreviewOpen] = useState(false);

  const dispatch = useDispatch();
  const { report, status } = useSelector((state) => state.financeReport);
  const batches = useSelector(selectActiveBatches);
  const users = useSelector(selectAllUsers);

  const adminUsers = useMemo(
    () =>
      [...(users || [])]
        .filter((user) => !isExcludedExportRole(user.role))
        .sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", undefined, {
            sensitivity: "base",
          })
        ),
    [users]
  );

  const selectedAdminUser = useMemo(
    () =>
      adminUsers.find(
        (user) => String(user._id) === String(formChangedBy)
      ) || null,
    [adminUsers, formChangedBy]
  );

  const collectedByLabel = selectedAdminUser?.name || "All admin users";

  const loadReport = (filters = {}) => {
    dispatch(
      fetchFinanceReport({
        authToken,
        period: filters.period ?? period,
        date: filters.date ?? reportDate,
        batch_id: filters.batch_id ?? formBatch,
        changed_by: filters.changed_by ?? formChangedBy,
      })
    );
  };

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
    loadReport({ period: nextPeriod });
  };

  const handleDateChange = (e) => {
    const nextDate = e.target.value;
    setReportDate(nextDate);
    loadReport({ date: nextDate });
  };

  const handleBatchChange = (batch_id) => {
    const next = Array.isArray(batch_id) ? batch_id : [];
    setFormBatch(next);
    loadReport({ batch_id: next });
  };

  const handleAdminUserChange = (changed_by) => {
    const next = changed_by || ALL_ADMIN_USERS_VALUE;
    setFormChangedBy(next);
    loadReport({ changed_by: next });
  };

  const handleClearFilters = () => {
    const today = moment().format("YYYY-MM-DD");
    setPeriod("daily");
    setReportDate(today);
    setFormBatch([]);
    setFormChangedBy(ALL_ADMIN_USERS_VALUE);
    setTxnTypeFilter([]);
    setTxnActionFilter([]);
    setTxnPaymentMethodFilter([]);
    setTxnPendingDuesFilter([]);
    setTxnSearch("");
    loadReport({
      period: "daily",
      date: today,
      batch_id: [],
      changed_by: ALL_ADMIN_USERS_VALUE,
    });
  };

  const handleClearTxnFilters = () => {
    setTxnTypeFilter([]);
    setTxnActionFilter([]);
    setTxnPaymentMethodFilter([]);
    setTxnPendingDuesFilter([]);
    setTxnSearch("");
  };

  const selectedBatchNames = useMemo(
    () =>
      (batches || [])
        .filter((batch) => formBatch.map(String).includes(String(batch._id)))
        .map((batch) => batch.name)
        .filter(Boolean),
    [batches, formBatch]
  );

  const getExportPayload = () => ({
    transactions: filteredTransactions,
    period,
    date: reportDate,
    batchName: selectedBatchNames.join(", ") || undefined,
    collectedBy: collectedByLabel,
    totalCash: summary.total_cash,
    totalOnline: summary.total_online,
    batchWise: summary.batch_wise || [],
  });

  const handleExportTransactions = () => {
    exportFinanceTransactionsExcel(getExportPayload());
  };

  const handleExportTransactionsPdf = async () => {
    try {
      await exportFinanceTransactionsPdf({
        ...getExportPayload(),
        mode: "download",
      });
    } catch (error) {
      toast({
        title: "Could not export PDF",
        description: error.message || "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePrintTransactions = async () => {
    try {
      await exportFinanceTransactionsPdf({
        ...getExportPayload(),
        mode: "print",
      });
      toast({
        title: "Report opened for printing",
        description: "Use your browser print dialog to finish.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not print report",
        description: error.message || "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleGenerateVoucher = (transaction) => {
    setPreviewTransaction(transaction);
    setIsVoucherPreviewOpen(true);
  };

  const handleCloseVoucherPreview = () => {
    setIsVoucherPreviewOpen(false);
    setPreviewTransaction(null);
  };

  useEffect(() => {
    dispatch(setLimitFilter(100));
    dispatch(setUserLimitFilter(100));
    dispatch(fetchBatches({ authToken }));
    dispatch(fetchUsers({ authToken }));
    loadReport({
      period: "daily",
      date: moment().format("YYYY-MM-DD"),
      batch_id: [],
      changed_by: ALL_ADMIN_USERS_VALUE,
    });
  }, []);

  const summary = report?.summary || {};
  const batchWiseCollections = summary.batch_wise || [];
  const periodLabel = PERIOD_OPTIONS.find((item) => item.value === period)?.label;
  const reportSubtitle =
    report && `${periodLabel} report: ${report.start_date} to ${report.end_date}`;

  const filteredTransactions = useMemo(() => {
    const list = report?.transactions || [];
    const query = txnSearch.trim().toLowerCase();
    const typeSet = new Set(txnTypeFilter.map(String));
    const actionSet = new Set(txnActionFilter.map(String));
    const paymentSet = new Set(txnPaymentMethodFilter.map(String));
    const duesSet = new Set(txnPendingDuesFilter.map(String));
    const selectedAdminName = selectedAdminUser?.name?.trim().toLowerCase() || "";

    return list.filter((transaction) => {
      if (formChangedBy && selectedAdminName) {
        const by = String(transaction.action_by || "").trim().toLowerCase();
        if (transaction.type === "expense" && by !== selectedAdminName) {
          return false;
        }
      }
      if (typeSet.size && !typeSet.has(String(transaction.type))) {
        return false;
      }
      if (actionSet.size && !actionSet.has(String(transaction.action_type))) {
        return false;
      }
      if (paymentSet.size) {
        const method =
          transaction.payment_method ||
          (transaction.action_type === "Paid" ? "Cash" : "");
        if (!paymentSet.has(String(method))) {
          return false;
        }
      }
      if (duesSet.size) {
        const hasPending =
          transaction.has_pending_dues === true ||
          transaction.action_type === "Pending" ||
          (transaction.fee_status === "Pending" &&
            Number(transaction.fee_pending_amount) > 0);
        const isClearedFee =
          transaction.type === "fee" &&
          transaction.has_pending_dues !== true &&
          transaction.action_type !== "Pending" &&
          transaction.fee_status !== "Pending";

        const matchesPending = duesSet.has("pending") && hasPending;
        const matchesCleared = duesSet.has("cleared") && isClearedFee;
        if (!matchesPending && !matchesCleared) {
          return false;
        }
      }
      if (!query) return true;

      const haystack = [
        transaction.student_name,
        transaction.title,
        transaction.batch_name,
        transaction.category,
        transaction.action_by,
        transaction.action_type,
        transaction.type,
        transaction.payment_method,
        transaction.fee_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [
    report?.transactions,
    txnTypeFilter,
    txnActionFilter,
    txnPaymentMethodFilter,
    txnPendingDuesFilter,
    txnSearch,
    formChangedBy,
    selectedAdminUser,
  ]);

  return (
    <>
      <PageHeader title="Finance Reporting" subtitle={reportSubtitle || undefined} />

      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        <div className="period-toggle overflow-x-auto pb-1">
          <ButtonGroup isAttached variant="outline" borderRadius="xl" flexWrap="wrap">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size={{ base: "sm", md: "lg" }}
                borderRadius="xl"
                colorScheme={period === option.value ? "yellow" : "gray"}
                bg={period === option.value ? "#FFCB82" : "white"}
                onClick={() => handlePeriodChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>
        <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
          <Input
            type="date"
            size="lg"
            borderRadius="xl"
            value={reportDate}
            onChange={handleDateChange}
          />
        </FormControl>
        <FormControl className="responsive-input" w={{ base: "full", md: "14rem" }}>
          <SearchableBatchSelect
            batches={batches}
            value={formBatch}
            onChange={handleBatchChange}
            placeholder="All batches"
            width="100%"
            isMulti
          />
        </FormControl>
        <FormControl className="responsive-input" w={{ base: "full", md: "14rem" }}>
          <Select
            size="lg"
            borderRadius="xl"
            value={formChangedBy}
            onChange={(e) => handleAdminUserChange(e.target.value)}
          >
            <option value={ALL_ADMIN_USERS_VALUE}>All admin users</option>
            {adminUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
                {user.role ? ` (${user.role})` : ""}
              </option>
            ))}
          </Select>
        </FormControl>
        <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
          <FilterX className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          p={4}
          borderRadius="xl"
          onClick={() => loadReport()}
          className={status === "loading" ? "animate-spin" : ""}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </FilterStack>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
        {SUMMARY_CARDS.map((item) => (
          <div key={item.key} className="w-full">
            <div className="bg-white rounded-xl border border-[#E0E8EC] p-6 flex justify-between items-start">
              <Stat>
                <StatLabel>{item.title}</StatLabel>
                {status === "loading" ? (
                  <div className="animate-pulse h-4 my-3 w-20 bg-gray-300 rounded-lg" />
                ) : (
                  <StatNumber>
                    {item.key === "total_pending_amount" ||
                    item.key === "total_fee_defaulters"
                      ? formChangedBy
                        ? "-"
                        : summary[item.key] ?? 0
                      : summary[item.key] ?? 0}
                  </StatNumber>
                )}
                <StatHelpText>{item.helpText}</StatHelpText>
              </Stat>
              <div className="p-2 bg-[#d69e2e]/30 rounded-lg">{item.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <FinanceReportChart
        breakdown={report?.breakdown || []}
        title={`${periodLabel} Finance Overview`}
      />

      <DataTableShell className="mt-3">
        <div className="px-4 sm:px-6 py-4 border-b border-[#E0E8EC]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold dash-text">Finance Transactions</h2>
              <p className="text-sm dash-text-muted">
                {formChangedBy
                  ? `Fee collections by ${collectedByLabel}`
                  : "Includes fee income and approved expense deductions for all admin users"}
              </p>
            </div>
            <FilterStack className="filter-stack--actions mt-0">
              <FormControl
                className="responsive-input"
                w={{ base: "full", sm: "14rem" }}
              >
                <FormLabel fontSize="xs" mb={1} color="gray.500">
                  Admin user (export)
                </FormLabel>
                <Select
                  size="md"
                  borderRadius="xl"
                  value={formChangedBy}
                  onChange={(e) => handleAdminUserChange(e.target.value)}
                >
                  <option value={ALL_ADMIN_USERS_VALUE}>All admin users</option>
                  {adminUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                      {user.role ? ` (${user.role})` : ""}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <Button
                size="sm"
                borderRadius="xl"
                variant="outline"
                onClick={handlePrintTransactions}
                isDisabled={status === "loading" || filteredTransactions.length === 0}
                alignSelf={{ base: "stretch", sm: "flex-end" }}
              >
                <Printer size={16} className="mr-1" />
                Print
              </Button>
              <Button
                size="sm"
                borderRadius="xl"
                variant="outline"
                onClick={handleExportTransactionsPdf}
                isDisabled={status === "loading" || filteredTransactions.length === 0}
                alignSelf={{ base: "stretch", sm: "flex-end" }}
              >
                <FileText size={16} className="mr-1" />
                Export PDF
              </Button>
              <Button
                size="sm"
                borderRadius="xl"
                variant="outline"
                onClick={handleExportTransactions}
                isDisabled={status === "loading" || filteredTransactions.length === 0}
                alignSelf={{ base: "stretch", sm: "flex-end" }}
              >
                <FileDown size={16} className="mr-1" />
                Export {period === "daily" ? "Daily" : "Report"}
              </Button>
              <FormControl className="responsive-input" w={{ base: "full", sm: "9rem" }}>
                <FilterMultiSelect
                  options={TRANSACTION_TYPE_OPTIONS}
                  value={txnTypeFilter}
                  onChange={setTxnTypeFilter}
                  placeholder="All Types"
                />
              </FormControl>
              <FormControl className="responsive-input" w={{ base: "full", sm: "10rem" }}>
                <FilterMultiSelect
                  options={ACTION_TYPE_OPTIONS}
                  value={txnActionFilter}
                  onChange={setTxnActionFilter}
                  placeholder="All Actions"
                />
              </FormControl>
              <FormControl className="responsive-input" w={{ base: "full", sm: "10rem" }}>
                <FilterMultiSelect
                  options={PAYMENT_METHOD_OPTIONS}
                  value={txnPaymentMethodFilter}
                  onChange={setTxnPaymentMethodFilter}
                  placeholder="All Payments"
                />
              </FormControl>
              <FormControl className="responsive-input" w={{ base: "full", sm: "11rem" }}>
                <FilterMultiSelect
                  options={PENDING_DUES_OPTIONS}
                  value={txnPendingDuesFilter}
                  onChange={setTxnPendingDuesFilter}
                  placeholder="All Dues"
                />
              </FormControl>
              <FormControl className="responsive-input" w={{ base: "full", sm: "12rem" }}>
                <InputGroup size="md">
                  <InputLeftElement pointerEvents="none">
                    <Search size={16} color="#94a3b8" />
                  </InputLeftElement>
                  <Input
                    borderRadius="xl"
                    placeholder="Search transactions..."
                    value={txnSearch}
                    onChange={(e) => setTxnSearch(e.target.value)}
                  />
                </InputGroup>
              </FormControl>
              {(txnTypeFilter.length > 0 ||
                txnActionFilter.length > 0 ||
                txnPaymentMethodFilter.length > 0 ||
                txnPendingDuesFilter.length > 0 ||
                txnSearch) && (
                <Button size="sm" borderRadius="xl" variant="outline" onClick={handleClearTxnFilters}>
                  <FilterX size={16} className="mr-1" />
                  Clear
                </Button>
              )}
            </FilterStack>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div className="bg-[#F8FAFC] rounded-xl border border-[#E0E8EC] p-4 flex justify-between items-start">
              <Stat>
                <StatLabel>Total Cash</StatLabel>
                {status === "loading" ? (
                  <div className="animate-pulse h-4 my-3 w-24 bg-gray-300 rounded-lg" />
                ) : (
                  <StatNumber fontSize="xl">{formatRs(summary.total_cash)}</StatNumber>
                )}
                <StatHelpText>Cash collections in this period</StatHelpText>
              </Stat>
              <div className="p-2 bg-[#d69e2e]/30 rounded-lg">
                <Banknote size={28} color="#d69e2e" />
              </div>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl border border-[#E0E8EC] p-4 flex justify-between items-start">
              <Stat>
                <StatLabel>Total Online</StatLabel>
                {status === "loading" ? (
                  <div className="animate-pulse h-4 my-3 w-24 bg-gray-300 rounded-lg" />
                ) : (
                  <StatNumber fontSize="xl">{formatRs(summary.total_online)}</StatNumber>
                )}
                <StatHelpText>Online / bank collections in this period</StatHelpText>
              </Stat>
              <div className="p-2 bg-[#d69e2e]/30 rounded-lg">
                <Smartphone size={28} color="#d69e2e" />
              </div>
            </div>
          </div>

          {(status === "loading" || batchWiseCollections.length > 0) && (
            <div className="mt-4">
              <Text fontSize="sm" fontWeight="600" color="gray.600" mb={2}>
                Batch-wise collections
              </Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {status === "loading"
                  ? [1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="bg-white rounded-xl border border-[#E0E8EC] p-4"
                      >
                        <div className="animate-pulse h-4 w-28 bg-gray-300 rounded-lg mb-3" />
                        <div className="animate-pulse h-5 w-20 bg-gray-300 rounded-lg" />
                      </div>
                    ))
                  : batchWiseCollections.map((batch) => (
                      <div
                        key={batch.batch_id || batch.batch_name}
                        className="bg-white rounded-xl border border-[#E0E8EC] p-4"
                      >
                        <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                          {batch.batch_name || "Unassigned"}
                        </Text>
                        <Text fontSize="lg" fontWeight="700" mt={1}>
                          {formatRs(batch.total)}
                        </Text>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                          <span>Cash: {formatRs(batch.total_cash)}</span>
                          <span>Online: {formatRs(batch.total_online)}</span>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Student</Th>
                <Th>Category / Batch</Th>
                <Th>Action</Th>
                <Th>Payment</Th>
                <Th isNumeric>Amount</Th>
                <Th>By</Th>
                <Th isNumeric>Voucher</Th>
              </Tr>
            </Thead>
            <Tbody>
              {status === "loading" ? (
                <TableRowLoading
                  nOfColumns={10}
                  actions={["w-10", "w-24", "w-16", "w-28", "w-24", "w-20", "w-16", "w-20", "w-24", "w-16"]}
                />
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
                  <Tr key={`${transaction.type}-${transaction._id}`}>
                    <Td>{index + 1}</Td>
                    <Td>
                      {moment(transaction.action_date).format("DD/MM/YYYY HH:mm")}
                    </Td>
                    <Td>
                      <Badge colorScheme={transaction.type === "expense" ? "red" : "blue"}>
                        {transaction.type === "expense" ? "Expense" : "Fee"}
                      </Badge>
                    </Td>
                    <Td>
                      {transaction.type === "expense"
                        ? transaction.title || "—"
                        : transaction.student_name || "—"}
                    </Td>
                    <Td>{transaction.batch_name}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          transaction.action_type === "Paid"
                            ? "green"
                            : transaction.action_type === "Expense"
                              ? "red"
                              : transaction.action_type === "Pending"
                                ? "yellow"
                                : "gray"
                        }
                      >
                        {transaction.action_type}
                      </Badge>
                    </Td>
                    <Td>
                      {transaction.payment_method ||
                      (transaction.action_type === "Paid" ? "Cash" : null) ? (
                        <Badge
                          colorScheme={
                            ["Online", "Online Payment"].includes(
                              transaction.payment_method || ""
                            )
                              ? "purple"
                              : "teal"
                          }
                          borderRadius="full"
                        >
                          {transaction.payment_method ||
                            (transaction.action_type === "Paid" ? "Cash" : "—")}
                        </Badge>
                      ) : (
                        <Text as="span" color="gray.400">
                          —
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <span
                        className={
                          transaction.type === "expense" ? "text-red-500 font-medium" : ""
                        }
                      >
                        {transaction.type === "expense"
                          ? `-${transaction.action_amount ?? transaction.amount}`
                          : transaction.action_amount ?? transaction.amount}
                      </span>
                    </Td>
                    <Td>{transaction.action_by}</Td>
                    <Td isNumeric>
                      <IconButton
                        aria-label="Generate voucher"
                        icon={<FileText size={18} />}
                        size="sm"
                        borderRadius="xl"
                        variant="outline"
                        title="Generate voucher"
                        onClick={() => handleGenerateVoucher(transaction)}
                        _hover={{ bg: "#FFCB82", borderColor: "#FFCB82", color: "#85652D" }}
                      />
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={10}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1] py-6">
                      {report?.transactions?.length > 0
                        ? "No transactions match the selected filters"
                        : "No transactions found for this period"}
                    </span>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </DataTableShell>

      <VoucherPreviewModal
        isOpen={isVoucherPreviewOpen}
        onClose={handleCloseVoucherPreview}
        transaction={previewTransaction}
      />
    </>
  );
}

export default FinanceReport;
