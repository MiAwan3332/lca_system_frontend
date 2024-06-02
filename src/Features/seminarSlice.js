import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
    seminars: [],
    fetchStatus: 'idle',
    addStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    error: null,
};

const fetchSeminars = createAsyncThunk('seminars/fetchSeminars', async (payload) => {
    const { authToken } = payload;
    const response = await fetch(`${BASE_URL}/seminars`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        }
    });
    const data = await response.json();
    return data;
});

const addSeminar = createAsyncThunk('seminars/addseminar', async (payload) => {
    const { authToken, seminar } = payload;
    const response = await fetch(`${BASE_URL}/seminars/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(seminar),
    });
    const data = await response.json();
    return data;
});

const updateSeminar = createAsyncThunk('seminars/updateSeminar', async (payload) => {
    const { authToken, seminar, id } = payload;
    const response = await fetch(`${BASE_URL}/seminars/update/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(seminar),
    });
    const data = await response.json();
    return data;
});

const deleteSeminar = createAsyncThunk('seminars/deleteSeminar', async (payload) => {
    const { authToken, seminarId } = payload;
    const response = await fetch(`${BASE_URL}/seminars/delete/${seminarId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${authToken}`,
        }
    });
    const data = await response.json();
    return data;
});

const seminarSlice = createSlice({
    name: 'seminars',
    initialState,
    reducers: {},

    extraReducers: (builder) => {
        builder
            // Fetch seminars
            .addCase(fetchSeminars.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchSeminars.fulfilled, (state, action) => {
                state.fetchStatus = 'success';
                state.seminars = action.payload;
            })
            .addCase(fetchSeminars.rejected, (state, action) => {
                state.fetchStatus = 'failure';
                state.error = action.error.message;
            })

            // Add seminar
            .addCase(addSeminar.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(addSeminar.fulfilled, (state, action) => {
                state.addStatus = 'success';
                toast({
                    title: "Seminar added.",
                    addStatus: "success",
                    duration: 9000,
                    isClosable: true,
                });
            })
            .addCase(addSeminar.rejected, (state, action) => {
                state.addStatus = 'failure';
                state.error = action.error.message;
            })

            // Update seminar
            .addCase(updateSeminar.pending, (state) => {
                state.updateStatus = 'loading';
            })
            .addCase(updateSeminar.fulfilled, (state, action) => {
                state.updateStatus = 'success';
                toast({
                    title: "Seminar updated.",
                    updateStatus: "success",
                    duration: 9000,
                    isClosable: true,
                });
            })
            .addCase(updateSeminar.rejected, (state, action) => {
                state.updateStatus = 'failure';
                state.error = action.error.message;
            })

            // Delete seminar
            .addCase(deleteSeminar.pending, (state) => {
                state.deleteStatus = 'loading';
            })
            .addCase(deleteSeminar.fulfilled, (state, action) => {
                state.deleteStatus = 'success';
                toast({
                    title: "Seminar deleted.",
                    deleteStatus: "success",
                    duration: 9000,
                    isClosable: true,
                });
            })
            .addCase(deleteSeminar.rejected, (state, action) => {
                state.deleteStatus = 'failure';
                state.error = action.error.message;
            });
    }
});

export const selectAllSeminars = (state) => state.seminars.seminars;

export { fetchSeminars, addSeminar, updateSeminar, deleteSeminar };

export default seminarSlice.reducer;