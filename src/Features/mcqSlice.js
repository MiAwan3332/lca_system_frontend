import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  mcqs: [],
  filters: TABLE_FILTERS,
  pagination: TABLE_PAGINATION,
  fetchStatus: 'idle',
  addStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  error: null,
};


// Async thunk to fetch MCQs
const fetchMcqs = createAsyncThunk("mcqs/fetchMcqs", async ({ authToken }) => {
  const response = await fetch(`${BASE_URL}/mcqs`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  const data = await response.json();
  return data;
});

// Async thunk to add a new MCQ
const addMcq = createAsyncThunk("mcqs/addMcq", async ({ mcqData, authToken }) => {
  const response = await fetch(`${BASE_URL}/mcqs/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(mcqData),
  });
  const data = await response.json();
  return data;
});

// Async thunk to update an MCQ
const updateMcq = createAsyncThunk("mcqs/updateMcq", async ({ mcqId, mcqData, authToken }) => {
  const response = await fetch(`${BASE_URL}/mcqs/update/${mcqId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(mcqData),
  });
  const data = await response.json();
  return data;
});

// Async thunk to delete an MCQ
const deleteMcq = createAsyncThunk("mcqs/deleteMcq", async ({ mcqId, authToken }) => {
  const response = await fetch(`${BASE_URL}/mcqs/delete/${mcqId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  const data = await response.json();
  return data;
});

const mcqSlice = createSlice({
  name: "mcqs",
  initialState,
  reducers: {
    setQueryFilter(state, action) {
      state.filters.query = action.payload;
    },
    setPageFilter(state, action) {
      state.filters.page = action.payload;
    },
    setLimitFilter(state, action) {
      state.filters.page = 1;
      state.filters.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch MCQs
      .addCase(fetchMcqs.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchMcqs.fulfilled, (state, action) => {
        state.mcqs = action.payload;
        state.fetchStatus = "succeeded";
      })
      .addCase(fetchMcqs.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.error.message;
      })

      // Add MCQ
      .addCase(addMcq.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addMcq.fulfilled, (state, action) => {
        state.mcqs.push(action.payload);
        state.addStatus = "succeeded";
      })
      .addCase(addMcq.rejected, (state, action) => {
        state.addStatus = "failed";
        state.error = action.error.message;
      })

      // Update MCQ
      .addCase(updateMcq.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateMcq.fulfilled, (state, action) => {
        state.mcqs = state.mcqs.map((mcq) =>
          mcq._id === action.payload._id ? action.payload : mcq
        );
        state.updateStatus = "succeeded";
      })
      .addCase(updateMcq.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.error.message;
      })

      // Delete MCQ
      .addCase(deleteMcq.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteMcq.fulfilled, (state, action) => {
        state.mcqs = state.mcqs.filter((mcq) => mcq._id !== action.payload._id);
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteMcq.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const selectAllMcqs = (state) => state.mcqs.mcqs;

export { fetchMcqs, addMcq, updateMcq, deleteMcq };
export const { setQueryFilter, setPageFilter, setLimitFilter } = mcqSlice.actions;

export default mcqSlice.reducer;
