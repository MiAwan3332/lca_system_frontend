import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
    seminarAttendees: [],
    fetchStatus: 'idle',
    error: null,
};

const fetchAttendeesBySeminar = createAsyncThunk('seminarAttendees/fetchAttendeesBySeminar', async (payload) => {
    const { authToken, seminarId } = payload;
    const response = await fetch(`${BASE_URL}/attendees/seminar/${seminarId}`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        }
    });
    const data = await response.json();
    return data;
});

const seminarAttendeeSlice = createSlice({
    name: 'seminarAttendees',
    initialState,
    reducers: {
        resetAttendees: (state) => {
            state.seminarAttendees = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Seminar Attendees By Seminar ID
            .addCase(fetchAttendeesBySeminar.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchAttendeesBySeminar.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';
                state.seminarAttendees = action.payload;
            })
            .addCase(fetchAttendeesBySeminar.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.error = action.error.message;
                toast({
                    title: "Error",
                    description: action.error.message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            });
    }
});

export const selectSeminarAttendees = (state) => state.seminarAttendees.seminarAttendees;

export { fetchAttendeesBySeminar };

export default seminarAttendeeSlice.reducer;
