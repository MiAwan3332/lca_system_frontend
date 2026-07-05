import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import { Box, useToast } from "@chakra-ui/react";
import { useSelector, useDispatch } from "react-redux";
import TablePagination from "../../Components/TablePagination";
import {
  selectAllFees,
  selectStudentFeesReport,
  setLimitFilter,
  setPageFilter,
  fetchFees,
  fetchStudentFeesReport,
} from "../../Features/feeSlice";
import {
  fetchBatches,
  selectActiveBatches,
  setLimitFilter as setBatchLimitFilter,
} from "../../Features/batchSlice";
import StudentFeesReportPanel from "../../Components/StudentFeesReportPanel";
import FeesPageHero from "../../Components/FeesPageHero";
import FeesFiltersCard from "../../Components/FeesFiltersCard";
import FeesRecordsTable from "../../Components/FeesRecordsTable";
import { generateStudentFeesBatchReport } from "../../utlls/generateStudentFeesBatchReport";
import OverdueFeeAlert from "../../Components/OverdueFeeAlert";
import { isFeeOverdue } from "../../utlls/feeDueDate";

function AdminFeesPage() {
  const toast = useToast();
  const [authToken] = useState(Cookies.get("authToken"));
  const [period, setPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(moment().format("YYYY-MM-DD"));
  const [formBatch, setFormBatch] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { fetchStatus, pagination, studentFeesReportStatus } = useSelector(
    (state) => state.fees
  );
  const fees = useSelector(selectAllFees);
  const batches = useSelector(selectActiveBatches);
  const studentFeesReport = useSelector(selectStudentFeesReport);
  const dispatch = useDispatch();

  const reportFilters = useMemo(
    () => ({
      authToken,
      period,
      date: reportDate,
      batch_id: formBatch,
      status: formStatus,
    }),
    [authToken, period, reportDate, formBatch, formStatus]
  );

  const loadFees = (overrides = {}) => {
    dispatch(fetchFees({ ...reportFilters, ...overrides }));
  };

  const loadReport = (overrides = {}) => {
    dispatch(fetchStudentFeesReport({ ...reportFilters, ...overrides }));
  };

  useEffect(() => {
    dispatch(setBatchLimitFilter(200));
    dispatch(fetchBatches({ authToken }));
    const today = moment().format("YYYY-MM-DD");
    dispatch(
      fetchFees({
        authToken,
        period: "daily",
        date: today,
        batch_id: "",
        status: "",
      })
    );
    dispatch(
      fetchStudentFeesReport({
        authToken,
        period: "daily",
        date: today,
        batch_id: "",
        status: "",
      })
    );
  }, [dispatch, authToken]);

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
    loadFees({ period: nextPeriod });
    loadReport({ period: nextPeriod });
  };

  const handleDateChange = (e) => {
    const nextDate = e.target.value;
    setReportDate(nextDate);
    loadFees({ date: nextDate });
    loadReport({ date: nextDate });
  };

  const handleBatchChange = (batchId) => {
    setFormBatch(batchId);
    loadFees({ batch_id: batchId });
    loadReport({ batch_id: batchId });
  };

  const handleStatusChange = (e) => {
    const nextStatus = e.target.value;
    setFormStatus(nextStatus);
    loadFees({ status: nextStatus });
    loadReport({ status: nextStatus });
  };

  const handleClearFilters = () => {
    const today = moment().format("YYYY-MM-DD");
    setPeriod("daily");
    setReportDate(today);
    setFormBatch("");
    setFormStatus("");
    loadFees({ period: "daily", date: today, batch_id: "", status: "" });
    loadReport({ period: "daily", date: today, batch_id: "", status: "" });
  };

  const handleRefresh = () => {
    loadFees();
    loadReport();
  };

  const overdueCount = useMemo(
    () => fees.filter((fee) => isFeeOverdue(fee.status, fee.due_date)).length,
    [fees]
  );

  const handleGenerateReport = async (mode) => {
    setIsGeneratingReport(true);
    try {
      const report = await dispatch(fetchStudentFeesReport(reportFilters)).unwrap();
      const fileName = generateStudentFeesBatchReport(report, mode);
      toast({
        title: mode === "print" ? "Report opened for printing" : "Report downloaded",
        description:
          mode === "print"
            ? "Use your browser print dialog to finish."
            : fileName,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not generate report",
        description:
          typeof error === "string" ? error : error?.message || "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <Box className="fees-page" pb={8}>
      <FeesPageHero viewOnly={false} />

      <FeesFiltersCard
        viewOnly={false}
        period={period}
        reportDate={reportDate}
        formBatch={formBatch}
        formStatus={formStatus}
        batches={batches}
        reportFilters={reportFilters}
        isLoading={fetchStatus === "loading" || studentFeesReportStatus === "loading"}
        isGeneratingReport={isGeneratingReport}
        onPeriodChange={handlePeriodChange}
        onDateChange={handleDateChange}
        onBatchChange={handleBatchChange}
        onStatusChange={handleStatusChange}
        onRefresh={handleRefresh}
        onClearFilters={handleClearFilters}
        onDownload={() => handleGenerateReport("download")}
        onPrint={() => handleGenerateReport("print")}
      />

      {studentFeesReport && (
        <StudentFeesReportPanel report={studentFeesReport} period={period} />
      )}

      <OverdueFeeAlert count={overdueCount} />

      <FeesRecordsTable
        fees={fees}
        fetchStatus={fetchStatus}
        viewOnly={false}
        pagination={pagination}
      />

      {fetchStatus !== "loading" && (
        <Box mt={4}>
          <TablePagination
            pagination={pagination}
            setLimitFilter={setLimitFilter}
            setPageFilter={setPageFilter}
            method={fetchFees}
            payload={reportFilters}
          />
        </Box>
      )}
    </Box>
  );
}

export default AdminFeesPage;
