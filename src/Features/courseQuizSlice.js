import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import axios from "axios";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();
const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  quizzes: [],
  attempts: [],
  batchCourses: [],
  activeAttempt: null,
  activeQuestions: [],
  selectedQuiz: null,
  filters: TABLE_FILTERS,
  pagination: TABLE_PAGINATION,
  attemptsPagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  attemptsStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  publishStatus: "idle",
  startStatus: "idle",
  submitStatus: "idle",
  reviewStatus: "idle",
  error: null,
};

export const fetchCourseQuizzes = createAsyncThunk(
  "courseQuizzes/fetchCourseQuizzes",
  async (payload, { getState }) => {
    const { authToken, ...extraParams } = payload;
    const state = getState();
    const response = await axios.get(`${BASE_URL}/course-quizzes`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { ...state.courseQuizzes.filters, ...extraParams },
    });
    return response.data;
  }
);

export const fetchCourseQuizById = createAsyncThunk(
  "courseQuizzes/fetchCourseQuizById",
  async ({ authToken, id }) => {
    const response = await axios.get(`${BASE_URL}/course-quizzes/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  }
);

export const fetchBatchCoursesForQuiz = createAsyncThunk(
  "courseQuizzes/fetchBatchCourses",
  async ({ authToken, batchId }) => {
    const response = await axios.get(
      `${BASE_URL}/course-quizzes/batch/${batchId}/courses`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  }
);

export const addCourseQuiz = createAsyncThunk(
  "courseQuizzes/addCourseQuiz",
  async ({ authToken, quiz }) => {
    const response = await fetch(`${BASE_URL}/course-quizzes/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quiz),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create quiz");
    return data;
  }
);

export const updateCourseQuiz = createAsyncThunk(
  "courseQuizzes/updateCourseQuiz",
  async ({ authToken, id, quiz }) => {
    const response = await fetch(`${BASE_URL}/course-quizzes/update/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quiz),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update quiz");
    return data;
  }
);

export const publishCourseQuiz = createAsyncThunk(
  "courseQuizzes/publishCourseQuiz",
  async ({ authToken, id }) => {
    const response = await fetch(`${BASE_URL}/course-quizzes/publish/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to publish quiz");
    return data;
  }
);

export const deleteCourseQuiz = createAsyncThunk(
  "courseQuizzes/deleteCourseQuiz",
  async ({ authToken, id }) => {
    const response = await fetch(`${BASE_URL}/course-quizzes/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete quiz");
    return data;
  }
);

export const startCourseQuizAttempt = createAsyncThunk(
  "courseQuizzes/startAttempt",
  async ({ authToken, quizId }) => {
    const response = await fetch(`${BASE_URL}/course-quizzes/${quizId}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to start quiz");
    return data;
  }
);

export const saveCourseQuizAnswer = createAsyncThunk(
  "courseQuizzes/saveAnswer",
  async ({ authToken, attemptId, answer }) => {
    const response = await fetch(
      `${BASE_URL}/course-quizzes/attempts/${attemptId}/answer`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(answer),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to save answer");
    return data;
  }
);

export const submitCourseQuizAttempt = createAsyncThunk(
  "courseQuizzes/submitAttempt",
  async ({ authToken, attemptId }) => {
    const response = await fetch(
      `${BASE_URL}/course-quizzes/attempts/${attemptId}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to submit quiz");
    return data;
  }
);

export const fetchCourseQuizAttempts = createAsyncThunk(
  "courseQuizzes/fetchAttempts",
  async ({ authToken, quiz_id, status }) => {
    const response = await axios.get(`${BASE_URL}/course-quizzes/attempts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { quiz_id, status },
    });
    return response.data;
  }
);

export const reviewCourseQuizAttempt = createAsyncThunk(
  "courseQuizzes/reviewAttempt",
  async ({ authToken, id, reviewData }) => {
    const response = await fetch(`${BASE_URL}/course-quizzes/attempts/${id}/review`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to review attempt");
    return data;
  }
);

export const publishCourseQuizResults = createAsyncThunk(
  "courseQuizzes/publishResults",
  async ({ authToken, id }) => {
    const response = await fetch(`${BASE_URL}/course-quizzes/${id}/publish-results`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to publish results");
    return data;
  }
);

const courseQuizSlice = createSlice({
  name: "courseQuizzes",
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
    clearActiveAttempt(state) {
      state.activeAttempt = null;
      state.activeQuestions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseQuizzes.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchCourseQuizzes.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.quizzes = action.payload.docs || [];
        state.pagination = {
          totalDocs: action.payload.totalDocs,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
          page: action.payload.page,
          hasPrevPage: action.payload.hasPrevPage,
          hasNextPage: action.payload.hasNextPage,
        };
      })
      .addCase(fetchCourseQuizzes.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(fetchCourseQuizById.fulfilled, (state, action) => {
        state.selectedQuiz = action.payload;
      })
      .addCase(fetchBatchCoursesForQuiz.fulfilled, (state, action) => {
        state.batchCourses = action.payload;
      })
      .addCase(startCourseQuizAttempt.fulfilled, (state, action) => {
        state.startStatus = "success";
        state.activeAttempt = action.payload.attempt;
        state.activeQuestions = action.payload.questions || [];
      })
      .addCase(startCourseQuizAttempt.rejected, (_, action) => {
        toast({ title: action.error.message, status: "error", duration: 4000 });
      })
      .addCase(fetchCourseQuizAttempts.fulfilled, (state, action) => {
        state.attemptsStatus = "success";
        state.attempts = action.payload.docs || [];
        state.attemptsPagination = {
          totalDocs: action.payload.totalDocs,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(addCourseQuiz.fulfilled, (state, action) => {
        state.addStatus = "success";
        state.quizzes.unshift(action.payload);
        toast({ title: "Quiz created", status: "success", duration: 3000 });
      })
      .addCase(updateCourseQuiz.fulfilled, (state, action) => {
        state.updateStatus = "success";
        const idx = state.quizzes.findIndex((q) => q._id === action.payload._id);
        if (idx !== -1) state.quizzes[idx] = action.payload;
        toast({ title: "Quiz updated", status: "success", duration: 3000 });
      })
      .addCase(publishCourseQuiz.fulfilled, (state, action) => {
        state.publishStatus = "success";
        const idx = state.quizzes.findIndex((q) => q._id === action.payload._id);
        if (idx !== -1) state.quizzes[idx] = action.payload;
        toast({ title: "Quiz published", status: "success", duration: 3000 });
      })
      .addCase(deleteCourseQuiz.fulfilled, (state, action) => {
        state.deleteStatus = "success";
        state.quizzes = state.quizzes.filter((q) => q._id !== action.payload._id);
        toast({ title: "Quiz deleted", status: "success", duration: 3000 });
      })
      .addCase(submitCourseQuizAttempt.fulfilled, (state) => {
        state.submitStatus = "success";
        state.activeAttempt = null;
        state.activeQuestions = [];
        toast({ title: "Quiz submitted", status: "success", duration: 3000 });
      })
      .addCase(reviewCourseQuizAttempt.fulfilled, (state, action) => {
        state.reviewStatus = "success";
        const idx = state.attempts.findIndex((a) => a._id === action.payload._id);
        if (idx !== -1) state.attempts[idx] = action.payload;
        toast({ title: "Attempt reviewed", status: "success", duration: 3000 });
      })
      .addCase(publishCourseQuizResults.fulfilled, () => {
        toast({ title: "Results published", status: "success", duration: 3000 });
      });
  },
});

export const { setQueryFilter, setPageFilter, setLimitFilter, clearActiveAttempt } =
  courseQuizSlice.actions;

export const selectAllCourseQuizzes = createSelector(
  (state) => state.courseQuizzes.quizzes,
  (quizzes) => quizzes
);

export default courseQuizSlice.reducer;
