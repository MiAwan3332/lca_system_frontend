import { accessFetch as fetch } from '../utlls/accessRequests';
import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";
import axios from 'axios';

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
    permissions: [],
    filters: TABLE_FILTERS,
    pagination: TABLE_PAGINATION,
    fetchStatus: 'idle',
    addStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    error: null,
};

const fetchPermissions = createAsyncThunk('permissions/fetchPermissions', async (payload, { getState }) => {
    const state = getState();
    const { authToken } = payload;
    const response = await axios.get(`${BASE_URL}/permissions`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
        params: state.permissions.filters,
    });
    return response.data;
});

const addPermission = createAsyncThunk('permissions/addPermission', async (payload) => {
    const { authToken, permission } = payload;
    const response = await fetch(`${BASE_URL}/permissions/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(permission),
    });
    const data = await response.json();
    return data;
});

const updatePermission = createAsyncThunk('permissions/updatePermission', async (payload) => {
    const { authToken, permission, id } = payload;
    const response = await fetch(`${BASE_URL}/permissions/update/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(permission),
    });
    const data = await response.json();
    return data;
});

const deletePermission = createAsyncThunk('permissions/deletePermission', async (payload) => {
    const { authToken, id } = payload;
    const response = await fetch(`${BASE_URL}/permissions/delete/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    const data = await response.json();
    return data;
});

const permissionSlice = createSlice({
    name: 'permissions',
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
            // Fetch permissions
            .addCase(fetchPermissions.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchPermissions.fulfilled, (state, action) => {
                state.fetchStatus = 'success';
                state.permissions = action.payload.docs;
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
            .addCase(fetchPermissions.rejected, (state, action) => {
                state.fetchStatus = 'failure';
                state.error = action.error.message;
            })

            // Add permission
            .addCase(addPermission.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(addPermission.fulfilled, (state, action) => {
                state.addStatus = 'success';
                toast({
                    title: 'Permission added successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(addPermission.rejected, (state, action) => {
                state.addStatus = 'failure';
                state.error = action.error.message;
            })

            // Update permission
            .addCase(updatePermission.pending, (state) => {
                state.updateStatus = 'loading';
            })
            .addCase(updatePermission.fulfilled, (state, action) => {
                state.updateStatus = 'success';
                toast({
                    title: 'Permission updated successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(updatePermission.rejected, (state, action) => {
                state.updateStatus = 'failure';
                state.error = action.error.message;
            })

            // Delete permission
            .addCase(deletePermission.pending, (state) => {
                state.deleteStatus = 'loading';
            })
            .addCase(deletePermission.fulfilled, (state, action) => {
                state.deleteStatus = 'success';
                toast({
                    title: 'Permission deleted successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(deletePermission.rejected, (state, action) => {
                state.deleteStatus = 'failure';
                state.error = action.error.message;
            });
    }
});

export const selectAllPermissions = (state) => state.permissions.permissions;

export { fetchPermissions, addPermission, updatePermission, deletePermission };
export const { setQueryFilter, setPageFilter, setLimitFilter } = permissionSlice.actions;

export default permissionSlice.reducer;
