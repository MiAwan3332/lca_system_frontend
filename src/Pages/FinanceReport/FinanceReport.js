import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  Badge,
  Button,
  ButtonGroup,
  FormControl,
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
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertTriangle,
  ArrowDown01,
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
import SearchableUserSelect from "../../Components/SearchableUserSelect";
import FinanceReportChart from "../../Components/FinanceReportChart";
import TableRowLoading from "../../Components/TableRowLoading";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import VoucherPreviewModal from "../../Components/FinanceReport/VoucherPreviewModal";
import { exportFinanceTransactionsExcel } from "../../utlls/generateFinanceTransactionsReport";
import { exportFinanceTransactionsPdf } from "../../utlls/generateFinanceTransactionsPdf";

const TRANSACTION_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "fee", label: "Fee" },
  { value: "expense", label: "Expense" },
];

const ACTION_TYPE_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "Paid", label: "Paid" },
  { value: "Created", label: "Created" },
  { value: "Discounted", label: "Discounted" },
  { value: "Deleted", label: "Deleted" },
  { value: "Expense", label: "Expense" },
];

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

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
    key: "total_pending_expenses",
    title: "Pending Expenses",
    helpText: "Awaiting approval, not yet deducted",
    icon: <Clock size={32} color="#d69e2e" />,
  },
  {
    key: "net_balance",
    title: "Net Balance",
    helpText: "Fee recovered minus approved expenses",
    icon: <Wallet size={32} color="#d69e2e" />,
  },
];

function FinanceReport() {
  const [authToken] = useState(Cookies.get("authToken"));
  const [period, setPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(moment().format("YYYY-MM-DD"));
  const [formBatch, setFormBatch] = useState("");
  const [formChangedBy, setFormChangedBy] = useState("");
  const [txnTypeFilter, setTxnTypeFilter] = useState("");
  const [txnActionFilter, setTxnActionFilter] = useState("");
  const [txnSearch, setTxnSearch] = useState("");
  const [previewTransaction, setPreviewTransaction] = useState(null);
  const [isVoucherPreviewOpen, setIsVoucherPreviewOpen] = useState(false);

  const dispatch = useDispatch();
  const { report, status } = useSelector((state) => state.financeReport);
  const batches = useSelector(selectActiveBatches);
  const users = useSelector(selectAllUsers);

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
    setFormBatch(batch_id);
    loadReport({ batch_id });
  };

  const handleChangedByChange = (changed_by) => {
    setFormChangedBy(changed_by);
    loadReport({ changed_by });
  };

  const handleClearFilters = () => {
    const today = moment().format("YYYY-MM-DD");
    setPeriod("daily");
    setReportDate(today);
    setFormBatch("");
    setFormChangedBy("");
    setTxnTypeFilter("");
    setTxnActionFilter("");
    setTxnSearch("");
    loadReport({
      period: "daily",
      date: today,
      batch_id: "",
      changed_by: "",
    });
  };

  const handleClearTxnFilters = () => {
    setTxnTypeFilter("");
    setTxnActionFilter("");
    setTxnSearch("");
  };

  const handleExportTransactions = () => {
    exportFinanceTransactionsExcel({
      transactions: filteredTransactions,
      period,
      date: reportDate,
      batchName: batches?.find((b) => b._id === formBatch)?.name,
    });
  };

  const handleExportTransactionsPdf = async () => {
    await exportFinanceTransactionsPdf({
      transactions: filteredTransactions,
      period,
      date: reportDate,
      batchName: batches?.find((b) => b._id === formBatch)?.name,
    });
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
      batch_id: "",
      changed_by: "",
    });
  }, []);

  const summary = report?.summary || {};
  const periodLabel = PERIOD_OPTIONS.find((item) => item.value === period)?.label;
  const reportSubtitle =
    report && `${periodLabel} report: ${report.start_date} to ${report.end_date}`;

  const filteredTransactions = useMemo(() => {
    const list = report?.transactions || [];
    const query = txnSearch.trim().toLowerCase();

    return list.filter((transaction) => {
      if (txnTypeFilter && transaction.type !== txnTypeFilter) {
        return false;
      }
      if (txnActionFilter && transaction.action_type !== txnActionFilter) {
        return false;
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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [report?.transactions, txnTypeFilter, txnActionFilter, txnSearch]);

  return (
    <>
      <PageHeader title="Finance Reporting" subtitle={reportSubtitle || undefined}>
        <FilterStack>
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
          <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
            <SearchableBatchSelect
              batches={batches}
              value={formBatch}
              onChange={handleBatchChange}
              placeholder="All batches"
              width="100%"
            />
          </FormControl>
          <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
            <SearchableUserSelect
              users={users}
              value={formChangedBy}
              onChange={handleChangedByChange}
              placeholder="Changed by"
              width="100%"
            />
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
      </PageHeader>

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
                Includes fee income and approved expense deductions
              </p>
            </div>
            <FilterStack className="mt-0">
              <Button
                size="sm"
                borderRadius="xl"
                variant="outline"
                onClick={handleExportTransactionsPdf}
                isDisabled={status === "loading" || filteredTransactions.length === 0}
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
              >
                <FileDown size={16} className="mr-1" />
                Export {period === "daily" ? "Daily" : "Report"}
              </Button>
              <FormControl className="responsive-input" w={{ base: "full", sm: "9rem" }}>
                <Select
                  size="md"
                  borderRadius="xl"
                  value={txnTypeFilter}
                  onChange={(e) => setTxnTypeFilter(e.target.value)}
                  placeholder="All Types"
                >
                  {TRANSACTION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl className="responsive-input" w={{ base: "full", sm: "10rem" }}>
                <Select
                  size="md"
                  borderRadius="xl"
                  value={txnActionFilter}
                  onChange={(e) => setTxnActionFilter(e.target.value)}
                  placeholder="All Actions"
                >
                  {ACTION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
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
              {(txnTypeFilter || txnActionFilter || txnSearch) && (
                <Button size="sm" borderRadius="xl" variant="outline" onClick={handleClearTxnFilters}>
                  <FilterX size={16} className="mr-1" />
                  Clear
                </Button>
              )}
            </FilterStack>
          </div>
        </div>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Details</Th>
                <Th>Category / Batch</Th>
                <Th>Action</Th>
                <Th isNumeric>Amount</Th>
                <Th>By</Th>
                <Th isNumeric>Voucher</Th>
              </Tr>
            </Thead>
            <Tbody>
              {status === "loading" ? (
                <TableRowLoading
                  nOfColumns={9}
                  actions={["w-10", "w-24", "w-16", "w-24", "w-24", "w-20", "w-20", "w-24", "w-16"]}
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
                        ? transaction.title
                        : transaction.student_name}
                    </Td>
                    <Td>{transaction.batch_name}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          transaction.action_type === "Paid"
                            ? "green"
                            : transaction.action_type === "Expense"
                              ? "red"
                              : transaction.action_type === "Created"
                                ? "blue"
                                : transaction.action_type === "Discounted"
                                  ? "orange"
                                  : "gray"
                        }
                      >
                        {transaction.action_type}
                      </Badge>
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
                  <Td colSpan={9}>
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
