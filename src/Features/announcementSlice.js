import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import axios from "axios";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();
const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  announcements: [],
  selectedAnnouncement: null,
  filters: {
    ...TABLE_FILTERS,
    batch_id: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

export const fetchAnnouncements = createAsyncThunk(
  "announcements/fetchAnnouncements",
  async (payload, { getState }) => {
    const { authToken } = payload;
    const state = getState();
    const response = await axios.get(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: state.announcements.filters,
    });
    return response.data;
  }
);

export const fetchAnnouncementById = createAsyncThunk(
  "announcements/fetchAnnouncementById",
  async ({ authToken, id }) => {
    const response = await axios.get(`${BASE_URL}/announcements/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  }
);

export const markAnnouncementRead = createAsyncThunk(
  "announcements/markAnnouncementRead",
  async ({ authToken, id }) => {
    const response = await axios.post(`${BASE_URL}/announcements/read/${id}`, null, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return { announcementId: id, ...response.data };
  }
);

export const addAnnouncement = createAsyncThunk(
  "announcements/addAnnouncement",
  async ({ authToken, announcement }) => {
    const response = await axios.post(`${BASE_URL}/announcements/add`, announcement, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  }
);

export const updateAnnouncement = createAsyncThunk(
  "announcements/updateAnnouncement",
  async ({ authToken, id, announcement }) => {
    const response = await axios.put(`${BASE_URL}/announcements/update/${id}`, announcement, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  }
);

export const deleteAnnouncement = createAsyncThunk(
  "announcements/deleteAnnouncement",
  async ({ authToken, id }) => {
    const response = await axios.delete(`${BASE_URL}/announcements/delete/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return { ...response.data, _id: id };
  }
);

const announcementSlice = createSlice({
  name: "announcements",
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
    setBatchFilter(state, action) {
      state.filters.page = 1;
      state.filters.batch_id = action.payload;
    },
    clearAnnouncementFilters(state) {
      state.filters.page = 1;
      state.filters.query = "";
      state.filters.batch_id = "";
    },
    clearSelectedAnnouncement(state) {
      state.selectedAnnouncement = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.announcements = action.payload.docs || [];
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
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(fetchAnnouncementById.fulfilled, (state, action) => {
        state.selectedAnnouncement = action.payload;
        const idx = state.announcements.findIndex((item) => item._id === action.payload._id);
        if (idx !== -1) {
          state.announcements[idx] = {
            ...state.announcements[idx],
            is_read: true,
          };
        }
      })
      .addCase(markAnnouncementRead.fulfilled, (state, action) => {
        const idx = state.announcements.findIndex(
          (item) => item._id === action.payload.announcementId
        );
        if (idx !== -1) {
          state.announcements[idx] = {
            ...state.announcements[idx],
            is_read: true,
          };
        }
      })
      .addCase(addAnnouncement.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addAnnouncement.fulfilled, (state, action) => {
        state.addStatus = "success";
        state.announcements.unshift(action.payload);
        toast({
          title: "Announcement sent",
          description: `Delivered to ${action.payload.recipient_count || 0} student(s).`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(addAnnouncement.rejected, (state, action) => {
        state.addStatus = "failure";
        toast({
          title: "Failed to send announcement",
          description: action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(updateAnnouncement.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        state.updateStatus = "success";
        const idx = state.announcements.findIndex((item) => item._id === action.payload._id);
        if (idx !== -1) {
          state.announcements[idx] = action.payload;
        }
        toast({
          title: "Announcement updated",
          description: "Changes saved successfully.",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(updateAnnouncement.rejected, (state, action) => {
        state.updateStatus = "failure";
        toast({
          title: "Failed to update announcement",
          description: action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.deleteStatus = "success";
        state.announcements = state.announcements.filter(
          (item) => item._id !== action.payload._id
        );
        toast({
          title: "Announcement deleted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      });
  },
});

export const selectAllAnnouncements = createSelector(
  (state) => state.announcements.announcements,
  (announcements) => announcements
);

export const {
  setQueryFilter,
  setPageFilter,
  setLimitFilter,
  setBatchFilter,
  clearAnnouncementFilters,
  clearSelectedAnnouncement,
} = announcementSlice.actions;

export default announcementSlice.reducer;
