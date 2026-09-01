import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import axios from "axios";
import { config } from "../utlls/config.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  panelists: [],
  filters: {
    ...TABLE_FILTERS,
    search_field: "all",
    is_active: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  changePasswordStatus: "idle",
  error: null,
};

const fetchPanelists = createAsyncThunk(
  "panelists/fetchPanelists",
  async (payload = {}, { getState }) => {
    const state = getState();
    const { authToken, queryParams = {} } = payload;
    const response = await axios.get(`${BASE_URL}/panelists`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: { ...state.panelists.filters, ...queryParams },
    });
    return response.data;
  }
);

const addPanelist = createAsyncThunk("panelists/addPanelist", async (payload) => {
  const { formData, authToken } = payload;
  const response = await fetch(`${BASE_URL}/panelists/add`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to add panelist");
  }
  return data;
});

const updatePanelist = createAsyncThunk(
  "panelists/updatePanelist",
  async (payload) => {
    const { panelistId, formData, authToken } = payload;
    const response = await fetch(`${BASE_URL}/panelists/update/${panelistId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Failed to update panelist");
    }
    return data;
  }
);

const deletePanelist = createAsyncThunk(
  "panelists/deletePanelist",
  async (payload) => {
    const { panelistId, authToken } = payload;
    const response = await fetch(`${BASE_URL}/panelists/delete/${panelistId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Failed to delete panelist");
    }
    return data;
  }
);

const changePanelistPassword = createAsyncThunk(
  "panelists/changePanelistPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const { authToken, panelistId, password } = payload;
      const response = await axios.post(
        `${BASE_URL}/panelists/change-password/${panelistId}`,
        { password },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update password"
      );
    }
  }
);

const panelistSlice = createSlice({
  name: "panelists",
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
    setSearchFieldFilter(state, action) {
      state.filters.page = 1;
      state.filters.search_field = action.payload;
    },
    setIsActiveFilter(state, action) {
      state.filters.page = 1;
      state.filters.is_active = action.payload;
    },
    clearPanelistFilters(state) {
      state.filters.page = 1;
      state.filters.query = "";
      state.filters.search_field = "all";
      state.filters.is_active = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPanelists.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchPanelists.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.panelists = action.payload.docs || [];
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
      .addCase(fetchPanelists.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(addPanelist.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addPanelist.fulfilled, (state, action) => {
        state.addStatus = "success";
        const wa = action.payload?.whatsapp_welcome;
        const waNote = wa?.sent
          ? " Welcome WhatsApp sent."
          : wa?.skipped || wa?.error
            ? " (WhatsApp welcome not sent — check Connect / Templates.)"
            : "";
        toast({
          title: "Panelist added successfully",
          description: waNote.trim() || undefined,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(addPanelist.rejected, (state, action) => {
        state.addStatus = "failure";
        state.error = action.error.message;
        toast({
          title: "Could not add panelist",
          description: action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(updatePanelist.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updatePanelist.fulfilled, (state) => {
        state.updateStatus = "success";
        toast({
          title: "Panelist updated successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(updatePanelist.rejected, (state, action) => {
        state.updateStatus = "failure";
        state.error = action.error.message;
        toast({
          title: "Could not update panelist",
          description: action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(deletePanelist.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deletePanelist.fulfilled, (state) => {
        state.deleteStatus = "success";
        toast({
          title: "Panelist deleted successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(deletePanelist.rejected, (state, action) => {
        state.deleteStatus = "failure";
        state.error = action.error.message;
        toast({
          title: "Could not delete panelist",
          description: action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(changePanelistPassword.pending, (state) => {
        state.changePasswordStatus = "loading";
      })
      .addCase(changePanelistPassword.fulfilled, (state) => {
        state.changePasswordStatus = "success";
        toast({
          title: "Password updated successfully",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(changePanelistPassword.rejected, (state, action) => {
        state.changePasswordStatus = "failure";
        state.error =
          action.payload ||
          action.error?.message ||
          "Failed to update password";
        toast({
          title: "Could not update password",
          description: state.error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  },
});

export const selectAllPanelists = (state) => state.panelists.panelists;
export const {
  setQueryFilter,
  setPageFilter,
  setLimitFilter,
  setSearchFieldFilter,
  setIsActiveFilter,
  clearPanelistFilters,
} = panelistSlice.actions;

export {
  fetchPanelists,
  addPanelist,
  updatePanelist,
  deletePanelist,
  changePanelistPassword,
};

export default panelistSlice.reducer;
