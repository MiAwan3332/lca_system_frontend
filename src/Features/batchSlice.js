import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";
import moment from "moment";
import axios from "axios";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  batches: [],
  batchCourses: [],
  batchTeachers: [],
  batchTeacherAssignments: [],
  filters: {
    ...TABLE_FILTERS,
    is_active: "",
    batch_type: "",
    start_date: "",
    end_date: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  assignCoursesStatus: "idle",
  fetchBatchCoursesStatus: "idle",
  assignTeachersStatus: "idle",
  fetchBatchTeachersStatus: "idle",
  assignTeacherCoursesStatus: "idle",
  fetchBatchTeacherAssignmentsStatus: "idle",
  toggleBatchStatusStatus: "idle",
  error: [],
};

const fetchBatches = createAsyncThunk(
  "batches/fetchBatches",
  async (payload, { getState }) => {
    const state = getState();
    const { authToken } = payload;
    const response = await axios.get(`${BASE_URL}/batches`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: state.batches.filters,
    });
    return response.data;
  }
);

const addBatch = createAsyncThunk("batches/addBatch", async (payload) => {
  const { authToken, values } = payload;
  const response = await fetch(`${BASE_URL}/batches/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(values),
  });
  const data = await response.json();
  return data;
});

const updateBatch = createAsyncThunk("batches/updateBatch", async (payload) => {
  const { authToken, values, id } = payload;
  const response = await fetch(`${BASE_URL}/batches/update/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(values),
  });
  const data = await response.json();
  return data;
});

const deleteBatch = createAsyncThunk("batches/deleteBatch", async (payload) => {
  const { authToken, id } = payload;
  const response = await fetch(`${BASE_URL}/batches/delete/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
  const data = await response.json();
  return data;
});

const toggleBatchStatus = createAsyncThunk(
  "batches/toggleBatchStatus",
  async (payload) => {
    const { authToken, id, is_active } = payload;
    const response = await fetch(`${BASE_URL}/batches/toggle-status/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ is_active }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update batch status");
    }
    return data;
  }
);

const assignCoursesToBatch = createAsyncThunk(
  "batches/assignCoursesToBatch",
  async (payload) => {
    const { authToken, batchId, courseIds } = payload;
    const response = await fetch(`${BASE_URL}/batches/assignCourses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ batchId, courseIds }),
    });
    const data = await response.json();
    return data;
  }
);

const fetchBatchCourses = createAsyncThunk(
  "batches/fetchBatchCourses",
  async (payload) => {
    const { authToken, batchId } = payload;
    const response = await fetch(`${BASE_URL}/batches/courses/${batchId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    return data;
  }
);

const assignTeachersToBatch = createAsyncThunk(
  "batches/assignTeachersToBatch",
  async (payload) => {
    const { authToken, batchId, teacherIds } = payload;
    const response = await fetch(`${BASE_URL}/batches/assignTeachers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ batchId, teacherIds }),
    });
    const data = await response.json();
    return data;
  }
);

const fetchBatchTeachers = createAsyncThunk(
  "batches/fetchBatchTeachers",
  async (payload) => {
    const { authToken, batchId } = payload;
    const response = await fetch(`${BASE_URL}/batches/teachers/${batchId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    return data;
  }
);

const fetchBatchTeacherAssignments = createAsyncThunk(
  "batches/fetchBatchTeacherAssignments",
  async (payload) => {
    const { authToken, batchId } = payload;
    const response = await fetch(`${BASE_URL}/batches/teacher-assignments/${batchId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch teacher assignments");
    }
    return data;
  }
);

const assignTeacherCoursesToBatch = createAsyncThunk(
  "batches/assignTeacherCoursesToBatch",
  async (payload) => {
    const { authToken, batchId, assignments } = payload;
    const response = await fetch(`${BASE_URL}/batches/assignTeacherCourses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ batchId, assignments }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to assign teachers");
    }
    return data;
  }
);

const batchSlice = createSlice({
  name: "batches",
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
      setStatusFilter(state, action) {
        state.filters.page = 1;
        state.filters.is_active = action.payload;
      },
      setBatchTypeFilter(state, action) {
        state.filters.page = 1;
        state.filters.batch_type = action.payload;
      },
      setStartDateFilter(state, action) {
        state.filters.page = 1;
        state.filters.start_date = action.payload;
      },
      setEndDateFilter(state, action) {
        state.filters.page = 1;
        state.filters.end_date = action.payload;
      },
      clearBatchFilters(state) {
        state.filters.page = 1;
        state.filters.query = "";
        state.filters.is_active = "";
        state.filters.batch_type = "";
        state.filters.start_date = "";
        state.filters.end_date = "";
      },
  },

  extraReducers: (builder) => {
    builder
      // Fetch Batches
      .addCase(fetchBatches.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.batches = action.payload.docs;
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
      .addCase(fetchBatches.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error.push(action.error.message);
      })

      // Add Batch
      .addCase(addBatch.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addBatch.fulfilled, (state, action) => {
        state.addStatus = "success";
        toast({
          title: "Batch Added Successfully",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      })
      .addCase(addBatch.rejected, (state, action) => {
        state.addStatus = "failure";
        state.error.push(action.error.message);
        toast({
          title: "Batch Adding Failed",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      })

      // Update Batch
      .addCase(updateBatch.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateBatch.fulfilled, (state, action) => {
        state.updateStatus = "success";
        const index = state.batches.findIndex(
          (batch) => batch._id === action.payload._id
        );
        if (index !== -1) {
          state.batches[index] = {
            ...state.batches[index],
            ...action.payload,
          };
        }
        const studentsDeactivated = action.payload.students_deactivated_count || 0;
        toast({
          title:
            studentsDeactivated > 0
              ? `Batch updated. ${studentsDeactivated} student(s) also deactivated.`
              : "Batch Updated Successfully",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      })
      .addCase(updateBatch.rejected, (state, action) => {
        state.updateStatus = "failure";
        state.error.push(action.error.message);
        toast({
          title: "Batch Update Failed",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      })

      .addCase(toggleBatchStatus.pending, (state) => {
        state.toggleBatchStatusStatus = "loading";
      })
      .addCase(toggleBatchStatus.fulfilled, (state, action) => {
        state.toggleBatchStatusStatus = "success";
        const index = state.batches.findIndex(
          (batch) => batch._id === action.payload._id
        );
        if (index !== -1) {
          state.batches[index] = {
            ...state.batches[index],
            ...action.payload,
          };
        }
        toast({
          title:
            action.payload.is_active !== false
              ? "Batch activated successfully"
              : action.payload.students_deactivated_count
              ? `Batch deactivated. ${action.payload.students_deactivated_count} student(s) also deactivated.`
              : "Batch deactivated successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(toggleBatchStatus.rejected, (state, action) => {
        state.toggleBatchStatusStatus = "failure";
        state.error.push(action.error.message);
        toast({
          title: action.error.message || "Failed to update batch status",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })

      // Delete Batch
      .addCase(deleteBatch.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteBatch.fulfilled, (state, action) => {
        state.deleteStatus = "success";
        toast({
          title: "Batch Deleted Successfully",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      })
      .addCase(deleteBatch.rejected, (state, action) => {
        state.deleteStatus = "failure";
        state.error.push(action.error.message);
        toast({
          title: "Batch Deletion Failed",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      })

      // Assign Courses to Batch
      .addCase(assignCoursesToBatch.pending, (state) => {
        state.assignCoursesStatus = "loading";
      })
      .addCase(assignCoursesToBatch.fulfilled, (state, action) => {
        state.assignCoursesStatus = "success";
        toast({
          title: "Courses Assigned Successfully",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      })
      .addCase(assignCoursesToBatch.rejected, (state, action) => {
        state.assignCoursesStatus = "failure";
        state.error.push(action.error.message);
        toast({
          title: "Courses Assignment Failed",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      })

      // Get Batch Courses
      .addCase(fetchBatchCourses.pending, (state) => {
        state.fetchBatchCoursesStatus = "loading";
      })
      .addCase(fetchBatchCourses.fulfilled, (state, action) => {
        state.fetchBatchCoursesStatus = "success";
        state.batchCourses = action.payload;
      })
      .addCase(fetchBatchCourses.rejected, (state, action) => {
        state.fetchBatchCoursesStatus = "failure";
        state.error.push(action.error.message);
      })

      // Assign Teachers to Batch
      .addCase(assignTeachersToBatch.pending, (state) => {
        state.assignTeachersStatus = "loading";
      })
      .addCase(assignTeachersToBatch.fulfilled, (state, action) => {
        state.assignTeachersStatus = "success";
        toast({
          title: "Teachers Assigned Successfully",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      })
      .addCase(assignTeachersToBatch.rejected, (state, action) => {
        state.assignTeachersStatus = "failure";
        state.error.push(action.error.message);
        toast({
          title: "Teachers Assignment Failed",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      })

      // Get Batch Teachers
      .addCase(fetchBatchTeachers.pending, (state) => {
        state.fetchBatchTeachersStatus = "loading";
      })
      .addCase(fetchBatchTeachers.fulfilled, (state, action) => {
        state.fetchBatchTeachersStatus = "success";
        state.batchTeachers = action.payload;
      })
      .addCase(fetchBatchTeachers.rejected, (state, action) => {
        state.fetchBatchTeachersStatus = "failure";
        state.error.push(action.error.message);
      })

      .addCase(fetchBatchTeacherAssignments.pending, (state) => {
        state.fetchBatchTeacherAssignmentsStatus = "loading";
      })
      .addCase(fetchBatchTeacherAssignments.fulfilled, (state, action) => {
        state.fetchBatchTeacherAssignmentsStatus = "success";
        state.batchTeacherAssignments = action.payload;
      })
      .addCase(fetchBatchTeacherAssignments.rejected, (state, action) => {
        state.fetchBatchTeacherAssignmentsStatus = "failure";
        state.error.push(action.error.message);
      })

      .addCase(assignTeacherCoursesToBatch.pending, (state) => {
        state.assignTeacherCoursesStatus = "loading";
      })
      .addCase(assignTeacherCoursesToBatch.fulfilled, (state, action) => {
        state.assignTeacherCoursesStatus = "success";
        state.batchTeacherAssignments = action.payload;
        toast({
          title: "Teachers assigned to courses successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(assignTeacherCoursesToBatch.rejected, (state, action) => {
        state.assignTeacherCoursesStatus = "failure";
        state.error.push(action.error.message);
        toast({
          title: action.error.message || "Teacher assignment failed",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  },
});

export const selectAllBatches = (state) => state.batches.batches;
export const selectActiveBatches = (state) =>
  state.batches.batches.filter((batch) => batch.is_active !== false);

export const filterActiveBatches = (batches = []) =>
  batches.filter((batch) => batch?.is_active !== false);
export const selectBatchCourses = (state) => state.batches.batchCourses;
export const selectBatchTeachers = (state) => state.batches.batchTeachers;
export const selectBatchTeacherAssignments = (state) =>
  state.batches.batchTeacherAssignments;

export const selectCurrentActiveBatch = (state) => {
  const batches = state.batches.batches;
  const currentDate = moment();
  return batches.find((batch) => currentDate.isBetween(moment(batch.startdate), moment(batch.enddate)));
};

export {
  fetchBatches,
  addBatch,
  updateBatch,
  deleteBatch,
  toggleBatchStatus,
  assignCoursesToBatch,
  fetchBatchCourses,
  assignTeachersToBatch,
  fetchBatchTeachers,
  fetchBatchTeacherAssignments,
  assignTeacherCoursesToBatch,
};
export const { setQueryFilter, setPageFilter, setLimitFilter, setStatusFilter, setBatchTypeFilter, setStartDateFilter, setEndDateFilter, clearBatchFilters } = batchSlice.actions;

export default batchSlice.reducer;
