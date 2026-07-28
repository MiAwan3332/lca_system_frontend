import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import axios from "axios";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  requests: [],
  pendingCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  filters: {
    ...TABLE_FILTERS,
    status: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  createStatus: "idle",
  decisionStatus: "idle",
  processStatus: "idle",
  error: null,
};

const fetchRefundRequests = createAsyncThunk(
  "refundRequests/fetchRefundRequests",
  async (payload, { getState }) => {
    const { authToken } = payload;
    const state = getState();
    const response = await axios.get(`${BASE_URL}/refund-requests`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: state.refundRequests.filters,
    });
    return response.data;
  }
);

const createRefundRequest = createAsyncThunk(
  "refundRequests/createRefundRequest",
  async (payload, { rejectWithValue }) => {
    const { authToken, studentId, amount, reason } = payload;
    try {
      const response = await axios.post(
        `${BASE_URL}/refund-requests/add`,
        { studentId, amount, reason },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to create request"
      );
    }
  }
);

const approveRefundRequest = createAsyncThunk(
  "refundRequests/approveRefundRequest",
  async (payload, { rejectWithValue }) => {
    const { authToken, requestId, comment, amount } = payload;
    try {
      const response = await axios.post(
        `${BASE_URL}/refund-requests/approve/${requestId}`,
        { comment, amount },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to approve"
      );
    }
  }
);

const rejectRefundRequest = createAsyncThunk(
  "refundRequests/rejectRefundRequest",
  async (payload, { rejectWithValue }) => {
    const { authToken, requestId, comment } = payload;
    try {
      const response = await axios.post(
        `${BASE_URL}/refund-requests/reject/${requestId}`,
        { comment },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to reject"
      );
    }
  }
);

const processRefundRequest = createAsyncThunk(
  "refundRequests/processRefundRequest",
  async (payload, { rejectWithValue }) => {
    const { authToken, requestId, amount } = payload;
    try {
      const response = await axios.post(
        `${BASE_URL}/refund-requests/process/${requestId}`,
        { amount },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error.message || "Failed to process refund"
      );
    }
  }
);

const refundRequestSlice = createSlice({
  name: "refundRequests",
  initialState,
  reducers: {
    setQueryFilter: (state, action) => {
      state.filters.query = action.payload;
      state.filters.page = 1;
    },
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
      state.filters.page = 1;
    },
    setLimitFilter: (state, action) => {
      state.filters.limit = action.payload;
      state.filters.page = 1;
    },
    setPageFilter: (state, action) => {
      state.filters.page = action.payload;
    },
    clearRefundFilters: (state) => {
      state.filters = { ...TABLE_FILTERS, status: "" };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRefundRequests.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchRefundRequests.fulfilled, (state, action) => {
        state.fetchStatus = "idle";
        state.requests = action.payload.docs || [];
        state.pagination = {
          totalDocs: action.payload.totalDocs,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
          page: action.payload.page,
          hasPrevPage: action.payload.hasPrevPage,
          hasNextPage: action.payload.hasNextPage,
          prevPage: action.payload.prevPage,
          nextPage: action.payload.nextPage,
        };
        state.pendingCount = action.payload.pendingCount || 0;
        state.approvedCount = action.payload.approvedCount || 0;
        state.rejectedCount = action.payload.rejectedCount || 0;
      })
      .addCase(fetchRefundRequests.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.error.message;
        toast({
          title: "Failed to load refund requests",
          description: action.error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(createRefundRequest.pending, (state) => {
        state.createStatus = "loading";
      })
      .addCase(createRefundRequest.fulfilled, (state) => {
        state.createStatus = "idle";
        toast({
          title: "Refund request submitted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(createRefundRequest.rejected, (state, action) => {
        state.createStatus = "failed";
        toast({
          title: "Could not submit refund request",
          description: action.payload || "Please try again.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(approveRefundRequest.pending, (state) => {
        state.decisionStatus = "loading";
      })
      .addCase(approveRefundRequest.fulfilled, (state) => {
        state.decisionStatus = "idle";
        toast({
          title: "Refund request approved",
          description: "Student set to inactive. Process refund from Students actions.",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(approveRefundRequest.rejected, (state, action) => {
        state.decisionStatus = "failed";
        toast({
          title: "Could not approve request",
          description: action.payload || "Please try again.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(rejectRefundRequest.pending, (state) => {
        state.decisionStatus = "loading";
      })
      .addCase(rejectRefundRequest.fulfilled, (state) => {
        state.decisionStatus = "idle";
        toast({
          title: "Refund request rejected",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(rejectRefundRequest.rejected, (state, action) => {
        state.decisionStatus = "failed";
        toast({
          title: "Could not reject request",
          description: action.payload || "Please try again.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(processRefundRequest.pending, (state) => {
        state.processStatus = "loading";
      })
      .addCase(processRefundRequest.fulfilled, (state) => {
        state.processStatus = "idle";
        toast({
          title: "Refund processed",
          description: "Amount deducted from finance.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(processRefundRequest.rejected, (state, action) => {
        state.processStatus = "failed";
        toast({
          title: "Could not process refund",
          description: action.payload || "Please try again.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      });
  },
});

export const selectAllRefundRequests = (state) => state.refundRequests.requests;

export const {
  setQueryFilter,
  setStatusFilter,
  setLimitFilter,
  setPageFilter,
  clearRefundFilters,
} = refundRequestSlice.actions;

export {
  fetchRefundRequests,
  createRefundRequest,
  approveRefundRequest,
  rejectRefundRequest,
  processRefundRequest,
};

export default refundRequestSlice.reducer;
