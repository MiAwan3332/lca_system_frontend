import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import axios from "axios";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();
const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  assignments: [],
  submissions: [],
  batchCourses: [],
  selectedAssignment: null,
  filters: {
    ...TABLE_FILTERS,
    batch_id: "",
    course_id: "",
    start_date: "",
    end_date: "",
  },
  pagination: TABLE_PAGINATION,
  submissionsPagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  submissionsStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  publishStatus: "idle",
  submitStatus: "idle",
  gradeStatus: "idle",
  error: null,
};

export const fetchAssignments = createAsyncThunk(
  "assignments/fetchAssignments",
  async (payload, { getState }) => {
    const { authToken, ...extraParams } = payload;
    const state = getState();
    const response = await axios.get(`${BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { ...state.assignments.filters, ...extraParams },
    });
    return response.data;
  }
);

export const fetchAssignmentById = createAsyncThunk(
  "assignments/fetchAssignmentById",
  async ({ authToken, id }) => {
    const response = await axios.get(`${BASE_URL}/assignments/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  }
);

export const fetchBatchCoursesForAssignment = createAsyncThunk(
  "assignments/fetchBatchCourses",
  async ({ authToken, batchId }) => {
    const response = await axios.get(
      `${BASE_URL}/assignments/batch/${batchId}/courses`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  }
);

export const fetchMyAssignmentCourses = createAsyncThunk(
  "assignments/fetchMyCourses",
  async ({ authToken }) => {
    const response = await axios.get(`${BASE_URL}/assignments/my-courses`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  }
);

export const addAssignment = createAsyncThunk(
  "assignments/addAssignment",
  async ({ authToken, formData }) => {
    const response = await fetch(`${BASE_URL}/assignments/add`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create assignment");
    return data;
  }
);

export const updateAssignment = createAsyncThunk(
  "assignments/updateAssignment",
  async ({ authToken, id, formData }) => {
    const response = await fetch(`${BASE_URL}/assignments/update/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update assignment");
    return data;
  }
);

export const publishAssignment = createAsyncThunk(
  "assignments/publishAssignment",
  async ({ authToken, id }) => {
    const response = await fetch(`${BASE_URL}/assignments/publish/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to publish assignment");
    return data;
  }
);

export const deleteAssignment = createAsyncThunk(
  "assignments/deleteAssignment",
  async ({ authToken, id }) => {
    const response = await fetch(`${BASE_URL}/assignments/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete assignment");
    return data;
  }
);

export const submitAssignment = createAsyncThunk(
  "assignments/submitAssignment",
  async ({ authToken, id, formData }) => {
    const response = await fetch(`${BASE_URL}/assignments/submit/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to submit assignment");
    return data;
  }
);

export const fetchAssignmentSubmissions = createAsyncThunk(
  "assignments/fetchSubmissions",
  async (payload) => {
    const {
      authToken,
      assignment_id,
      batch_id,
      course_id,
      status,
      page = 1,
      limit = 50,
    } = payload;

    const response = await axios.get(`${BASE_URL}/assignments/submissions/list`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        assignment_id,
        batch_id,
        course_id,
        status,
        page,
        limit,
      },
    });
    return response.data;
  }
);

export const gradeSubmission = createAsyncThunk(
  "assignments/gradeSubmission",
  async ({ authToken, id, gradeData }) => {
    const response = await fetch(`${BASE_URL}/assignments/submissions/${id}/grade`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gradeData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to grade submission");
    return data;
  }
);

const assignmentSlice = createSlice({
  name: "assignments",
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
    setBatchFilter(state, action) {
      state.filters.page = 1;
      state.filters.batch_id = action.payload;
      state.filters.course_id = "";
    },
    setCourseFilter(state, action) {
      state.filters.page = 1;
      state.filters.course_id = action.payload;
    },
    setStartDateFilter(state, action) {
      state.filters.page = 1;
      state.filters.start_date = action.payload;
    },
    setEndDateFilter(state, action) {
      state.filters.page = 1;
      state.filters.end_date = action.payload;
    },
    clearAssignmentFilters(state) {
      state.filters.batch_id = "";
      state.filters.course_id = "";
      state.filters.start_date = "";
      state.filters.end_date = "";
      state.filters.query = "";
      state.filters.page = 1;
    },
    clearSelectedAssignment(state) {
      state.selectedAssignment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.assignments = action.payload.docs || [];
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
        if (action.payload.message && !(action.payload.docs || []).length) {
          toast({
            title: action.payload.message,
            status: "info",
            duration: 5000,
            isClosable: true,
          });
        }
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(fetchAssignmentById.fulfilled, (state, action) => {
        state.selectedAssignment = action.payload;
      })
      .addCase(fetchBatchCoursesForAssignment.fulfilled, (state, action) => {
        state.batchCourses = action.payload;
      })
      .addCase(fetchMyAssignmentCourses.fulfilled, (state, action) => {
        state.batchCourses = action.payload || [];
      })
      .addCase(fetchAssignmentSubmissions.pending, (state) => {
        state.submissionsStatus = "loading";
      })
      .addCase(fetchAssignmentSubmissions.fulfilled, (state, action) => {
        state.submissionsStatus = "success";
        state.submissions = action.payload.docs || [];
        state.submissionsPagination = {
          totalDocs: action.payload.totalDocs,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
          page: action.payload.page,
        };
      })
      .addCase(addAssignment.fulfilled, (state, action) => {
        state.addStatus = "success";
        state.assignments.unshift(action.payload);
        toast({ title: "Assignment created", status: "success", duration: 3000 });
      })
      .addCase(addAssignment.rejected, (state, action) => {
        state.addStatus = "failure";
        toast({ title: action.error.message, status: "error", duration: 4000 });
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.updateStatus = "success";
        const idx = state.assignments.findIndex((a) => a._id === action.payload._id);
        if (idx !== -1) state.assignments[idx] = action.payload;
        toast({ title: "Assignment updated", status: "success", duration: 3000 });
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.updateStatus = "failure";
        toast({
          title: action.error.message || "Failed to update assignment",
          status: "error",
          duration: 4000,
        });
      })
      .addCase(publishAssignment.fulfilled, (state, action) => {
        state.publishStatus = "success";
        const idx = state.assignments.findIndex((a) => a._id === action.payload._id);
        if (idx !== -1) state.assignments[idx] = action.payload;
        toast({ title: "Assignment published", status: "success", duration: 3000 });
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.deleteStatus = "success";
        state.assignments = state.assignments.filter((a) => a._id !== action.payload._id);
        toast({ title: "Assignment deleted", status: "success", duration: 3000 });
      })
      .addCase(submitAssignment.fulfilled, (state) => {
        state.submitStatus = "success";
        toast({ title: "Submission uploaded", status: "success", duration: 3000 });
      })
      .addCase(submitAssignment.rejected, (_, action) => {
        toast({ title: action.error.message, status: "error", duration: 4000 });
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        state.gradeStatus = "success";
        const idx = state.submissions.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.submissions[idx] = action.payload;
        toast({ title: "Submission graded", status: "success", duration: 3000 });
      });
  },
});

export const {
  setQueryFilter,
  setPageFilter,
  setLimitFilter,
  setBatchFilter,
  setCourseFilter,
  setStartDateFilter,
  setEndDateFilter,
  clearAssignmentFilters,
  clearSelectedAssignment,
} = assignmentSlice.actions;

export const selectAllAssignments = createSelector(
  (state) => state.assignments.assignments,
  (assignments) => assignments
);

export default assignmentSlice.reducer;
