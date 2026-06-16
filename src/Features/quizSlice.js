import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();
const BASE_URL = config.BASE_URL;

const authHeaders = (authToken) => ({
  Authorization: `Bearer ${authToken}`,
});

const initialState = {
  subjects: [],
  currentAttempt: null,
  result: null,
  attempts: [],
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalDocs: 0,
  },
  subjectsStatus: "idle",
  startStatus: "idle",
  attemptStatus: "idle",
  submitStatus: "idle",
  historyStatus: "idle",
  error: null,
};

export const fetchQuizSubjects = createAsyncThunk(
  "quiz/fetchQuizSubjects",
  async ({ authToken }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/quiz/subjects`, {
        headers: authHeaders(authToken),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load subjects"
      );
    }
  }
);

export const startQuizAttempt = createAsyncThunk(
  "quiz/startQuizAttempt",
  async ({ authToken, payload }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/quiz/start`, payload, {
        headers: authHeaders(authToken),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to start quiz"
      );
    }
  }
);

export const fetchQuizAttempt = createAsyncThunk(
  "quiz/fetchQuizAttempt",
  async ({ authToken, attemptId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/quiz/attempts/${attemptId}`, {
        headers: authHeaders(authToken),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load quiz attempt"
      );
    }
  }
);

export const saveQuizAnswer = createAsyncThunk(
  "quiz/saveQuizAnswer",
  async ({ authToken, attemptId, answer }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/quiz/attempts/${attemptId}/answer`,
        answer,
        { headers: authHeaders(authToken) }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save answer"
      );
    }
  }
);

export const submitQuizAttempt = createAsyncThunk(
  "quiz/submitQuizAttempt",
  async ({ authToken, attemptId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/quiz/attempts/${attemptId}/submit`,
        {},
        { headers: authHeaders(authToken) }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit quiz"
      );
    }
  }
);

export const fetchQuizAttempts = createAsyncThunk(
  "quiz/fetchQuizAttempts",
  async ({ authToken, page = 1, limit = 10, course_id = "" }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/quiz/attempts`, {
        headers: authHeaders(authToken),
        params: { page, limit, course_id },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load attempt history"
      );
    }
  }
);

export const fetchQuizAttemptLog = createAsyncThunk(
  "quiz/fetchQuizAttemptLog",
  async ({ authToken, attemptId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/quiz/attempts/${attemptId}/log`,
        { headers: authHeaders(authToken) }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load attempt log"
      );
    }
  }
);

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    clearQuizResult(state) {
      state.result = null;
      state.currentAttempt = null;
    },
    setCurrentAttempt(state, action) {
      state.currentAttempt = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizSubjects.pending, (state) => {
        state.subjectsStatus = "loading";
      })
      .addCase(fetchQuizSubjects.fulfilled, (state, action) => {
        state.subjectsStatus = "succeeded";
        state.subjects = action.payload;
      })
      .addCase(fetchQuizSubjects.rejected, (state, action) => {
        state.subjectsStatus = "failed";
        state.error = action.payload;
      })
      .addCase(startQuizAttempt.pending, (state) => {
        state.startStatus = "loading";
      })
      .addCase(startQuizAttempt.fulfilled, (state, action) => {
        state.startStatus = "succeeded";
        state.currentAttempt = action.payload;
      })
      .addCase(startQuizAttempt.rejected, (state, action) => {
        state.startStatus = "failed";
        toast({
          title: "Could not start quiz",
          description: action.payload,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(fetchQuizAttempt.fulfilled, (state, action) => {
        state.attemptStatus = "succeeded";
        state.currentAttempt = action.payload;
      })
      .addCase(saveQuizAnswer.fulfilled, (state, action) => {
        state.currentAttempt = action.payload;
      })
      .addCase(submitQuizAttempt.pending, (state) => {
        state.submitStatus = "loading";
      })
      .addCase(submitQuizAttempt.fulfilled, (state, action) => {
        state.submitStatus = "succeeded";
        state.result = action.payload;
        state.currentAttempt = action.payload;
      })
      .addCase(submitQuizAttempt.rejected, (state, action) => {
        state.submitStatus = "failed";
        toast({
          title: "Submit failed",
          description: action.payload,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(fetchQuizAttempts.pending, (state) => {
        state.historyStatus = "loading";
      })
      .addCase(fetchQuizAttempts.fulfilled, (state, action) => {
        state.historyStatus = "succeeded";
        state.attempts = action.payload.docs;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
          totalDocs: action.payload.totalDocs,
        };
      })
      .addCase(fetchQuizAttemptLog.fulfilled, (state, action) => {
        state.result = action.payload;
      });
  },
});

export const { clearQuizResult, setCurrentAttempt } = quizSlice.actions;
export default quizSlice.reducer;
