import React from 'react';
import { Button, ButtonGroup, HStack, Text } from '@chakra-ui/react';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from './AccessInputs';

export default function DataPagination({ pagination, onPage, onLimit, label = 'records' }) {
  const page = Math.max(1, Number(pagination.page) || 1), limit = Math.max(1, Number(pagination.limit) || 25);
  const total = Math.max(0, Number(pagination.totalDocs ?? pagination.docs?.length) || 0);
  const totalPages = Math.max(1, Number(pagination.totalPages) || Math.ceil(total / limit));
  const previous = pagination.hasPrevPage ?? page > 1, next = pagination.hasNextPage ?? page < totalPages;
  const first = total ? Math.min((page - 1) * limit + 1, total) : 0, last = Math.min(page * limit, total);
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  return <div className="data-pagination">
    <HStack spacing={4} flexWrap="wrap"><Text fontSize="sm" className="dash-text">{first} - {last} of {total} {label}</Text>{onLimit && <Select aria-label="Rows per page" value={limit} onChange={(event) => onLimit(Number(event.target.value))} w="24" borderRadius="xl" bg="var(--dash-surface)">{[...new Set([1, 5, 10, 20, 30, 40, 50, limit])].sort((a, b) => a - b).map((size) => <option key={size} value={size}>{size}</option>)}</Select>}</HStack>
    <ButtonGroup size="md" isAttached variant="outline" bg="var(--dash-surface)">
      <Button aria-label={`First ${label}`} title="First page" isDisabled={!previous} onClick={() => onPage(1)}><ChevronFirst size={18} /></Button>
      <Button aria-label={`Previous ${label}`} title="Previous page" isDisabled={!previous} onClick={() => onPage(Math.max(1, page - 1))}><ChevronLeft size={18} /></Button>
      {pages.map((number) => <Button key={number} aria-label={`Page ${number}`} aria-current={number === page ? 'page' : undefined} isDisabled={number === page} onClick={() => onPage(number)}>{number}</Button>)}
      <Button aria-label={`Next ${label}`} title="Next page" isDisabled={!next} onClick={() => onPage(page + 1)}><ChevronRight size={18} /></Button>
      <Button aria-label={`Last ${label}`} title="Last page" isDisabled={!next} onClick={() => onPage(totalPages)}><ChevronLast size={18} /></Button>
    </ButtonGroup>
  </div>;
}
