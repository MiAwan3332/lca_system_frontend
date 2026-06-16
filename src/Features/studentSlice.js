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
    filters: {
        ...TABLE_FILTERS,
        batch_id: "",
        enrollment_status: "",
        start_date: "",
        end_date: "",
        city: "",
        search_field: "all",
    },
    pagination: TABLE_PAGINATION,
    fetchStatus: 'idle',
    addStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    changePasswordStatus: 'idle',
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

const fetchStudentsByBatch = createAsyncThunk('students/fetchStudentsByBatch', async (payload, { getState }) => {
    const state = getState();
    const { authToken, batchId } = payload;
    const response = await axios.get(`${BASE_URL}/students/batch/${batchId}`, {
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

const updateStudentInfo = createAsyncThunk(
    'students/updateStudentInfo',
    async (payload, { rejectWithValue }) => {
        const { authToken, studentId, formData } = payload;
        try {
            const response = await axios.post(
                `${BASE_URL}/students/studentInfoUpdate/${studentId}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to update profile'
            );
        }
    }
);

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

const changeStudentPassword = createAsyncThunk(
    'students/changeStudentPassword',
    async (payload) => {
        const { authToken, studentId, password } = payload;
        const response = await axios.post(
            `${BASE_URL}/students/change-password/${studentId}`,
            { password },
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );
        return response.data;
    }
);

const studentSlice = createSlice({
    name: 'students',
    initialState,
    reducers: {
        setQueryFilter(state, action) {
            state.filters.query = action.payload;
            state.filters.page = 1;
        },
        setPageFilter(state, action) {
            state.filters.page = action.payload;
        },
        setLimitFilter(state, action) {
            state.filters.page = 1;
            state.filters.limit = action.payload;
        },
        setBatchFilter(state, action) {
            state.filters.page = 1;
            state.filters.batch_id = action.payload;
        },
        setEnrollmentFilter(state, action) {
            state.filters.page = 1;
            state.filters.enrollment_status = action.payload;
        },
        setStartDateFilter(state, action) {
            state.filters.page = 1;
            state.filters.start_date = action.payload;
        },
        setEndDateFilter(state, action) {
            state.filters.page = 1;
            state.filters.end_date = action.payload;
        },
        setCityFilter(state, action) {
            state.filters.page = 1;
            state.filters.city = action.payload;
        },
        setSearchFieldFilter(state, action) {
            state.filters.page = 1;
            state.filters.search_field = action.payload;
        },
        clearStudentFilters(state) {
            state.filters.page = 1;
            state.filters.query = "";
            state.filters.search_field = "all";
            state.filters.batch_id = "";
            state.filters.enrollment_status = "";
            state.filters.start_date = "";
            state.filters.end_date = "";
            state.filters.city = "";
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

            // Fetch students by batch
            .addCase(fetchStudentsByBatch.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchStudentsByBatch.fulfilled, (state, action) => {
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
            .addCase(fetchStudentsByBatch.rejected, (state, action) => {
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

            .addCase(updateStudentInfo.pending, (state) => {
                state.updateStatus = 'loading';
            })
            .addCase(updateStudentInfo.fulfilled, (state) => {
                state.updateStatus = 'success';
                toast({
                    title: "Profile updated successfully!",
                    description: "This was your one-time profile update.",
                    status: "success",
                    duration: 4000,
                    isClosable: true,
                });
            })
            .addCase(updateStudentInfo.rejected, (state, action) => {
                state.updateStatus = 'failure';
                state.error = action.payload || action.error.message;
                toast({
                    title: "Profile update failed",
                    description: action.payload || action.error.message,
                    status: "error",
                    duration: 4000,
                    isClosable: true,
                });
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

            // Change student password
            .addCase(changeStudentPassword.pending, (state) => {
                state.changePasswordStatus = 'loading';
            })
            .addCase(changeStudentPassword.fulfilled, (state) => {
                state.changePasswordStatus = 'success';
                toast({
                    title: "Student password updated successfully!",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .addCase(changeStudentPassword.rejected, (state, action) => {
                state.changePasswordStatus = 'failure';
                state.error = action.error.message;
                toast({
                    title: "Failed to update password",
                    description: action.error.message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            })
    }
});

export const selectAllStudents = (state) => state.students.students;

export { fetchStudents, fetchStudentsByBatch, addStudent, updateStudent, basicUpdate, updateStudentInfo, deleteStudent, changeStudentPassword };
export const { setQueryFilter, setPageFilter, setLimitFilter, setBatchFilter, setEnrollmentFilter, setStartDateFilter, setEndDateFilter, setCityFilter, setSearchFieldFilter, clearStudentFilters } = studentSlice.actions;

export default studentSlice.reducer;
