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
  conductData: null,
  conductStatus: "idle",
  evaluationDetails: null,
  evaluationDetailsStatus: "idle",
  startInterviewStatus: "idle",
  submitEvaluationStatus: "idle",
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

export const bookInterviewPanelSlot = createAsyncThunk(
  "interviewPanels/bookSlot",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, id, values } = payload;
      const response = await axios.post(
        `${BASE_URL}/interview-panels/book/${id}`,
        values,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to book interview"
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

export const startInterviewSession = createAsyncThunk(
  "interviewPanels/startInterview",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, panelId, schedule_index } = payload;
      const response = await axios.post(
        `${BASE_URL}/interview-panels/start-interview/${panelId}`,
        { schedule_index },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to start interview"
      );
    }
  }
);

export const fetchConductInterview = createAsyncThunk(
  "interviewPanels/fetchConduct",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, panelId, scheduleIndex } = payload;
      const response = await axios.get(
        `${BASE_URL}/interview-panels/conduct/${panelId}/${scheduleIndex}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load interview session"
      );
    }
  }
);

export const submitInterviewEvaluation = createAsyncThunk(
  "interviewPanels/submitEvaluation",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, panelId, values } = payload;
      const response = await axios.post(
        `${BASE_URL}/interview-panels/submit-evaluation/${panelId}`,
        values,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit evaluation"
      );
    }
  }
);

export const fetchInterviewEvaluationDetails = createAsyncThunk(
  "interviewPanels/fetchEvaluationDetails",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, panelId, scheduleIndex } = payload;
      const response = await axios.get(
        `${BASE_URL}/interview-panels/evaluation-details/${panelId}/${scheduleIndex}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load interview details"
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
    clearInterviewEvaluationDetails(state) {
      state.evaluationDetails = null;
      state.evaluationDetailsStatus = "idle";
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
          const matchId = (item) =>
            String(item?._id) === String(updated._id);
          state.panels = state.panels.some(matchId)
            ? state.panels.map((item) => (matchId(item) ? updated : item))
            : [updated, ...state.panels];
          state.scheduleBoardPanels = state.scheduleBoardPanels.some(matchId)
            ? state.scheduleBoardPanels.map((item) =>
                matchId(item) ? updated : item
              )
            : [updated, ...state.scheduleBoardPanels];
          if (
            state.currentPanel &&
            String(state.currentPanel._id) === String(updated._id)
          ) {
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
      .addCase(bookInterviewPanelSlot.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(bookInterviewPanelSlot.fulfilled, (state, action) => {
        state.updateStatus = "success";
        const updated = action.payload;
        if (updated?._id) {
          const matchId = (item) =>
            String(item?._id) === String(updated._id);
          state.panels = state.panels.some(matchId)
            ? state.panels.map((item) => (matchId(item) ? updated : item))
            : [updated, ...state.panels];
          state.scheduleBoardPanels = state.scheduleBoardPanels.some(matchId)
            ? state.scheduleBoardPanels.map((item) =>
                matchId(item) ? updated : item
              )
            : [updated, ...state.scheduleBoardPanels];
          if (
            state.currentPanel &&
            String(state.currentPanel._id) === String(updated._id)
          ) {
            state.currentPanel = updated;
          }
        }
        toast({
          title: "Interview booked",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(bookInterviewPanelSlot.rejected, (state, action) => {
        state.updateStatus = "failure";
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not book interview",
          description: state.error,
          status: "error",
          duration: 5000,
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
      })
      .addCase(startInterviewSession.pending, (state) => {
        state.startInterviewStatus = "loading";
      })
      .addCase(startInterviewSession.fulfilled, (state, action) => {
        state.startInterviewStatus = "success";
        state.conductData = action.payload;
        const updated = action.payload?.panel;
        if (updated?._id) {
          const matchId = (item) => String(item?._id) === String(updated._id);
          state.scheduleBoardPanels = state.scheduleBoardPanels.some(matchId)
            ? state.scheduleBoardPanels.map((item) =>
                matchId(item) ? updated : item
              )
            : state.scheduleBoardPanels;
        }
      })
      .addCase(startInterviewSession.rejected, (state, action) => {
        state.startInterviewStatus = "failure";
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not start interview",
          description: state.error,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(fetchConductInterview.pending, (state) => {
        state.conductStatus = "loading";
      })
      .addCase(fetchConductInterview.fulfilled, (state, action) => {
        state.conductStatus = "success";
        state.conductData = action.payload;
      })
      .addCase(fetchConductInterview.rejected, (state, action) => {
        state.conductStatus = "failure";
        state.conductData = null;
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not load interview",
          description: state.error,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(fetchInterviewEvaluationDetails.pending, (state) => {
        state.evaluationDetailsStatus = "loading";
      })
      .addCase(fetchInterviewEvaluationDetails.fulfilled, (state, action) => {
        state.evaluationDetailsStatus = "success";
        state.evaluationDetails = action.payload;
      })
      .addCase(fetchInterviewEvaluationDetails.rejected, (state, action) => {
        state.evaluationDetailsStatus = "failure";
        state.evaluationDetails = null;
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not load interview details",
          description: state.error,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(submitInterviewEvaluation.pending, (state) => {
        state.submitEvaluationStatus = "loading";
      })
      .addCase(submitInterviewEvaluation.fulfilled, (state, action) => {
        state.submitEvaluationStatus = "success";
        if (state.conductData) {
          state.conductData = {
            ...state.conductData,
            evaluation: action.payload?.evaluation || state.conductData.evaluation,
          };
        }
        toast({
          title: "Mock evaluation submitted",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(submitInterviewEvaluation.rejected, (state, action) => {
        state.submitEvaluationStatus = "failure";
        state.error = action.payload || action.error.message;
        toast({
          title: "Could not submit evaluation",
          description: state.error,
          status: "error",
          duration: 5000,
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
  clearInterviewEvaluationDetails,
} = interviewPanelSlice.actions;

export default interviewPanelSlice.reducer;
