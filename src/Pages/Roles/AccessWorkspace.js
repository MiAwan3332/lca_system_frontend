import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Badge, Box, Button, HStack, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { Copy, Plus, Pencil } from 'lucide-react';
import { config } from '../../utlls/config';
import { can } from '../../utlls/accessCapabilities';
import PageHeader, { DataTableShell } from '../../Components/PageHeader';
import RoleEditor from './RoleEditor';
import PeopleAccess from './PeopleAccess';
import { AccessDefaults, AccessHistory } from './AccessSettings';
import { ConfirmChange, LoadState, Pager, SearchInput, useAccessData } from './AccessCommon';
import { ACCESS_ROOT } from './accessUi';
import './accessManagement.css';

const empty = { name: '', description: '', active: true, grants: [] };
function RolesTable({ api, version, onEdit, onCreate, onClone }) {
  const [page, setPage] = useState(1), [query, setQuery] = useState('');
  const state = useAccessData(api, '/roles', { page, limit: 25, query }, version);
  return <><HStack justify="space-between" mb={4} gap={3} flexWrap="wrap"><SearchInput label="Search roles" value={query} onChange={(value) => { setQuery(value); setPage(1); }} />{can('access.manage') && <Button className="table-action-btn table-action-btn--primary" leftIcon={<Plus size={16} />} onClick={onCreate}>Create Role</Button>}</HStack>
    <LoadState state={state}><DataTableShell className="access-table access-role-table"><Table><Thead><Tr><Th>Role</Th><Th>People</Th><Th>Permissions</Th><Th>Status</Th><Th /></Tr></Thead><Tbody>{state.data?.docs.map((role) => <Tr key={role._id}><Td><Button variant="link" onClick={() => onEdit(role._id)}>{role.name}</Button>{role.description && <Text fontSize="sm" color="var(--dash-muted)" mt={1}>{role.description}</Text>}</Td><Td>{role.memberCount ?? '—'}</Td><Td>{new Set(role.grants.map((grant) => grant.permission)).size}</Td><Td><Badge colorScheme={role.active ? 'green' : 'gray'}>{role.active ? 'Active' : 'Disabled'}</Badge></Td><Td>{can('access.manage') && <HStack justify="end"><Button size="sm" variant="ghost" aria-label={`Edit ${role.name}`} title="Edit role" onClick={() => onEdit(role._id)}><Pencil size={16} /></Button><Button size="sm" variant="ghost" aria-label={`Clone ${role.name}`} title="Clone role" onClick={() => onClone(role)}><Copy size={16} /></Button></HStack>}</Td></Tr>)}</Tbody></Table>{state.data?.docs.length === 0 && <Box textAlign="center" py={10}><Text fontWeight="semibold">{query ? 'No matching roles' : 'No roles yet'}</Text></Box>}</DataTableShell><Pager data={state.data} onPage={setPage} label="roles" /></LoadState>
  </>;
}
function EditorLoader({ api, id, catalog, seed, ...props }) {
  const state = useAccessData(api, id === 'new' ? null : `/roles/${id}`);
  return <LoadState state={state}>{(id === 'new' || state.data) && <RoleEditor key={id} api={api} role={id === 'new' ? empty : state.data} seed={seed} catalog={catalog} {...props} />}</LoadState>;
}
export default function AccessWorkspace() {
  const location = useLocation(), navigate = useNavigate();
  const [dirty, setDirty] = useState(false), [pending, setPending] = useState(null), [version, setVersion] = useState(0);
  const registerDirty = useCallback((value) => setDirty(value), []);
  useEffect(() => { const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const api = useMemo(() => axios.create({ baseURL: `${config.BASE_URL}/access`, headers: { Authorization: `Bearer ${Cookies.get('authToken')}` }, timeout: 15000 }), []);
  const catalog = useAccessData(api, '/catalog');
  const segments = location.pathname.slice(ACCESS_ROOT.length).split('/').filter(Boolean);
  const section = segments[0] || 'roles', editorId = section === 'roles' ? segments[1] : null, personId = section === 'people' ? segments[1] : null;
  const go = (path, options = {}, force = false) => { if (dirty && !force) { setPending({ path, options }); return; } setDirty(false); navigate(path, options); };
  const rolesHome = () => go(ACCESS_ROOT, {}, true);
  const tabs = [{ key: 'roles', label: 'Roles', allowed: true, path: ACCESS_ROOT }, { key: 'people', label: 'People & Access', allowed: can('access.assign'), path: `${ACCESS_ROOT}/people` }, { key: 'defaults', label: 'New Account Defaults', allowed: can('access.manage'), path: `${ACCESS_ROOT}/defaults` }, { key: 'history', label: 'Change History', allowed: can('access.audit'), path: `${ACCESS_ROOT}/history` }];
  const allowed = tabs.find((tab) => tab.key === section)?.allowed;
  return <Box className="access-workspace"><PageHeader title="Access Management" />
    <nav className="access-tabs" aria-label="Access Management sections">{tabs.filter((tab) => tab.allowed).map((tab) => <button key={tab.key} aria-current={section === tab.key ? 'page' : undefined} onClick={() => go(tab.path)}>{tab.label}</button>)}</nav>
    {!allowed ? <Text py={8}>This section is not available with your current access.</Text> : <LoadState state={catalog}>
      {section === 'roles' && (editorId ? (editorId !== 'new' || can('access.manage')) ? <EditorLoader api={api} id={editorId} readOnly={!can('access.manage')} seed={location.state?.seed} catalog={catalog.data?.permissions || []} onBack={rolesHome} onSaved={() => { setVersion((value) => value + 1); rolesHome(); }} registerDirty={registerDirty} /> : <Text>Role editing is not available with your current access.</Text> : <RolesTable api={api} version={version} onCreate={() => go(`${ACCESS_ROOT}/roles/new`)} onEdit={(id) => go(`${ACCESS_ROOT}/roles/${id}`)} onClone={(role) => go(`${ACCESS_ROOT}/roles/new`, { state: { seed: { ...role, _sourceId: role._id, _id: undefined, code: undefined, revision: undefined, name: `${role.name} Copy` } } })} />)}
      {section === 'people' && <PeopleAccess key={personId || 'list'} api={api} catalog={catalog.data?.permissions || []} userId={personId} onSelect={(id) => go(`${ACCESS_ROOT}/people/${id}${location.search}`)} onBack={() => go(`${ACCESS_ROOT}/people${location.search}`)} />}
      {section === 'defaults' && <AccessDefaults api={api} registerDirty={registerDirty} />}
      {section === 'history' && <AccessHistory api={api} onRestore={(role, seed) => go(`${ACCESS_ROOT}/roles/${role._id}`, { state: { seed } })} />}
    </LoadState>}
    {pending && <ConfirmChange title="Leave unsaved changes?" action="Leave Page" requireReason={false} danger onClose={() => setPending(null)} onConfirm={() => { const next = pending; setPending(null); go(next.path, next.options, true); }}><Text>These changes have not been applied.</Text></ConfirmChange>}
  </Box>;
}
