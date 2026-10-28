import Select from '../../Components/InPageSelect';
import { DataTableShell } from '../../Components/PageHeader';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertIcon, Badge, Box, Button, FormControl, FormLabel, HStack, Input, Menu, MenuButton, MenuItem, MenuList, Stack, Table, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue, useFormControlContext, useToast } from '@chakra-ui/react';
import { ArrowLeft, ChevronDown, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { can, refreshAccess } from '../../utlls/accessCapabilities';
import { ConfirmChange, LoadState, Pager, SearchInput, useAccessData } from './AccessCommon';
import ScopePicker from './ScopePicker';
import { moduleName, permissionName, scopeName, words } from './accessUi';

export function RoleChoice({ api, value, onChange, label = 'Role to assign' }) {
  const [page, setPage] = useState(1);
  const state = useAccessData(api, '/roles', { page, limit: 25 });
  const form = useFormControlContext();
  const background = useColorModeValue('#ffffff', '#1e293b');
  const foreground = useColorModeValue('#263238', '#f1f5f9');
  const highlight = useColorModeValue('#edf2f7', '#334155');
  const activeRoles = state.data?.docs.filter((role) => role.active) || [];
  return <LoadState state={state}>
    <Menu matchWidth placement="bottom-start" isLazy>
      <MenuButton as={Button} aria-label={label} isDisabled={form?.isDisabled} rightIcon={<ChevronDown size={16} />} width="100%" variant="outline" fontWeight="normal" textAlign="left" bg={background} color={foreground}>
        <Text as="span" display="block" isTruncated>{value ? `${value.name}${value.active === false ? ' (Disabled)' : ''}` : 'Choose a role'}</Text>
      </MenuButton>
      <MenuList bg={background} color={foreground} maxHeight="280px" overflowY="auto" zIndex={1500}>
        <MenuItem bg={background} color={foreground} _focus={{ bg: highlight }} _hover={{ bg: highlight }} onClick={() => onChange(null)}>Choose a role</MenuItem>
        {activeRoles.map((role) => <MenuItem key={role._id} bg={background} color={foreground} _focus={{ bg: highlight }} _hover={{ bg: highlight }} onClick={() => onChange(role)}>{role.name}</MenuItem>)}
        {!activeRoles.length && <Text px={3} py={2} fontSize="sm">No active roles on this page.</Text>}
      </MenuList>
    </Menu>
    <Pager data={state.data} onPage={setPage} label="roles" />
  </LoadState>;
}
export default function PeopleAccess({ api, userId, catalog, onSelect, onBack }) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1), query = params.get('query') || '';
  const category = params.get('category') ?? 'staff', status = params.get('status') || '';
  const filter = (changes) => setParams({ category, status, query, page: '1', ...changes }, { replace: true });
  const [version, setVersion] = useState(0), [assignmentPage, setAssignmentPage] = useState(1);
  const list = useAccessData(api, userId ? null : '/users', { page, limit: 25, query, category, status }, version);
  const person = useAccessData(api, userId ? `/users/${userId}/effective` : null, {}, version);
  const assignments = useAccessData(api, userId ? `/assignments/${userId}` : null, { page: assignmentPage, limit: 25 }, version);
  const [role, setRole] = useState(null), [batchIds, setBatches] = useState([]), [courseIds, setCourses] = useState([]), [expiresAt, setExpiry] = useState('');
  const [batchLabels, setBatchLabels] = useState([]), [courseLabels, setCourseLabels] = useState([]);
  const [adding, setAdding] = useState(false), [confirm, setConfirm] = useState(null), [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState(''), [amount, setAmount] = useState(''), [decision, setDecision] = useState(null), [checking, setChecking] = useState(false), [checkError, setCheckError] = useState('');
  const [checkBatch, setCheckBatch] = useState([]), [checkCourse, setCheckCourse] = useState([]), [ownerSelf, setOwnerSelf] = useState(false), [creatorSelf, setCreatorSelf] = useState(false), [effectiveQuery, setEffectiveQuery] = useState('');
  const toast = useToast();
  const change = async (reason) => {
    setBusy(true);
    try {
      if (confirm.type === 'assign') await api.post('/assignments', { userId, roleId: role._id, batchIds, courseIds, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null, reason });
      else await api.delete(`/assignments/${confirm.item._id}`, { data: { reason } });
      setConfirm(null); setAdding(false); setRole(null); setBatches([]); setCourses([]); setExpiry(''); setVersion((value) => value + 1); await refreshAccess(); toast({ title: 'Access updated', status: 'success' });
    } finally { setBusy(false); }
  };
  if (!userId) return <>
    <div className="access-people-filters">
      <FormControl><FormLabel>Account category</FormLabel><Select aria-label="Filter account category" value={category} onChange={(event) => filter({ category: event.target.value })}><option value="">All categories</option>{['staff', 'student', 'teacher', 'qualifier', 'panelist'].map((type) => <option key={type} value={type}>{words(type)}</option>)}</Select></FormControl>
      <FormControl><FormLabel>Account status</FormLabel><Select aria-label="Filter account status" value={status} onChange={(event) => filter({ status: event.target.value })}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></Select></FormControl>
      <SearchInput label="Search people by name or email" value={query} onChange={(value) => filter({ query: value })} />
    </div>
    <LoadState state={list}><DataTableShell className="access-table access-people-table"><Table><Thead><Tr><Th>Person</Th><Th>Account category</Th><Th>Access roles</Th><Th /></Tr></Thead><Tbody>{list.data?.docs.map((user) => <Tr key={user._id}><Td><Button variant="link" onClick={() => onSelect(user._id)}>{user.name}</Button><Text fontSize="sm" color="var(--dash-muted)">{user.email}</Text>{user.disabledAt && <Badge colorScheme="red">Inactive</Badge>}</Td><Td>{words(user.accountType || user.role)}</Td><Td>{user.platformOwner ? <Badge colorScheme="purple">Protected owner</Badge> : user.accessRoles?.length ? user.accessRoles.map((role) => <Badge key={role._id} mr={1} mb={1} colorScheme={role.code === 'lca-v1-pending-staff' ? 'yellow' : 'gray'}>{role.name}</Badge>) : <Badge colorScheme="yellow">No assigned role</Badge>}</Td><Td><Button size="sm" onClick={() => onSelect(user._id)}>Manage Access</Button></Td></Tr>)}</Tbody></Table>{list.data?.docs.length === 0 && <Text py={8} textAlign="center">No matching people.</Text>}</DataTableShell><Pager data={list.data} onPage={(value) => filter({ page: String(value) })} label="people" /></LoadState>
  </>;
  const user = person.data?.user;
  const effective = (person.data?.grants || []).filter((grant) => `${permissionName(grant.permission)} ${grant.permission}`.toLowerCase().includes(effectiveQuery.toLowerCase()));
  return <>
    <Button variant="ghost" mb={4} leftIcon={<ArrowLeft size={16} />} onClick={onBack}>Back to People</Button>
    <LoadState state={person}>{user && <>
      <div className="access-person-heading"><div><h2>{user.name}</h2><Text color="var(--dash-muted)">{user.email}</Text></div><Badge>{words(user.accountType || user.role)}</Badge>{person.data.disabled && <Badge colorScheme="red">Account inactive</Badge>}</div>
      {user.platformOwner ? <Alert status="info" mb={4}><AlertIcon />Protected platform owner. Role assignments cannot change this account's owner authority.</Alert> : <>
        <HStack justify="space-between" mb={3}><h3>Assigned Roles</h3>{can('access.assign') && <Button leftIcon={<Plus size={16} />} onClick={() => setAdding(!adding)}>{adding ? 'Cancel Assignment' : 'Assign Role'}</Button>}</HStack>
        <LoadState state={assignments}><DataTableShell className="access-table access-assignments"><Table size="sm"><Thead><Tr><Th>Role</Th><Th>Class restrictions</Th><Th>Expires</Th><Th /></Tr></Thead><Tbody>{assignments.data?.docs.map((item) => <Tr key={item._id}><Td>{item.role?.name || 'Unavailable role'}{(item.expiresAt && new Date(item.expiresAt) <= new Date()) && <Badge ml={2}>Expired</Badge>}{item.role?.active === false && <Badge ml={2}>Role disabled</Badge>}</Td><Td>{[...(item.batches || []), ...(item.courses || [])].map((scope) => scope.name).join(', ') || 'Role-defined scope'}</Td><Td>{item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'No expiry'}</Td><Td><Button size="sm" variant="ghost" colorScheme="red" leftIcon={<Trash2 size={14} />} onClick={() => setConfirm({ type: 'revoke', item })}>Remove</Button></Td></Tr>)}</Tbody></Table>{assignments.data?.docs.length === 0 && <Text py={6} textAlign="center">No assigned roles.</Text>}</DataTableShell><Pager data={assignments.data} onPage={setAssignmentPage} label="assignments" /></LoadState>
        {adding && <section className="access-assignment-form"><h3>Assign a Role to {user.name}</h3><FormControl><FormLabel>Role</FormLabel><RoleChoice api={api} value={role} onChange={setRole} /></FormControl>
          {role?.grants.some((grant) => grant.scope === 'selected') && <><ScopePicker api={api} type="batches" selected={batchIds} onChange={setBatches} onLabels={setBatchLabels} /><ScopePicker api={api} type="courses" selected={courseIds} onChange={setCourses} onLabels={setCourseLabels} /></>}
          <FormControl maxW="320px"><FormLabel htmlFor="assignment-expiry">Expiry (optional)</FormLabel><Input id="assignment-expiry" type="datetime-local" value={expiresAt} onChange={(event) => setExpiry(event.target.value)} /></FormControl>
          <Button className="table-action-btn table-action-btn--primary" isDisabled={!role || (role.grants.some((grant) => grant.scope === 'selected') && !batchIds.length) || Boolean(expiresAt && new Date(expiresAt) <= new Date())} onClick={() => setConfirm({ type: 'assign' })}>Review Assignment</Button></section>}
      </>}
      <section className="access-section"><h3>Effective Access</h3>{person.data.owner ? <Text>All application operations through protected owner authority.</Text> : <><SearchInput label="Search effective access" value={effectiveQuery} onChange={setEffectiveQuery} /><div className="access-effective-list">{effective.map((grant, index) => <div key={index}><span>{moduleName(grant.permission.split('.')[0])} / {permissionName(grant.permission)}</span><span>{person.data.roles?.find((role) => String(role._id) === String(grant.roleId))?.name && <Text as="small" display="block" mb={1}>{person.data.roles.find((role) => String(role._id) === String(grant.roleId)).name}</Text>}{scopeName(grant.scope)}{grant.maxAmount != null ? ` · PKR ${grant.maxAmount}` : ''}{grant.noSelfApproval ? ' · No self-approval' : ''}{grant.fields?.length ? ` · ${grant.fields.map(words).join(', ')}` : ''}</span></div>)}{!effective.length && <Text py={4}>No effective permissions.</Text>}</div></>}</section>
      {can('access.explain') && <section className="access-section"><h3>Check Access</h3><div className="access-details-grid"><FormControl><FormLabel>Action</FormLabel><Select aria-label="Action to check" value={permission} onChange={(event) => { setPermission(event.target.value); setDecision(null); }}><option value="">Choose an action</option>{catalog.filter((item) => item.type !== 'field').map((item) => <option key={item.key} value={item.key}>{moduleName(item.group)} / {permissionName(item)}</option>)}</Select></FormControl><FormControl><FormLabel>Amount (optional, PKR)</FormLabel><Input type="number" min={0} value={amount} onChange={(event) => { setAmount(event.target.value); setDecision(null); }} /></FormControl></div><ScopePicker api={api} type="batches" single selected={checkBatch} onChange={(ids) => { setCheckBatch(ids); setDecision(null); }} /><ScopePicker api={api} type="courses" single selected={checkCourse} onChange={(ids) => { setCheckCourse(ids); setDecision(null); }} /><label className="access-check-owner"><input type="checkbox" checked={ownerSelf} onChange={(event) => { setOwnerSelf(event.target.checked); setDecision(null); }} /> Record belongs to {user.name}</label><label className="access-check-owner"><input type="checkbox" checked={creatorSelf} onChange={(event) => { setCreatorSelf(event.target.checked); setDecision(null); }} /> Request created by {user.name}</label>
        <Button leftIcon={<ShieldCheck size={16} />} isLoading={checking} isDisabled={!permission || (amount !== '' && (!Number.isFinite(Number(amount)) || Number(amount) < 0))} onClick={async () => { setChecking(true); setCheckError(''); try { setDecision((await api.post('/explain', { userId, permission, resource: { batchId: checkBatch[0], courseId: checkCourse[0], createdBy: creatorSelf ? userId : undefined, ownerId: ownerSelf ? userId : undefined, amount: amount === '' ? undefined : Number(amount) } })).data); } catch (failure) { setCheckError(failure.response?.data?.message || failure.message); } finally { setChecking(false); } }}>Check Access</Button>{checkError && <Alert status="error" mt={3}><AlertIcon />{checkError}</Alert>}{decision && <Alert status={decision.allowed ? 'success' : 'warning'} mt={3}><AlertIcon /><Box><Text fontWeight="semibold">{decision.allowed ? 'Allowed' : 'Not allowed'}</Text><Text>{words(decision.reason)}</Text><Text fontSize="sm">Role checks only; record ownership and business rules are checked again during the action.</Text></Box></Alert>}</section>}
    </>}</LoadState>
    {confirm && <ConfirmChange title={confirm.type === 'assign' ? `Assign ${role.name}?` : `Remove ${confirm.item.role?.name || 'role'}?`} action={confirm.type === 'assign' ? 'Assign Role' : 'Remove Role'} danger={confirm.type === 'revoke'} busy={busy} onClose={() => setConfirm(null)} onConfirm={change}><Text>{user?.name} ({user?.email})</Text><Text mt={2}>{confirm.type === 'assign' ? `${expiresAt ? `Expires ${new Date(expiresAt).toLocaleString()}.` : 'No expiry.'}` : 'Access from other assigned roles will remain in effect.'}</Text>{confirm.type === 'assign' && batchLabels.length > 0 && <Text mt={2}>Batches: {batchLabels.join(', ')}</Text>}{confirm.type === 'assign' && courseLabels.length > 0 && <Text mt={2}>Courses: {courseLabels.join(', ')}</Text>}{confirm.type === 'assign' && role?.grants.some((grant) => grant.scope === 'all' && !grant.permission.startsWith('fields.')) && <Alert status="warning" mt={3}><AlertIcon />This role includes institution-wide operations.</Alert>}</ConfirmChange>}
  </>;
}
