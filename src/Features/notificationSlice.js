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
  async ({ authToken, page = 1, unread_only = false }) => {
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page, limit: 20, unread_only },
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
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.notifications = action.payload.docs || [];
        state.unreadCount = state.notifications.filter((n) => !n.is_read).length;
        state.pagination = {
          page: action.payload.page,
          totalPages: action.payload.totalPages,
          totalDocs: action.payload.totalDocs,
        };
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const idx = state.notifications.findIndex((n) => n._id === action.payload._id);
        if (idx !== -1) state.notifications[idx] = action.payload;
        state.unreadCount = state.notifications.filter((n) => !n.is_read).length;
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
