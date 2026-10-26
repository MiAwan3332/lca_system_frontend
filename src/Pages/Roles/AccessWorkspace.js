import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Box, Button, Checkbox, FormControl, FormLabel, HStack, Input, Select, Text, Textarea,
  Tabs, TabList, Tab, TabPanels, TabPanel, Table, Thead, Tbody, Tr, Th, Td, Alert, AlertIcon, Stack } from '@chakra-ui/react';
import { Plus, Copy, Save, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { config } from '../../utlls/config';
import { can, refreshAccess } from '../../utlls/accessCapabilities';
import PageHeader from '../../Components/PageHeader';
import TableRowLoading from '../../Components/TableRowLoading';
import ScopePicker from './ScopePicker';

const empty = () => ({ name: '', description: '', grants: [], active: true });
const Pager = ({ page, next, onChange, disabled }) => <HStack mt={3}>
  <Button aria-label="Previous page" title="Previous page" isDisabled={disabled || page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></Button>
  <Text fontSize="sm">Page {page}</Text><Button aria-label="Next page" title="Next page" isDisabled={disabled || !next} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></Button>
</HStack>;

export default function AccessWorkspace() {
  const [catalog, setCatalog] = useState([]), [roles, setRoles] = useState({ docs: [] }), [users, setUsers] = useState({ docs: [] });
  const [rolePage, setRolePage] = useState(1), [userPage, setUserPage] = useState(1), [userQuery, setUserQuery] = useState('');
  const [auditPage, setAuditPage] = useState(1), [audits, setAudits] = useState({ docs: [] });
  const [assignmentPage, setAssignmentPage] = useState(1), [assignments, setAssignments] = useState({ docs: [] });
  const [draft, setDraft] = useState(null), [permissionQuery, setPermissionQuery] = useState(''), [group, setGroup] = useState('');
  const [reason, setReason] = useState(''), [preview, setPreview] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState(''), [assignment, setAssignment] = useState({ roleId: '', batchIds: [], courseIds: [], expiresAt: '' });
  const [explain, setExplain] = useState({ userId: '', permission: '', batchId: '', ownerId: '', amount: '' }), [decision, setDecision] = useState(null);
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState(0), [defaults, setDefaults] = useState({ roles: {}, revision: 0 });
  const api = useMemo(() => axios.create({ baseURL: `${config.BASE_URL}/access`, headers: { Authorization: `Bearer ${Cookies.get('authToken')}` }, timeout: 15000 }), []);
  const execute = async (run) => {
    setBusy(true); setError('');
    try { await run(); } catch (failure) { setError(failure.response?.data?.message || failure.message || 'Access operation failed'); }
    finally { setBusy(false); }
  };
  useEffect(() => { execute(async () => setCatalog((await api.get('/catalog')).data.permissions)); }, [api]);
  useEffect(() => { execute(async () => setRoles((await api.get('/roles', { params: { page: rolePage, limit: 25 } })).data)); }, [api, rolePage, version]);
  useEffect(() => {
    if (!can('access.assign')) return;
    const controller = new AbortController();
    const timer = setTimeout(() => api.get('/users', { params: { page: userPage, limit: 25, query: userQuery }, signal: controller.signal })
      .then(({ data }) => setUsers(data)).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); }), 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [api, userPage, userQuery, version]);
  useEffect(() => { if (userId) execute(async () => setAssignments((await api.get(`/assignments/${userId}`, { params: { page: assignmentPage, limit: 25 } })).data)); }, [api, userId, assignmentPage, version]);
  useEffect(() => { if (can('access.audit')) execute(async () => setAudits((await api.get('/audit', { params: { page: auditPage, limit: 25 } })).data)); }, [api, auditPage, version]);
  useEffect(() => { if (can('access.manage')) execute(async () => setDefaults((await api.get('/defaults')).data)); }, [api, version]);
  const groups = [...new Set(catalog.map((permission) => permission.group))];
  const visible = catalog.filter((permission) => (!group || permission.group === group) && `${permission.label} ${permission.key}`.toLowerCase().includes(permissionQuery.toLowerCase()));
  const changeGrant = (key, update) => { setPreview(null); setDraft((current) => ({ ...current, grants: current.grants.map((grant) => grant.permission === key ? { ...grant, ...update } : grant) })); };
  const toggle = (key, checked) => { setPreview(null); setDraft((current) => ({ ...current, grants: checked ? [...current.grants, { permission: key, scope: 'all', maxAmount: null, noSelfApproval: false }] : current.grants.filter((grant) => grant.permission !== key) })); };
  const publish = () => execute(async () => {
    if (reason.trim().length < 5) throw new Error('Enter a change reason');
    const payload = { ...draft, reason };
    if (draft._id) await api.put(`/roles/${draft._id}`, payload); else await api.post('/roles', payload);
    setDraft(null); setPreview(null); setReason(''); setVersion((current) => current + 1); await refreshAccess();
  });
  return <Box>
    <PageHeader title="Access Management">{can('access.manage') && <Button leftIcon={<Plus size={16} />} onClick={() => { setDraft(empty()); setPreview(null); }}>Create Role</Button>}</PageHeader>
    {error && <Alert status="error" my={3}><AlertIcon />{error}</Alert>}
    <Tabs isLazy index={tab} onChange={setTab}><TabList flexWrap="wrap"><Tab>Roles</Tab>{can('access.assign') && <Tab>Assignments</Tab>}{can('access.explain') && <Tab>Explain Access</Tab>}{can('access.audit') && <Tab>Audit</Tab>}{can('access.manage') && <Tab>Onboarding</Tab>}</TabList>
      <TabPanels><TabPanel px={0}>
        {draft ? <Stack spacing={4} as="section">
          <HStack align="end" flexWrap="wrap"><FormControl maxW="360px"><FormLabel>Role name</FormLabel><Input value={draft.name} maxLength={100} onChange={(event) => { setPreview(null); setDraft({ ...draft, name: event.target.value }); }} /></FormControl>
            <Checkbox isChecked={draft.active} onChange={(event) => { setPreview(null); setDraft({ ...draft, active: event.target.checked }); }}>Active</Checkbox>
            <Button onClick={() => setDraft(null)}>Cancel</Button></HStack>
          <FormControl><FormLabel>Description</FormLabel><Textarea value={draft.description || ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></FormControl>
          <HStack flexWrap="wrap"><Input aria-label="Search permissions" maxW="360px" placeholder="Search permissions" value={permissionQuery} onChange={(event) => setPermissionQuery(event.target.value)} />
            <Select aria-label="Permission group" maxW="240px" value={group} onChange={(event) => setGroup(event.target.value)}><option value="">All modules</option>{groups.map((name) => <option key={name}>{name}</option>)}</Select>
            <Text fontSize="sm">{draft.grants.length} selected</Text></HStack>
          <Box overflowX="auto" maxH="480px" overflowY="auto" borderWidth="1px" borderRadius="6px"><Table size="sm"><Thead><Tr><Th>Permission</Th><Th>Scope</Th><Th>Amount limit</Th><Th>Approval</Th></Tr></Thead><Tbody>
            {visible.map((permission) => { const grant = draft.grants.find((item) => item.permission === permission.key); return <Tr key={permission.key}>
              <Td minW="280px"><Checkbox isChecked={Boolean(grant)} onChange={(event) => toggle(permission.key, event.target.checked)}>{permission.label}</Checkbox><Text fontSize="xs" color="gray.500">{permission.key}</Text>
                {permission.type === 'field' && grant && <Select multiple aria-label={`Fields ${permission.key}`} mt={2} h="100px" value={grant.fields?.length ? grant.fields : ['*']} onChange={(event) => { const selected = Array.from(event.target.selectedOptions, (option) => option.value); changeGrant(permission.key, { fields: selected.includes('*') ? [] : selected }); }}><option value="*">All fields</option>{permission.fields?.map((field) => <option key={field}>{field}</option>)}</Select>}
              </Td>
              <Td><Select size="sm" aria-label={`Scope ${permission.key}`} minW="140px" isDisabled={!grant || permission.type === 'field'} value={grant?.scope || 'all'} onChange={(event) => changeGrant(permission.key, { scope: event.target.value })}>
                <option value="all">All records</option><option value="own">Own records</option><option value="assigned">Assigned batches</option><option value="selected">Selected batches/courses</option></Select></Td>
              <Td><Input size="sm" type="number" min={0} w="130px" aria-label={`Amount ${permission.key}`} isDisabled={!grant} placeholder="No limit" value={grant?.maxAmount ?? ''} onChange={(event) => changeGrant(permission.key, { maxAmount: event.target.value === '' ? null : Number(event.target.value) })} /></Td>
              <Td><Checkbox isDisabled={!grant} isChecked={Boolean(grant?.noSelfApproval)} onChange={(event) => changeGrant(permission.key, { noSelfApproval: event.target.checked })}>No self-approval</Checkbox></Td>
            </Tr>; })}</Tbody></Table></Box>
          <FormControl><FormLabel>Change reason</FormLabel><Textarea value={reason} onChange={(event) => setReason(event.target.value)} /></FormControl>
          {preview && <Alert status="warning"><AlertIcon />{preview.activeAssignments} active assignments affected; {preview.added.length} grants added, {preview.removed.length} removed.{preview.onboardingDefaults?.length ? ` Default for: ${preview.onboardingDefaults.join(', ')}. Disabling this role blocks new accounts in these categories.` : ''}</Alert>}
          <HStack>{draft._id && <Button isLoading={busy} onClick={() => execute(async () => setPreview((await api.post(`/roles/${draft._id}/preview`, draft)).data))}>Preview Impact</Button>}
            <Button leftIcon={<Save size={16} />} isLoading={busy} isDisabled={!draft.name.trim() || reason.trim().length < 5 || Boolean(draft._id && !preview)} onClick={publish}>Publish Role</Button></HStack>
        </Stack> : <><Box overflowX="auto"><Table><Thead><Tr><Th>Role</Th><Th>Revision</Th><Th>Grants</Th><Th>Status</Th><Th>Actions</Th></Tr></Thead><Tbody>
          {busy && !roles.docs.length ? <TableRowLoading colSpan={5} /> : roles.docs.map((role) => <Tr key={role._id}><Td>{role.name}<Text fontSize="xs">{role.description}</Text></Td><Td>{role.revision}</Td><Td>{role.grants.length}</Td><Td>{role.active ? 'Active' : 'Disabled'}</Td>
            <Td>{can('access.manage') && <HStack><Button size="sm" onClick={() => { setDraft(role); setPreview(null); }}>Edit</Button><Button size="sm" leftIcon={<Copy size={14} />} onClick={() => { setDraft({ ...role, _id: undefined, code: undefined, name: `${role.name} Copy` }); setPreview(null); }}>Clone</Button></HStack>}</Td></Tr>)}</Tbody></Table></Box>
          <Pager page={rolePage} next={roles.hasNextPage} onChange={setRolePage} disabled={busy} /></>}
      </TabPanel>
      {can('access.assign') && <TabPanel px={0}><Stack spacing={4}>
        <HStack><Input placeholder="Search users" aria-label="Search users" value={userQuery} onChange={(event) => { setUserQuery(event.target.value); setUserPage(1); }} /><Select aria-label="User" value={userId} onChange={(event) => { setUserId(event.target.value); setAssignmentPage(1); }}><option value="">Select user</option>{users.docs.map((user) => <option key={user._id} value={user._id}>{user.name} ({user.email}){user.platformOwner ? ' - Protected owner' : ''}</option>)}</Select></HStack>
        <Pager page={userPage} next={users.hasNextPage} onChange={setUserPage} />
        {userId && <><Table size="sm"><Thead><Tr><Th>Role</Th><Th>Scope IDs</Th><Th>Expiry</Th><Th>Action</Th></Tr></Thead><Tbody>{assignments.docs.map((item) => <Tr key={item._id}><Td>{item.role?.name || 'Missing role'}</Td><Td>{[...item.batchIds, ...item.courseIds].join(', ') || 'Role-defined'}</Td><Td>{item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'No expiry'}</Td><Td><Button size="sm" isDisabled={busy || reason.trim().length < 5} onClick={() => execute(async () => { await api.delete(`/assignments/${item._id}`, { data: { reason } }); setVersion((current) => current + 1); await refreshAccess(); })}>Revoke</Button></Td></Tr>)}</Tbody></Table><Pager page={assignmentPage} next={assignments.hasNextPage} onChange={setAssignmentPage} /></>}
        <Select aria-label="Role to assign" value={assignment.roleId} onChange={(event) => setAssignment({ ...assignment, roleId: event.target.value })}><option value="">Select role</option>{roles.docs.filter((role) => role.active).map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</Select><Pager page={rolePage} next={roles.hasNextPage} onChange={setRolePage} />
        <ScopePicker api={api} type="batches" selected={assignment.batchIds} onChange={(batchIds) => setAssignment({ ...assignment, batchIds })} />
        <ScopePicker api={api} type="courses" selected={assignment.courseIds} onChange={(courseIds) => setAssignment({ ...assignment, courseIds })} />
        <FormControl><FormLabel>Expires at (optional)</FormLabel><Input type="datetime-local" value={assignment.expiresAt} onChange={(event) => setAssignment({ ...assignment, expiresAt: event.target.value })} /></FormControl>
        <Textarea aria-label="Assignment change reason" placeholder="Change reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button alignSelf="start" isLoading={busy} isDisabled={!userId || !assignment.roleId || reason.trim().length < 5} onClick={() => execute(async () => { await api.post('/assignments', { userId, ...assignment, expiresAt: assignment.expiresAt ? new Date(assignment.expiresAt).toISOString() : null, reason }); setVersion((current) => current + 1); await refreshAccess(); })}>Assign Role</Button>
      </Stack></TabPanel>}
      {can('access.explain') && <TabPanel px={0}><Stack spacing={3} maxW="720px">
        <Input aria-label="Explain user ID" placeholder="User ID" value={explain.userId} onChange={(event) => setExplain({ ...explain, userId: event.target.value })} />
        <Select aria-label="Explain permission" value={explain.permission} onChange={(event) => setExplain({ ...explain, permission: event.target.value })}><option value="">Select permission</option>{catalog.map((item) => <option key={item.key} value={item.key}>{item.key}</option>)}</Select>
        {['batchId', 'ownerId', 'amount'].map((key) => <Input key={key} aria-label={key} placeholder={key} value={explain[key]} onChange={(event) => setExplain({ ...explain, [key]: event.target.value })} />)}
        <Button leftIcon={<Search size={16} />} isLoading={busy} onClick={() => execute(async () => setDecision((await api.post('/explain', { userId: explain.userId, permission: explain.permission, resource: { batchId: explain.batchId || undefined, ownerId: explain.ownerId || undefined, amount: explain.amount === '' ? undefined : Number(explain.amount) } })).data))}>Check Access</Button>
        {decision && <Alert status={decision.allowed ? 'success' : 'warning'}><AlertIcon />{decision.allowed ? 'Allowed' : 'Denied'}: {decision.reason}</Alert>}
      </Stack></TabPanel>}
      {can('access.audit') && <TabPanel px={0}><Box overflowX="auto"><Table size="sm"><Thead><Tr><Th>Time</Th><Th>Actor</Th><Th>Action</Th><Th>Target</Th><Th>Reason</Th><Th>Restore</Th></Tr></Thead><Tbody>{audits.docs.map((item) => <Tr key={item._id}><Td>{new Date(item.createdAt).toLocaleString()}</Td><Td>{item.actor?.name || String(item.actor || '')}</Td><Td>{item.action}</Td><Td>{item.target}</Td><Td>{item.reason}</Td><Td>{item.before?.managed && can('access.manage') && <Button size="sm" onClick={() => execute(async () => { const current = (await api.get(`/roles/${item.target}`)).data; setDraft({ ...item.before, revision: current.revision }); setPreview(null); setTab(0); })}>Prepare Previous Version</Button>}</Td></Tr>)}</Tbody></Table></Box><Pager page={auditPage} next={audits.hasNextPage} onChange={setAuditPage} /></TabPanel>}
      {can('access.manage') && <TabPanel px={0}><Stack maxW="720px" spacing={4}>
        {['staff', 'student', 'teacher', 'qualifier', 'panelist'].map((type) => <FormControl key={type}><FormLabel textTransform="capitalize">{type}</FormLabel><Select aria-label={`Default ${type} role`} value={defaults.roles?.[type] || ''} onChange={(event) => setDefaults({ ...defaults, roles: { ...defaults.roles, [type]: event.target.value } })}><option value="">No default</option>{roles.docs.filter((role) => role.active).map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</Select></FormControl>)}
        <Pager page={rolePage} next={roles.hasNextPage} onChange={setRolePage} />
        <Textarea aria-label="Onboarding change reason" placeholder="Change reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button alignSelf="start" leftIcon={<Save size={16} />} isLoading={busy} isDisabled={!can('access.owner') || reason.trim().length < 5} onClick={() => execute(async () => { const roles = Object.fromEntries(Object.entries(defaults.roles || {}).filter(([, value]) => value)); setDefaults((await api.put('/defaults', { ...defaults, roles, reason })).data); setReason(''); })}>Save Defaults</Button>
      </Stack></TabPanel>}
      </TabPanels></Tabs>
  </Box>;
}
