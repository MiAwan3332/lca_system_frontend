import React from 'react';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import DataPagination from './DataPagination';

export default function TablePagination({ pagination, setLimitFilter, setPageFilter, method, payload = {} }) {
  const dispatch = useDispatch();
  const authToken = Cookies.get('authToken');
  const onPage = (page) => {
    dispatch(setPageFilter(page));
    dispatch(method({ authToken, page, ...payload }));
  };
  const onLimit = (limit) => {
    dispatch(setLimitFilter(limit));
    dispatch(method({ authToken, page: 1, limit, ...payload }));
  };
  return <DataPagination pagination={pagination} onPage={onPage} onLimit={onLimit} />;
}
