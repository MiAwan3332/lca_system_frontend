import Select from '../../Components/InPageSelect';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormLabel, HStack, Input, Stack, Switch, Text, Textarea, useToast } from '@chakra-ui/react';
import { ArrowLeft, Check, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { refreshAccess, accessSnapshot } from '../../utlls/accessCapabilities';
import { ConfirmChange, SearchInput, useAccessData } from './AccessCommon';
import AccessGrid from './AccessGrid';
import inventory from '../../config/accessCatalog.generated.json';
import { workflowGaps, completeWorkflowAccess } from '../../utlls/accessWorkflowRules';
import { defaultScope, pageChanges } from './accessAreas';
import { moduleName, permissionName, words, scopeName, scopeChoices, editable, fingerprint, rolePayload, draftErrors, financialRule, approvalRule } from './accessUi';

// Safeguards that a built-in role (or a copy of it) adds on top of its permissions.
function BuiltInRules({ api, role, draft, onChange, readOnly }) {
  const state = useAccessData(api, '/rule-profiles');
  // An older API or unexpected response simply hides this panel rather than breaking the editor.
  const profiles = { data: Array.isArray(state.data) ? state.data.filter((item) => item?.code && Array.isArray(item.rules)) : null };
  const fixed = profiles.data?.find((item) => item.code === role.code);
  const current = fixed || profiles.data?.find((item) => item.code === draft.profile);
  const canEdit = !fixed && !readOnly && accessSnapshot().owner;
  if (!profiles.data?.length || (!current && !canEdit)) return null;
  return <Box className="access-rules">
    <HStack spacing={2} mb={2}><ShieldAlert size={16} /><Text fontWeight="semibold">Built-in safeguards</Text>{fixed && <Badge>Built-in role</Badge>}</HStack>
    {canEdit && <Box maxW="320px" mb={2}><Select size="sm" aria-label="Built-in safeguards" value={draft.profile || ''} onChange={(event) => onChange(event.target.value || null)}>
      <option value="">None</option>{profiles.data.map((item) => <option key={item.code} value={item.code}>Same as {item.name}</option>)}</Select></Box>}
    {current ? <Stack as="ul" spacing={1} pl={5} fontSize="sm">{current.rules.map((rule) => <li key={rule}>{rule}</li>)}</Stack>
      : <Text fontSize="sm" color="var(--dash-muted)">No extra safeguards beyond the permissions below.</Text>}
    {current && !fixed && <Text fontSize="xs" color="var(--dash-muted)" mt={2}>Copied from {current.name}. These apply in addition to the permissions below.</Text>}
  </Box>;
}

export default function RoleEditor({ api, role, seed, catalog, readOnly = false, onBack, onSaved, registerDirty }) {
  const storageKey = `access-role-draft:${accessSnapshot().userId || 'local'}:${role._id || (seed?._sourceId ? `clone-${seed._sourceId}` : 'new')}`;
  const initial = useMemo(() => editable(role), [role]);
  const [draft, setDraft] = useState(() => {
    if (readOnly) return initial;
    try { const saved = JSON.parse(sessionStorage.getItem(storageKey)); if (saved?.draft && (!seed || saved.seedTag === fingerprint(seed))) return saved.draft; } catch {}
    return seed ? editable(seed) : initial;
  });
  const [query, setQuery] = useState(''), [group, setGroup] = useState(() => catalog.find((item) => item.key === role.grants?.[0]?.permission)?.group || 'students'), [technical, setTechnical] = useState(false);
  const [fieldQueries, setFieldQueries] = useState({});
  const [review, setReview] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [confirmCancel, setConfirmCancel] = useState(false);
  const [mode, setMode] = useState('simple'), [gridScope, setGridScope] = useState(() => defaultScope(draft.grants));
  const toast = useToast(), current = useRef(draft);
  const dirty = fingerprint(draft) !== fingerprint(initial);
  useEffect(() => { current.current = draft; registerDirty(dirty); return () => registerDirty(false); }, [draft, dirty, registerDirty]);
  useEffect(() => {
    if (dirty) sessionStorage.setItem(storageKey, JSON.stringify({ base: fingerprint(initial), seedTag: seed ? fingerprint(seed) : null, draft }));
    else sessionStorage.removeItem(storageKey);
  }, [draft, dirty, initial, storageKey, seed]);
  useEffect(() => {
    const unload = (event) => { if (fingerprint(current.current) !== fingerprint(initial)) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', unload); return () => window.removeEventListener('beforeunload', unload);
  }, [initial]);
  const change = (update) => { setDraft((old) => ({ ...old, ...update })); setReview(null); setError(''); };
  const setGrants = useCallback((grants) => { setDraft((old) => ({ ...old, grants })); setReview(null); setError(''); }, []);
  const grantChange = (index, update) => change({ grants: draft.grants.map((item, position) => position === index ? { ...item, ...update } : item) });
  const toggle = (permission, checked) => change({ grants: checked ? [...draft.grants, { permission: permission.key, scope: permission.type === 'field' ? 'all' : '', noSelfApproval: approvalRule(permission.key), _fieldMode: '', _key: `${Date.now()}-${permission.key}` }] : draft.grants.filter((item) => item.permission !== permission.key) });
  // Advanced shortcuts add grants with the role's default records so they are ready to save.
  const bulk = (items, kind) => {
    const chosen = new Set(items.filter((item) => kind === 'all' || (kind === 'view' && (item.type === 'field' ? item.key.endsWith('.read') : /\.(get|list|getall|latest|check)\./.test(`${item.key}.`)))).map((item) => item.key));
    const keys = new Set(items.map((item) => item.key)), kept = draft.grants.filter((grant) => !keys.has(grant.permission) || chosen.has(grant.permission));
    const added = items.filter((item) => chosen.has(item.key) && !kept.some((grant) => grant.permission === item.key)).map((item, index) => ({ permission: item.key,
      scope: item.type === 'field' || scopeChoices(item.key).length === 1 ? 'all' : gridScope, noSelfApproval: approvalRule(item.key), _fieldMode: item.type === 'field' ? 'all' : '', _key: `${Date.now()}-${index}-${item.key}` }));
    change({ grants: [...kept, ...added] });
  };
  const errors = draftErrors(draft);
  const workflowIssues = workflowGaps(draft.grants, inventory);
  const modules = [...new Set(catalog.map((item) => item.group))].sort((a, b) => moduleName(a).localeCompare(moduleName(b)));
  const visible = catalog.filter((item) => (!group || item.group === group) && `${permissionName(item)} ${item.key}`.toLowerCase().includes(query.toLowerCase()));
  const moduleGroups = modules.map((name) => ({ name, items: visible.filter((item) => item.group === name) })).filter((item) => item.items.length);
  const compare = () => {
    const prior = new Map(initial.grants.map((grant) => [`${grant.permission}:${grant.scope}`, JSON.stringify(rolePayload({ ...initial, grants: [grant] }).grants[0])]));
    const next = new Map(draft.grants.map((grant) => [`${grant.permission}:${grant.scope}`, JSON.stringify(rolePayload({ ...draft, grants: [grant] }).grants[0])]));
    return { added: draft.grants.filter((grant) => prior.get(`${grant.permission}:${grant.scope}`) !== next.get(`${grant.permission}:${grant.scope}`)), removed: initial.grants.filter((grant) => next.get(`${grant.permission}:${grant.scope}`) !== prior.get(`${grant.permission}:${grant.scope}`)) };
  };
  const reviewChanges = async () => {
    if (errors.length) { setError(errors.join(' ')); return; }
    setBusy(true); setError(''); const version = fingerprint(draft);
    try {
      const impact = draft._id ? (await api.post(`/roles/${draft._id}/preview`, rolePayload(draft))).data : { activeAssignments: 0, onboardingDefaults: [] };
      if (fingerprint(current.current) === version) setReview({ ...impact, ...compare(), version, summary: pageChanges(initial.grants, draft.grants) });
    } catch (failure) { setError(failure.response?.data?.message || failure.message); }
    finally { setBusy(false); }
  };
  const publish = async (reason) => {
    if (fingerprint(current.current) !== review.version) throw new Error('The draft changed. Review it again before saving.');
    setBusy(true);
    try {
      const payload = { ...rolePayload(draft), reason };
      if (draft._id) await api.put(`/roles/${draft._id}`, payload); else await api.post('/roles', payload);
      sessionStorage.removeItem(storageKey); registerDirty(false); await refreshAccess();
      toast({ title: draft._id ? 'Role changes saved' : 'Role created', status: 'success' }); onSaved();
    } finally { setBusy(false); }
  };
  const discard = () => { sessionStorage.removeItem(storageKey); registerDirty(false); setConfirmCancel(false); onBack(true); };
  return <>
    <HStack mb={4} flexWrap="wrap" gap={2}><Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => dirty ? setConfirmCancel(true) : onBack(true)}>Back to Roles</Button><Text color="var(--dash-muted)">/</Text><Text fontWeight="semibold">{draft._id ? `${readOnly ? 'Viewing' : 'Editing'}: ${role.name}` : 'Create Role'}</Text>{dirty && <Badge colorScheme="yellow">Unsaved changes</Badge>}</HStack>
    <div className="access-editor-heading"><h2>{draft._id ? role.name : 'New Role'}</h2><Badge colorScheme={draft.active ? 'green' : 'gray'}>{draft.active ? 'Active' : 'Disabled'}</Badge></div>
    <fieldset disabled={readOnly}><div className="access-details-grid"><FormControl isRequired><FormLabel htmlFor="role-name">Role name</FormLabel><Input id="role-name" aria-label="Role name" maxLength={100} value={draft.name} onChange={(event) => change({ name: event.target.value })} /></FormControl><FormControl><FormLabel htmlFor="role-status">Status</FormLabel><HStack h="40px"><Switch id="role-status" isChecked={draft.active} onChange={(event) => change({ active: event.target.checked })} /><Text>{draft.active ? 'Active' : 'Disabled'}</Text></HStack></FormControl><FormControl className="access-description"><FormLabel htmlFor="role-description">Description</FormLabel><Textarea id="role-description" maxLength={2000} rows={2} value={draft.description || ''} onChange={(event) => change({ description: event.target.value })} /></FormControl></div></fieldset>
    {draft._id && draft.revision !== role.revision && <Alert status="warning" mb={3}><AlertIcon />This role changed in another session. Your draft has been retained; discard it to load the latest saved version.</Alert>}
    <BuiltInRules api={api} role={role} draft={draft} readOnly={readOnly} onChange={(profile) => change({ profile })} />
    {workflowIssues.length > 0 && <Box className="access-rules" role="status" mb={3}>
      <Text fontWeight="semibold">Some workflows need more access</Text>
      <Text fontSize="sm">The selected actions have missing form fields or supporting choices. Keep these restrictions if partial access is intended.</Text>
      <Box as="ul" pl={5} my={2} fontSize="sm">{workflowIssues.map(issue => <li key={issue.id}>{issue.label}: {issue.fields.map(f => `${words(f.key)} (${f.action})`).concat(issue.permissions.map(g => permissionName(g.permission))).join(', ')}</li>)}</Box>
      {!readOnly && <Button size="sm" onClick={() => setGrants(editable({ grants: completeWorkflowAccess(draft.grants, inventory) }).grants)}>Add required workflow access</Button>}
      <Text fontSize="xs" mt={2}>This adds specific fields and names-only assignment choices. It does not add approvals, discounts or direct balance editing.</Text>
    </Box>}
    <nav className="access-mode-tabs" aria-label="Permission view">{[['simple', 'Pages & actions'], ['advanced', 'Advanced']].map(([key, label]) => <button key={key} type="button" aria-current={mode === key ? 'page' : undefined} onClick={() => setMode(key)}>{label}</button>)}</nav>
    {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}
    {mode === 'simple' && <AccessGrid grants={draft.grants} readOnly={readOnly} scope={gridScope} onScope={setGridScope} onChange={setGrants} />}
    {mode === 'advanced' && <>
    <div className="access-permission-toolbar"><SearchInput label="Search permissions" value={query} onChange={(value) => { setQuery(value); if (value) setGroup(''); }} /><Select aria-label="Permission module" value={group} onChange={(event) => setGroup(event.target.value)}><option value="">All modules</option>{modules.map((name) => <option key={name} value={name}>{moduleName(name)}</option>)}</Select><Checkbox isChecked={technical} onChange={(event) => setTechnical(event.target.checked)}>Technical details</Checkbox><Badge>{draft.grants.length} rules selected</Badge></div>
    {!visible.length && <Text py={8} textAlign="center">No matching permissions.</Text>}
    <div className="access-module-layout"><nav className="access-module-nav" aria-label="Permission modules">{modules.map((name) => <button key={name} aria-current={group === name ? 'true' : undefined} onClick={() => { setGroup(name); setQuery(''); }}><span>{moduleName(name)}</span><span>{new Set(draft.grants.filter((grant) => catalog.find((item) => item.key === grant.permission)?.group === name).map((grant) => grant.permission)).size}</span></button>)}</nav><fieldset disabled={readOnly} className="access-module-content">
    {moduleGroups.map(({ name, items }) => <details className="access-permission-module" key={name} open>
      <summary><h3>{moduleName(name)} <span>{items.filter((item) => draft.grants.some((grant) => grant.permission === item.key)).length} / {items.length}</span></h3></summary>
      {!readOnly && <HStack className="access-module-bulk" spacing={1} mb={2}><Button size="xs" variant="ghost" onClick={() => bulk(items, 'all')}>Select all</Button><Button size="xs" variant="ghost" onClick={() => bulk(items, 'view')}>View only</Button><Button size="xs" variant="ghost" onClick={() => bulk(items, 'clear')}>Clear</Button></HStack>}
      {items.map((permission) => {
        const matches = draft.grants.map((grant, index) => ({ grant, index })).filter(({ grant }) => grant.permission === permission.key);
        return <div className="access-permission-row" key={permission.key}>
          <div><Checkbox isChecked={matches.length > 0} onChange={(event) => toggle(permission, event.target.checked)}>{permissionName(permission)}</Checkbox>{technical && <Text fontFamily="mono" fontSize="xs" color="var(--dash-muted)" mt={1}>{permission.key}</Text>}</div>
          <div className="access-permission-rules">{matches.map(({ grant, index }) => <div className="access-rule" key={grant._key || index}>
            {permission.type !== 'field' ? <FormControl><FormLabel fontSize="xs">Who can this apply to?</FormLabel><Select aria-label={`Scope ${permission.key} ${index}`} value={grant.scope} onChange={(event) => grantChange(index, { scope: event.target.value })}><option value="">Choose access scope</option>{[...new Set([...scopeChoices(permission.key), ...(grant.scope ? [grant.scope] : [])])].map((scope) => <option key={scope} value={scope}>{scopeName(scope)}</option>)}</Select></FormControl>
              : <FormControl><FormLabel fontSize="xs">Allowed fields</FormLabel><Select aria-label={`Fields ${permission.key}`} value={grant._fieldMode || ''} onChange={(event) => grantChange(index, { _fieldMode: event.target.value, fields: [] })}><option value="">Choose fields</option><option value="all">All permitted fields</option><option value="selected">Selected fields</option></Select>{grant._fieldMode === 'selected' && <><Input size="sm" mt={2} aria-label={`Search fields ${permission.key}`} placeholder="Search fields" value={fieldQueries[permission.key] || ''} onChange={(event) => setFieldQueries({ ...fieldQueries, [permission.key]: event.target.value })} /><div className="access-field-list">{permission.fields?.filter((field) => words(field).toLowerCase().includes((fieldQueries[permission.key] || '').toLowerCase())).map((field) => <Checkbox key={field} isChecked={grant.fields?.includes(field) || false} onChange={(event) => grantChange(index, { fields: event.target.checked ? [...(grant.fields || []), field] : grant.fields.filter((name) => name !== field) })}>{words(field)}</Checkbox>)}</div></>}</FormControl>}
            {grant.scope === 'all' && permission.type === 'action' && <Text fontSize="xs" color="var(--dash-accent)">Institution-wide access</Text>}
            {(financialRule(permission.key) || (technical && grant.maxAmount != null)) && <FormControl><FormLabel fontSize="xs">Maximum amount (PKR)</FormLabel><Input type="number" min={0} aria-label={`Amount ${permission.key} ${index}`} placeholder="No limit" value={grant.maxAmount ?? ''} onChange={(event) => grantChange(index, { maxAmount: event.target.value === '' ? null : Number(event.target.value) })} /></FormControl>}
            {(approvalRule(permission.key) || grant.noSelfApproval) && <Checkbox isChecked={Boolean(grant.noSelfApproval)} onChange={(event) => grantChange(index, { noSelfApproval: event.target.checked })}>Prevent approving own requests</Checkbox>}
            {matches.length > 1 && <Button size="sm" variant="ghost" aria-label={`Remove scope ${index}`} title="Remove this scope" onClick={() => change({ grants: draft.grants.filter((_, position) => position !== index) })}><Trash2 size={16} /></Button>}
          </div>)}{matches.length > 0 && permission.type === 'action' && <Button size="xs" variant="ghost" leftIcon={<Plus size={14} />} onClick={() => change({ grants: [...draft.grants, { permission: permission.key, scope: '', _key: `${Date.now()}-${permission.key}` }] })}>Add scope</Button>}</div>
        </div>;
      })}
    </details>)}</fieldset></div></>}
    {!readOnly && <div className="access-savebar"><Text fontSize="sm">{dirty ? 'Unsaved changes' : draft._id ? 'No changes' : 'New role'}</Text><HStack><Button isDisabled={busy} onClick={() => dirty ? setConfirmCancel(true) : onBack(true)}>Cancel</Button><Button className="table-action-btn table-action-btn--primary" leftIcon={<Check size={16} />} isLoading={busy} isDisabled={!dirty && Boolean(draft._id)} onClick={reviewChanges}>Review Changes</Button></HStack></div>}
    {review && !readOnly && <ConfirmChange title={draft._id ? `Review changes to ${draft.name}` : `Create ${draft.name}`} action={draft._id ? 'Save Changes' : 'Create Role'} onClose={() => setReview(null)} busy={busy} onConfirm={publish}>
      <Stack spacing={3}><Text>{review.activeAssignments || 0} active assignments affected.</Text>{draft.grants.length === 0 && <Alert status="warning"><AlertIcon />This role grants no permissions.</Alert>}{draft.grants.some((grant) => ['access.manage', 'access.assign'].includes(grant.permission)) && <Alert status="warning"><AlertIcon />This role can administer other people's access.</Alert>}{review.onboardingDefaults?.length > 0 && <Alert status="warning"><AlertIcon />Default role for {review.onboardingDefaults.map(words).join(', ')}.{!draft.active && ' Disabling it will block new accounts in these categories.'}</Alert>}
        {initial.name !== draft.name && <Text>Name: {initial.name || 'New role'} → {draft.name}</Text>}{initial.description !== draft.description && <Text>Description changed.</Text>}{initial.active !== draft.active && <Text>Status: {draft.active ? 'Active' : 'Disabled'}</Text>}
        {(initial.profile || null) !== (draft.profile || null) && <Text>Built-in safeguards: {draft.profile ? 'copied from a built-in role' : 'removed'}</Text>}
        {review.summary.length > 0 && <Box><Text fontWeight="semibold">What changes</Text><Box as="ul" pl={5} maxH="220px" overflowY="auto" fontSize="sm">{review.summary.map((item) => <li key={item}>{item}</li>)}</Box></Box>}
        <details open={!review.summary.length}><summary>Individual permissions ({review.added.length} added or changed, {review.removed.length} removed)</summary><Stack spacing={2} mt={2}>
        <Text fontWeight="semibold">Added or changed ({review.added.length})</Text><Box maxH="180px" overflowY="auto">{review.added.map((grant, index) => <Text key={index} fontSize="sm">+ {permissionName(grant.permission)} · {scopeName(grant.scope)}{grant.maxAmount != null ? ` · PKR ${grant.maxAmount}` : ''}{grant.noSelfApproval ? ' · No self-approval' : ''}{grant.fields?.length ? ` · ${grant.fields.map(words).join(', ')}` : ''}</Text>)}</Box>
        <Text fontWeight="semibold">Removed or replaced ({review.removed.length})</Text><Box maxH="140px" overflowY="auto">{review.removed.map((grant, index) => <Text key={index} fontSize="sm">− {permissionName(grant.permission)} · {scopeName(grant.scope)}</Text>)}</Box></Stack></details>
      </Stack></ConfirmChange>}
    {confirmCancel && <ConfirmChange title="Discard unsaved role changes?" action="Discard Changes" danger requireReason={false} onClose={() => setConfirmCancel(false)} onConfirm={discard}><Text>Your saved role will not be changed.</Text></ConfirmChange>}
  </>;
}
