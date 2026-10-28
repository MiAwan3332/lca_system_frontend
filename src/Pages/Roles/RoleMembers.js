import { DataTableShell } from '../../Components/PageHeader';
import React, { useState } from 'react';
import { Badge, Box, Button, Checkbox, HStack, Table, Tbody, Td, Text, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { ArrowRightLeft, Trash2, UserPlus } from 'lucide-react';
import { refreshAccess } from '../../utlls/accessCapabilities';
import { ConfirmChange, LoadState, Pager, SearchInput, useAccessData } from './AccessCommon';
import AssignDialog from './AssignDialog';
import { words } from './accessUi';

// Everyone who currently has a role, with add, move and remove in bulk.
export default function RoleMembers({ api, role, onPerson }) {
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [version, setVersion] = useState(0);
  const [selected, setSelected] = useState({}), [dialog, setDialog] = useState(null);
  const state = useAccessData(api, `/roles/${role._id}/members`, { page, limit: 25, query }, version);
  const toast = useToast();
  const docs = state.data?.docs || [], chosen = Object.values(selected);
  const refresh = () => { setSelected({}); setDialog(null); setVersion((value) => value + 1); };
  const toggle = (item, checked) => setSelected((old) => { const next = { ...old }; if (checked) next[item._id] = item; else delete next[item._id]; return next; });
  const allChecked = docs.length > 0 && docs.every((item) => selected[item._id]);
  return <Box>
    <HStack justify="space-between" mb={4} gap={3} flexWrap="wrap">
      <SearchInput label="Search people with this role" value={query} onChange={(value) => { setQuery(value); setPage(1); setSelected({}); }} />
      <HStack flexWrap="wrap" gap={2}>
        {chosen.length > 0 && <><Text fontSize="sm">{chosen.length} selected</Text>
          <Button size="sm" leftIcon={<ArrowRightLeft size={14} />} onClick={() => setDialog('move')}>Move to another role</Button>
          <Button size="sm" colorScheme="red" variant="outline" leftIcon={<Trash2 size={14} />} onClick={() => setDialog('remove')}>Remove from role</Button></>}
        <Button className="table-action-btn table-action-btn--primary" leftIcon={<UserPlus size={16} />} isDisabled={!role.active} title={role.active ? undefined : 'Enable this role before giving it to people'} onClick={() => setDialog('add')}>Add People</Button>
      </HStack>
    </HStack>
    <LoadState state={state}><DataTableShell className="access-table access-members-table"><Table><Thead><Tr>
      <Th width="40px"><Checkbox aria-label="Select everyone on this page" isChecked={allChecked} isIndeterminate={!allChecked && docs.some((item) => selected[item._id])}
        onChange={(event) => docs.forEach((item) => toggle(item, event.target.checked))} /></Th><Th>Person</Th><Th>Account category</Th><Th>Classes</Th><Th>Access ends</Th></Tr></Thead>
      <Tbody>{docs.map((item) => <Tr key={item._id}>
        <Td><Checkbox aria-label={`Select ${item.user?.name || 'person'}`} isChecked={Boolean(selected[item._id])} onChange={(event) => toggle(item, event.target.checked)} /></Td>
        <Td><Button variant="link" onClick={() => item.user && onPerson(item.user._id)}>{item.user?.name || 'Unavailable person'}</Button><Text fontSize="sm" color="var(--dash-muted)">{item.user?.email}</Text>{item.user?.disabledAt && <Badge colorScheme="red">Inactive</Badge>}</Td>
        <Td>{words(item.user?.accountType || item.user?.role || '')}</Td>
        <Td>{[...(item.batches || []), ...(item.courses || [])].map((scope) => scope.name).join(', ') || 'As the role defines'}</Td>
        <Td>{item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'No end date'}</Td>
      </Tr>)}</Tbody></Table>
      {!docs.length && <Box textAlign="center" py={10}><Text fontWeight="semibold">{query ? 'No matching people' : 'Nobody has this role yet'}</Text>{!query && role.active && <Text fontSize="sm" mt={1}>Use Add People to give it to staff.</Text>}</Box>}
    </DataTableShell><Pager data={state.data} onPage={(value) => { setPage(value); setSelected({}); }} label="people" /></LoadState>
    {dialog === 'add' && <AssignDialog api={api} role={role} onClose={() => setDialog(null)} onDone={refresh} />}
    {dialog === 'move' && <AssignDialog api={api} moveFrom={role} people={chosen.map((item) => item.user).filter(Boolean)} onClose={() => setDialog(null)} onDone={refresh} />}
    {dialog === 'remove' && <ConfirmChange title={`Remove ${chosen.length} ${chosen.length === 1 ? 'person' : 'people'} from ${role.name}?`} action="Remove from Role" danger onClose={() => setDialog(null)}
      reasons={['Left the organisation', 'Role change', 'Temporary cover ended', 'Correcting access']}
      onConfirm={async (reason) => {
        const { data } = await api.post('/assignments/revoke', { assignmentIds: chosen.map((item) => item._id), reason });
        await refreshAccess(); toast({ title: `Removed ${data.revoked} ${data.revoked === 1 ? 'person' : 'people'} from ${role.name}`, status: 'success' });
        const notChanged = [...data.skipped, ...(data.failed || [])];
        if (notChanged.length) toast({ title: `${notChanged.length} not changed`, description: [...new Set(notChanged.map((item) => item.reason))].join(' '), status: data.failed?.length ? 'error' : 'warning', duration: 9000, isClosable: true });
        refresh();
      }}><Text>{chosen.map((item) => item.user?.name || 'Unavailable person').join(', ')}</Text><Text mt={2} fontSize="sm">Access from their other roles stays the same.</Text></ConfirmChange>}
  </Box>;
}
