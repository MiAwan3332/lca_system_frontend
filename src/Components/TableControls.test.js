import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { useDispatch } from 'react-redux';
import DataPagination from './DataPagination';
import TablePagination from './TablePagination';
import TableSearchControl from './TableSearchControl';
import TableSearch from './TableSearch';
jest.mock('react-redux', () => ({ useDispatch: jest.fn() }));
jest.mock('js-cookie', () => ({ get: () => 'test-token' }));
const show = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);
beforeEach(() => jest.clearAllMocks());
test('pagination has a correct empty range and disables unavailable navigation', () => {
  show(<DataPagination pagination={{ page: 1, limit: 10, totalDocs: 0, totalPages: 0 }} onPage={jest.fn()} />);
  expect(screen.getByText('0 - 0 of 0 records')).toBeInTheDocument();
  for (const name of ['First records', 'Previous records', 'Next records', 'Last records']) expect(screen.getByRole('button', { name })).toBeDisabled();
});
test('shared pagination navigates first, previous, next and last pages', () => {
  const onPage = jest.fn();
  show(<DataPagination pagination={{ page: 3, limit: 10, totalDocs: 100, totalPages: 10 }} onPage={onPage} label="roles" />);
  for (const name of ['First roles', 'Previous roles', 'Next roles', 'Last roles']) fireEvent.click(screen.getByRole('button', { name }));
  expect(onPage.mock.calls.map(([page]) => page)).toEqual([1, 2, 4, 10]);
  expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
});
test('custom page size is represented and changes remain controlled', () => {
  const onLimit = jest.fn();
  show(<DataPagination pagination={{ page: 1, limit: 100, totalDocs: 200 }} onPage={jest.fn()} onLimit={onLimit} />);
  expect(screen.getByLabelText('Rows per page')).toHaveValue('100');
  fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '20' } });
  expect(onLimit).toHaveBeenCalledWith(20);
});
test('Redux pagination retains explicit page and filter payloads', () => {
  const dispatch = jest.fn(), setPageFilter = jest.fn((page) => ({ type: 'page', page })), setLimitFilter = jest.fn((limit) => ({ type: 'limit', limit })), method = jest.fn((payload) => ({ type: 'fetch', payload }));
  useDispatch.mockReturnValue(dispatch);
  show(<TablePagination pagination={{ page: 1, limit: 10, totalDocs: 30 }} setPageFilter={setPageFilter} setLimitFilter={setLimitFilter} method={method} payload={{ batch: 'batch-a' }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Next records' }));
  expect(setPageFilter).toHaveBeenCalledWith(2);
  expect(method).toHaveBeenLastCalledWith({ authToken: 'test-token', page: 2, batch: 'batch-a' });
  fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '20' } });
  expect(method).toHaveBeenLastCalledWith({ authToken: 'test-token', page: 1, limit: 20, batch: 'batch-a' });
});
test('shared search supports typing, Enter and accessible clearing', () => {
  const onChange = jest.fn(), onSearch = jest.fn(), onClear = jest.fn();
  show(<TableSearchControl value="Ada" onChange={onChange} onSearch={onSearch} onClear={onClear} label="Search people" />);
  fireEvent.change(screen.getByLabelText('Search people'), { target: { value: 'Sam' } });
  expect(onChange).toHaveBeenCalledWith('Sam');
  fireEvent.keyDown(screen.getByLabelText('Search people'), { key: 'Enter' });
  expect(onSearch).toHaveBeenCalledWith('Ada');
  fireEvent.click(screen.getByRole('button', { name: 'Clear search people' }));
  expect(onClear).toHaveBeenCalledTimes(1);
});
test('Redux search still submits only on Enter and clears its filter', () => {
  const dispatch = jest.fn(), setQueryFilter = jest.fn((query) => ({ type: 'query', query })), method = jest.fn((payload) => ({ type: 'fetch', payload }));
  useDispatch.mockReturnValue(dispatch);
  show(<TableSearch setQueryFilter={setQueryFilter} method={method} payload={{ city: 'Lahore' }} />);
  method.mockClear();
  fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Sam' } });
  expect(method).not.toHaveBeenCalled();
  fireEvent.keyDown(screen.getByLabelText('Search'), { key: 'Enter' });
  expect(setQueryFilter).toHaveBeenLastCalledWith('Sam');
  expect(method).toHaveBeenLastCalledWith({ authToken: 'test-token', city: 'Lahore' });
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(setQueryFilter).toHaveBeenLastCalledWith('');
});
