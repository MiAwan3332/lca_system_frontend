import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import TableSearchControl from './TableSearchControl';

const TableSearch = forwardRef(({ setQueryFilter, method, placeholder = 'Search...', payload = {} }, ref) => {
  const [authToken] = useState(Cookies.get('authToken'));
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();
  const search = (value) => { dispatch(setQueryFilter(value)); dispatch(method({ authToken, ...payload })); };
  const clearSearch = () => { setQuery(''); search(''); };
  useEffect(() => { setQuery(''); dispatch(setQueryFilter('')); }, []);
  useImperativeHandle(ref, () => ({ clearSearch }));
  return <TableSearchControl value={query} onChange={setQuery} onSearch={search} onClear={clearSearch} placeholder={placeholder} />;
});

export default TableSearch;
