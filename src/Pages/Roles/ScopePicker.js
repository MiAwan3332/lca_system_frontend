import React, { useEffect, useState } from 'react';
import { Box, Checkbox, HStack, Text, Tag, TagLabel, TagCloseButton } from '@chakra-ui/react';
import DataPagination from '../../Components/DataPagination';
import TableSearchControl from '../../Components/TableSearchControl';
export default function ScopePicker({ api, type, selected, onChange, onLabels, single = false }) {
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [result, setResult] = useState({ docs: [] }), [error, setError] = useState('');
  const [names, setNames] = useState({});
  const selectedKey = JSON.stringify(selected);
  useEffect(() => { if (onLabels) onLabels(JSON.parse(selectedKey).map((id) => names[id] || 'Selected item')); }, [selectedKey, names, onLabels]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => api.get(`/scopes/${type}`, { params: { page, limit: 20, query }, signal: controller.signal })
      .then(({ data }) => { if (controller.signal.aborted) return; setResult(data); setNames((old) => ({ ...old, ...Object.fromEntries(data.docs.map((item) => [item._id, item.name])) })); setError(''); }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); }), 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [api, type, page, query]);
  return <Box borderTopWidth="1px" pt={3}>
    <HStack mb={2}><Text fontWeight="medium">{type === 'batches' ? 'Batches' : 'Courses'}</Text><Text fontSize="sm">{selected.length} selected</Text></HStack>
    <TableSearchControl label={`Search ${type}`} placeholder={`Search ${type}`} value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
    <HStack flexWrap="wrap" mt={2}>{selected.map((id) => <Tag key={id}><TagLabel>{names[id] || 'Selected item'}</TagLabel><TagCloseButton aria-label={`Remove ${names[id] || 'selection'}`} onClick={() => onChange(selected.filter((item) => item !== id))} /></Tag>)}</HStack>
    <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))" gap={2} mt={2}>{result.docs.map((item) =>
      <Checkbox key={item._id} isChecked={selected.includes(item._id)} onChange={(event) => onChange(event.target.checked ? single ? [item._id] : [...selected, item._id] : selected.filter((id) => id !== item._id))}>{item.name}</Checkbox>)}</Box>
    {error && <Text color="red.600">{error}</Text>}
    <DataPagination pagination={result} onPage={setPage} label={type} />
  </Box>;
}
