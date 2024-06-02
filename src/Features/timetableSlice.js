import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
  events: [],
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

const fetchTimeTableEvents = createAsyncThunk(
  "timetable/fetchTimeTableEvents",
  async ({ authToken }) => {
    const response = await fetch(`${BASE_URL}/timetable`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    return data;
  }
);

const addTimeTableEvent = createAsyncThunk(
  "timetable/addTimeTableEvent",
  async ({ authToken, timeTable }) => {
    const response = await fetch(`${BASE_URL}/timetable/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(timeTable),
    });
    const data = await response.json();
    return data;
  }
);

const updateTimeTableEvent = createAsyncThunk(
  "timetable/updateTimeTableEvent",
  async ({ authToken, timeTable }) => {
    const response = await fetch(`${BASE_URL}/timetable/update/${timeTable._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(timeTable),
    });
    const data = await response.json();
    return data;
  }
);

const deleteTimeTableEvent = createAsyncThunk(
  "timetable/deleteTimeTableEvent",
  async ({ authToken, id }) => {
    const response = await fetch(`${BASE_URL}/timetable/delete/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    return data;
  }
);

const timetableSlice = createSlice({
  name: "timetable",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch timetable events
      .addCase(fetchTimeTableEvents.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchTimeTableEvents.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.events = action.payload;
      })
      .addCase(fetchTimeTableEvents.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.error.message;
      })

      // Add timetable event
      .addCase(addTimeTableEvent.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addTimeTableEvent.fulfilled, (state, action) => {
        state.addStatus = "succeeded";
        toast({
          title: "Event added successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(addTimeTableEvent.rejected, (state, action) => {
        state.addStatus = "failed";
        state.error = action.error.message;
      })

      // Update timetable event
      .addCase(updateTimeTableEvent.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateTimeTableEvent.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        toast({
          title: "Event updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(updateTimeTableEvent.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.error.message;
      })

      // Delete timetable event
      .addCase(deleteTimeTableEvent.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteTimeTableEvent.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        toast({
          title: "Event deleted successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(deleteTimeTableEvent.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const selectTimeTableEvents = (state) => state.timetable.events;

export { fetchTimeTableEvents, addTimeTableEvent, updateTimeTableEvent, deleteTimeTableEvent };

export default timetableSlice.reducer;