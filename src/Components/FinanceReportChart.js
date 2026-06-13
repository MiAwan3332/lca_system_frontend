import React from "react";
import Chart from "react-apexcharts";

function FinanceReportChart({ breakdown = [], title = "Finance Trend" }) {
  const labels = breakdown.map((item) => item.label);
  const recoveredData = breakdown.map((item) => item.recovered);
  const expenseData = breakdown.map((item) => item.expenses || 0);
  const netData = breakdown.map((item) => item.net || 0);

  const options = {
    chart: {
      id: "finance-report-chart",
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "55%",
      },
    },
    xaxis: {
      categories: labels,
    },
    colors: ["#FFCB82", "#FF8A8A", "#82B4FF"],
    title: {
      text: title,
      align: "center",
      style: {
        fontSize: "20px",
        color: "#263238",
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: "top",
    },
  };

  const series = [
    { name: "Income (Recovered)", data: recoveredData },
    { name: "Approved Expenses", data: expenseData },
    { name: "Net Balance", data: netData },
  ];

  if (!breakdown.length) {
    return (
      <div className="my-8 text-center text-gray-500 bg-white rounded-xl border border-[#E0E8EC] p-8">
        No finance data found for the selected period.
      </div>
    );
  }

  return (
    <div className="chart my-8 w-full bg-white rounded-xl border border-[#E0E8EC] p-4">
      <Chart options={options} series={series} type="bar" height="350" />
    </div>
  );
}

export default FinanceReportChart;
