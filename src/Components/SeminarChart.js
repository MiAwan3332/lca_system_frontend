import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import axios from 'axios';
import LcaLogoLoading from "./LcaLogoLoading";

const SeminarChart = ({ chartTitle }) => {
  const [chartOptions, setChartOptions] = useState({
    chart: {
      id: 'batch-column-chart',
      type: 'bar',
    },
    xaxis: {
      categories: [], // Initialize with an empty array
    },
    colors: ['#FFCB82'], // Set the bar color here
    title: {
      text: chartTitle || 'Batch Data',
      align: 'center',
      style: {
        fontSize: '20px',
        color: '#263238'
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#000000'] // Set the data labels text color to black
      }
    }
  });

  const [chartSeries, setChartSeries] = useState([{
    name: 'Count',
    data: [] // Initialize with an empty array
  }]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get authToken from session storage
        const authToken = sessionStorage.getItem('authToken');

        if (!authToken) {
          console.error('No authToken found in session storage');
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/students/students/Batchesgraph`, {
          headers: {
            'Authorization': `Bearer ${authToken}` // Include the authToken in the headers
          }
        });

        const responseData = response.data;

        // Ensure that responseData is not undefined or null
        if (responseData && responseData.length > 0) {
          // Extract batch names and counts
          const batchNames = responseData.map(item => item.batch);
          const batchCounts = responseData.map(item => item.count);

          // Update the chart options and series with the fetched data
          setChartOptions(prevOptions => ({
            ...prevOptions,
            xaxis: {
              ...prevOptions.xaxis,
              categories: batchNames
            }
          }));

          setChartSeries([{
            name: 'Count',
            data: batchCounts
          }]);
        } else {
          console.error('No data returned from the API');
        }
      } catch (error) {
        console.error('Error fetching the data', error);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this effect runs once on component mount

  // Conditional rendering to avoid rendering the chart with undefined or empty data
  if (chartSeries[0].data.length === 0 || chartOptions.xaxis.categories.length === 0) {
    return <LcaLogoLoading size="sm" />;
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
}

export default SeminarChart;
