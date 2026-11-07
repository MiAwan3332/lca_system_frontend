import Select from '../../Components/InPageSelect';
import { DataTableShell } from '../../Components/PageHeader';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormLabel, HStack, Input, Table, Tbody, Td, Text, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { ArrowLeft, Plus, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { can, refreshAccess, routeAllowed, routesForGrants } from '../../utlls/accessCapabilities';
import { ConfirmChange, LoadState, Pager, SearchInput, useAccessData } from './AccessCommon';
import { RoleChoice } from './RoleChoice';
import AssignDialog, { PENDING_STAFF } from './AssignDialog';
import ScopePicker from './ScopePicker';
import { ABILITIES, ADMIN_AREAS, FIELD_AREAS, MENU_PAGES, accessSummary, adminState, areaRoleIds, fieldState } from './accessAreas';
import { moduleName, permissionName, scopeName, words } from './accessUi';

export { RoleChoice };
const FIELD_LEVEL = { view: 'View', edit: 'View & edit', custom: 'Custom' };

// Readable overview of a person's combined access, with the roles it comes from.
function AccessOverview({ data }) {
  const [details, setDetails] = useState(false), [query, setQuery] = useState('');
  const grants = data.grants || [], roleName = (id) => data.roles?.find((role) => String(role._id) === String(id))?.name;
  const summary = accessSummary(grants);
  const pages = MENU_PAGES.filter((page) => routeAllowed(page.path, { owner: data.owner, grants, routes: routesForGrants(grants, data.owner) }));
  const fields = FIELD_AREAS.map((item) => ({ item, state: fieldState(item.key, grants) })).filter(({ state }) => state.level !== 'none');
  const admin = ADMIN_AREAS.filter((item) => adminState(item, grants) === true);
  const effective = grants.filter((grant) => `${permissionName(grant.permission)} ${grant.permission}`.toLowerCase().includes(query.toLowerCase()));
  if (data.owner) return <section className="access-section" aria-label="What they can do"><h3>What they can do</h3><Text>All application operations through protected owner authority.</Text></section>;
  return <section className="access-section" aria-label="What they can do"><h3>What they can do</h3>
    <Text fontWeight="medium" mb={2}>Pages in their menu</Text>
    <HStack flexWrap="wrap" gap={2} mb={4}>{pages.map((page) => <Badge key={page.path} variant="subtle" px={2} py={1} textTransform="none">{page.name}</Badge>)}{!pages.length && <Text fontSize="sm">Only their own profile.</Text>}</HStack>
    <div className="access-overview">{summary.map(({ area, state, label, extras }) => <div key={area.key}>
      <Text fontWeight="semibold">{area.label}</Text>
      <Text>{label}{state.level === 'custom' ? ` (${state.actions} of ${state.total} actions)` : ''}{state.scope && state.scope !== 'all' ? ` · ${state.scope === 'mixed' ? 'Mixed records' : scopeName(state.scope)}` : ''}{extras.length ? ` · ${extras.join(', ')}` : ''}</Text>
      <Text fontSize="xs" color="var(--dash-muted)">From {areaRoleIds(area, grants).map(roleName).filter(Boolean).join(', ') || 'assigned roles'}</Text>
    </div>)}{!summary.length && <Text py={2}>No pages beyond their own profile.</Text>}</div>
    {fields.length > 0 && <Text mt={3} fontSize="sm"><b>Information:</b> {fields.map(({ item, state }) => `${item.label} (${FIELD_LEVEL[state.level]}${state.limited ? ', selected fields' : ''})`).join(' · ')}</Text>}
    {admin.length > 0 && <Text mt={2} fontSize="sm"><b>Access administration:</b> {admin.map((item) => item.label).join(' · ')}</Text>}
    <Button size="sm" variant="ghost" mt={3} onClick={() => setDetails(!details)} aria-expanded={details}>{details ? 'Hide' : 'Show'} every individual permission ({grants.length})</Button>
    {details && <><SearchInput label="Search effective access" value={query} onChange={setQuery} /><div className="access-effective-list">{effective.map((grant, index) => <div key={index}><span>{moduleName(grant.permission.split('.')[0])} / {permissionName(grant.permission)}</span><span>{roleName(grant.roleId) && <Text as="small" display="block" mb={1}>{roleName(grant.roleId)}</Text>}{scopeName(grant.scope)}{grant.maxAmount != null ? ` · PKR ${grant.maxAmount}` : ''}{grant.noSelfApproval ? ' · No self-approval' : ''}{grant.fields?.length ? ` · ${grant.fields.map(words).join(', ')}` : ''}</span></div>)}{!effective.length && <Text py={4}>No effective permissions.</Text>}</div></>}
  </section>;
}
function CheckAccess({ api, user, userId, catalog }) {
  const [permission, setPermission] = useState(''), [technical, setTechnical] = useState(false), [amount, setAmount] = useState(''), [decision, setDecision] = useState(null), [checking, setChecking] = useState(false), [checkError, setCheckError] = useState('');
  const [checkBatch, setCheckBatch] = useState([]), [checkCourse, setCheckCourse] = useState([]), [ownerSelf, setOwnerSelf] = useState(false), [creatorSelf, setCreatorSelf] = useState(false);
  const reset = () => setDecision(null);
  const groups = [...new Set(ABILITIES.map((item) => item.area.label))];
  return <section className="access-section"><h3>Check Access</h3><Text fontSize="sm" color="var(--dash-muted)" mb={3}>Can {user.name} do something? Pick it and optionally a class or amount.</Text>
    <div className="access-details-grid"><FormControl><FormLabel>Action</FormLabel><Select aria-label="Action to check" value={permission} onChange={(event) => { setPermission(event.target.value); reset(); }}>
      <option value="">Choose an action</option>
      {technical ? catalog.filter((item) => item.type !== 'field').map((item) => <option key={item.key} value={item.key}>{moduleName(item.group)} / {permissionName(item)}</option>)
        : groups.map((group) => <optgroup key={group} label={group}>{ABILITIES.filter((item) => item.area.label === group).map((item) => <option key={`${group}-${item.label}`} value={item.permission}>{group}: {item.label}</option>)}</optgroup>)}
    </Select><Checkbox size="sm" mt={2} isChecked={technical} onChange={(event) => { setTechnical(event.target.checked); setPermission(''); reset(); }}>Choose an individual action</Checkbox></FormControl>
      <FormControl><FormLabel>Amount (optional, PKR)</FormLabel><Input type="number" min={0} value={amount} onChange={(event) => { setAmount(event.target.value); reset(); }} /></FormControl></div>
    <ScopePicker api={api} type="batches" single selected={checkBatch} onChange={(ids) => { setCheckBatch(ids); reset(); }} /><ScopePicker api={api} type="courses" single selected={checkCourse} onChange={(ids) => { setCheckCourse(ids); reset(); }} />
    <label className="access-check-owner"><input type="checkbox" checked={ownerSelf} onChange={(event) => { setOwnerSelf(event.target.checked); reset(); }} /> Record belongs to {user.name}</label>
    <label className="access-check-owner"><input type="checkbox" checked={creatorSelf} onChange={(event) => { setCreatorSelf(event.target.checked); reset(); }} /> Request created by {user.name}</label>
    <Button leftIcon={<ShieldCheck size={16} />} isLoading={checking} isDisabled={!permission || (amount !== '' && (!Number.isFinite(Number(amount)) || Number(amount) < 0))} onClick={async () => { setChecking(true); setCheckError(''); try { setDecision((await api.post('/explain', { userId, permission, resource: { batchId: checkBatch[0], courseId: checkCourse[0], createdBy: creatorSelf ? userId : undefined, ownerId: ownerSelf ? userId : undefined, amount: amount === '' ? undefined : Number(amount) } })).data); } catch (failure) { setCheckError(failure.response?.data?.message || failure.message); } finally { setChecking(false); } }}>Check Access</Button>
    {checkError && <Alert status="error" mt={3}><AlertIcon />{checkError}</Alert>}
    {decision && <Alert status={decision.allowed ? 'success' : 'warning'} mt={3}><AlertIcon /><Box><Text fontWeight="semibold">{decision.allowed ? 'Allowed' : 'Not allowed'}</Text><Text>{words(decision.reason)}</Text><Text fontSize="sm">Role checks only; record ownership and business rules are checked again during the action.</Text></Box></Alert>}
  </section>;
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
  const [batchLabels, setBatchLabels] = useState([]), [courseLabels, setCourseLabels] = useState([]), [replacePending, setReplacePending] = useState(true);
  const [adding, setAdding] = useState(false), [confirm, setConfirm] = useState(null), [busy, setBusy] = useState(false), [selected, setSelected] = useState({}), [bulk, setBulk] = useState(false);
  const toast = useToast();
  const hasPending = (assignments.data?.docs || []).some((item) => item.role?.code === PENDING_STAFF && (!item.expiresAt || new Date(item.expiresAt) > new Date()));
  const change = async (reason) => {
    setBusy(true);
    try {
      if (confirm.type === 'assign') {
        const { data } = await api.post('/assignments', { userId, roleId: role._id, batchIds, courseIds, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null, replacePending: hasPending && replacePending, reason });
        if (data?.keptPending) toast({ title: 'Kept Staff - Pending Assignment', description: `${role.name} does not include all of their own profile, photo, password and notification access, so the pending role was left in place.`, status: 'warning', duration: 9000, isClosable: true });
        if (data?.alreadyHad) toast({ title: `${user.name} already had ${role.name}`, description: 'Their pending role was removed.', status: 'info' });
      } else await api.delete(`/assignments/${confirm.item._id}`, { data: { reason } });
      setConfirm(null); setAdding(false); setRole(null); setBatches([]); setCourses([]); setExpiry(''); setVersion((value) => value + 1); await refreshAccess(); toast({ title: 'Access updated', status: 'success' });
    } finally { setBusy(false); }
  };
  if (!userId) {
    const docs = list.data?.docs || [], chosen = Object.values(selected), selectable = docs.filter((user) => !user.platformOwner);
    const toggle = (user, checked) => setSelected((old) => { const next = { ...old }; if (checked) next[user._id] = user; else delete next[user._id]; return next; });
    const allChecked = selectable.length > 0 && selectable.every((user) => selected[user._id]);
    return <>
      <div className="access-people-filters">
        <FormControl><FormLabel>Account category</FormLabel><Select aria-label="Filter account category" value={category} onChange={(event) => filter({ category: event.target.value })}><option value="">All categories</option>{['staff', 'student', 'teacher', 'qualifier', 'panelist'].map((type) => <option key={type} value={type}>{words(type)}</option>)}</Select></FormControl>
        <FormControl><FormLabel>Account status</FormLabel><Select aria-label="Filter account status" value={status} onChange={(event) => filter({ status: event.target.value })}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></Select></FormControl>
        <SearchInput label="Search people by name or email" value={query} onChange={(value) => filter({ query: value })} />
      </div>
      {chosen.length > 0 && can('access.assign') && <HStack className="access-bulkbar" justify="space-between" flexWrap="wrap" gap={2}><Text>{chosen.length} selected</Text><HStack>
        <Button size="sm" variant="ghost" onClick={() => setSelected({})}>Clear selection</Button><Button size="sm" className="table-action-btn table-action-btn--primary" leftIcon={<UserCog size={14} />} onClick={() => setBulk(true)}>Assign Role to Selected</Button></HStack></HStack>}
      <LoadState state={list}><DataTableShell className="access-table access-people-table"><Table><Thead><Tr><Th width="40px"><Checkbox aria-label="Select everyone on this page" isChecked={allChecked} isIndeterminate={!allChecked && selectable.some((user) => selected[user._id])} onChange={(event) => selectable.forEach((user) => toggle(user, event.target.checked))} /></Th><Th>Person</Th><Th>Account category</Th><Th>Access roles</Th><Th /></Tr></Thead><Tbody>{docs.map((user) => <Tr key={user._id}>
        <Td><Checkbox aria-label={`Select ${user.name}`} isDisabled={user.platformOwner} isChecked={Boolean(selected[user._id])} onChange={(event) => toggle(user, event.target.checked)} /></Td>
        <Td><Button variant="link" onClick={() => onSelect(user._id)}>{user.name}</Button><Text fontSize="sm" color="var(--dash-muted)">{user.email}</Text>{user.disabledAt && <Badge colorScheme="red">Inactive</Badge>}</Td><Td>{words(user.accountType || user.role)}</Td><Td>{user.platformOwner ? <Badge colorScheme="purple">Protected owner</Badge> : user.accessRoles?.length ? user.accessRoles.map((item) => <Badge key={item._id} mr={1} mb={1} colorScheme={item.code === PENDING_STAFF ? 'yellow' : 'gray'}>{item.name}</Badge>) : <Badge colorScheme="yellow">No assigned role</Badge>}</Td><Td><Button size="sm" onClick={() => onSelect(user._id)}>Manage Access</Button></Td></Tr>)}</Tbody></Table>{docs.length === 0 && <Text py={8} textAlign="center">No matching people.</Text>}</DataTableShell><Pager data={list.data} onPage={(value) => filter({ page: String(value) })} label="people" /></LoadState>
      {bulk && <AssignDialog api={api} people={chosen} onClose={() => setBulk(false)} onDone={() => { setBulk(false); setSelected({}); setVersion((value) => value + 1); }} />}
    </>;
  }
  const user = person.data?.user, scoped = role?.grants.some((grant) => grant.scope === 'selected');
  return <>
    <Button variant="ghost" mb={4} leftIcon={<ArrowLeft size={16} />} onClick={onBack}>Back to People</Button>
    <LoadState state={person}>{user && <>
      <div className="access-person-heading"><div><h2>{user.name}</h2><Text color="var(--dash-muted)">{user.email}</Text></div><Badge>{words(user.accountType || user.role)}</Badge>{person.data.disabled && <Badge colorScheme="red">Account inactive</Badge>}</div>
      {user.platformOwner ? <Alert status="info" mb={4}><AlertIcon />Protected platform owner. Role assignments cannot change this account's owner authority.</Alert> : <>
        <HStack justify="space-between" mb={3}><h3>Assigned Roles</h3>{can('access.assign') && <Button leftIcon={<Plus size={16} />} onClick={() => setAdding(!adding)}>{adding ? 'Cancel Assignment' : 'Assign Role'}</Button>}</HStack>
        {hasPending && !adding && <Alert status="warning" mb={3}><AlertIcon />{user.name} is waiting for a role. Assign one to give them access to their work.</Alert>}
        <LoadState state={assignments}><DataTableShell className="access-table access-assignments"><Table size="sm"><Thead><Tr><Th>Role</Th><Th>Class restrictions</Th><Th>Expires</Th><Th /></Tr></Thead><Tbody>{assignments.data?.docs.map((item) => <Tr key={item._id}><Td>{item.role?.name || 'Unavailable role'}{(item.expiresAt && new Date(item.expiresAt) <= new Date()) && <Badge ml={2}>Expired</Badge>}{item.role?.active === false && <Badge ml={2}>Role disabled</Badge>}</Td><Td>{[...(item.batches || []), ...(item.courses || [])].map((scope) => scope.name).join(', ') || 'Role-defined scope'}</Td><Td>{item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'No expiry'}</Td><Td><Button size="sm" variant="ghost" colorScheme="red" leftIcon={<Trash2 size={14} />} onClick={() => setConfirm({ type: 'revoke', item })}>Remove</Button></Td></Tr>)}</Tbody></Table>{assignments.data?.docs.length === 0 && <Text py={6} textAlign="center">No assigned roles.</Text>}</DataTableShell><Pager data={assignments.data} onPage={setAssignmentPage} label="assignments" /></LoadState>
        {adding && <section className="access-assignment-form"><h3>Assign a Role to {user.name}</h3><FormControl><FormLabel>Role</FormLabel><RoleChoice api={api} value={role} onChange={setRole} /></FormControl>
          {scoped && <><Text fontSize="sm" color="var(--dash-muted)">This role only works in the batches or courses you choose.</Text><ScopePicker api={api} type="batches" selected={batchIds} onChange={setBatches} onLabels={setBatchLabels} /><ScopePicker api={api} type="courses" selected={courseIds} onChange={setCourses} onLabels={setCourseLabels} /></>}
          <FormControl maxW="320px"><FormLabel htmlFor="assignment-expiry">Expiry (optional)</FormLabel><Input id="assignment-expiry" type="datetime-local" value={expiresAt} onChange={(event) => setExpiry(event.target.value)} /></FormControl>
          {hasPending && <Checkbox isChecked={replacePending} onChange={(event) => setReplacePending(event.target.checked)}>Remove “Staff - Pending Assignment” after assigning</Checkbox>}
          <Button className="table-action-btn table-action-btn--primary" isDisabled={!role || (scoped && !batchIds.length && !courseIds.length) || Boolean(expiresAt && new Date(expiresAt) <= new Date())} onClick={() => setConfirm({ type: 'assign' })}>Review Assignment</Button></section>}
      </>}
      <AccessOverview data={person.data} />
      {can('access.explain') && <CheckAccess api={api} user={user} userId={userId} catalog={catalog} />}
    </>}</LoadState>
    {confirm && <ConfirmChange title={confirm.type === 'assign' ? `Assign ${role.name}?` : `Remove ${confirm.item.role?.name || 'role'}?`} action={confirm.type === 'assign' ? 'Assign Role' : 'Remove Role'} danger={confirm.type === 'revoke'} busy={busy} onClose={() => setConfirm(null)} onConfirm={change}><Text>{user?.name} ({user?.email})</Text><Text mt={2}>{confirm.type === 'assign' ? `${expiresAt ? `Expires ${new Date(expiresAt).toLocaleString()}.` : 'No expiry.'}` : 'Access from other assigned roles will remain in effect.'}</Text>{confirm.type === 'assign' && hasPending && replacePending && <Text mt={2}>Staff - Pending Assignment will be removed.</Text>}{confirm.type === 'assign' && batchLabels.length > 0 && <Text mt={2}>Batches: {batchLabels.join(', ')}</Text>}{confirm.type === 'assign' && courseLabels.length > 0 && <Text mt={2}>Courses: {courseLabels.join(', ')}</Text>}{confirm.type === 'assign' && role?.grants.some((grant) => grant.scope === 'all' && !grant.permission.startsWith('fields.')) && <Alert status="warning" mt={3}><AlertIcon />This role includes institution-wide operations.</Alert>}</ConfirmChange>}
  </>;
}
