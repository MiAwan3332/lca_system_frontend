import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { config } from "../utlls/config.js";

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  logs: [],
  filterOptions: { modules: [], actions: [] },
  filters: {
    query: TABLE_FILTERS.query,
    page: TABLE_FILTERS.page,
    limit: TABLE_FILTERS.limit,
    actor_category: "",
    module: "",
    action: "",
    start_date: "",
    end_date: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  filterOptionsStatus: "idle",
  error: null,
};

const buildActivityLogParams = (filters, overrides = {}) => {
  const merged = { ...filters, ...overrides };
  const page = Math.max(1, Number(merged.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(merged.limit) || 10));
  return {
    query: merged.query || "",
    page,
    limit,
    actor_category: merged.actor_category || "",
    module: merged.module || "",
    action: merged.action || "",
    start_date: merged.start_date || "",
    end_date: merged.end_date || "",
  };
};

const fetchActivityLogs = createAsyncThunk(
  "activityLogs/fetchActivityLogs",
  async (payload, { getState }) => {
    const { authToken, ...overrides } = payload || {};
    const params = buildActivityLogParams(
      getState().activityLogs.filters,
      overrides
    );
    const response = await axios.get(`${BASE_URL}/activity-logs`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params,
    });
    return response.data;
  }
);

const fetchActivityLogFilters = createAsyncThunk(
  "activityLogs/fetchActivityLogFilters",
  async (payload) => {
    const { authToken, actor_category } = payload;
    const response = await axios.get(`${BASE_URL}/activity-logs/filters`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { actor_category },
    });
    return response.data;
  }
);

const activityLogSlice = createSlice({
  name: "activityLogs",
  initialState,
  reducers: {
    setActorCategoryFilter(state, action) {
      state.filters.page = 1;
      state.filters.actor_category = action.payload;
    },
    setQueryFilter(state, action) {
      state.filters.page = 1;
      state.filters.query = action.payload;
    },
    setPageFilter(state, action) {
      state.filters.page = Number(action.payload) || 1;
    },
    setLimitFilter(state, action) {
      state.filters.page = 1;
      state.filters.limit = Number(action.payload) || 10;
    },
    setModuleFilter(state, action) {
      state.filters.page = 1;
      state.filters.module = action.payload;
    },
    setActionFilter(state, action) {
      state.filters.page = 1;
      state.filters.action = action.payload;
    },
    setStartDateFilter(state, action) {
      state.filters.page = 1;
      state.filters.start_date = action.payload;
    },
    setEndDateFilter(state, action) {
      state.filters.page = 1;
      state.filters.end_date = action.payload;
    },
    clearActivityLogFilters(state) {
      state.filters = {
        query: TABLE_FILTERS.query,
        page: TABLE_FILTERS.page,
        limit: TABLE_FILTERS.limit,
        actor_category: "",
        module: "",
        action: "",
        start_date: "",
        end_date: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityLogs.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.logs = action.payload.docs || [];
        state.pagination = {
          totalDocs: action.payload.totalDocs,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
          page: action.payload.page,
          pagingCounter: action.payload.pagingCounter,
          hasPrevPage: action.payload.hasPrevPage,
          hasNextPage: action.payload.hasNextPage,
          prevPage: action.payload.prevPage,
          nextPage: action.payload.nextPage,
        };
        // Keep filter page/limit in sync with server response
        if (action.payload.page) state.filters.page = action.payload.page;
        if (action.payload.limit) state.filters.limit = action.payload.limit;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(fetchActivityLogFilters.fulfilled, (state, action) => {
        state.filterOptionsStatus = "success";
        state.filterOptions = action.payload;
      });
  },
});

export const selectAllActivityLogs = (state) => state.activityLogs.logs;

export { fetchActivityLogs, fetchActivityLogFilters };

export const {
  setActorCategoryFilter,
  setQueryFilter,
  setPageFilter,
  setLimitFilter,
  setModuleFilter,
  setActionFilter,
  setStartDateFilter,
  setEndDateFilter,
  clearActivityLogFilters,
} = activityLogSlice.actions;

export default activityLogSlice.reducer;
