import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { config } from "../utlls/config.js";
import axios from "axios";

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  attendances: [],
  filters: TABLE_FILTERS,
  pagination: TABLE_PAGINATION,
  status: "idle",
};

const fetchAttendances = createAsyncThunk(
  "attendances/fetchAll",
  async (payload, { getState }) => {
    const state = getState();
    const { authToken, course_id, batch_id, date, start_date, end_date } = payload;
    const response = await axios.get(`${BASE_URL}/attendence`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: {
        ...state.attendance.filters,
        course_id,
        batch_id,
        date,
        start_date,
        end_date,
      }
    });
    return response.data;
  }
);

const attendanceSlice = createSlice({
  name: "attendance",
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
    addAttendance: (state, action) => {
      state.attendances.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendances.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAttendances.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.attendances = action.payload.docs;
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
      .addCase(fetchAttendances.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export const selectAttendances = (state) => state.attendance.attendances;

export { fetchAttendances };
export const { setQueryFilter, setPageFilter, setLimitFilter } =
  attendanceSlice.actions;

export default attendanceSlice.reducer;
