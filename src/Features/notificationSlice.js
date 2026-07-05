import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { config } from "../utlls/config.js";

const BASE_URL = config.BASE_URL;

const initialState = {
  notifications: [],
  unreadCount: 0,
  pagination: { page: 1, totalPages: 1, totalDocs: 0 },
  fetchStatus: "idle",
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ authToken, page = 1, limit = 20, unread_only, read_filter, type }) => {
    const params = { page, limit };

    if (read_filter === "unread" || unread_only === true) {
      params.unread_only = "true";
    } else if (read_filter === "read") {
      params.read_only = "true";
    }

    if (type && type !== "all") {
      params.type = type;
    }

    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params,
    });
    return response.data;
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async ({ authToken, id }) => {
    const response = await fetch(`${BASE_URL}/notifications/read/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to mark read");
    return data;
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async ({ authToken }) => {
    const response = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to mark all read");
    return data;
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.notifications = action.payload.docs || [];
        state.unreadCount =
          typeof action.payload.unreadCount === "number"
            ? action.payload.unreadCount
            : state.notifications.filter((n) => !n.is_read).length;
        state.pagination = {
          page: action.payload.page,
          totalPages: action.payload.totalPages,
          totalDocs: action.payload.totalDocs,
        };
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.fetchStatus = "failed";
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const idx = state.notifications.findIndex((n) => n._id === action.payload._id);
        if (idx !== -1) {
          const wasUnread = !state.notifications[idx].is_read;
          state.notifications[idx] = action.payload;
          if (wasUnread && state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          is_read: true,
        }));
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
