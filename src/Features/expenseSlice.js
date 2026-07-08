import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";
import axios from "axios";

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
  expenses: [],
  totalAmount: 0,
  pendingAmount: 0,
  approvedAmount: 0,
  rejectedAmount: 0,
  filters: {
    ...TABLE_FILTERS,
    category: "",
    status: "",
    start_date: "",
    end_date: "",
  },
  pagination: TABLE_PAGINATION,
  fetchStatus: "idle",
  addStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  approvalStatus: "idle",
  error: null,
};

const fetchExpenses = createAsyncThunk(
  "expenses/fetchExpenses",
  async (payload, { getState }) => {
    const state = getState();
    const { authToken } = payload;

    const response = await axios.get(`${BASE_URL}/expenses`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: state.expenses.filters,
    });

    return response.data;
  }
);

const addExpense = createAsyncThunk("expenses/addExpense", async (payload) => {
  const { authToken, expense } = payload;
  const response = await axios.post(`${BASE_URL}/expenses/add`, expense, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return response.data;
});

const updateExpense = createAsyncThunk(
  "expenses/updateExpense",
  async (payload) => {
    const { authToken, expense, id } = payload;
    const response = await axios.post(
      `${BASE_URL}/expenses/update/${id}`,
      expense,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  }
);

const deleteExpense = createAsyncThunk(
  "expenses/deleteExpense",
  async (payload) => {
    const { authToken, expenseId } = payload;
    const response = await axios.delete(
      `${BASE_URL}/expenses/delete/${expenseId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  }
);

const approveExpense = createAsyncThunk(
  "expenses/approveExpense",
  async (payload) => {
    const { authToken, expenseId } = payload;
    const response = await axios.post(
      `${BASE_URL}/expenses/approve/${expenseId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  }
);

const rejectExpense = createAsyncThunk(
  "expenses/rejectExpense",
  async (payload) => {
    const { authToken, expenseId, rejection_reason } = payload;
    const response = await axios.post(
      `${BASE_URL}/expenses/reject/${expenseId}`,
      { rejection_reason },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  }
);

const expenseSlice = createSlice({
  name: "expenses",
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
    setCategoryFilter(state, action) {
      state.filters.page = 1;
      state.filters.category = action.payload;
    },
    setStatusFilter(state, action) {
      state.filters.page = 1;
      state.filters.status = action.payload;
    },
    setStartDateFilter(state, action) {
      state.filters.page = 1;
      state.filters.start_date = action.payload;
    },
    setEndDateFilter(state, action) {
      state.filters.page = 1;
      state.filters.end_date = action.payload;
    },
    clearExpenseFilters(state, action) {
      state.filters.page = 1;
      state.filters.query = "";
      state.filters.category = "";
      state.filters.status = "";
      state.filters.start_date = action.payload.start_date;
      state.filters.end_date = action.payload.end_date;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.fetchStatus = "success";
        state.expenses = action.payload.docs;
        state.totalAmount = action.payload.total_amount || 0;
        state.pendingAmount = action.payload.pending_amount || 0;
        state.approvedAmount = action.payload.approved_amount || 0;
        state.rejectedAmount = action.payload.rejected_amount || 0;
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
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.fetchStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(addExpense.pending, (state) => {
        state.addStatus = "loading";
      })
      .addCase(addExpense.fulfilled, (state) => {
        state.addStatus = "success";
        toast({
          title: "Expense submitted for approval.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.addStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(updateExpense.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateExpense.fulfilled, (state) => {
        state.updateStatus = "success";
        toast({
          title: "Expense updated.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.updateStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(deleteExpense.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteExpense.fulfilled, (state) => {
        state.deleteStatus = "success";
        toast({
          title: "Expense deleted.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.deleteStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(approveExpense.pending, (state) => {
        state.approvalStatus = "loading";
      })
      .addCase(approveExpense.fulfilled, (state) => {
        state.approvalStatus = "success";
        toast({
          title: "Expense approved and deducted from finance.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(approveExpense.rejected, (state, action) => {
        state.approvalStatus = "failure";
        state.error = action.error.message;
      })
      .addCase(rejectExpense.pending, (state) => {
        state.approvalStatus = "loading";
      })
      .addCase(rejectExpense.fulfilled, (state) => {
        state.approvalStatus = "success";
        toast({
          title: "Expense rejected.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      })
      .addCase(rejectExpense.rejected, (state, action) => {
        state.approvalStatus = "failure";
        state.error = action.error.message;
      });
  },
});

export const selectAllExpenses = (state) => state.expenses.expenses;
export const selectTotalExpenseAmount = (state) => state.expenses.totalAmount;

export {
  fetchExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
};
export const {
  setQueryFilter,
  setPageFilter,
  setLimitFilter,
  setCategoryFilter,
  setStatusFilter,
  setStartDateFilter,
  setEndDateFilter,
  clearExpenseFilters,
} = expenseSlice.actions;

export default expenseSlice.reducer;
