import React from "react";
import Chart from "react-apexcharts";

function DashboardRadialChart({ title, items = [], loading = false }) {
  const labels = items.map((item) => item.label);
  const values = items.map((item) => item.value || 0);

  const options = {
    chart: {
      type: "radialBar",
      toolbar: { show: false },
    },
    plotOptions: {
      radialBar: {
        dataLabels: {
          name: {
            fontSize: "14px",
          },
          value: {
            fontSize: "16px",
            formatter: (val) => `${Math.round(val)}`,
          },
          total: {
            show: true,
            label: "Metrics",
          },
        },
      },
    },
    labels,
    colors: ["#FFCB82", "#82B4FF", "#FF8A8A", "#d69e2e", "#82FFCB"],
    title: {
      text: title,
      align: "center",
      style: { fontSize: "18px", color: "#263238" },
    },
    legend: {
      show: true,
      position: "bottom",
    },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E0E8EC] p-8 min-h-[320px] flex items-center justify-center">
        <div className="animate-pulse h-32 w-32 bg-gray-200 rounded-full" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-white rounded-xl border border-[#E0E8EC] p-8 text-center text-gray-500 min-h-[320px] flex items-center justify-center">
        No overview data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E0E8EC] p-4">
      <Chart options={options} series={values} type="radialBar" height={320} />
    </div>
  );
}

export default DashboardRadialChart;
