import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import axios from "axios";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();
const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  panels: [],
  currentPanel: null,
  scheduleBoardPanels: [],
  filters: {
    ...TABLE_FILTERS,
    status: "",
    start_date: "",
    end_date: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  fetchOneStatus: "idle",
  fetchScheduleBoardStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

export const fetchInterviewPanels = createAsyncThunk(
  "interviewPanels/fetch",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { authToken } = payload;
      const response = await axios.get(`${BASE_URL}/interview-panels`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: state.interviewPanels.filters,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to load panels"
      );
    }
  }
);

export const fetchInterviewPanel = createAsyncThunk(
  "interviewPanels/fetchOne",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, id } = payload;
      const response = await axios.get(`${BASE_URL}/interview-panels/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load panel"
      );
    }
  }
);

export const fetchInterviewPanelScheduleBoard = createAsyncThunk(
  "interviewPanels/fetchScheduleBoard",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, query = "", status = "", start_date = "", end_date = "" } =
        payload;
      const response = await axios.get(`${BASE_URL}/interview-panels`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          page: 1,
          limit: 500,
          query,
          status,
          start_date,
          end_date,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load schedules"
      );
    }
  }
);

export const addInterviewPanel = createAsyncThunk(
  "interviewPanels/add",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, values } = payload;
      const response = await axios.post(
        `${BASE_URL}/interview-panels/add`,
        values,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to add panel"
      );
    }
  }
);

export const updateInterviewPanel = createAsyncThunk(
  "interviewPanels/update",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, id, values } = payload;
      const response = await axios.post(
        `${BASE_URL}/interview-panels/update/${id}`,
        values,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update panel"
      );
    }
  }
);

export const deleteInterviewPanel = createAsyncThunk(
  "interviewPanels/delete",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, id } = payload;
      const response = await axios.delete(
        `${BASE_URL}/interview-panels/delete/${id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return { ...(response.data || {}), id };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete panel"
      );
    }
  }
);

const interviewPanelSlice = createSlice({
  name: "interviewPanels",
  initialState,
  reducers: {
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
    setStatusFilter(state, action) {
      state.filters.page = 1;
      state.filters.status = action.payload;
    },
    setStartDateFilter(state, action) {
      state.filters.page = 1;
      state.filters.start_date = action.payload;
    },
    setEndDateFilter(state, action) {
      state.filters.page = 1;
      state.filters.end_date = action.payload;
    },
    clearInterviewPanelFilters(state) {
      state.filters.page = 1;
      state.filters.query = "";
      state.filters.status = "";
      state.filters.start_date = "";
      state.filters.end_date = "";
    },
    clearCurrentInterviewPanel(state) {
      state.currentPanel = null;
      state.fetchOneStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInterviewPanels.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchInterviewPanels.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.panels = action.payload.docs || [];
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
      .addCase(fetchInterviewPanels.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not load interview panels",
          description: state.error,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(fetchInterviewPanel.pending, (state) => {
        state.fetchOneStatus = "loading";
      })
      .addCase(fetchInterviewPanel.fulfilled, (state, action) => {
        state.fetchOneStatus = "success";
        state.currentPanel = action.payload || null;
        const updated = action.payload;
        if (updated?._id) {
          const exists = state.panels.some((item) => item._id === updated._id);
          if (exists) {
            state.panels = state.panels.map((item) =>
              item._id === updated._id ? updated : item
            );
          }
        }
      })
      .addCase(fetchInterviewPanel.rejected, (state, action) => {
        state.fetchOneStatus = "failure";
        state.currentPanel = null;
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not load interview panel",
          description: state.error,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(fetchInterviewPanelScheduleBoard.pending, (state) => {
        state.fetchScheduleBoardStatus = "loading";
      })
      .addCase(fetchInterviewPanelScheduleBoard.fulfilled, (state, action) => {
        state.fetchScheduleBoardStatus = "success";
        state.scheduleBoardPanels = action.payload?.docs || [];
      })
      .addCase(fetchInterviewPanelScheduleBoard.rejected, (state, action) => {
        state.fetchScheduleBoardStatus = "failure";
        state.scheduleBoardPanels = [];
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not load panel schedules",
          description: state.error,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(addInterviewPanel.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addInterviewPanel.fulfilled, (state, action) => {
        state.addStatus = "success";
        if (action.payload?._id) {
          state.panels = [action.payload, ...state.panels];
        }
        toast({
          title: "Interview panel created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(addInterviewPanel.rejected, (state, action) => {
        state.addStatus = "failure";
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not create panel",
          description: state.error,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(updateInterviewPanel.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateInterviewPanel.fulfilled, (state, action) => {
        state.updateStatus = "success";
        const updated = action.payload;
        if (updated?._id) {
          state.panels = state.panels.map((item) =>
            item._id === updated._id ? updated : item
          );
          state.scheduleBoardPanels = state.scheduleBoardPanels.map((item) =>
            item._id === updated._id ? updated : item
          );
          if (state.currentPanel?._id === updated._id) {
            state.currentPanel = updated;
          }
        }
        toast({
          title: "Interview panel updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(updateInterviewPanel.rejected, (state, action) => {
        state.updateStatus = "failure";
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not update panel",
          description: state.error,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(deleteInterviewPanel.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteInterviewPanel.fulfilled, (state, action) => {
        state.deleteStatus = "success";
        const id = action.payload?.id;
        if (id) {
          state.panels = state.panels.filter((item) => item._id !== id);
        }
        toast({
          title: "Interview panel deleted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(deleteInterviewPanel.rejected, (state, action) => {
        state.deleteStatus = "failure";
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not delete panel",
          description: state.error,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      });
  },
});

export const {
  setQueryFilter,
  setPageFilter,
  setLimitFilter,
  setStatusFilter,
  setStartDateFilter,
  setEndDateFilter,
  clearInterviewPanelFilters,
  clearCurrentInterviewPanel,
} = interviewPanelSlice.actions;

export default interviewPanelSlice.reducer;
