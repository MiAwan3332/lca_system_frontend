import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { config } from "../utlls/config.js";

const BASE_URL = config.BASE_URL;

const initialState = {
  report: null,
  status: "idle",
  error: null,
};

const buildReportParams = (payload = {}) => {
  const params = new URLSearchParams();
  const { period = "daily", date, batch_id, changed_by } = payload;

  params.append("period", period);
  if (date) params.append("date", date);

  const toList = (value) => {
    if (Array.isArray(value)) {
      return value.map(String).map((item) => item.trim()).filter(Boolean);
    }
    if (value == null || value === "") return [];
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const batchIds = toList(batch_id);
  const changedByIds = toList(changed_by);

  if (batchIds.length) params.append("batch_id", batchIds.join(","));
  if (changedByIds.length) params.append("changed_by", changedByIds.join(","));

  return params.toString();
};

const fetchFinanceReport = createAsyncThunk(
  "financeReport/fetchFinanceReport",
  async (payload) => {
    const { authToken } = payload;
    const response = await axios.get(
      `${BASE_URL}/fees/report?${buildReportParams(payload)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  }
);

const financeReportSlice = createSlice({
  name: "financeReport",
  initialState,
  reducers: {
    clearFinanceReport: (state) => {
      state.report = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinanceReport.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFinanceReport.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.report = action.payload;
      })
      .addCase(fetchFinanceReport.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { clearFinanceReport } = financeReportSlice.actions;
export { fetchFinanceReport };
export default financeReportSlice.reducer;
