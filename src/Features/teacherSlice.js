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
  teachers: [],
  filters: {
    ...TABLE_FILTERS,
    search_field: "all",
    batch_id: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

const fetchTeachers = createAsyncThunk(
  "teachers/fetchTeachers",
  async (payload = {}, { getState }) => {
    const state = getState();
    const { authToken, queryParams = {} } = payload;
    const response = await axios.get(`${BASE_URL}/teachers`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: { ...state.teachers.filters, ...queryParams },
    });
    return response.data;
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
    const { teacherId, formData, authToken } = payload;
    const response = await fetch(`${BASE_URL}/teachers/update/${teacherId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData
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
      setSearchFieldFilter(state, action) {
          state.filters.page = 1;
          state.filters.search_field = action.payload;
      },
      setBatchFilter(state, action) {
          state.filters.page = 1;
          state.filters.batch_id = action.payload;
      },
      clearTeacherFilters(state) {
          state.filters.page = 1;
          state.filters.query = "";
          state.filters.search_field = "all";
          state.filters.batch_id = "";
      },
  },

  extraReducers: (builder) => {
    builder
      // Fetch teachers
      .addCase(fetchTeachers.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.teachers = action.payload.docs;
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
export const { setQueryFilter, setPageFilter, setLimitFilter, setSearchFieldFilter, setBatchFilter, clearTeacherFilters } = teacherSlice.actions;

export default teacherSlice.reducer;
