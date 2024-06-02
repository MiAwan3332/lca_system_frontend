import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
    roles: [],
    assignedPermissions: [],
    fetchStatus: 'idle',
    addStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    fetchAssignedPermissionsStatus: 'idle',
    assignPermissionsStatus: 'idle',
    error: null,
};

const fetchRoles = createAsyncThunk('roles/fetchRoles', async (payload) => {
    const { authToken } = payload;
    const response = await fetch(`${BASE_URL}/roles`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        }
    });
    const data = await response.json();
    return data;
});

const addRole = createAsyncThunk('roles/addRole', async (payload) => {
    const { authToken, role } = payload;
    const response = await fetch(`${BASE_URL}/roles/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(role),
    });
    const data = await response.json();
    return data;
});

const updateRole = createAsyncThunk('roles/updateRole', async (payload) => {
    const { authToken, role, id } = payload;
    const response = await fetch(`${BASE_URL}/roles/update/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(role),
    });
    const data = await response.json();
    return data;
});

const deleteRole = createAsyncThunk('roles/deleteRole', async (payload) => {
    const { authToken, id } = payload;
    const response = await fetch(`${BASE_URL}/roles/delete/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    const data = await response.json();
    return data;
});

const fetchAssignedPermissions = createAsyncThunk('roles/fetchAssignedPermissions', async (payload) => {
    const { authToken, id } = payload;
    const response = await fetch(`${BASE_URL}/roles/permissions/${id}`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    const data = await response.json();
    return data;
});

const assignPermissions = createAsyncThunk('roles/assignPermissions', async (payload) => {
    const { authToken, roleId, permissions } = payload;
    const response = await fetch(`${BASE_URL}/roles/assignPermissions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ roleId, permissionIds: permissions }),
    });
    const data = await response.json();
    return data;
});

const roleSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {},

    extraReducers: (builder) => {
        builder
            // Fetch roles
            .addCase(fetchRoles.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.fetchStatus = 'success';
                state.roles = action.payload;
            })
            .addCase(fetchRoles.rejected, (state, action) => {
                state.fetchStatus = 'failure';
                state.error = action.error.message;
            })

            // Add role
            .addCase(addRole.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(addRole.fulfilled, (state, action) => {
                state.addStatus = 'success';
                toast({
                    title: "Role added successfully",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(addRole.rejected, (state, action) => {
                state.addStatus = 'failure';
                state.error = action.error.message;
            })

            // Update role
            .addCase(updateRole.pending, (state) => {
                state.updateStatus = 'loading';
            })
            .addCase(updateRole.fulfilled, (state, action) => {
                state.updateStatus = 'success';
                toast({
                    title: "Role updated successfully",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(updateRole.rejected, (state, action) => {
                state.updateStatus = 'failure';
                state.error = action.error.message;
            })

            // Delete role
            .addCase(deleteRole.pending, (state) => {
                state.deleteStatus = 'loading';
            })
            .addCase(deleteRole.fulfilled, (state, action) => {
                state.deleteStatus = 'success';
                toast({
                    title: "Role deleted successfully",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(deleteRole.rejected, (state, action) => {
                state.deleteStatus = 'failure';
                state.error = action.error.message;
            })

            // Fetch assigned permissions
            .addCase(fetchAssignedPermissions.pending, (state) => {
                state.fetchAssignedPermissionsStatus = 'loading';
            })
            .addCase(fetchAssignedPermissions.fulfilled, (state, action) => {
                state.fetchAssignedPermissionsStatus = 'success';
                state.assignedPermissions = action.payload;
            })
            .addCase(fetchAssignedPermissions.rejected, (state, action) => {
                state.fetchAssignedPermissionsStatus = 'failure';
                state.error = action.error.message;
            })

            // Assign permissions
            .addCase(assignPermissions.pending, (state) => {
                state.assignPermissionsStatus = 'loading';
            })
            .addCase(assignPermissions.fulfilled, (state, action) => {
                state.assignPermissionsStatus = 'success';
                toast({
                    title: "Permissions assigned successfully",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(assignPermissions.rejected, (state, action) => {
                state.assignPermissionsStatus = 'failure';
                state.error = action.error.message;
            });
    }
});

export const selectAllRoles = (state) => state.roles.roles;
export const selectAllAssignedPermissions = (state) => state.roles.assignedPermissions;

export { fetchRoles, addRole, updateRole, deleteRole, fetchAssignedPermissions, assignPermissions };

export default roleSlice.reducer;
