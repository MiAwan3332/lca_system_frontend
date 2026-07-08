import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import axios from "axios";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();
const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  complaints: [],
  meta: {
    allowed_targets: [],
    statuses: [],
    inbox_role: null,
    can_view_inbox: false,
    can_view_all: false,
  },
  filters: {
    ...TABLE_FILTERS,
    view: "mine",
    status: "",
    target_role: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  metaStatus: "idle",
  addStatus: "idle",
  respondStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

export const fetchComplaintMeta = createAsyncThunk(
  "complaints/fetchComplaintMeta",
  async ({ authToken }) => {
    const response = await axios.get(`${BASE_URL}/complaints/meta`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  }
);

export const fetchComplaints = createAsyncThunk(
  "complaints/fetchComplaints",
  async (payload, { getState }) => {
    const { authToken, ...extraParams } = payload;
    const state = getState();
    const response = await axios.get(`${BASE_URL}/complaints`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { ...state.complaints.filters, ...extraParams },
    });
    return response.data;
  }
);

export const addComplaint = createAsyncThunk(
  "complaints/addComplaint",
  async ({ authToken, complaintData }) => {
    const response = await fetch(`${BASE_URL}/complaints/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(complaintData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to submit complaint");
    return data;
  }
);

export const respondToComplaint = createAsyncThunk(
  "complaints/respondToComplaint",
  async ({ authToken, id, responseData }) => {
    const response = await fetch(`${BASE_URL}/complaints/respond/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(responseData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update complaint");
    return data;
  }
);

export const deleteComplaint = createAsyncThunk(
  "complaints/deleteComplaint",
  async ({ authToken, id }) => {
    const response = await fetch(`${BASE_URL}/complaints/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete complaint");
    return data;
  }
);

const complaintSlice = createSlice({
  name: "complaints",
  initialState,
  reducers: {
    setComplaintView(state, action) {
      state.filters.view = action.payload;
      state.filters.page = 1;
    },
    setComplaintStatusFilter(state, action) {
      state.filters.status = action.payload;
      state.filters.page = 1;
    },
    setComplaintTargetFilter(state, action) {
      state.filters.target_role = action.payload;
      state.filters.page = 1;
    },
    setComplaintPageFilter(state, action) {
      state.filters.page = action.payload;
    },
    setComplaintLimitFilter(state, action) {
      state.filters.page = 1;
      state.filters.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComplaintMeta.pending, (state) => {
        state.metaStatus = "loading";
      })
      .addCase(fetchComplaintMeta.fulfilled, (state, action) => {
        state.metaStatus = "success";
        state.meta = action.payload;
      })
      .addCase(fetchComplaints.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.complaints = action.payload.docs || [];
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
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(addComplaint.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addComplaint.fulfilled, (state, action) => {
        state.addStatus = "idle";
        if (state.filters.view === "mine") {
          state.complaints.unshift(action.payload);
        }
        toast({
          title: "Complaint submitted",
          description: `Sent to ${action.payload.target_role}.`,
          status: "success",
          duration: 3000,
        });
      })
      .addCase(addComplaint.rejected, (_, action) => {
        toast({ title: action.error.message, status: "error", duration: 4000 });
      })
      .addCase(respondToComplaint.pending, (state) => {
        state.respondStatus = "loading";
      })
      .addCase(respondToComplaint.fulfilled, (state, action) => {
        state.respondStatus = "idle";
        const idx = state.complaints.findIndex((item) => item._id === action.payload._id);
        if (idx !== -1) state.complaints[idx] = action.payload;
        toast({ title: "Complaint updated", status: "success", duration: 3000 });
      })
      .addCase(respondToComplaint.rejected, (_, action) => {
        toast({ title: action.error.message, status: "error", duration: 4000 });
      })
      .addCase(deleteComplaint.fulfilled, (state, action) => {
        state.deleteStatus = "success";
        state.complaints = state.complaints.filter((item) => item._id !== action.payload._id);
        toast({ title: "Complaint deleted", status: "success", duration: 3000 });
      });
  },
});

export const {
  setComplaintView,
  setComplaintStatusFilter,
  setComplaintTargetFilter,
  setComplaintPageFilter,
  setComplaintLimitFilter,
} = complaintSlice.actions;

export const selectAllComplaints = createSelector(
  (state) => state.complaints.complaints,
  (complaints) => complaints
);

export default complaintSlice.reducer;
