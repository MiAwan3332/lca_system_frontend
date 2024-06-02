import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import axios from 'axios';
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
    users: [],
    fetchStatus: 'idle',
    addStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    error: null,
};

const fetchUsers = createAsyncThunk('users/fetchUsers', async (payload) => {
    const { authToken } = payload;
    const response = await axios.get(`${BASE_URL}/users`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        }
    });
    return response.data;
});

const addUser = createAsyncThunk('users/addUser', async (payload) => {
    const { formData, authToken } = payload;
    const response = await axios.post(`${BASE_URL}/users/add`, formData, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    return response.data;
});

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
    reducers: {},

    extraReducers: (builder) => {
        builder
            // Fetch Users
            .addCase(fetchUsers.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';
                state.users = action.payload;
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
                toast({
                    title: 'User added successfully',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            })
            .addCase(addUser.rejected, (state, action) => {
                state.addStatus = 'failed';
                state.error = action.error.message;
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

export default userSlice.reducer;
