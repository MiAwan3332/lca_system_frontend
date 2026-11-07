import Select from '../../Components/InPageSelect';
import React, { useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormHelperText, FormLabel, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
  ModalHeader, ModalOverlay, Stack, Tag, TagCloseButton, TagLabel, Text, useToast } from '@chakra-ui/react';
import { refreshAccess } from '../../utlls/accessCapabilities';
import { LoadState, Pager, ReasonField, SearchInput, useAccessData } from './AccessCommon';
import { RoleChoice } from './RoleChoice';
import ScopePicker from './ScopePicker';
import { words } from './accessUi';

export const PENDING_STAFF = 'lca-v1-pending-staff';
const CATEGORIES = ['staff', 'student', 'teacher', 'qualifier', 'panelist'];

export function PeoplePicker({ api, selected, onChange }) {
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [category, setCategory] = useState('staff');
  const list = useAccessData(api, '/users', { page, limit: 25, query, category, status: 'active' });
  const toggle = (user, checked) => { const next = { ...selected }; if (checked) next[user._id] = user; else delete next[user._id]; onChange(next); };
  const docs = list.data?.docs || [];
  return <Box>
    <HStack spacing={3} align="end" flexWrap="wrap" mb={2}>
      <FormControl maxW="200px"><FormLabel fontSize="sm">Account category</FormLabel><Select size="sm" aria-label="People category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
        <option value="">All categories</option>{CATEGORIES.map((item) => <option key={item} value={item}>{words(item)}</option>)}</Select></FormControl>
      <Box flex="1 1 220px"><SearchInput label="Search people by name or email" value={query} onChange={(value) => { setQuery(value); setPage(1); }} /></Box>
    </HStack>
    {Object.keys(selected).length > 0 && <HStack flexWrap="wrap" spacing={2} mb={2}>{Object.values(selected).map((user) => <Tag key={user._id} size="sm"><TagLabel>{user.name}</TagLabel>
      <TagCloseButton aria-label={`Remove ${user.name}`} onClick={() => toggle(user, false)} /></Tag>)}</HStack>}
    <LoadState state={list}><Stack className="access-picker-list" spacing={0}>{docs.map((user) => <Checkbox key={user._id} isDisabled={user.platformOwner} isChecked={Boolean(selected[user._id])} onChange={(event) => toggle(user, event.target.checked)}>
      <Text as="span" fontWeight="medium">{user.name}</Text> <Text as="span" fontSize="sm" color="var(--dash-muted)">{user.email}</Text>
      {user.platformOwner ? <Badge ml={1} colorScheme="purple">Protected owner</Badge> : user.accessRoles?.map((role) => <Badge key={role._id} ml={1} colorScheme={role.code === PENDING_STAFF ? 'yellow' : 'gray'}>{role.name}</Badge>)}</Checkbox>)}
      {!docs.length && <Text py={4} textAlign="center" fontSize="sm">No matching active people.</Text>}</Stack>
      <Pager data={list.data} onPage={setPage} label="people" /></LoadState>
  </Box>;
}

// One dialog for giving a role to people: from a role's member list, the People list, or when moving people between roles.
export default function AssignDialog({ api, role: fixedRole = null, people: fixedPeople = null, moveFrom = null, onClose, onDone }) {
  const [role, setRole] = useState(fixedRole), [people, setPeople] = useState(() => Object.fromEntries((fixedPeople || []).map((user) => [user._id, user])));
  const [batchIds, setBatches] = useState([]), [courseIds, setCourses] = useState([]), [expiresAt, setExpiry] = useState('');
  const [replacePending, setReplacePending] = useState(true), [reason, setReason] = useState(moveFrom ? 'Role change' : '');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [result, setResult] = useState(null);
  const toast = useToast();
  const selected = Object.values(people), scoped = role?.grants?.some((grant) => grant.scope === 'selected');
  const expiryInvalid = Boolean(expiresAt && new Date(expiresAt) <= new Date());
  const ready = role && selected.length > 0 && selected.length <= 100 && (!scoped || batchIds.length || courseIds.length) && reason.trim().length >= 5 && !expiryInvalid;
  const title = moveFrom ? `Move ${selected.length} ${selected.length === 1 ? 'person' : 'people'} from ${moveFrom.name}` : fixedRole ? `Add people to ${fixedRole.name}` : `Assign a role to ${selected.length} ${selected.length === 1 ? 'person' : 'people'}`;
  const submit = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/assignments/bulk', { roleId: role._id, userIds: selected.map((user) => user._id), batchIds, courseIds,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null, replacePending, replaceRoleIds: moveFrom ? [moveFrom._id] : [], reason: reason.trim() });
      setResult(data); await refreshAccess();
      const problems = (data.failed?.length || 0) + data.skipped.length;
      toast({ title: data.assigned.length ? `${moveFrom ? 'Moved' : 'Updated'} ${data.assigned.length} ${data.assigned.length === 1 ? 'person' : 'people'}` : 'Nobody was changed',
        description: problems ? `${problems} not changed. See the details in the dialog.` : undefined, status: data.failed?.length ? 'error' : problems ? 'warning' : 'success' });
    } catch (failure) { setError(failure.response?.data?.message || failure.message); }
    finally { setBusy(false); }
  };
  return <Modal isOpen onClose={busy ? () => {} : result ? onDone : onClose} closeOnOverlayClick={!busy} size="2xl" scrollBehavior="inside"><ModalOverlay /><ModalContent className="access-confirm-modal" borderRadius="8px">
    <ModalHeader>{title}</ModalHeader><ModalCloseButton isDisabled={busy} />
    <ModalBody>{result ? <Stack spacing={3}>
      {result.failed?.length > 0 && <Alert status="error" alignItems="flex-start"><AlertIcon /><Box><Text fontWeight="semibold">Could not be saved for {result.failed.length} {result.failed.length === 1 ? 'person' : 'people'}</Text>
        {result.failed.map((item) => <Text key={item.userId} fontSize="sm">{item.name}: {item.reason}</Text>)}</Box></Alert>}
      {(() => { const added = result.assigned.filter((item) => !item.alreadyHad), had = result.assigned.filter((item) => item.alreadyHad); return <>
        {added.length > 0 && <Alert status="success"><AlertIcon />{role.name} given to {added.map((item) => item.name).join(', ')}.</Alert>}
        {had.length > 0 && <Alert status="info"><AlertIcon />{had.map((item) => item.name).join(', ')} already had {role.name}{moveFrom ? `; they were removed from ${moveFrom.name}` : '; their pending role was removed'}.</Alert>}
        {!result.assigned.length && !result.failed?.length && <Alert status="info"><AlertIcon />Nobody was changed.</Alert>}</>; })()}
      {result.revoked > 0 && <Text>{result.revoked} previous role assignment{result.revoked === 1 ? ' was' : 's were'} removed.</Text>}
      {result.keptPending?.length > 0 && <Alert status="warning"><AlertIcon />Kept “Staff - Pending Assignment” for {result.keptPending.map((item) => item.name).join(', ')} so they can still use their own profile, photo, password and notifications. Add those basics to {role.name} to remove it.</Alert>}
      {result.skipped.length > 0 && <Box><Text fontWeight="semibold">Not changed</Text>{result.skipped.map((item) => <Text key={item.userId} fontSize="sm">{item.name}: {item.reason}</Text>)}</Box>}
    </Stack> : <Stack spacing={4}>
      {!fixedRole && <FormControl><FormLabel>{moveFrom ? 'Move to role' : 'Role'}</FormLabel><RoleChoice api={api} value={role} onChange={(next) => { setRole(next); setBatches([]); setCourses([]); }} exclude={moveFrom ? [moveFrom._id] : []} /></FormControl>}
      {!fixedPeople && <FormControl><FormLabel>People ({selected.length} selected)</FormLabel><PeoplePicker api={api} selected={people} onChange={setPeople} /></FormControl>}
      {fixedPeople && <Text fontSize="sm">{selected.map((user) => user.name).join(', ')}</Text>}
      {selected.length > 100 && <Alert status="warning"><AlertIcon />Choose at most 100 people at a time.</Alert>}
      {scoped && <Box><Text fontWeight="medium">Which classes?</Text><Text fontSize="sm" color="var(--dash-muted)">This role only works in the batches or courses you choose here.</Text>
        <ScopePicker api={api} type="batches" selected={batchIds} onChange={setBatches} /><ScopePicker api={api} type="courses" selected={courseIds} onChange={setCourses} /></Box>}
      <FormControl maxW="320px" isInvalid={expiryInvalid}><FormLabel htmlFor="bulk-expiry">Access ends (optional)</FormLabel><Input id="bulk-expiry" type="datetime-local" value={expiresAt} onChange={(event) => setExpiry(event.target.value)} />
        <FormHelperText>Use for temporary cover. Leave empty to keep access until removed.</FormHelperText></FormControl>
      {!moveFrom && <Checkbox isChecked={replacePending} onChange={(event) => setReplacePending(event.target.checked)}>Remove “Staff - Pending Assignment” from anyone who has it</Checkbox>}
      {moveFrom && <Text fontSize="sm">They will be removed from {moveFrom.name}. Access from their other roles stays the same.</Text>}
      <ReasonField value={reason} onChange={setReason} />
      {error && <Alert status="error"><AlertIcon />{error}</Alert>}
    </Stack>}</ModalBody>
    <ModalFooter gap={2}>{result ? <Button className="table-action-btn table-action-btn--primary" onClick={onDone}>Done</Button> : <>
      <Button variant="ghost" isDisabled={busy} onClick={onClose}>Cancel</Button>
      <Button className="table-action-btn table-action-btn--primary" isLoading={busy} isDisabled={!ready} onClick={submit}>{moveFrom ? `Move ${selected.length} to ${role ? role.name : 'new role'}` : `Give ${role ? role.name : 'role'} to ${selected.length || 'selected people'}`}</Button></>}</ModalFooter>
  </ModalContent></Modal>;
}
