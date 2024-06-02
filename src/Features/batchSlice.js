import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
  batches: [],
  batchCourses: [],
  batchTeachers: [],
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  assignCoursesStatus: "idle",
  fetchBatchCoursesStatus: "idle",
  assignTeachersStatus: "idle",
  fetchBatchTeachersStatus: "idle",
  error: [],
};

const fetchBatches = createAsyncThunk(
  "batches/fetchBatches",
  async (payload) => {
    const { authToken } = payload;
    const response = await fetch(`${BASE_URL}/batches`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    return data;
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

const batchSlice = createSlice({
  name: "batches",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      // Fetch Batches
      .addCase(fetchBatches.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.batches = action.payload;
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
        toast({
          title: "Batch Updated Successfully",
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
      });
  },
});

export const selectAllBatches = (state) => state.batches.batches;
export const selectBatchCourses = (state) => state.batches.batchCourses;
export const selectBatchTeachers = (state) => state.batches.batchTeachers;

export {
  fetchBatches,
  addBatch,
  updateBatch,
  deleteBatch,
  assignCoursesToBatch,
  fetchBatchCourses,
  assignTeachersToBatch,
  fetchBatchTeachers,
};

export default batchSlice.reducer;
