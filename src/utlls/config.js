export const config = {
  BASE_URL: process.env.REACT_APP_BASE_URL || "http://localhost:5000",
  TABLE_FILTERS: {
    query: "",
    page: 1,
    limit: 10,
    limits: [1, 5, 10, 20, 30, 40, 50],
    batch: ''
  },
  TABLE_PAGINATION: {
    totalDocs: 0,
    limit: 10,
    totalPages: 2,
    page: 1,
    pagingCounter: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
  },
};
