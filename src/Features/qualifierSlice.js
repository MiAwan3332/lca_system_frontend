import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import axios from "axios";
import { config } from "../utlls/config.js";
import { whatsappWelcomeDescription } from "../utlls/whatsappWelcome.js";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  qualifiers: [],
  filters: {
    ...TABLE_FILTERS,
    search_field: "all",
    is_active: "",
    city: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  changePasswordStatus: "idle",
  error: null,
};

const fetchQualifiers = createAsyncThunk(
  "qualifiers/fetchQualifiers",
  async (payload = {}, { getState }) => {
    const state = getState();
    const { authToken, queryParams = {} } = payload;
    const response = await axios.get(`${BASE_URL}/qualifiers`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: { ...state.qualifiers.filters, ...queryParams },
    });
    return response.data;
  }
);

const addQualifier = createAsyncThunk(
  "qualifiers/addQualifier",
  async (payload) => {
    const { formData, authToken } = payload;
    const response = await fetch(`${BASE_URL}/qualifiers/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Failed to add qualifier");
    }
    return data;
  }
);

const updateQualifier = createAsyncThunk(
  "qualifiers/updateQualifier",
  async (payload) => {
    const { qualifierId, formData, authToken } = payload;
    const response = await fetch(
      `${BASE_URL}/qualifiers/update/${qualifierId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Failed to update qualifier");
    }
    return data;
  }
);

const deleteQualifier = createAsyncThunk(
  "qualifiers/deleteQualifier",
  async (payload) => {
    const { qualifierId, authToken } = payload;
    const response = await fetch(
      `${BASE_URL}/qualifiers/delete/${qualifierId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Failed to delete qualifier");
    }
    return data;
  }
);

const changeQualifierPassword = createAsyncThunk(
  "qualifiers/changeQualifierPassword",
  async (payload) => {
    const { authToken, qualifierId, password } = payload;
    const response = await axios.post(
      `${BASE_URL}/qualifiers/change-password/${qualifierId}`,
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

const qualifierSlice = createSlice({
  name: "qualifiers",
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
    setCityFilter(state, action) {
      state.filters.page = 1;
      state.filters.city = action.payload;
    },
    clearQualifierFilters(state) {
      state.filters.page = 1;
      state.filters.query = "";
      state.filters.search_field = "all";
      state.filters.is_active = "";
      state.filters.city = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQualifiers.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchQualifiers.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.qualifiers = action.payload.docs || [];
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
      .addCase(fetchQualifiers.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(addQualifier.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addQualifier.fulfilled, (state, action) => {
        state.addStatus = "success";
        const wa = action.payload?.whatsapp_welcome;
        toast({
          title: "Qualifier added successfully",
          description: whatsappWelcomeDescription(wa),
          status: wa?.sent === false && (wa?.skipped || wa?.error || wa?.reason)
            ? "warning"
            : "success",
          duration: 7000,
          isClosable: true,
        });
      })
      .addCase(addQualifier.rejected, (state, action) => {
        state.addStatus = "failure";
        state.error = action.error.message;
        toast({
          title: "Could not add qualifier",
          description: action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(updateQualifier.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateQualifier.fulfilled, (state) => {
        state.updateStatus = "success";
        toast({
          title: "Qualifier updated successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(updateQualifier.rejected, (state, action) => {
        state.updateStatus = "failure";
        state.error = action.error.message;
        toast({
          title: "Could not update qualifier",
          description: action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(deleteQualifier.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteQualifier.fulfilled, (state) => {
        state.deleteStatus = "success";
        toast({
          title: "Qualifier deleted successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(deleteQualifier.rejected, (state, action) => {
        state.deleteStatus = "failure";
        state.error = action.error.message;
        toast({
          title: "Could not delete qualifier",
          description: action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(changeQualifierPassword.pending, (state) => {
        state.changePasswordStatus = "loading";
      })
      .addCase(changeQualifierPassword.fulfilled, (state) => {
        state.changePasswordStatus = "success";
        toast({
          title: "Qualifier password updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(changeQualifierPassword.rejected, (state, action) => {
        state.changePasswordStatus = "failure";
        state.error =
          action.error?.message ||
          action.payload ||
          "Failed to update password";
        toast({
          title: "Failed to update password",
          description: state.error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  },
});

export const selectAllQualifiers = (state) => state.qualifiers.qualifiers;
export const {
  setQueryFilter,
  setPageFilter,
  setLimitFilter,
  setSearchFieldFilter,
  setIsActiveFilter,
  setCityFilter,
  clearQualifierFilters,
} = qualifierSlice.actions;

export {
  fetchQualifiers,
  addQualifier,
  updateQualifier,
  deleteQualifier,
  changeQualifierPassword,
};

export default qualifierSlice.reducer;
