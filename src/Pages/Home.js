import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { fetchStatistics } from "../Features/statisticsSlice";
import { fetchFinanceReport } from "../Features/financeReportSlice";
import {
  fetchBatches,
  selectActiveBatches,
  setLimitFilter,
} from "../Features/batchSlice";
import {
  fetchUsers,
  selectAllUsers,
  setLimitFilter as setUserLimitFilter,
} from "../Features/userSlice";
import { fetchNotifications } from "../Features/notificationSlice";
import { selectUser } from "../Features/authSlice";
import { isStudentViewOnly } from "../utlls/studentAccess";
import { isTeacherRole } from "../utlls/teacherAccess";
import { hasPermission } from "../utlls/useful";
import DashboardHeader from "../Components/Dashboard/DashboardHeader";
import KpiCard from "../Components/Dashboard/KpiCard";
import QuickActions from "../Components/Dashboard/QuickActions";
import ActivityFeed from "../Components/Dashboard/ActivityFeed";
import UpcomingSchedule from "../Components/Dashboard/UpcomingSchedule";
import DashboardChartCard from "../Components/Dashboard/DashboardChartCard";
import TodayCollectionsSection from "../Components/Dashboard/TodayCollectionsSection";
import {
  ADMIN_KPI_CONFIG,
  TEACHER_KPI_CONFIG,
  STUDENT_KPI_CONFIG,
  buildActivityItems,
  buildUpcomingEvents,
} from "../Components/Dashboard/dashboardConfig";
import MonthlyColumnChart from "../Components/MonthlyStudentChart";
import BatchChart from "../Components/BatchChart";
import OverdueFeeAlert from "../Components/OverdueFeeAlert";

const ALL_USERS_VALUE = "";

const isExcludedDashboardUserRole = (role) => {
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

function Home() {
  const viewOnly = isStudentViewOnly();
  const isTeacher = isTeacherRole();
  // Today's Collections on every staff dashboard (students cannot access finance report API)
  const showTodayCollections = !viewOnly;
  const user = useSelector(selectUser);
  const { status } = useSelector((state) => state.statistics);
  const financeReport = useSelector((state) => state.financeReport.report);
  const financeStatus = useSelector((state) => state.financeReport.status);
  const notifications = useSelector((state) => state.notifications.notifications);
  const batches = useSelector(selectActiveBatches);
  const users = useSelector(selectAllUsers);
  const dispatch = useDispatch();

  const [statistics, setStatistics] = useState({});
  const [authToken] = useState(Cookies.get("authToken"));
  const [formBatch, setFormBatch] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formChangedBy, setFormChangedBy] = useState(ALL_USERS_VALUE);

  const loading = status === "loading";
  const collectionsLoading = financeStatus === "loading";
  const chartData = statistics.chart_data || {};
  const todaySummary = financeReport?.summary || {};

  const adminUsers = useMemo(
    () =>
      [...(users || [])]
        .filter((item) => !isExcludedDashboardUserRole(item.role))
        .sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", undefined, {
            sensitivity: "base",
          })
        ),
    [users]
  );

  const selectedAdminUser = useMemo(
    () =>
      adminUsers.find((item) => String(item._id) === String(formChangedBy)) ||
      null,
    [adminUsers, formChangedBy]
  );

  const selectedUserLabel = selectedAdminUser?.name || "All users";

  const dashboardFilters = {
    batch_id: formBatch,
    start_date: formStartDate,
    end_date: formEndDate,
  };

  const loadStatistics = (filters = dashboardFilters) => {
    dispatch(fetchStatistics({ authToken, ...filters }))
      .unwrap()
      .then((response) => setStatistics(response))
      .catch(() => setStatistics({}));
  };

  const loadTodayCollections = (changed_by = formChangedBy) => {
    if (!showTodayCollections || !authToken) return;
    dispatch(
      fetchFinanceReport({
        authToken,
        period: "daily",
        date: moment().format("YYYY-MM-DD"),
        changed_by: changed_by || undefined,
      })
    );
  };

  useEffect(() => {
    if (!viewOnly && !isTeacher) {
      dispatch(setLimitFilter(100));
      dispatch(fetchBatches({ authToken }));
    }
    if (showTodayCollections) {
      dispatch(setUserLimitFilter(200));
      dispatch(fetchUsers({ authToken }));
    }
    if (authToken) {
      dispatch(fetchNotifications({ authToken }));
    }
    loadStatistics({ batch_id: "", start_date: "", end_date: "" });
    loadTodayCollections(ALL_USERS_VALUE);
  }, []);

  const handleUserFilterChange = (changed_by) => {
    const next = changed_by || ALL_USERS_VALUE;
    setFormChangedBy(next);
    loadTodayCollections(next);
  };

  const kpiConfig = isTeacher
    ? TEACHER_KPI_CONFIG
    : viewOnly
      ? STUDENT_KPI_CONFIG
      : ADMIN_KPI_CONFIG;

  const visibleKpis = useMemo(
    () =>
      kpiConfig.filter(
        (item) =>
          isTeacher ||
          viewOnly ||
          !item.permissions ||
          hasPermission(item.permissions)
      ),
    [kpiConfig, isTeacher, viewOnly]
  );

  const greeting = isTeacher
    ? `Welcome back, ${statistics.teacher_name || user?.name || "Teacher"}`
    : viewOnly
      ? `Welcome back, ${statistics.student_name || user?.name || "Student"}`
      : `Welcome back, ${user?.name || "Admin"}`;

  const subtitle = isTeacher
    ? "Your teaching command center — track classes, students, and assessments."
    : viewOnly
      ? "Your learning hub — fees, attendance, and academic progress at a glance."
      : "Institution analytics — enrollment, finance, and operational insights.";

  const roleLabel = isTeacher
    ? "Teacher Dashboard"
    : viewOnly
      ? "Student Dashboard"
      : "Admin Dashboard";

  const activityItems = buildActivityItems(statistics, notifications);
  const upcomingEvents = buildUpcomingEvents(statistics);

  const monthlyFinanceSeries = [
    {
      name: "Fee Recovered",
      data: (chartData.monthly_finance || []).map((item) => item.recovered || 0),
    },
    {
      name: "Expenses",
      data: (chartData.monthly_finance || []).map((item) => item.expenses || 0),
    },
  ];

  return (
    <div className="dash-page">
      <DashboardHeader
        greeting={greeting}
        subtitle={subtitle}
        role={roleLabel}
        loading={loading}
        showFilters={!viewOnly && !isTeacher}
        batches={batches}
        formBatch={formBatch}
        formStartDate={formStartDate}
        formEndDate={formEndDate}
        onBatchChange={(batch_id) => {
          setFormBatch(batch_id);
          loadStatistics({ batch_id, start_date: formStartDate, end_date: formEndDate });
        }}
        onStartDateChange={(e) => {
          const start_date = e.target.value;
          setFormStartDate(start_date);
          loadStatistics({ batch_id: formBatch, start_date, end_date: formEndDate });
        }}
        onEndDateChange={(e) => {
          const end_date = e.target.value;
          setFormEndDate(end_date);
          loadStatistics({ batch_id: formBatch, start_date: formStartDate, end_date });
        }}
        onClearFilters={() => {
          setFormBatch("");
          setFormStartDate("");
          setFormEndDate("");
          loadStatistics({ batch_id: "", start_date: "", end_date: "" });
        }}
        onReload={() => {
          loadStatistics();
          loadTodayCollections();
        }}
      />

      {viewOnly && statistics.fee_is_overdue && (
        <OverdueFeeAlert
          dueDate={statistics.fee_due_date}
          amount={statistics.total_fee_pending}
          status="Pending"
          mb={6}
        />
      )}

      {showTodayCollections && (
        <TodayCollectionsSection
          totalCash={todaySummary.total_cash}
          totalOnline={todaySummary.total_online}
          expensesToday={todaySummary.total_approved_expenses}
          batchWise={todaySummary.batch_wise || []}
          loading={collectionsLoading}
          adminUsers={adminUsers}
          selectedUserId={formChangedBy}
          selectedUserLabel={selectedUserLabel}
          onUserChange={handleUserFilterChange}
        />
      )}

      <section className="kpi-grid mb-6">
        {visibleKpis.map((item) => (
          <KpiCard
            key={item.key}
            title={item.title}
            value={statistics[item.key] ?? 0}
            helpText={item.helpText}
            icon={item.icon}
            loading={loading}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-1">
          <QuickActions />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed items={activityItems} loading={loading} />
        </div>
        <div className="xl:col-span-1">
          <UpcomingSchedule events={upcomingEvents} loading={loading} />
        </div>
      </section>

      {!viewOnly && !isTeacher && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold dash-text">Analytics Overview</h2>
            <p className="text-sm dash-text-muted">Enrollment, finance, and operational metrics</p>
          </div>

          <section className="chart-grid mb-4">
            {hasPermission(["view_total_fee_recovered"]) && (
              <DashboardChartCard
                title="Fee Overview"
                subtitle="Recovered vs pending"
                type="donut"
                labels={(chartData.fee_overview || []).map((item) => item.label)}
                values={(chartData.fee_overview || []).map((item) => item.value)}
                colors={["#FFCB82", "#FF8A8A", "#82B4FF"]}
                loading={loading}
              />
            )}
            {hasPermission(["view_current_batches"]) && (
              <DashboardChartCard
                title="Batch Status"
                subtitle="Current vs previous"
                type="donut"
                labels={(chartData.batch_status || []).map((item) => item.label)}
                values={(chartData.batch_status || []).map((item) => item.value)}
                colors={["#82B4FF", "#d69e2e"]}
                loading={loading}
              />
            )}
            {hasPermission(["view_total_enrolled_students"]) && (
              <DashboardChartCard
                title="Student Enrollment"
                subtitle="Enrolled vs unenrolled"
                type="donut"
                labels={(chartData.enrollment_overview || []).map((item) => item.label)}
                values={(chartData.enrollment_overview || []).map((item) => item.value)}
                colors={["#82FFCB", "#FFCB82"]}
                loading={loading}
              />
            )}
            {hasPermission(["view_total_fee_recovered"]) && (
              <DashboardChartCard
                title="Expense Status"
                type="donut"
                labels={(chartData.expense_overview || []).map((item) => item.label)}
                values={(chartData.expense_overview || []).map((item) => item.value)}
                colors={["#FF8A8A", "#d69e2e"]}
                loading={loading}
              />
            )}
            {hasPermission(["view_total_fee_recovered"]) && (
              <DashboardChartCard
                title="Expense by Category"
                type="bar"
                categories={(chartData.expense_categories || []).map((item) => item.label)}
                series={[
                  {
                    name: "Amount",
                    data: (chartData.expense_categories || []).map((item) => item.value),
                  },
                ]}
                loading={loading}
              />
            )}
            <div className="dash-surface-card p-5">
              <h3 className="text-lg font-medium dash-text mb-1">Quick Finance Summary</h3>
              <p className="text-sm dash-text-muted mb-4">Real-time financial snapshot</p>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-8 dash-skeleton rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 px-1">
                  {[
                    { label: "Fee Recovered", value: statistics.total_fee_recovered ?? 0, color: "text-green-600 dark:text-green-400" },
                    { label: "Approved Expenses", value: `-${statistics.total_approved_expenses ?? 0}`, color: "text-red-500 dark:text-red-400" },
                    { label: "Pending Expenses", value: statistics.total_pending_expenses ?? 0, color: "text-orange-500 dark:text-orange-400" },
                    { label: "Net Balance", value: statistics.net_balance ?? 0, color: "dash-text-accent font-bold" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-[var(--dash-border)] last:border-0">
                      <span className="text-sm dash-text-muted">{row.label}</span>
                      <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="analytics-grid mb-4">
            {hasPermission(["view_total_fee_recovered"]) && (
              <DashboardChartCard
                title="Monthly Finance Trend"
                subtitle="Recovered fees vs expenses"
                type="area"
                categories={(chartData.monthly_finance || []).map((item) => item.label)}
                series={monthlyFinanceSeries}
                colors={["#FFCB82", "#FF8A8A", "#82B4FF"]}
                height={340}
                loading={loading}
              />
            )}
            <div className="dash-surface-card p-4">
              <MonthlyColumnChart chartTitle="Student Admissions" filters={dashboardFilters} />
            </div>
          </section>

          <section className="mb-4">
            <div className="dash-surface-card p-4">
              <BatchChart chartTitle="Students per Batch" filters={dashboardFilters} />
            </div>
          </section>
        </>
      )}

      {isTeacher && statistics.chart_data?.workload_overview?.length > 0 && (
        <section className="chart-grid mb-4">
          <DashboardChartCard
            title="Teaching Workload"
            subtitle="Reviews, quizzes, and deadlines"
            type="donut"
            labels={(statistics.chart_data.workload_overview || []).map((item) => item.label)}
            values={(statistics.chart_data.workload_overview || []).map((item) => item.value)}
            colors={["#FFCB82", "#82B4FF", "#FF8A8A"]}
            loading={loading}
          />
          <DashboardChartCard
            title="Workload Distribution"
            type="bar"
            categories={(statistics.chart_data.workload_overview || []).map((item) => item.label)}
            series={[
              {
                name: "Count",
                data: (statistics.chart_data.workload_overview || []).map((item) => item.value),
              },
            ]}
            loading={loading}
          />
        </section>
      )}

      {viewOnly && chartData.fee_overview?.length > 0 && (
        <section className="chart-grid mb-4">
          <DashboardChartCard
            title="My Fee Overview"
            type="donut"
            labels={(chartData.fee_overview || []).map((item) => item.label)}
            values={(chartData.fee_overview || []).map((item) => item.value)}
            colors={["#82FFCB", "#FF8A8A"]}
            loading={loading}
          />
        </section>
      )}
    </div>
  );
}

export default Home;
