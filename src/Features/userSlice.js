import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import axios from 'axios';
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
    users: [],
    filters: TABLE_FILTERS,
    pagination: TABLE_PAGINATION,
    fetchStatus: 'idle',
    addStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    error: null,
};

const fetchUsers = createAsyncThunk('users/fetchUsers', async (payload, { getState }) => {
    const state = getState();
    const { authToken } = payload;
    const response = await axios.get(`${BASE_URL}/users`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
        params: state.users.filters,
    });
    return response.data;
});

const addUser = createAsyncThunk(
    'users/addUser',
    async (payload, { rejectWithValue }) => {
        const { formData, authToken } = payload;
        try {
            const response = await axios.post(`${BASE_URL}/users/add`, formData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error?.response?.data?.message || error.message || "Failed to add user"
            );
        }
    }
);

const updateUser = createAsyncThunk('users/updateUser', async (payload) => {
    const { userId, values, authToken } = payload;
    const response = await axios.post(`${BASE_URL}/users/update/${userId}`, values, {
        headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
    });
    return response.data;
});

const deleteUser = createAsyncThunk('users/deleteUser', async (payload) => {
    const { userId, authToken } = payload;
    const response = await axios.delete(`${BASE_URL}/users/delete/${userId}`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    return response.data;
});

const userSlice = createSlice({
    name: 'users',
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
    },

    extraReducers: (builder) => {
        builder
            // Fetch Users
            .addCase(fetchUsers.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';
                state.users = action.payload.docs;
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
            .addCase(fetchUsers.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.error = action.error.message;
            })

            // Add User
            .addCase(addUser.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(addUser.fulfilled, (state, action) => {
                state.addStatus = 'succeeded';
                const wa = action.payload?.whatsapp_welcome;
                const waNote = wa?.sent
                    ? " Welcome WhatsApp sent."
                    : wa?.skipped || wa?.error
                        ? " (WhatsApp welcome not sent — check Connect / Templates.)"
                        : "";
                toast({
                    title: 'User added successfully',
                    description: waNote.trim() || undefined,
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            })
            .addCase(addUser.rejected, (state, action) => {
                state.addStatus = 'failed';
                state.error = action.payload || action.error.message;
                toast({
                    title: action.payload || action.error.message || 'Failed to add user',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            })

            // Update User
            .addCase(updateUser.pending, (state) => {
                state.updateStatus = 'loading';
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.updateStatus = 'succeeded';
                toast({
                    title: 'User updated successfully',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.updateStatus = 'failed';
                state.error = action.error.message;
            })

            // Delete User
            .addCase(deleteUser.pending, (state) => {
                state.deleteStatus = 'loading';
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.deleteStatus = 'succeeded';
                toast({
                    title: 'User deleted successfully',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.deleteStatus = 'failed';
                state.error = action.error.message;
            });
    }
});

export const selectAllUsers = (state) => state.users.users;
export const selectUserById = (state, userId) => state.users.users.find((user) => user.id === userId);

export { fetchUsers, addUser, updateUser, deleteUser };
export const { setQueryFilter, setPageFilter, setLimitFilter } = userSlice.actions;

export default userSlice.reducer;
