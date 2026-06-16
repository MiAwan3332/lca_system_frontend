import {
  IconButton,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  HStack,
  FormControl,
  Input,
  Button,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import { fetchStatistics } from "../Features/statisticsSlice";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import {
  ArrowDown01,
  Box,
  Boxes,
  DollarSign,
  FileBox,
  GraduationCap,
  HandCoins,
  RotateCw,
  AlertTriangle,
  FilterX,
  Receipt,
  Wallet,
  Clock,
} from "lucide-react";
import MonthlyColumnChart from "../Components/MonthlyStudentChart";
import BatchChart from "../Components/BatchChart";
import SearchableBatchSelect from "../Components/SearchableBatchSelect";
import DashboardDonutChart from "../Components/DashboardDonutChart";
import DashboardAreaChart from "../Components/DashboardAreaChart";
import {
  fetchBatches,
  selectAllBatches,
  setLimitFilter,
} from "../Features/batchSlice";
import { isStudentViewOnly } from "../utlls/studentAccess";

function Home() {
  const viewOnly = isStudentViewOnly();

  const studentDashboardData = [
    {
      key: "batch_name",
      title: "My Batch",
      helpText: "Assigned batch",
      icon: <Box size={32} color="#d69e2e" />,
    },
    {
      key: "total_fee_record",
      title: "Total Fee",
      helpText: "Your total fee amount",
      icon: <DollarSign size={32} color="#d69e2e" />,
    },
    {
      key: "total_fee_recovered",
      title: "Fee Paid",
      helpText: "Amount you have paid",
      icon: <HandCoins size={32} color="#d69e2e" />,
    },
    {
      key: "total_fee_pending",
      title: "Fee Pending",
      helpText: "Outstanding fee balance",
      icon: <ArrowDown01 size={32} color="#d69e2e" />,
    },
    {
      key: "attendance_records_count",
      title: "Attendance Records",
      helpText: "Your attendance entries",
      icon: <GraduationCap size={32} color="#d69e2e" />,
    },
  ];

  const data = [
    {
      key: "current_batches_count",
      title: "Current Batches",
      helpText: "Number of current batches",
      icon: <Box size={32} color="#d69e2e" />,
      permissions: ["view_current_batches"],
    },
    {
      key: "previous_batches_count",
      title: "Previous Batches",
      helpText: "Number of previous batches",
      icon: <FileBox size={32} color="#d69e2e" />,
      permissions: ["view_previous_batches"],
    },
    {
      key: "total_batches_count",
      title: "Total Batches",
      helpText: "Total number of batches",
      icon: <Boxes size={32} color="#d69e2e" />,
      permissions: ["view_total_batches"],
    },
    {
      key: "total_enrolled_students_count",
      title: "Total Enrolled Students",
      helpText: "Total number of enrolled students",
      icon: <GraduationCap size={32} color="#d69e2e" />,
      permissions: ["view_total_enrolled_students"],
    },
    {
      key: "total_fee_record",
      title: "Total Fee Record",
      helpText: "Total fee record of all batches",
      icon: <DollarSign size={32} color="#d69e2e" />,
      permissions: ["view_total_fee_record"],
    },
    {
      key: "total_fee_recovered",
      title: "Total Fee Recovered",
      helpText: "Total fee recovered from all students",
      icon: <HandCoins size={32} color="#d69e2e" />,
      permissions: ["view_total_fee_recovered"],
    },
    {
      key: "total_fee_pending",
      title: "Total Fee Pending",
      helpText: "Total fee pending from all students",
      icon: <ArrowDown01 size={32} color="#d69e2e" />,
      permissions: ["view_total_fee_pending"],
    },
    {
      key: "total_fee_defaulters",
      title: "Total Fee Defaulters",
      helpText: "Total fee pending students",
      icon: <AlertTriangle size={32} color="#d69e2e" />,
      permissions: ["view_total_fee_defaulters"],
    },
    {
      key: "total_approved_expenses",
      title: "Approved Expenses",
      helpText: "Deducted from finance after approval",
      icon: <Receipt size={32} color="#d69e2e" />,
      permissions: ["view_total_fee_recovered"],
    },
    {
      key: "total_pending_expenses",
      title: "Pending Expenses",
      helpText: "Awaiting approval",
      icon: <Clock size={32} color="#d69e2e" />,
      permissions: ["view_total_fee_recovered"],
    },
    {
      key: "net_balance",
      title: "Net Balance",
      helpText: "Fee recovered minus approved expenses",
      icon: <Wallet size={32} color="#d69e2e" />,
      permissions: ["view_total_fee_recovered"],
    },
  ];

  const [statistics, setStatistics] = React.useState({});
  const [authToken] = React.useState(Cookies.get("authToken"));
  const [formBatch, setFormBatch] = React.useState("");
  const [formStartDate, setFormStartDate] = React.useState("");
  const [formEndDate, setFormEndDate] = React.useState("");

  const { status } = useSelector((state) => state.statistics);
  const batches = useSelector(selectAllBatches);
  const dispatch = useDispatch();

  const dashboardFilters = {
    batch_id: formBatch,
    start_date: formStartDate,
    end_date: formEndDate,
  };

  const chartData = statistics.chart_data || {};
  const loading = status === "loading";

  const loadStatistics = (filters = dashboardFilters) => {
    dispatch(fetchStatistics({ authToken, ...filters }))
      .unwrap()
      .then((response) => {
        setStatistics(response);
      });
  };

  const handleReload = () => {
    loadStatistics();
  };

  const handleFormBatchChange = (batch_id) => {
    setFormBatch(batch_id);
    loadStatistics({
      batch_id,
      start_date: formStartDate,
      end_date: formEndDate,
    });
  };

  const handleFormStartDateChange = (e) => {
    const start_date = e.target.value;
    setFormStartDate(start_date);
    loadStatistics({
      batch_id: formBatch,
      start_date,
      end_date: formEndDate,
    });
  };

  const handleFormEndDateChange = (e) => {
    const end_date = e.target.value;
    setFormEndDate(end_date);
    loadStatistics({
      batch_id: formBatch,
      start_date: formStartDate,
      end_date,
    });
  };

  const handleClearFilters = () => {
    setFormBatch("");
    setFormStartDate("");
    setFormEndDate("");
    loadStatistics({
      batch_id: "",
      start_date: "",
      end_date: "",
    });
  };

  const hasPermission = (permissionsToCheck) => {
    const storedPermissions = sessionStorage.getItem("permissions");
    const permissionsArray = storedPermissions
      ? storedPermissions.split(",")
      : [];
    return permissionsToCheck.some((permission) =>
      permissionsArray.includes(permission)
    );
  };

  useEffect(() => {
    if (!viewOnly) {
      dispatch(setLimitFilter(100));
      dispatch(fetchBatches({ authToken }));
    }
    loadStatistics({
      batch_id: "",
      start_date: "",
      end_date: "",
    });
  }, []);

  const dashboardCards = viewOnly ? studentDashboardData : data;

  return (
    <>
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div className="ml-6 mb-5">
          <h1 className="text-xl font-semibold">
            {viewOnly
              ? `Welcome, ${statistics.student_name || "Student"}`
              : "Welcome to LCA System"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {viewOnly
              ? "Your personal dashboard"
              : "Analytics dashboard with charts and key statistics"}
          </p>
        </div>
        {!viewOnly && (
        <div className="flex items-center gap-3 mr-6 mb-5 flex-wrap justify-end">
          <HStack spacing={3}>
            <FormControl>
              <SearchableBatchSelect
                batches={batches}
                value={formBatch}
                onChange={handleFormBatchChange}
                placeholder="Search or select batch"
                width="12rem"
              />
            </FormControl>
            <FormControl>
              <Input
                type="date"
                w={48}
                size="lg"
                borderRadius="xl"
                placeholder="Start Date"
                value={formStartDate}
                onChange={handleFormStartDateChange}
              />
            </FormControl>
            <FormControl>
              <Input
                type="date"
                w={48}
                size="lg"
                borderRadius="xl"
                placeholder="End Date"
                value={formEndDate}
                onChange={handleFormEndDateChange}
              />
            </FormControl>
            <Button
              size="icon"
              p={4}
              borderRadius="xl"
              onClick={handleClearFilters}
            >
              <FilterX className="h-4 w-4" />
            </Button>
            <IconButton
              icon={<RotateCw size={18} />}
              onClick={handleReload}
              className={`!rounded-full !text-gray-600 ${
                status === "loading" ? "animate-spin" : ""
              }`}
            />
          </HStack>
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 px-1">
        {dashboardCards.map((item, index) => (
          (viewOnly || hasPermission(item.permissions)) && (
            <div className="w-full" key={index}>
              <div className="bg-white rounded-xl border border-[#E0E8EC] p-6 flex justify-between items-start">
                <Stat>
                  <StatLabel>{item.title}</StatLabel>
                  {loading ? (
                    <div className="animate-pulse h-4 my-3 w-20 bg-gray-300 rounded-lg" />
                  ) : (
                    <StatNumber>{statistics[item.key] ?? 0}</StatNumber>
                  )}
                  <StatHelpText>{item.helpText}</StatHelpText>
                </Stat>
                <div className="p-2 bg-[#d69e2e]/30 rounded-lg">{item.icon}</div>
              </div>
            </div>
          )
        ))}
      </div>

      {!viewOnly && (
      <>
      <div className="mt-6 mb-2 ml-2">
        <h2 className="text-lg font-semibold">Graphical Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {hasPermission(["view_total_fee_recovered"]) && (
          <DashboardDonutChart
            title="Fee Overview"
            labels={(chartData.fee_overview || []).map((item) => item.label)}
            values={(chartData.fee_overview || []).map((item) => item.value)}
            colors={["#FFCB82", "#FF8A8A", "#82B4FF"]}
          />
        )}
        {hasPermission(["view_current_batches"]) && (
          <DashboardDonutChart
            title="Batch Status"
            labels={(chartData.batch_status || []).map((item) => item.label)}
            values={(chartData.batch_status || []).map((item) => item.value)}
            colors={["#82B4FF", "#d69e2e"]}
          />
        )}
        {hasPermission(["view_total_enrolled_students"]) && (
          <DashboardDonutChart
            title="Student Enrollment"
            labels={(chartData.enrollment_overview || []).map((item) => item.label)}
            values={(chartData.enrollment_overview || []).map((item) => item.value)}
            colors={["#82FFCB", "#FFCB82"]}
          />
        )}
        {hasPermission(["view_total_fee_recovered"]) && (
          <DashboardDonutChart
            title="Expense Status"
            labels={(chartData.expense_overview || []).map((item) => item.label)}
            values={(chartData.expense_overview || []).map((item) => item.value)}
            colors={["#FF8A8A", "#d69e2e"]}
          />
        )}
        {hasPermission(["view_total_fee_recovered"]) && (
          <DashboardDonutChart
            title="Expense by Category"
            labels={(chartData.expense_categories || []).map((item) => item.label)}
            values={(chartData.expense_categories || []).map((item) => item.value)}
          />
        )}
        <div className="bg-white rounded-xl border border-[#E0E8EC] p-4 min-h-[320px] flex flex-col justify-center">
          <h3 className="text-center text-lg font-medium text-[#263238] mb-4">
            Quick Finance Summary
          </h3>
          {loading ? (
            <div className="animate-pulse h-24 bg-gray-200 rounded-lg mx-4" />
          ) : (
            <div className="space-y-3 px-6">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Fee Recovered</span>
                <span className="font-semibold text-green-600">
                  {statistics.total_fee_recovered ?? 0}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Approved Expenses</span>
                <span className="font-semibold text-red-500">
                  -{statistics.total_approved_expenses ?? 0}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Pending Expenses</span>
                <span className="font-semibold text-orange-500">
                  {statistics.total_pending_expenses ?? 0}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-800 font-medium">Net Balance</span>
                <span className="font-bold text-[#85652D]">
                  {statistics.net_balance ?? 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        {hasPermission(["view_total_fee_recovered"]) && (
          <DashboardAreaChart
            title="Monthly Finance Trend"
            data={chartData.monthly_finance || []}
            loading={loading}
          />
        )}
        <div className="w-full">
          <MonthlyColumnChart
            chartTitle="Student Admissions"
            filters={dashboardFilters}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4">
        <BatchChart chartTitle="Students per Batch" filters={dashboardFilters} />
      </div>
      </>
      )}

      {viewOnly && chartData.fee_overview?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <DashboardDonutChart
            title="My Fee Overview"
            labels={(chartData.fee_overview || []).map((item) => item.label)}
            values={(chartData.fee_overview || []).map((item) => item.value)}
            colors={["#82FFCB", "#FF8A8A"]}
          />
        </div>
      )}
    </>
  );
}

export default Home;
