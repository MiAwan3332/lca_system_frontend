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
    students: [],
    filters: TABLE_FILTERS,
    pagination: TABLE_PAGINATION,
    fetchStatus: 'idle',
    addStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    error: null,
};

const fetchStudents = createAsyncThunk('students/fetchStudents', async (payload, { getState }) => {
    const state = getState();
    const { authToken } = payload;
    const response = await axios.get(`${BASE_URL}/students`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
        params: state.students.filters,
    });
    return response.data;
});

const addStudent = createAsyncThunk('students/addStudent', async (payload) => {
    const { authToken, student } = payload;
    const response = await fetch(`${BASE_URL}/students/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(student),
    });
    const data = await response.json();
    return data;
});

const updateStudent = createAsyncThunk('students/updateStudent', async (payload) => {
    const { authToken, student } = payload;
    const response = await fetch(`${BASE_URL}/students/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(student),
    });
    const data = await response.json();
    return data;
});

const basicUpdate = createAsyncThunk('students/basicUpdate', async (payload) => {
    const { authToken, studentId, student } = payload;
    const response = await fetch(`${BASE_URL}/students/basic-update/${studentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(student),
    });
    const data = await response.json();
    return data;
});

const deleteStudent = createAsyncThunk('students/deleteStudent', async (payload) => {
    const { authToken, studentId } = payload;
    const response = await fetch(`${BASE_URL}/students/delete/${studentId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${authToken}`,
        }
    });
    const data = await response.json();
    return data;
});

const studentSlice = createSlice({
    name: 'students',
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
        setBatchFilter(state, action) {
            state.filters.batch = action.payload;
        },
    },

    extraReducers: (builder) => {
        builder
            // Fetch students
            .addCase(fetchStudents.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchStudents.fulfilled, (state, action) => {
                state.fetchStatus = 'success';
                state.students = action.payload.docs;
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
            .addCase(fetchStudents.rejected, (state, action) => {
                state.fetchStatus = 'failure';
                state.error = action.error.message;
            })

            // Add student
            .addCase(addStudent.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(addStudent.fulfilled, (state, action) => {
                state.addStatus = 'success';
                toast({
                    title: "Student added successfully!",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(addStudent.rejected, (state, action) => {
                state.addStatus = 'failure';
                state.error = action.error.message;
            })

            // Update student
            .addCase(updateStudent.pending, (state) => {
                state.updateStatus = 'loading';
            })
            .addCase(updateStudent.fulfilled, (state, action) => {
                state.updateStatus = 'success';
                toast({
                    title: "Student updated successfully!",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(updateStudent.rejected, (state, action) => {
                state.updateStatus = 'failure';
                state.error = action.error.message;
            })

            // Basic update student
            .addCase(basicUpdate.pending, (state) => {
                state.updateStatus = 'loading';
            })
            .addCase(basicUpdate.fulfilled, (state, action) => {
                state.updateStatus = 'success';
                toast({
                    title: "Student updated successfully!",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(basicUpdate.rejected, (state, action) => {
                state.updateStatus = 'failure';
                state.error = action.error.message;
            })

            // Delete student
            .addCase(deleteStudent.pending, (state) => {
                state.deleteStatus = 'loading';
            })
            .addCase(deleteStudent.fulfilled, (state, action) => {
                state.deleteStatus = 'success';
                toast({
                    title: "Student deleted successfully!",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(deleteStudent.rejected, (state, action) => {
                state.deleteStatus = 'failure';
                state.error = action.error.message;
            })
    }
});

export const selectAllStudents = (state) => state.students.students;

export { fetchStudents, addStudent, updateStudent, basicUpdate, deleteStudent };
export const { setQueryFilter, setPageFilter, setLimitFilter,setBatchFilter } = studentSlice.actions;

export default studentSlice.reducer;
