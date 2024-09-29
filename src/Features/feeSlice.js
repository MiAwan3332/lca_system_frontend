import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createStandaloneToast } from "@chakra-ui/react";
import { config } from "../utlls/config.js";
import axios from 'axios';

const { toast } = createStandaloneToast();

const BASE_URL = config.BASE_URL;
const TABLE_FILTERS = config.TABLE_FILTERS;
const TABLE_PAGINATION = config.TABLE_PAGINATION;

const initialState = {
    fees: [],
    feeLogs: [],
    filters: TABLE_FILTERS,
    pagination: TABLE_PAGINATION,
    fetchStatus: 'idle',
    addStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    fetchFeeLogsStatus: 'idle',
    error: null,
};

const fetchFees = createAsyncThunk('fees/fetchFees', async (payload, { getState }) => {
    const state = getState();
    const { authToken } = payload;
    const response = await axios.get(`${BASE_URL}/fees`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
        params: state.fees.filters
    });
    const data = await response.data;
    return data;
});

const fetchFeeById = createAsyncThunk('fees/fetchFeeById', async (payload) => {
    const { authToken, id } = payload;
    const response = await fetch(`${BASE_URL}/fees/${id}`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    const data = await response.json();
    return data;
});

const createFee = createAsyncThunk('fees/createFee', async (payload) => {
    const { authToken, studentId, batchId, amount } = payload;
    const response = await fetch(`${BASE_URL}/fees/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ student_id: studentId, batch_id: batchId, amount }),
    });
    const data = await response.json();
    return data;
});

const payFee = createAsyncThunk('fees/payFee', async (payload) => {
    const { authToken, id, studentId, amount } = payload;
    const response = await fetch(`${BASE_URL}/fees/pay/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ studentId, amount }),
    });
    const data = await response.json();
    return data;
});

const discountFee = createAsyncThunk('fees/discountFee', async (payload) => {
    const { authToken, id, studentId, amount } = payload;
    const response = await fetch(`${BASE_URL}/fees/discount/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ studentId, amount }),
    });
    const data = await response.json();
    return data;
});

const deleteFee = createAsyncThunk('fees/deleteFee', async (payload) => {
    const { authToken, id } = payload;
    const response = await fetch(`${BASE_URL}/fees/delete/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    });
    const data = await response.json();
    return data;
});

const fetchFeeLogs = createAsyncThunk('fees/fetchFeeLogs', async (payload) => {
    const { authToken, id } = payload;
    const response = await fetch(`${BASE_URL}/fees/logs/${id}`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    const data = await response.json();
    return data;
});

const fetchFeesByStudent = createAsyncThunk('fees/fetchFeesByStudent', async (payload) => {
    const { authToken, id } = payload;
    const response = await fetch(`${BASE_URL}/fees/student/${id}`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    const data = await response.json();
    return data;
});

const feeSlice = createSlice({
    name: 'fees',
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
    },
    extraReducers: (builder) => {
        builder
            // FETCH FEES
            .addCase(fetchFees.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchFees.fulfilled, (state, action) => {
                state.fees = action.payload.docs;
                state.fetchStatus = 'idle';
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
            .addCase(fetchFees.rejected, (state) => {
                state.fetchStatus = 'failed';
            })
            
            // FETCH FEE BY ID
            .addCase(fetchFeeById.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchFeeById.fulfilled, (state, action) => {
                state.fees = action.payload;
                state.fetchStatus = 'idle';
            })
            .addCase(fetchFeeById.rejected, (state) => {
                state.fetchStatus = 'failed';
            })

            // CREATE FEE
            .addCase(createFee.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(createFee.fulfilled, (state, action) => {
                state.fees = action.payload;
                state.addStatus = 'idle';
            })
            .addCase(createFee.rejected, (state) => {
                state.addStatus = 'failed';
            })

            // PAY FEE
            .addCase(payFee.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(payFee.fulfilled, (state, action) => {
                state.fees = action.payload;
                state.addStatus = 'idle';
            })
            .addCase(payFee.rejected, (state) => {
                state.addStatus = 'failed';
            })

            // DISCOUNT FEE
            .addCase(discountFee.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(discountFee.fulfilled, (state, action) => {
                state.fees = action.payload;
                state.addStatus = 'idle';
            })
            .addCase(discountFee.rejected, (state) => {
                state.addStatus = 'failed';
            })

            // DELETE FEE
            .addCase(deleteFee.pending, (state) => {
                state.addStatus = 'loading';
            })
            .addCase(deleteFee.fulfilled, (state, action) => {
                state.fees = action.payload;
                state.addStatus = 'idle';
            })
            .addCase(deleteFee.rejected, (state) => {
                state.addStatus = 'failed';
            })

            // FETCH FEE LOGS
            .addCase(fetchFeeLogs.pending, (state) => {
                state.fetchFeeLogsStatus = 'loading';
            })
            .addCase(fetchFeeLogs.fulfilled, (state, action) => {
                state.fetchFeeLogsStatus = 'idle';
                state.feeLogs = action.payload;
            })
            .addCase(fetchFeeLogs.rejected, (state) => {
                state.fetchFeeLogsStatus = 'failed';
            })

            // FETCH FEES BY STUDENT
            .addCase(fetchFeesByStudent.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchFeesByStudent.fulfilled, (state, action) => {
                state.fees = action.payload;
                state.fetchStatus = 'idle';
            })
            .addCase(fetchFeesByStudent.rejected, (state) => {
                state.fetchStatus = 'failed';
            });
    },
});

export const selectAllFees = (state) => state.fees.fees;
export const selectFeeById = (state, id) => state.fees.fees.find((fee) => fee._id === id);
export const selectFeeLogs = (state) => state.fees.feeLogs;

export { fetchFees, fetchFeeById, createFee, payFee, discountFee, deleteFee, fetchFeeLogs, fetchFeesByStudent };
export const { setQueryFilter, setPageFilter, setLimitFilter } = feeSlice.actions;

export default feeSlice.reducer;