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
    ...TABLE_FILTERS,
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

const fetchActivityLogs = createAsyncThunk(
  "activityLogs/fetchActivityLogs",
  async (payload, { getState }) => {
    const { authToken } = payload;
    const response = await axios.get(`${BASE_URL}/activity-logs`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: getState().activityLogs.filters,
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
      state.filters.page = action.payload;
    },
    setLimitFilter(state, action) {
      state.filters.page = 1;
      state.filters.limit = action.payload;
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
      const actorCategory = state.filters.actor_category;
      state.filters = {
        ...TABLE_FILTERS,
        actor_category: actorCategory,
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

export {
  fetchActivityLogs,
  fetchActivityLogFilters,
};

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
