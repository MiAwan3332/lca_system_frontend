import React from "react";
import Chart from "react-apexcharts";

function DashboardAreaChart({ title, data = [], loading = false }) {
  const labels = data.map((item) => item.label);
  const recovered = data.map((item) => item.recovered || 0);
  const expenses = data.map((item) => item.expenses || 0);
  const net = data.map((item) => item.net || 0);

  const options = {
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.45,
        opacityTo: 0.05,
      },
    },
    xaxis: {
      categories: labels,
    },
    colors: ["#FFCB82", "#FF8A8A", "#82B4FF"],
    title: {
      text: title,
      align: "center",
      style: { fontSize: "18px", color: "#263238" },
    },
    legend: {
      position: "top",
    },
    dataLabels: {
      enabled: false,
    },
  };

  const series = [
    { name: "Fee Recovered", data: recovered },
    { name: "Approved Expenses", data: expenses },
    { name: "Net Balance", data: net },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E0E8EC] p-8 min-h-[350px] flex items-center justify-center">
        <div className="animate-pulse h-40 w-full bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-[#E0E8EC] p-8 text-center text-gray-500 min-h-[350px] flex items-center justify-center">
        No finance trend data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E0E8EC] p-4">
      <Chart options={options} series={series} type="area" height={350} />
    </div>
  );
}

export default DashboardAreaChart;
