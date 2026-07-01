import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";
import axios from "axios";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  mcqs: [],
  filters: {
    ...TABLE_FILTERS,
    course_id: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  importStatus: "idle",
  error: null,
};

const fetchMcqs = createAsyncThunk(
  "mcqs/fetchMcqs",
  async (payload, { getState }) => {
    const state = getState();
    const { authToken } = payload;
    const response = await axios.get(`${BASE_URL}/mcqs`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: state.mcqs.filters,
    });
    return response.data;
  }
);

const addMcq = createAsyncThunk(
  "mcqs/addMcq",
  async ({ mcqData, authToken }) => {
    const response = await fetch(`${BASE_URL}/mcqs/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(mcqData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to add MCQ");
    }
    return data;
  }
);

const updateMcq = createAsyncThunk(
  "mcqs/updateMcq",
  async ({ mcqId, mcqData, authToken }) => {
    const { _id, ...updateData } = mcqData;
    const response = await fetch(`${BASE_URL}/mcqs/update/${mcqId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(updateData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update MCQ");
    }
    return data;
  }
);

const deleteMcq = createAsyncThunk(
  "mcqs/deleteMcq",
  async ({ mcqId, authToken }) => {
    const response = await fetch(`${BASE_URL}/mcqs/delete/${mcqId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete MCQ");
    }
    return { _id: data._id || mcqId };
  }
);

const bulkImportMcqs = createAsyncThunk(
  "mcqs/bulkImportMcqs",
  async ({ authToken, mcqs }) => {
    const response = await axios.post(
      `${BASE_URL}/mcqs/bulk-import`,
      { mcqs },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  }
);

const mcqSlice = createSlice({
  name: "mcqs",
  initialState,
  reducers: {
    setQueryFilter(state, action) {
      state.filters.query = action.payload;
      state.filters.page = 1;
    },
    setPageFilter(state, action) {
      state.filters.page = action.payload;
    },
    setLimitFilter(state, action) {
      state.filters.page = 1;
      state.filters.limit = action.payload;
    },
    setCourseFilter(state, action) {
      state.filters.course_id = action.payload;
      state.filters.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMcqs.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchMcqs.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.mcqs = action.payload;
        } else {
          state.mcqs = action.payload.docs || [];
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
        }
        state.fetchStatus = "succeeded";
      })
      .addCase(fetchMcqs.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.error.message;
      })

      .addCase(addMcq.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addMcq.fulfilled, (state) => {
        state.addStatus = "succeeded";
        toast({
          title: "MCQ added.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(addMcq.rejected, (state, action) => {
        state.addStatus = "failed";
        state.error = action.error.message;
      })

      .addCase(updateMcq.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateMcq.fulfilled, (state) => {
        state.updateStatus = "succeeded";
        toast({
          title: "MCQ updated.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(updateMcq.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.error.message;
      })

      .addCase(deleteMcq.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteMcq.fulfilled, (state, action) => {
        state.mcqs = state.mcqs.filter((mcq) => mcq._id !== action.payload._id);
        state.deleteStatus = "succeeded";
        toast({
          title: "MCQ deleted.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(deleteMcq.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.error.message;
      })

      .addCase(bulkImportMcqs.pending, (state) => {
        state.importStatus = "loading";
      })
      .addCase(bulkImportMcqs.fulfilled, (state, action) => {
        state.importStatus = "succeeded";
        const { imported, failed } = action.payload;
        toast({
          title: "MCQ import completed",
          description:
            failed?.length > 0
              ? `Imported ${imported} MCQs. ${failed.length} row(s) failed.`
              : `Successfully imported ${imported} MCQs.`,
          status: failed?.length > 0 ? "warning" : "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(bulkImportMcqs.rejected, (state, action) => {
        state.importStatus = "failed";
        state.error = action.error.message;
        toast({
          title: "Import failed",
          description: action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  },
});

export const selectAllMcqs = (state) => state.mcqs.mcqs;

export { fetchMcqs, addMcq, updateMcq, deleteMcq, bulkImportMcqs };
export const { setQueryFilter, setPageFilter, setLimitFilter, setCourseFilter } = mcqSlice.actions;

export default mcqSlice.reducer;
