import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
    statistics: {},
    status: "idle",
    error: null,
};

const buildStatisticsParams = (payload = {}) => {
  const params = new URLSearchParams();
  const { batch_id, start_date, end_date } = payload;

  if (batch_id) params.append("batch_id", batch_id);
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const fetchStatistics = createAsyncThunk(
    "statistics/fetchStatistics",
    async (payload) => {
        const { authToken } = payload;
        const response = await fetch(
            `${BASE_URL}/statistics${buildStatisticsParams(payload)}`,
            {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to load statistics");
        }
        return data;
    }
);

const statisticsSlice = createSlice({
    name: "statistics",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch statistics
            .addCase(fetchStatistics.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchStatistics.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.statistics = action.payload;
            })
            .addCase(fetchStatistics.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export { fetchStatistics };

export default statisticsSlice.reducer;