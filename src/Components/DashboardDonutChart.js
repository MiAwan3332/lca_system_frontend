import React from "react";
import Chart from "react-apexcharts";

function DashboardDonutChart({ title, labels = [], values = [], colors = ["#FFCB82", "#82B4FF", "#FF8A8A", "#d69e2e"] }) {
  const hasData = values.some((value) => value > 0);

  const options = {
    chart: {
      type: "donut",
      toolbar: { show: false },
    },
    labels,
    colors,
    title: {
      text: title,
      align: "center",
      style: { fontSize: "18px", color: "#263238" },
    },
    legend: {
      position: "bottom",
    },
    dataLabels: {
      enabled: true,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "62%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              fontSize: "14px",
            },
          },
        },
      },
    },
  };

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-[#E0E8EC] p-8 text-center text-gray-500 min-h-[320px] flex items-center justify-center">
        No data available for {title}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E0E8EC] p-4">
      <Chart options={options} series={values} type="donut" height={320} />
    </div>
  );
}

export default DashboardDonutChart;
