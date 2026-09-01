import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useDispatch, useSelector } from "react-redux";
import { fetchStatistics } from "../Features/statisticsSlice";
import {
  fetchBatches,
  selectActiveBatches,
  setLimitFilter,
} from "../Features/batchSlice";
import { selectUser } from "../Features/authSlice";
import { isStudentViewOnly } from "../utlls/studentAccess";
import { isTeacherRole } from "../utlls/teacherAccess";
import { isQualifierRole } from "../utlls/qualifierAccess";
import { hasPermission } from "../utlls/useful";
import DashboardHeader from "../Components/Dashboard/DashboardHeader";
import KpiCard from "../Components/Dashboard/KpiCard";
import UpcomingSchedule from "../Components/Dashboard/UpcomingSchedule";
import DashboardChartCard from "../Components/Dashboard/DashboardChartCard";
import {
  ADMIN_KPI_CONFIG,
  TEACHER_KPI_CONFIG,
  STUDENT_KPI_CONFIG,
  QUALIFIER_KPI_CONFIG,
  buildUpcomingEvents,
} from "../Components/Dashboard/dashboardConfig";
import OverdueFeeAlert from "../Components/OverdueFeeAlert";

function Home() {
  const viewOnly = isStudentViewOnly();
  const isTeacher = isTeacherRole();
  const isQualifier = isQualifierRole();
  const isPersonalDashboard = viewOnly || isQualifier;
  const user = useSelector(selectUser);
  const { status } = useSelector((state) => state.statistics);
  const batches = useSelector(selectActiveBatches);
  const dispatch = useDispatch();

  const [statistics, setStatistics] = useState({});
  const [authToken] = useState(Cookies.get("authToken"));
  const [formBatch, setFormBatch] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  const loading = status === "loading";
  const chartData = statistics.chart_data || {};

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

  useEffect(() => {
    if (!isPersonalDashboard && !isTeacher) {
      dispatch(setLimitFilter(100));
      dispatch(fetchBatches({ authToken }));
    }
    loadStatistics({ batch_id: "", start_date: "", end_date: "" });
  }, []);

  const kpiConfig = isQualifier
    ? QUALIFIER_KPI_CONFIG
    : isTeacher
      ? TEACHER_KPI_CONFIG
      : viewOnly
        ? STUDENT_KPI_CONFIG
        : ADMIN_KPI_CONFIG;

  const visibleKpis = useMemo(
    () =>
      kpiConfig.filter(
        (item) =>
          isTeacher ||
          isPersonalDashboard ||
          !item.permissions ||
          hasPermission(item.permissions)
      ),
    [kpiConfig, isTeacher, isPersonalDashboard]
  );

  const greeting = isQualifier
    ? `Welcome back, ${statistics.qualifier_name || user?.name || "Qualifier"}`
    : isTeacher
      ? `Welcome back, ${statistics.teacher_name || user?.name || "Teacher"}`
      : viewOnly
        ? `Welcome back, ${statistics.student_name || user?.name || "Student"}`
        : `Welcome back, ${user?.name || "Admin"}`;

  const subtitle = isQualifier
    ? "Your interview hub — fees, batch, and booked panel schedules."
    : isTeacher
      ? "Your teaching command center — track classes, students, and assessments."
      : viewOnly
        ? "Your learning hub — fees, attendance, and academic progress at a glance."
        : "Institution analytics — enrollment, finance, and operational insights.";

  const roleLabel = isQualifier
    ? "Qualifier Dashboard"
    : isTeacher
      ? "Teacher Dashboard"
      : viewOnly
        ? "Student Dashboard"
        : "Admin Dashboard";

  const upcomingEvents = buildUpcomingEvents(statistics);

  return (
    <div className="dash-page">
      <DashboardHeader
        greeting={greeting}
        subtitle={subtitle}
        role={roleLabel}
        loading={loading}
        showFilters={!isPersonalDashboard && !isTeacher}
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

      <section className="mb-6">
        <UpcomingSchedule events={upcomingEvents} loading={loading} />
      </section>

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
