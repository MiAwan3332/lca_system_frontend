import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
    students: [],
    fetchStatus: 'idle',
    addStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    error: null,
};

const fetchStudents = createAsyncThunk('students/fetchStudents', async (payload) => {
    const { authToken } = payload;
    const response = await fetch(`${BASE_URL}/students`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        }
    });
    const data = await response.json();
    return data;
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
    reducers: {},

    extraReducers: (builder) => {
        builder
            // Fetch students
            .addCase(fetchStudents.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchStudents.fulfilled, (state, action) => {
                state.fetchStatus = 'success';
                state.students = action.payload;
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

export { fetchStudents, addStudent, updateStudent, deleteStudent };

export default studentSlice.reducer;
