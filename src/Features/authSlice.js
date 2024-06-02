import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { config } from "../utlls/config.js";

const BASE_URL = config.BASE_URL;

const initialState = {
  user: null,
  status: "idle",
};

const fetchUserById = createAsyncThunk("users/fetchById", async (payload) => {
  const userId = payload.userId;
  const authToken = payload.authToken;
  const response = await axios.get(`${BASE_URL}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return response.data;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "idle";
      })
      .addCase(fetchUserById.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export const selectUser = (state) => state.auth.user;

export const { setUser } = authSlice.actions;

export { fetchUserById };

export default authSlice.reducer;
