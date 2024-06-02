import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
  teachers: [],
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

const fetchTeachers = createAsyncThunk(
  "teachers/fetchTeachers",
  async (payload) => {
    const { authToken } = payload;
    const response = await fetch(`${BASE_URL}/teachers`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    return data;
  }
);

const addTeacher = createAsyncThunk("teachers/addTeacher", async (payload) => {
  const { formData, authToken } = payload;
  const response = await fetch(`${BASE_URL}/teachers/add`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: formData,
  });
  const data = await response.json();
  return data;
});

const updateTeacher = createAsyncThunk(
  "teachers/updateTeacher",
  async (payload) => {
    const { teacherId, values, authToken } = payload;
    const response = await fetch(`${BASE_URL}/teachers/update/${teacherId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    return data;
  }
);

const deleteTeacher = createAsyncThunk(
  "teachers/deleteTeacher",
  async (payload) => {
    const { teacherId, authToken } = payload;
    const response = await fetch(`${BASE_URL}/teachers/delete/${teacherId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    return data;
  }
);

const teacherSlice = createSlice({
  name: "teachers",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      // Fetch teachers
      .addCase(fetchTeachers.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.teachers = action.payload;
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error = action.error.message;
      })

      // Add teacher
      .addCase(addTeacher.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addTeacher.fulfilled, (state, action) => {
        state.addStatus = "success";
        toast({
          title: "Teacher added successfully",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      })
      .addCase(addTeacher.rejected, (state, action) => {
        state.addStatus = "failure";
        state.error = action.error.message;
      })

      // Update teacher
      .addCase(updateTeacher.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateTeacher.fulfilled, (state, action) => {
        state.updateStatus = "success";
        toast({
          title: "Teacher updated successfully",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      })
      .addCase(updateTeacher.rejected, (state, action) => {
        state.updateStatus = "failure";
        state.error = action.error.message;
      })

      // Delete teacher
      .addCase(deleteTeacher.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteTeacher.fulfilled, (state, action) => {
        state.deleteStatus = "success";
        toast({
          title: "Teacher deleted successfully",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      })
      .addCase(deleteTeacher.rejected, (state, action) => {
        state.deleteStatus = "failure";
        state.error = action.error.message;
      });
  },
});

export const selectAllTeachers = (state) => state.teachers.teachers;
export const selectTeacherById = (state, teacherId) =>
  state.teachers.teachers.find((teacher) => teacher.id === teacherId);

export { fetchTeachers, addTeacher, updateTeacher, deleteTeacher };

export default teacherSlice.reducer;
