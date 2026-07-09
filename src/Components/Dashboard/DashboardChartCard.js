import React from "react";
import { useColorModeValue } from "@chakra-ui/react";
import Chart from "react-apexcharts";

function DashboardChartCard({
  title,
  subtitle,
  type = "donut",
  labels = [],
  values = [],
  series = [],
  categories = [],
  colors = ["#FFCB82", "#82B4FF", "#FF8A8A", "#d69e2e", "#82FFCB"],
  height = 300,
  loading = false,
  emptyMessage = "No data available",
}) {
  const textColor = useColorModeValue("#263238", "#f1f5f9");
  const mutedColor = useColorModeValue("#6E879C", "#94a3b8");
  const gridColor = useColorModeValue("#E0E8EC", "#334155");

  const hasDonutData = values.some((v) => v > 0);
  const hasSeriesData = series.some((s) => s.data?.some((d) => d > 0));

  const baseOptions = {
    chart: { toolbar: { show: false }, fontFamily: "Inter, sans-serif" },
    colors,
    legend: { position: "bottom", labels: { colors: mutedColor } },
    dataLabels: { enabled: type === "donut" },
    grid: { borderColor: gridColor },
    xaxis: {
      categories,
      labels: { style: { colors: mutedColor } },
    },
    yaxis: { labels: { style: { colors: mutedColor } } },
  };

  const donutOptions = {
    ...baseOptions,
    labels,
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: { show: true, label: "Total", color: mutedColor },
          },
        },
      },
    },
  };

  const barOptions = {
    ...baseOptions,
    plotOptions: { bar: { borderRadius: 6, columnWidth: "55%" } },
  };

  const lineOptions = {
    ...baseOptions,
    stroke: { curve: "smooth", width: 3 },
  };

  const areaOptions = {
    ...lineOptions,
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0.05 },
    },
  };

  const optionsMap = {
    donut: donutOptions,
    bar: barOptions,
    line: lineOptions,
    area: areaOptions,
  };

  if (loading) {
    return (
      <div className="dash-surface-card p-5 min-h-[340px]">
        <div className="h-5 w-36 dash-skeleton rounded-md mb-2" />
        <div className="h-4 w-48 dash-skeleton rounded-md mb-8" />
        <div className="w-full h-48 dash-skeleton rounded-xl" />
      </div>
    );
  }

  const isEmpty =
    type === "donut" ? !hasDonutData : !hasSeriesData && !categories.length;

  return (
    <div className="dash-surface-card p-5">
      <div className="mb-3">
        <h3 className="text-lg font-semibold" style={{ color: textColor }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm" style={{ color: mutedColor }}>
            {subtitle}
          </p>
        )}
      </div>
      {isEmpty ? (
        <div
          className="min-h-[260px] flex items-center justify-center text-sm"
          style={{ color: mutedColor }}
        >
          {emptyMessage}
        </div>
      ) : (
        <Chart
          options={optionsMap[type] || donutOptions}
          series={type === "donut" ? values : series}
          type={type}
          height={height}
        />
      )}
    </div>
  );
}

export default DashboardChartCard;
