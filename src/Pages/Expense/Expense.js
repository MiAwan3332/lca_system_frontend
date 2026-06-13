import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  Badge,
  FormControl,
  HStack,
  Input,
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
  Button,
} from "@chakra-ui/react";
import { FileX, FilterX, Plus, Receipt, Clock, CheckCircle, XCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import TableSearch from "../../Components/TableSearch";
import TableRowLoading from "../../Components/TableRowLoading";
import TablePagination from "../../Components/TablePagination";
import AddModal from "./AddModal";
import UpdateModal from "./UpdateModal";
import DeleteModal from "./DeleteModal";
import ApprovalActions from "./ApprovalActions";
import {
  fetchExpenses,
  selectAllExpenses,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setCategoryFilter,
  setStatusFilter,
  setStartDateFilter,
  setEndDateFilter,
  clearExpenseFilters,
} from "../../Features/expenseSlice";
import { EXPENSE_CATEGORIES } from "./expenseConstants";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];

const getStatusColor = (status) => {
  if (status === "Approved") return "green";
  if (status === "Rejected") return "red";
  return "orange";
};

function Expense() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken] = useState(Cookies.get("authToken"));
  const today = moment().format("YYYY-MM-DD");

  const expenses = useSelector(selectAllExpenses);
  const { fetchStatus, pagination, filters, pendingAmount, approvedAmount, rejectedAmount } =
    useSelector((state) => state.expenses);
  const dispatch = useDispatch();

  const loadExpenses = () => {
    dispatch(fetchExpenses({ authToken }));
  };

  const handleCategoryChange = (e) => {
    dispatch(setCategoryFilter(e.target.value));
    loadExpenses();
  };

  const handleStatusChange = (e) => {
    dispatch(setStatusFilter(e.target.value));
    loadExpenses();
  };

  const handleStartDateChange = (e) => {
    dispatch(setStartDateFilter(e.target.value));
    loadExpenses();
  };

  const handleEndDateChange = (e) => {
    dispatch(setEndDateFilter(e.target.value));
    loadExpenses();
  };

  const handleClearFilters = () => {
    dispatch(clearExpenseFilters({ start_date: today, end_date: today }));
    loadExpenses();
  };

  useEffect(() => {
    dispatch(setStartDateFilter(today));
    dispatch(setEndDateFilter(today));
    dispatch(fetchExpenses({ authToken }));
  }, []);

  const summaryCards = [
    {
      label: "Pending Approval",
      value: pendingAmount,
      help: "Awaiting finance approval",
      icon: <Clock size={28} color="#d69e2e" />,
    },
    {
      label: "Approved Expenses",
      value: approvedAmount,
      help: "Deducted from finance after approval",
      icon: <CheckCircle size={28} color="#d69e2e" />,
    },
    {
      label: "Rejected Expenses",
      value: rejectedAmount,
      help: "Not deducted from finance",
      icon: <XCircle size={28} color="#d69e2e" />,
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="ml-6">
          <h1 className="text-xl font-semibold text-nowrap">Expense Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Daily expenses require approval before deduction from finance
          </p>
        </div>
        <div className="w-full flex items-center justify-end gap-3 flex-wrap">
          <TableSearch setQueryFilter={setQueryFilter} method={fetchExpenses} />
          <HStack spacing={3}>
            <FormControl>
              <Select
                placeholder="All Statuses"
                w={40}
                size="lg"
                borderRadius="xl"
                value={filters.status}
                onChange={handleStatusChange}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <Select
                placeholder="All Categories"
                w={40}
                size="lg"
                borderRadius="xl"
                value={filters.category}
                onChange={handleCategoryChange}
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <Input
                type="date"
                w={40}
                size="lg"
                borderRadius="xl"
                value={filters.start_date}
                onChange={handleStartDateChange}
              />
            </FormControl>
            <FormControl>
              <Input
                type="date"
                w={40}
                size="lg"
                borderRadius="xl"
                value={filters.end_date}
                onChange={handleEndDateChange}
              />
            </FormControl>
            <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
              <FilterX className="h-4 w-4" />
            </Button>
          </HStack>
          <button
            className="bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
            onClick={onAddOpen}
          >
            <Plus size={24} />
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 ml-6 mr-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-[#E0E8EC] p-6 flex justify-between items-start"
          >
            <Stat>
              <StatLabel>{card.label}</StatLabel>
              {fetchStatus === "loading" ? (
                <div className="animate-pulse h-4 my-3 w-24 bg-gray-300 rounded-lg" />
              ) : (
                <StatNumber>{card.value}</StatNumber>
              )}
              <StatHelpText>{card.help}</StatHelpText>
            </Stat>
            <div className="p-2 bg-[#d69e2e]/30 rounded-lg">{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="w-full bg-white mt-3 rounded-xl border border-[#E0E8EC]">
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th data-searchable>Title</Th>
                <Th>Category</Th>
                <Th>Amount</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th>Added By</Th>
                <Th>Approved By</Th>
                <Th isNumeric>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={9}
                  actions={["w-10", "w-24", "w-20", "w-16", "w-20", "w-20", "w-20", "w-20", "w-32"]}
                />
              ) : expenses.length === 0 ? (
                <Tr>
                  <Td colSpan={9}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1] py-6">
                      <FileX />
                      No expense records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                expenses.map((expense, index) => (
                  <Tr key={expense._id}>
                    <Td>{index + 1}</Td>
                    <Td>
                      <div className="font-medium">{expense.title}</div>
                      {expense.description && (
                        <div className="text-sm text-gray-500">{expense.description}</div>
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme="yellow">{expense.category}</Badge>
                    </Td>
                    <Td>{expense.amount}</Td>
                    <Td>{expense.expense_date}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(expense.status || "Pending")}>
                        {expense.status || "Pending"}
                      </Badge>
                    </Td>
                    <Td>{expense.created_by?.name || "N/A"}</Td>
                    <Td>{expense.approved_by?.name || "-"}</Td>
                    <Td isNumeric>
                      <div className="flex flex-col items-end gap-2">
                        <ApprovalActions expense={expense} onUpdated={loadExpenses} />
                        <div className="flex items-center gap-1">
                          {(expense.status === "Pending" || !expense.status) && (
                            <>
                              <UpdateModal expense={expense} onUpdated={loadExpenses} />
                              <DeleteModal expenseId={expense._id} onDeleted={loadExpenses} />
                            </>
                          )}
                        </div>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </div>

      {fetchStatus !== "loading" && (
        <TablePagination
          pagination={pagination}
          setLimitFilter={setLimitFilter}
          setPageFilter={setPageFilter}
          method={fetchExpenses}
        />
      )}

      <AddModal isOpen={isAddOpen} onClose={onAddClose} onAdded={loadExpenses} />
    </>
  );
}

export default Expense;
