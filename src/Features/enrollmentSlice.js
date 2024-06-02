import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
    enrollments: [],
    studentEnrollments: [],
    fetchEnrollmentsStatus: "idle",
    createEnrollmentStatus: "idle",
    fetchStudentEnrollmentsStatus: "idle",
};

const fetchEnrollments = createAsyncThunk(
    'enrollments/fetchEnrollments',
    async () => {
        const { authToken } = payload;
        const response = await fetch(`${BASE_URL}/enrollments`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        const data = await response.json();
        return data;
    }
);

const createEnrollment = createAsyncThunk(
    'enrollments/createEnrollment',
    async (payload) => {
        const { authToken, studentId, batchId, courseIds } = payload;
        const response = await fetch(`${BASE_URL}/enrollments/add`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: studentId,
                batch_id: batchId,
                course_ids: courseIds,
            }),
        });
        const data = await response.json();
        return data;
    }
);

const fetchStudentEnrollments = createAsyncThunk(
    'enrollments/fetchStudentEnrollments',
    async (payload) => {
        const { authToken, studentId } = payload;
        const response = await fetch(`${BASE_URL}/enrollments/student/${studentId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        const data = await response.json();
        return data;
    }
);

const enrollmentSlice = createSlice({
    name: 'enrollments',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Enrollments
            .addCase(fetchEnrollments.pending, (state) => {
                state.fetchEnrollmentsStatus = 'loading';
            })
            .addCase(fetchEnrollments.fulfilled, (state, action) => {
                state.fetchEnrollmentsStatus = 'succeeded';
                state.enrollments = action.payload;
            })
            .addCase(fetchEnrollments.rejected, (state, action) => {
                state.fetchEnrollmentsStatus = 'failed';
                toast({
                    title: 'Error',
                    description: action.error.message,
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                });
            })

            // Create Enrollment
            .addCase(createEnrollment.pending, (state) => {
                state.createEnrollmentStatus = 'loading';
            })
            .addCase(createEnrollment.fulfilled, (state, action) => {
                state.createEnrollmentStatus = 'succeeded';
                toast({
                    title: 'Enrollment Created',
                    description: 'The enrollment has been created successfully.',
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                });
            })
            .addCase(createEnrollment.rejected, (state, action) => {
                state.createEnrollmentStatus = 'failed';
                toast({
                    title: 'Error',
                    description: action.error.message,
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                });
            })

            // Fetch Student Enrollments
            .addCase(fetchStudentEnrollments.pending, (state) => {
                state.fetchStudentEnrollmentsStatus = 'loading';
            })
            .addCase(fetchStudentEnrollments.fulfilled, (state, action) => {
                state.fetchStudentEnrollmentsStatus = 'succeeded';
                state.studentEnrollments = action.payload;
            })
            .addCase(fetchStudentEnrollments.rejected, (state, action) => {
                state.fetchStudentEnrollmentsStatus = 'failed';
                toast({
                    title: 'Error',
                    description: action.error.message,
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                });
            });
    },
});

export { fetchEnrollments, createEnrollment, fetchStudentEnrollments };

export default enrollmentSlice.reducer;