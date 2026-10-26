import React, { useEffect, useState } from 'react';
import { Box, Button, Checkbox, Input, HStack, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function ScopePicker({ api, type, selected, onChange }) {
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [result, setResult] = useState({ docs: [] }), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => api.get(`/scopes/${type}`, { params: { page, limit: 20, query }, signal: controller.signal })
      .then(({ data }) => { setResult(data); setError(''); }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); }), 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [api, type, page, query]);
  return <Box borderTopWidth="1px" pt={3}>
    <HStack mb={2}><Text fontWeight="medium">{type === 'batches' ? 'Batches' : 'Courses'}</Text><Text fontSize="sm">{selected.length} selected</Text></HStack>
    <Input aria-label={`Search ${type}`} placeholder={`Search ${type}`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
    <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))" gap={2} mt={2}>{result.docs.map((item) =>
      <Checkbox key={item._id} isChecked={selected.includes(item._id)} onChange={(event) => onChange(event.target.checked ? [...selected, item._id] : selected.filter((id) => id !== item._id))}>{item.name}</Checkbox>)}</Box>
    {error && <Text color="red.600">{error}</Text>}
    <HStack mt={2}><Button size="sm" title="Previous page" aria-label={`Previous ${type}`} isDisabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></Button><Text fontSize="sm">{page}</Text>
      <Button size="sm" title="Next page" aria-label={`Next ${type}`} isDisabled={!result.hasNextPage} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></Button></HStack>
  </Box>;
}
