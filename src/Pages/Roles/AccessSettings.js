import { DataTableShell } from '../../Components/PageHeader';
import React, { useEffect, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, FormControl, FormLabel, HStack, Stack, Table, Tbody, Td, Text, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { RotateCcw, Save } from 'lucide-react';
import { accessSnapshot, can } from '../../utlls/accessCapabilities';
import { ConfirmChange, LoadState, Pager, useAccessData } from './AccessCommon';
import { RoleChoice } from './PeopleAccess';
import { permissionName, scopeName, words } from './accessUi';

function DefaultRow({ api, type, id, onChange, disabled }) {
  const current = useAccessData(api, id ? `/roles/${id}` : null);
  return <FormControl className="access-default-row" isDisabled={disabled}><FormLabel>{words(type)}</FormLabel><Box><RoleChoice api={api} label={`${words(type)} default role`} value={current.data || (id ? { _id: id, name: 'Loading selected role' } : null)} onChange={(role) => onChange(role?._id || '')} /></Box></FormControl>;
}
function DefaultDiff({ api, type, before, after }) {
  const previous = useAccessData(api, before ? `/roles/${before}` : null);
  const next = useAccessData(api, after ? `/roles/${after}` : null);
  return <Text>{words(type)}: {before ? previous.data?.name || 'Loading previous role' : 'No default'} → {after ? next.data?.name || 'Loading new role' : 'No default'}</Text>;
}
export function AccessDefaults({ api, registerDirty }) {
  const [version, setVersion] = useState(0), [draft, setDraft] = useState(null), [review, setReview] = useState(false), [busy, setBusy] = useState(false);
  const state = useAccessData(api, '/defaults', {}, version), toast = useToast();
  const owner = accessSnapshot().owner;
  useEffect(() => { if (state.data) setDraft(state.data); }, [state.data]);
  const changed = draft && state.data ? ['staff', 'student', 'teacher', 'qualifier', 'panelist'].filter((type) => String(draft.roles?.[type] || '') !== String(state.data.roles?.[type] || '')) : [];
  const dirty = changed.length > 0;
  useEffect(() => { registerDirty(dirty); return () => registerDirty(false); }, [dirty, registerDirty]);
  return <LoadState state={state}>{draft && <>
    <h2>New Account Defaults</h2>{!owner && <Alert status="info" my={4}><AlertIcon />Only the protected owner can change new-account defaults.</Alert>}
    {['staff', 'student', 'teacher', 'qualifier', 'panelist'].map((type) => <DefaultRow key={type} api={api} type={type} id={draft.roles?.[type]} disabled={!owner || busy} onChange={(value) => setDraft({ ...draft, roles: { ...draft.roles, [type]: value } })} />)}
    <div className="access-savebar"><Text>{dirty ? `${changed.length} defaults changed` : 'No changes'}</Text><HStack><Button isDisabled={!dirty || busy} onClick={() => setDraft(state.data)}>Discard Changes</Button><Button className="table-action-btn table-action-btn--primary" leftIcon={<Save size={16} />} isDisabled={!owner || !dirty} onClick={() => setReview(true)}>Review Changes</Button></HStack></div>
    {review && <ConfirmChange title="Change new-account defaults?" action="Save Defaults" busy={busy} onClose={() => setReview(false)} onConfirm={async (reason) => { setBusy(true); try { await api.put('/defaults', { roles: Object.fromEntries(Object.entries(draft.roles).filter(([, id]) => id)), revision: draft.revision || 0, reason }); registerDirty(false); setReview(false); setVersion((value) => value + 1); toast({ title: 'New-account defaults saved', status: 'success' }); } finally { setBusy(false); } }}><Stack>{changed.map((type) => <DefaultDiff key={type} api={api} type={type} before={state.data.roles?.[type]} after={draft.roles?.[type]} />)}<Text>Existing users and their assigned roles are not changed.</Text>{changed.some((type) => !draft.roles[type]) && <Alert status="warning"><AlertIcon />A category without a default cannot create new accounts while enforcement is enabled.</Alert>}{changed.includes('staff') && <Alert status="warning"><AlertIcon />The staff default applies to newly created staff accounts, regardless of their job title.</Alert>}</Stack></ConfirmChange>}
  </>}</LoadState>;
}
export function AccessHistory({ api, onRestore }) {
  const [page, setPage] = useState(1), [selected, setSelected] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const state = useAccessData(api, '/audit', { page, limit: 25 });
  return <><h2>Change History</h2><LoadState state={state}><DataTableShell className="access-table"><Table><Thead><Tr><Th>When</Th><Th>Changed by</Th><Th>Change</Th><Th>Reason</Th><Th /></Tr></Thead><Tbody>{state.data?.docs.map((item) => <Tr key={item._id}><Td>{new Date(item.createdAt).toLocaleString()}</Td><Td>{item.actor?.name || 'Unavailable user'}</Td><Td>{words(item.action.replace(/\.intent$/, ''))}<Text fontSize="sm" color="var(--dash-muted)">{item.after?.name || item.before?.name || item.after?.userName || item.before?.userName || (item.action.includes('assignment') ? 'Role assignment' : 'Access configuration')}</Text>{item.action.endsWith('.intent') && <Badge>Requested</Badge>}</Td><Td>{item.reason}</Td><Td><Button size="sm" variant="ghost" onClick={() => setSelected(item)}>View Change</Button></Td></Tr>)}</Tbody></Table>{state.data?.docs.length === 0 && <Text py={8} textAlign="center">No access changes recorded.</Text>}</DataTableShell><Pager data={state.data} onPage={setPage} label="changes" /></LoadState>
    {selected && <ConfirmChange title="Change Details" action="Done" requireReason={false} onClose={() => setSelected(null)} onConfirm={() => setSelected(null)}><Stack><Text>{selected.actor?.name || 'Unavailable user'} · {new Date(selected.createdAt).toLocaleString()}</Text><Text>{selected.reason}</Text>{selected.action.endsWith('.intent') && <Alert status="info"><AlertIcon />Recorded change request. This entry alone does not confirm that the operation finished.</Alert>}
      {['before', 'after'].map((side) => <Box key={side}><Text fontWeight="semibold">{words(side)}</Text>{selected[side]?.name && <Text>{selected[side].name}</Text>}{selected[side]?.description && <Text fontSize="sm">{selected[side].description}</Text>}{selected[side]?.active != null && <Text fontSize="sm">Status: {selected[side].active ? 'Active' : 'Disabled'}</Text>}{selected[side]?.revision != null && <Text fontSize="sm">Revision {selected[side].revision}</Text>}{selected[side]?.roleName && <Text>{selected[side].userName} / {selected[side].roleName}</Text>}{Object.entries(selected[side]?.defaultNames || {}).map(([type, name]) => <Text key={type} fontSize="sm">{words(type)}: {name}</Text>)}{selected[side]?.grants ? <Box maxH="180px" overflowY="auto">{selected[side].grants.map((grant, index) => <Text key={index} fontSize="sm">{permissionName(grant.permission)} · {scopeName(grant.scope)}</Text>)}</Box> : <Text fontSize="sm">{selected[side] ? 'Configuration recorded' : 'No previous configuration'}</Text>}</Box>)}
      {selected.before?.managed && can('access.manage') && <Button leftIcon={<RotateCcw size={16} />} isLoading={busy} onClick={async () => { setBusy(true); try { const current = (await api.get(`/roles/${selected.target}`)).data; onRestore(current, { ...selected.before, _id: current._id, revision: current.revision }); } catch (failure) { setError(failure.response?.data?.message || failure.message); } finally { setBusy(false); } }}>Review Previous Version</Button>}{error && <Alert status="error"><AlertIcon />{error}</Alert>}
      <details><summary>Technical details</summary><Text fontSize="xs" fontFamily="mono">{selected.action} · {selected.target} · {selected.requestId}</Text></details>
    </Stack></ConfirmChange>}
  </>;
}
