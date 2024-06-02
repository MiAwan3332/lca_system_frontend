import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;

const initialState = {
    courses: [],
    fetchStatus: 'idle',
    addStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    error: null,
};

const fetchCourses = createAsyncThunk('courses/fetchCourses', async (payload) => {
    const { authToken } = payload;
    const response = await fetch(`${BASE_URL}/courses`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        }
    });
    const data = await response.json();
    return data;
});

const addCourse = createAsyncThunk('courses/addCourse', async (payload) => {
    const { authToken, course } = payload;
    const response = await fetch(`${BASE_URL}/courses/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(course),
    });
    const data = await response.json();
    return data;
});

const updateCourse = createAsyncThunk('courses/updateCourse', async (payload) => {
    const { authToken, course, id } = payload;
    const response = await fetch(`${BASE_URL}/courses/update/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(course),
    });
    const data = await response.json();
    return data;
});

const deleteCourse = createAsyncThunk('courses/deleteCourse', async (payload) => {
    const { authToken, courseId } = payload;
    const response = await fetch(`${BASE_URL}/courses/delete/${courseId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${authToken}`,
        }
    });
    const data = await response.json();
    return data;
});

const courseSlice = createSlice({
    name: 'courses',
    initialState,
    reducers: {},

    extraReducers: (builder) => {
        builder
            // Fetch courses
            .addCase(fetchCourses.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchCourses.fulfilled, (state, action) => {
                state.fetchStatus = 'success';
                state.courses = action.payload;
            })
            .addCase(fetchCourses.rejected, (state, action) => {
                state.fetchStatus = 'failure';
                state.error = action.error.message;
            })

            // Add course
            .addCase(addCourse.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(addCourse.fulfilled, (state, action) => {
                state.addStatus = 'success';
                toast({
                    title: "Course added.",
                    addStatus: "success",
                    duration: 9000,
                    isClosable: true,
                });
            })
            .addCase(addCourse.rejected, (state, action) => {
                state.addStatus = 'failure';
                state.error = action.error.message;
            })

            // Update course
            .addCase(updateCourse.pending, (state) => {
                state.updateStatus = 'loading';
            })
            .addCase(updateCourse.fulfilled, (state, action) => {
                state.updateStatus = 'success';
                toast({
                    title: "Course updated.",
                    updateStatus: "success",
                    duration: 9000,
                    isClosable: true,
                });
            })
            .addCase(updateCourse.rejected, (state, action) => {
                state.updateStatus = 'failure';
                state.error = action.error.message;
            })

            // Delete course
            .addCase(deleteCourse.pending, (state) => {
                state.deleteStatus = 'loading';
            })
            .addCase(deleteCourse.fulfilled, (state, action) => {
                state.deleteStatus = 'success';
                toast({
                    title: "Course deleted.",
                    deleteStatus: "success",
                    duration: 9000,
                    isClosable: true,
                });
            })
            .addCase(deleteCourse.rejected, (state, action) => {
                state.deleteStatus = 'failure';
                state.error = action.error.message;
            });
    }
});

export const selectAllCourses = (state) => state.courses.courses;

export { fetchCourses, addCourse, updateCourse, deleteCourse };

export default courseSlice.reducer;