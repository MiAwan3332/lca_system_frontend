import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  Badge,
  Button,
  ButtonGroup,
  FormControl,
  HStack,
  Input,
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
} from "lucide-react";
import { fetchFinanceReport } from "../../Features/financeReportSlice";
import {
  fetchBatches,
  selectAllBatches,
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

  const dispatch = useDispatch();
  const { report, status } = useSelector((state) => state.financeReport);
  const batches = useSelector(selectAllBatches);
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
    loadReport({
      period: "daily",
      date: today,
      batch_id: "",
      changed_by: "",
    });
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

  return (
    <>
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div className="ml-6">
          <h1 className="text-xl font-semibold">Finance Reporting</h1>
          {report && (
            <p className="text-sm text-gray-500 mt-1">
              {periodLabel} report: {report.start_date} to {report.end_date}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 mr-6 flex-wrap justify-end">
          <ButtonGroup isAttached variant="outline" borderRadius="xl">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="lg"
                borderRadius="xl"
                colorScheme={period === option.value ? "yellow" : "gray"}
                bg={period === option.value ? "#FFCB82" : "white"}
                onClick={() => handlePeriodChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>

          <HStack spacing={3}>
            <FormControl>
              <Input
                type="date"
                w={48}
                size="lg"
                borderRadius="xl"
                value={reportDate}
                onChange={handleDateChange}
              />
            </FormControl>
            <FormControl>
              <SearchableBatchSelect
                batches={batches}
                value={formBatch}
                onChange={handleBatchChange}
                placeholder="All batches"
                width="12rem"
              />
            </FormControl>
            <FormControl>
              <SearchableUserSelect
                users={users}
                value={formChangedBy}
                onChange={handleChangedByChange}
                placeholder="Changed by"
                width="12rem"
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
          </HStack>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
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

      <div className="w-full bg-white mt-3 rounded-xl border border-[#E0E8EC]">
        <div className="px-6 py-4 border-b border-[#E0E8EC]">
          <h2 className="text-lg font-semibold">Finance Transactions</h2>
          <p className="text-sm text-gray-500">
            Includes fee income and approved expense deductions
          </p>
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
                <Th>Amount</Th>
                <Th>By</Th>
              </Tr>
            </Thead>
            <Tbody>
              {status === "loading" ? (
                <TableRowLoading
                  nOfColumns={8}
                  actions={["w-10", "w-24", "w-16", "w-24", "w-24", "w-20", "w-20", "w-24"]}
                />
              ) : report?.transactions?.length > 0 ? (
                report.transactions.map((transaction, index) => (
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
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={8}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1] py-6">
                      No transactions found for this period
                    </span>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </div>
    </>
  );
}

export default FinanceReport;
