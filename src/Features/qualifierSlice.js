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
    class_type: "",
    exam_type: "",
    profile_updated: "",
  },
  pagination: TABLE_PAGINATION,
  status_counts: {
    total: 0,
    active: 0,
    inactive: 0,
  },
  exam_type_counts: {
    total: 0,
    css: 0,
    pms: 0,
  },
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  changePasswordStatus: "idle",
  importStatus: "idle",
  fillNullFieldStatus: "idle",
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

const bulkImportQualifiers = createAsyncThunk(
  "qualifiers/bulkImportQualifiers",
  async ({ authToken, batch_id, qualifiers }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/qualifiers/bulk-import`,
        { batch_id, qualifiers },
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
          "Failed to import qualifiers"
      );
    }
  }
);

const toggleQualifierStatus = createAsyncThunk(
  "qualifiers/toggleQualifierStatus",
  async ({ authToken, id, is_active }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/qualifiers/toggle-status/${id}`,
        { is_active },
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
          "Failed to update qualifier status"
      );
    }
  }
);

const updateQualifierExamType = createAsyncThunk(
  "qualifiers/updateQualifierExamType",
  async ({ authToken, id, exam_type }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("exam_type", exam_type == null ? "" : String(exam_type));
      const response = await axios.post(
        `${BASE_URL}/qualifiers/update/${id}`,
        formData,
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
          "Failed to update CSS/PMS"
      );
    }
  }
);

const fillNullQualifierField = createAsyncThunk(
  "qualifiers/fillNullQualifierField",
  async (
    { authToken, field, value, batch_id, preview = false },
    { rejectWithValue }
  ) => {
    try {
      const body = { field, value, preview: Boolean(preview) };
      if (batch_id) body.batch_id = batch_id;
      const response = await axios.post(
        `${BASE_URL}/qualifiers/fill-null-field`,
        body,
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
          "Failed to fill empty qualifier field"
      );
    }
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
    setClassTypeFilter(state, action) {
      state.filters.page = 1;
      state.filters.class_type = action.payload;
    },
    setExamTypeFilter(state, action) {
      state.filters.page = 1;
      state.filters.exam_type = action.payload;
    },
    setProfileUpdatedFilter(state, action) {
      state.filters.page = 1;
      state.filters.profile_updated = action.payload;
    },
    clearQualifierFilters(state) {
      state.filters.page = 1;
      state.filters.query = "";
      state.filters.search_field = "all";
      state.filters.is_active = "";
      state.filters.city = "";
      state.filters.class_type = "";
      state.filters.exam_type = "";
      state.filters.profile_updated = "";
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
        state.status_counts = {
          total: Number(action.payload?.status_counts?.total) || 0,
          active: Number(action.payload?.status_counts?.active) || 0,
          inactive: Number(action.payload?.status_counts?.inactive) || 0,
        };
        state.exam_type_counts = {
          total: Number(action.payload?.exam_type_counts?.total) || 0,
          css: Number(action.payload?.exam_type_counts?.css) || 0,
          pms: Number(action.payload?.exam_type_counts?.pms) || 0,
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
          status:
            wa?.queued || wa?.sent
              ? "success"
              : wa?.sent === false && (wa?.skipped || wa?.error || wa?.reason)
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
      })
      .addCase(bulkImportQualifiers.pending, (state) => {
        state.importStatus = "loading";
      })
      .addCase(bulkImportQualifiers.fulfilled, (state, action) => {
        state.importStatus = "success";
        toast({
          title: "Qualifier import completed",
          description: [
            action.payload?.message || "Import finished",
            action.payload?.whatsapp_queued
              ? `WhatsApp Qualifier Welcome: ${action.payload.whatsapp_queued} queued (see WA Queue)`
              : "",
          ]
            .filter(Boolean)
            .join(". "),
          status: action.payload?.failed?.length ? "warning" : "success",
          duration: 7000,
          isClosable: true,
        });
      })
      .addCase(bulkImportQualifiers.rejected, (state, action) => {
        state.importStatus = "failure";
        toast({
          title: "Qualifier import failed",
          description: action.payload || action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(toggleQualifierStatus.fulfilled, (state, action) => {
        const idx = state.qualifiers.findIndex(
          (q) => q._id === action.payload._id
        );
        const previous = idx !== -1 ? state.qualifiers[idx] : null;
        const wasActive = previous ? previous.is_active !== false : null;
        const nowActive = action.payload.is_active !== false;
        if (idx !== -1) {
          state.qualifiers[idx] = action.payload;
        }
        if (
          wasActive !== null &&
          wasActive !== nowActive &&
          state.status_counts
        ) {
          if (nowActive) {
            state.status_counts.active =
              Math.max(0, Number(state.status_counts.active) || 0) + 1;
            state.status_counts.inactive = Math.max(
              0,
              (Number(state.status_counts.inactive) || 0) - 1
            );
          } else {
            state.status_counts.inactive =
              Math.max(0, Number(state.status_counts.inactive) || 0) + 1;
            state.status_counts.active = Math.max(
              0,
              (Number(state.status_counts.active) || 0) - 1
            );
          }
        }
        toast({
          title:
            action.payload.is_active !== false
              ? "Qualifier activated"
              : "Qualifier deactivated",
          description:
            action.payload.is_active === false
              ? "Inactive qualifiers cannot log in."
              : undefined,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .addCase(toggleQualifierStatus.rejected, (state, action) => {
        toast({
          title: "Failed to update qualifier status",
          description: action.payload || action.error.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(updateQualifierExamType.fulfilled, (state, action) => {
        const updated = action.payload?.qualifier || action.payload;
        const previous = String(
          action.meta?.arg?.previous_exam_type || ""
        ).trim();
        const exam = String(updated?.exam_type || "").trim();
        const idx = state.qualifiers.findIndex((q) => q._id === updated?._id);
        if (idx !== -1 && updated) {
          const activeExamFilter = String(state.filters.exam_type || "").trim();
          if (activeExamFilter && activeExamFilter !== exam) {
            state.qualifiers.splice(idx, 1);
          } else {
            state.qualifiers[idx] = {
              ...state.qualifiers[idx],
              ...updated,
              exam_type: updated.exam_type || "",
            };
          }
        }
        if (!state.exam_type_counts) {
          state.exam_type_counts = { total: 0, css: 0, pms: 0 };
        }
        if (previous === "CSS") {
          state.exam_type_counts.css = Math.max(
            0,
            (Number(state.exam_type_counts.css) || 0) - 1
          );
        } else if (previous === "PMS") {
          state.exam_type_counts.pms = Math.max(
            0,
            (Number(state.exam_type_counts.pms) || 0) - 1
          );
        }
        if (exam === "CSS") {
          state.exam_type_counts.css =
            Math.max(0, Number(state.exam_type_counts.css) || 0) + 1;
        } else if (exam === "PMS") {
          state.exam_type_counts.pms =
            Math.max(0, Number(state.exam_type_counts.pms) || 0) + 1;
        }
        toast({
          title: exam ? `CSS/PMS set to ${exam}` : "CSS/PMS cleared",
          status: "success",
          duration: 2500,
          isClosable: true,
        });
      })
      .addCase(updateQualifierExamType.rejected, (state, action) => {
        toast({
          title: "Failed to update CSS/PMS",
          description: action.payload || action.error.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .addCase(fillNullQualifierField.pending, (state, action) => {
        if (!action.meta?.arg?.preview) {
          state.fillNullFieldStatus = "loading";
        }
      })
      .addCase(fillNullQualifierField.fulfilled, (state, action) => {
        if (action.payload?.preview) {
          return;
        }
        state.fillNullFieldStatus = "success";
        toast({
          title: "Empty fields updated",
          description:
            action.payload?.message ||
            `Updated ${action.payload?.modified_count || 0} qualifier(s)`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(fillNullQualifierField.rejected, (state, action) => {
        if (action.meta?.arg?.preview) {
          return;
        }
        state.fillNullFieldStatus = "failure";
        toast({
          title: "Could not update empty fields",
          description: action.payload || action.error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  },
});

export const selectAllQualifiers = (state) => state.qualifiers.qualifiers;
export const selectQualifierStatusCounts = (state) =>
  state.qualifiers.status_counts || { total: 0, active: 0, inactive: 0 };
export const selectQualifierExamTypeCounts = (state) =>
  state.qualifiers.exam_type_counts || { total: 0, css: 0, pms: 0 };
export const {
  setQueryFilter,
  setPageFilter,
  setLimitFilter,
  setSearchFieldFilter,
  setIsActiveFilter,
  setCityFilter,
  setClassTypeFilter,
  setExamTypeFilter,
  setProfileUpdatedFilter,
  clearQualifierFilters,
} = qualifierSlice.actions;

export {
  fetchQualifiers,
  addQualifier,
  updateQualifier,
  deleteQualifier,
  changeQualifierPassword,
  bulkImportQualifiers,
  toggleQualifierStatus,
  updateQualifierExamType,
  fillNullQualifierField,
};

export default qualifierSlice.reducer;
