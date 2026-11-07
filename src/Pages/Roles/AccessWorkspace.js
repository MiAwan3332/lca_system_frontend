import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Badge, Box, Button, HStack, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Stack, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { ArrowLeft, Copy, FilePlus, Plus, Pencil } from 'lucide-react';
import { config } from '../../utlls/config';
import { can } from '../../utlls/accessCapabilities';
import PageHeader, { DataTableShell } from '../../Components/PageHeader';
import RoleEditor from './RoleEditor';
import RoleMembers from './RoleMembers';
import PeopleAccess from './PeopleAccess';
import { AccessDefaults, AccessHistory } from './AccessSettings';
import { ConfirmChange, LoadState, Pager, SearchInput, useAccessData } from './AccessCommon';
import { BASELINE, accessSummary, addSelfService } from './accessAreas';
import { ACCESS_ROOT } from './accessUi';
import './accessManagement.css';

// New roles start with the own-profile basics every account needs and can see everyday record details.
const empty = { name: '', description: '', active: true, grants: addSelfService([...BASELINE.map((grant) => ({ ...grant })),
  { permission: 'fields.general.read', scope: 'all' }, { permission: 'fields.general.write', scope: 'all' }]).map(({ _key, _fieldMode, ...grant }) => grant) };
const builtIn = (role) => /^lca-/.test(role.code || '');
// Copies keep the built-in safeguards of the role they came from.
export const copySeed = (role) => ({ ...role, _sourceId: role._id, _id: undefined, code: undefined, revision: undefined, memberCount: undefined, name: `${role.name} Copy`,
  profile: role.profile || (/^lca-staff-/.test(role.code || '') ? role.code : null) });
function StartRole({ api, onClose, onBlank, onCopy }) {
  const [page, setPage] = useState(1), [query, setQuery] = useState('');
  const state = useAccessData(api, '/roles', { page, limit: 10, query });
  return <Modal isOpen onClose={onClose} size="lg" scrollBehavior="inside"><ModalOverlay /><ModalContent className="access-confirm-modal" borderRadius="8px"><ModalHeader>Create a role</ModalHeader><ModalCloseButton /><ModalBody pb={6}>
    <Button width="100%" justifyContent="flex-start" leftIcon={<FilePlus size={16} />} variant="outline" mb={4} onClick={onBlank}>Start from scratch</Button>
    <Text fontWeight="semibold" mb={1}>Or copy an existing role</Text><Text fontSize="sm" color="var(--dash-muted)" mb={3}>You can change anything before saving. The original role is not changed.</Text>
    <SearchInput label="Search roles to copy" value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
    <LoadState state={state}><Stack spacing={0} mt={2}>{state.data?.docs.map((role) => <HStack key={role._id} justify="space-between" py={2} borderBottom="1px solid var(--dash-border)">
      <Box minW={0}><Text fontWeight="medium">{role.name} {builtIn(role) && <Badge ml={1}>Built-in</Badge>}</Text>{role.description && <Text fontSize="sm" color="var(--dash-muted)" noOfLines={2}>{role.description}</Text>}</Box>
      <Button size="sm" leftIcon={<Copy size={14} />} aria-label={`Copy ${role.name}`} onClick={() => onCopy(role)}>Copy</Button></HStack>)}</Stack>
      <Pager data={state.data} onPage={setPage} label="roles" /></LoadState>
  </ModalBody></ModalContent></Modal>;
}
function RolesTable({ api, version, onEdit, onCreate, onClone, onMembers }) {
  const [page, setPage] = useState(1), [query, setQuery] = useState('');
  const state = useAccessData(api, '/roles', { page, limit: 25, query }, version);
  return <><HStack justify="space-between" mb={4} gap={3} flexWrap="wrap"><SearchInput label="Search roles" value={query} onChange={(value) => { setQuery(value); setPage(1); }} />{can('access.manage') && <Button className="table-action-btn table-action-btn--primary" leftIcon={<Plus size={16} />} onClick={onCreate}>Create Role</Button>}</HStack>
    <LoadState state={state}><DataTableShell className="access-table access-role-table"><Table><Thead><Tr><Th>Role</Th><Th>People</Th><Th>Access</Th><Th>Status</Th><Th /></Tr></Thead><Tbody>{state.data?.docs.map((role) => {
      const pages = accessSummary(role.grants || []).length;
      return <Tr key={role._id}><Td><Button variant="link" onClick={() => onEdit(role._id)}>{role.name}</Button>{builtIn(role) && <Badge ml={2}>Built-in</Badge>}{role.description && <Text fontSize="sm" color="var(--dash-muted)" mt={1}>{role.description}</Text>}</Td>
        <Td>{can('access.assign') ? <Button variant="link" size="sm" aria-label={`People with ${role.name}`} onClick={() => onMembers(role._id)}>{role.memberCount ?? 0} {role.memberCount === 1 ? 'person' : 'people'}</Button> : role.memberCount ?? '—'}</Td>
        <Td><Text>{pages} {pages === 1 ? 'page' : 'pages'}</Text><Text fontSize="xs" color="var(--dash-muted)">{new Set((role.grants || []).map((grant) => grant.permission)).size} permissions</Text></Td>
        <Td><Badge colorScheme={role.active ? 'green' : 'gray'}>{role.active ? 'Active' : 'Disabled'}</Badge></Td>
        <Td>{can('access.manage') && <HStack justify="end"><Button size="sm" variant="ghost" aria-label={`Edit ${role.name}`} title="Edit role" onClick={() => onEdit(role._id)}><Pencil size={16} /></Button><Button size="sm" variant="ghost" aria-label={`Clone ${role.name}`} title="Copy role" onClick={() => onClone(role)}><Copy size={16} /></Button></HStack>}</Td></Tr>;
    })}</Tbody></Table>{state.data?.docs.length === 0 && <Box textAlign="center" py={10}><Text fontWeight="semibold">{query ? 'No matching roles' : 'No roles yet'}</Text></Box>}</DataTableShell><Pager data={state.data} onPage={setPage} label="roles" /></LoadState>
  </>;
}
function EditorLoader({ api, id, catalog, seed, ...props }) {
  const state = useAccessData(api, id === 'new' ? null : `/roles/${id}`);
  return <LoadState state={state}>{(id === 'new' || state.data) && <RoleEditor key={id} api={api} role={id === 'new' ? empty : state.data} seed={seed} catalog={catalog} {...props} />}</LoadState>;
}
function MembersLoader({ api, id, onBack, onPerson }) {
  const state = useAccessData(api, `/roles/${id}`);
  return <LoadState state={state}>{state.data && <>
    <HStack mb={4} flexWrap="wrap" gap={2}><Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={onBack}>Back to Roles</Button><Text color="var(--dash-muted)">/</Text><Text fontWeight="semibold">People with {state.data.name}</Text>{!state.data.active && <Badge>Disabled</Badge>}</HStack>
    <RoleMembers api={api} role={state.data} onPerson={onPerson} /></>}</LoadState>;
}
export default function AccessWorkspace() {
  const location = useLocation(), navigate = useNavigate();
  const [dirty, setDirty] = useState(false), [pending, setPending] = useState(null), [version, setVersion] = useState(0), [starting, setStarting] = useState(false);
  const registerDirty = useCallback((value) => setDirty(value), []);
  useEffect(() => { const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const api = useMemo(() => axios.create({ baseURL: `${config.BASE_URL}/access`, headers: { Authorization: `Bearer ${Cookies.get('authToken')}` }, timeout: 15000 }), []);
  const catalog = useAccessData(api, '/catalog');
  const segments = location.pathname.slice(ACCESS_ROOT.length).split('/').filter(Boolean);
  const section = segments[0] || 'roles', editorId = section === 'roles' ? segments[1] : null, personId = section === 'people' ? segments[1] : null;
  const membersView = Boolean(editorId && editorId !== 'new' && segments[2] === 'members');
  const go = (path, options = {}, force = false) => { if (dirty && !force) { setPending({ path, options }); return; } setDirty(false); navigate(path, options); };
  const rolesHome = () => go(ACCESS_ROOT, {}, true);
  const startCopy = (role) => { setStarting(false); go(`${ACCESS_ROOT}/roles/new`, { state: { seed: copySeed(role) } }); };
  const tabs = [{ key: 'roles', label: 'Roles', allowed: true, path: ACCESS_ROOT }, { key: 'people', label: 'People & Access', allowed: can('access.assign'), path: `${ACCESS_ROOT}/people` }, { key: 'defaults', label: 'New Account Defaults', allowed: can('access.manage'), path: `${ACCESS_ROOT}/defaults` }, { key: 'history', label: 'Change History', allowed: can('access.audit'), path: `${ACCESS_ROOT}/history` }];
  const allowed = tabs.find((tab) => tab.key === section)?.allowed;
  const roleTabs = editorId && editorId !== 'new' && can('access.assign') && <nav className="access-mode-tabs" aria-label="Role sections">
    <button type="button" aria-current={!membersView ? 'page' : undefined} onClick={() => go(`${ACCESS_ROOT}/roles/${editorId}`)}>Permissions</button>
    <button type="button" aria-current={membersView ? 'page' : undefined} onClick={() => go(`${ACCESS_ROOT}/roles/${editorId}/members`)}>People with this role</button></nav>;
  return <Box className="access-workspace"><PageHeader title="Access Management" />
    <nav className="access-tabs" aria-label="Access Management sections">{tabs.filter((tab) => tab.allowed).map((tab) => <button key={tab.key} aria-current={section === tab.key ? 'page' : undefined} onClick={() => go(tab.path)}>{tab.label}</button>)}</nav>
    {!allowed ? <Text py={8}>This section is not available with your current access.</Text> : <LoadState state={catalog}>
      {section === 'roles' && (editorId ? (editorId !== 'new' || can('access.manage')) ? <>{roleTabs}{membersView
        ? <MembersLoader api={api} id={editorId} onBack={rolesHome} onPerson={(id) => go(`${ACCESS_ROOT}/people/${id}`)} />
        : <EditorLoader api={api} id={editorId} readOnly={!can('access.manage')} seed={location.state?.seed} catalog={catalog.data?.permissions || []} onBack={rolesHome} onSaved={() => { setVersion((value) => value + 1); rolesHome(); }} registerDirty={registerDirty} />}</> : <Text>Role editing is not available with your current access.</Text>
        : <RolesTable api={api} version={version} onCreate={() => setStarting(true)} onEdit={(id) => go(`${ACCESS_ROOT}/roles/${id}`)} onMembers={(id) => go(`${ACCESS_ROOT}/roles/${id}/members`)} onClone={startCopy} />)}
      {section === 'people' && <PeopleAccess key={personId || 'list'} api={api} catalog={catalog.data?.permissions || []} userId={personId} onSelect={(id) => go(`${ACCESS_ROOT}/people/${id}${location.search}`)} onBack={() => go(`${ACCESS_ROOT}/people${location.search}`)} />}
      {section === 'defaults' && <AccessDefaults api={api} registerDirty={registerDirty} />}
      {section === 'history' && <AccessHistory api={api} onRestore={(role, seed) => go(`${ACCESS_ROOT}/roles/${role._id}`, { state: { seed } })} />}
    </LoadState>}
    {starting && <StartRole api={api} onClose={() => setStarting(false)} onBlank={() => { setStarting(false); go(`${ACCESS_ROOT}/roles/new`); }} onCopy={startCopy} />}
    {pending && <ConfirmChange title="Leave unsaved changes?" action="Leave Page" requireReason={false} danger onClose={() => setPending(null)} onConfirm={() => { const next = pending; setPending(null); go(next.path, next.options, true); }}><Text>These changes have not been applied.</Text></ConfirmChange>}
  </Box>;
}
