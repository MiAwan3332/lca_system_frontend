import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import axios from "axios";
import Cookies from "js-cookie";
import { useColorModeValue } from "@chakra-ui/react";
import { config } from "../utlls/config";

const buildChartParams = (filters = {}) => {
  const params = new URLSearchParams();
  const { batch_id, start_date, end_date } = filters;

  if (batch_id) params.append("batch_id", batch_id);
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const emptySeries = () => [
  { name: "Total", data: [] },
  { name: "Active", data: [] },
  { name: "Inactive", data: [] },
];

const BatchChart = ({ chartTitle, filters = {} }) => {
  const titleColor = useColorModeValue("#263238", "#f1f5f9");
  const labelColor = useColorModeValue("#6E879C", "#94a3b8");
  const dataLabelColor = useColorModeValue("#263238", "#f1f5f9");

  const [chartOptions, setChartOptions] = useState({
    chart: {
      id: "batch-column-chart",
      type: "bar",
      stacked: false,
      toolbar: { show: false },
    },
    xaxis: {
      categories: [],
    },
    colors: ["#94A3B8", "#7AEF85", "#FF8A8A"],
    legend: {
      position: "top",
    },
    title: {
      text: chartTitle || "Batch Data",
      align: "center",
      style: {
        fontSize: "20px",
        color: "#263238",
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ["#000000"],
      },
    },
  });

  const [chartSeries, setChartSeries] = useState(emptySeries());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setChartOptions((prev) => ({
      ...prev,
      title: {
        ...prev.title,
        text: chartTitle || "Batch Data",
        style: { fontSize: "20px", color: titleColor },
      },
      xaxis: {
        ...prev.xaxis,
        labels: { style: { colors: labelColor } },
      },
      yaxis: {
        labels: { style: { colors: labelColor } },
      },
      dataLabels: {
        enabled: true,
        style: { colors: [dataLabelColor] },
      },
    }));
  }, [chartTitle, titleColor, labelColor, dataLabelColor]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const authToken =
          Cookies.get("authToken") || sessionStorage.getItem("authToken");

        if (!authToken) {
          console.error("No authToken found");
          setChartSeries(emptySeries());
          return;
        }

        const response = await axios.get(
          `${config.BASE_URL}/students/students/Batchesgraph${buildChartParams(
            filters
          )}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const responseData = response.data;

        if (responseData && responseData.length > 0) {
          const batchNames = responseData.map((item) => item.batch);

          setChartOptions((prevOptions) => ({
            ...prevOptions,
            xaxis: {
              ...prevOptions.xaxis,
              categories: batchNames,
            },
          }));

          setChartSeries([
            {
              name: "Total",
              data: responseData.map(
                (item) => Number(item.total ?? item.count) || 0
              ),
            },
            {
              name: "Active",
              data: responseData.map((item) => Number(item.active) || 0),
            },
            {
              name: "Inactive",
              data: responseData.map((item) => Number(item.inactive) || 0),
            },
          ]);
        } else {
          setChartOptions((prevOptions) => ({
            ...prevOptions,
            xaxis: {
              ...prevOptions.xaxis,
              categories: [],
            },
          }));
          setChartSeries(emptySeries());
        }
      } catch (error) {
        console.error("Error fetching the data", error);
        setChartSeries(emptySeries());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.batch_id, filters.start_date, filters.end_date, chartTitle]);

  if (loading) {
    return <div className="my-8 text-center dash-text-muted">Loading...</div>;
  }

  if (!chartSeries[0]?.data?.length) {
    return (
      <div className="my-8 text-center dash-text-muted">
        No batch data found for selected filters.
      </div>
    );
  }

  return (
    <div className="chart my-8 w-full">
      <Chart
        options={chartOptions}
        series={chartSeries}
        type="bar"
        height="350"
      />
    </div>
  );
};

export default BatchChart;
