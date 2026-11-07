import Select from '../../Components/InPageSelect';
import React, { memo, useCallback, useRef, useState } from 'react';
import { Badge, Box, Button, Checkbox, HStack, Input, Radio, RadioGroup, Stack, Text } from '@chakra-ui/react';
import { AlertTriangle, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { AREAS, FIELD_AREAS, ADMIN_AREAS, areaState, setAreaLevel, setAreaExtra, setAreaScope, setAreaLimit, setAreaSelfApproval, setAreaAction,
  minimumLevel, requiredBy, missingNeeds, fixNeeds, fieldState, setFieldLevel, adminState, setAdmin, missingBaseline, addSelfService, selfServiceGaps, SELF_SERVICE, otherGrants, levelName } from './accessAreas';
import { SearchInput } from './AccessCommon';
import { permissionName, scopeName } from './accessUi';

const RANK = { none: 0, view: 1, manage: 2 };
const SCOPES = ['all', 'own', 'assigned', 'selected'];
const levelsFor = (area) => ['none', 'view', ...(area.manage?.length ? ['manage'] : [])];

// Everything a row shows, computed once per change so unchanged rows can skip rendering.
function rowInfo(area, grants) {
  const state = areaState(area, grants);
  const selfApproval = Object.fromEntries((area.extras || []).filter((extra) => extra.selfApproval).map((extra) => [extra.key, grants.some((grant) => extra.permissions.includes(grant.permission) && grant.noSelfApproval)]));
  const info = { state, minimum: minimumLevel(area, grants), needs: missingNeeds(area, grants), requiredNames: requiredBy(area, grants).map((item) => item.area.label), selfApproval };
  info.signature = JSON.stringify([state.level, state.extras, state.limits, state.scope, [...state.permissions].sort(), info.minimum, info.needs.map((item) => `${item.area.key}:${item.level}`), info.requiredNames, selfApproval]);
  return info;
}
const AreaRow = memo(function AreaRow({ area, info, apply, scope, readOnly }) {
  const [open, setOpen] = useState(false);
  const { state, minimum, needs, requiredNames } = info;
  const onChange = (update) => apply(update);
  const actions = [...area.view, ...(area.manage || []), ...(area.advanced || [])];
  const scoped = state.level !== 'none' && state.scope !== null;
  return <div className="access-area-row" role="group" aria-label={`${area.label} access`}>
    <div className="access-area-name">
      <Text fontWeight="semibold">{area.label}</Text>
      {area.pages.length > 1 && <Text fontSize="xs" color="var(--dash-muted)">{area.pages.join(', ')}</Text>}
      {state.level === 'custom' && <Badge colorScheme="purple" mt={1} title="Some, but not all, actions for this page are included">Custom · {state.actions} of {state.total} actions</Badge>}
      {state.advanced > 0 && <Badge ml={state.level === 'custom' ? 1 : 0} mt={1}>+{state.advanced} advanced</Badge>}
    </div>
    <div className="access-area-controls">
      <RadioGroup className="access-level" value={['custom'].includes(state.level) ? '' : state.level} onChange={(level) => onChange((grants) => setAreaLevel(grants, area, level, scope))} isDisabled={readOnly}>
        <HStack spacing={4} flexWrap="wrap">{levelsFor(area).map((level) => <Radio key={level} value={level} inputProps={{ 'aria-label': `${area.label}: ${levelName(area, level)}` }}
          isDisabled={readOnly || RANK[level] < RANK[minimum]} title={RANK[level] < RANK[minimum] ? `Required by ${requiredNames.join(', ')}` : undefined}>{levelName(area, level)}</Radio>)}</HStack>
      </RadioGroup>
      {scoped && <Box className="access-area-scope"><Select size="sm" aria-label={`${area.label} records`} value={state.scope} isDisabled={readOnly} onChange={(event) => event.target.value !== 'mixed' && onChange((grants) => setAreaScope(grants, area, event.target.value))}>
        {state.scope === 'mixed' && <option value="mixed" disabled>Mixed records</option>}{SCOPES.map((item) => <option key={item} value={item}>{scopeName(item)}</option>)}</Select></Box>}
      {minimum !== 'none' && <Text fontSize="xs" color="var(--dash-muted)">Needed by {requiredNames.join(', ')}</Text>}
    </div>
    {state.level !== 'none' && area.extras?.length > 0 && <div className="access-area-extras">{area.extras.map((extra) => {
      const value = state.extras[extra.key];
      return <Box key={extra.key} className="access-area-extra">
        <Checkbox isChecked={value === true} isIndeterminate={value === 'partial'} isDisabled={readOnly} colorScheme={extra.danger ? 'red' : undefined}
          title={value === 'partial' ? 'Partly included. Tick to include all of it.' : undefined} onChange={(event) => { const enabled = event.target.checked || value === 'partial'; onChange((grants) => setAreaExtra(grants, area, extra.key, enabled, scope)); }}>{extra.label}</Checkbox>
        {value === true && extra.limit && <Input size="xs" type="number" min={0} width="150px" ml={6} mt={1} aria-label={`${area.label} ${extra.label} maximum amount`} isDisabled={readOnly}
          placeholder={state.limits[extra.key] === 'mixed' ? 'Mixed limits' : 'No PKR limit'} value={typeof state.limits[extra.key] === 'number' ? state.limits[extra.key] : ''}
          onChange={(event) => { const amount = event.target.value === '' ? null : Math.max(0, Number(event.target.value)); onChange((grants) => setAreaLimit(grants, area, extra.key, amount)); }} />}
        {value === true && extra.selfApproval && <Checkbox size="sm" ml={6} mt={1} isDisabled={readOnly} isChecked={info.selfApproval[extra.key]}
          onChange={(event) => { const checked = event.target.checked; onChange((grants) => setAreaSelfApproval(grants, area, extra.key, checked)); }}>{extra.selfApprovalLabel || 'Cannot approve own requests'}</Checkbox>}
      </Box>;
    })}</div>}
    {needs.length > 0 && <HStack className="access-area-warning" spacing={2}><AlertTriangle size={14} /><Text fontSize="sm">Screens on this page also need {needs.map((item) => `${item.area.label} (${levelName(item.area, item.level)})`).join(', ')}.</Text>
      {!readOnly && <Button size="xs" variant="outline" onClick={() => onChange((grants) => fixNeeds(grants, area, scope))}>Add</Button>}</HStack>}
    {state.level !== 'none' && <Box className="access-area-detail">
      <Button size="xs" variant="ghost" leftIcon={open ? <ChevronDown size={14} /> : <ChevronRight size={14} />} onClick={() => setOpen(!open)} aria-expanded={open}>Individual actions</Button>
      {open && <div className="access-area-actions">{actions.map((permission) => <Checkbox key={permission} size="sm" isDisabled={readOnly} isChecked={state.permissions.has(permission)}
        onChange={(event) => { const checked = event.target.checked; onChange((grants) => setAreaAction(grants, area, permission, checked, scope)); }}>{permissionName(permission)}</Checkbox>)}</div>}
    </Box>}
  </div>;
}, (before, after) => before.info.signature === after.info.signature && before.scope === after.scope && before.readOnly === after.readOnly);

function AccessGrid({ grants, onChange, readOnly = false, scope, onScope }) {
  const [query, setQuery] = useState(''), [onlyActive, setOnlyActive] = useState(false);
  const latest = useRef({ grants, onChange }); latest.current = { grants, onChange };
  // Rows apply updates to the latest grants, so a memoized row never works from a stale copy.
  const apply = useCallback((update) => latest.current.onChange(update(latest.current.grants)), []);
  const visible = AREAS.filter((area) => area.label.toLowerCase().includes(query.toLowerCase()) && (!onlyActive || areaState(area, grants).level !== 'none'));
  const missing = missingBaseline(grants), gaps = selfServiceGaps(grants), others = otherGrants(grants);
  const active = AREAS.filter((area) => areaState(area, grants).level !== 'none');
  return <div className="access-grid">
    <div className="access-grid-toolbar">
      <SearchInput label="Search pages" value={query} onChange={setQuery} />
      <Checkbox isChecked={onlyActive} onChange={(event) => setOnlyActive(event.target.checked)}>Only pages with access</Checkbox>
      <HStack className="access-grid-default" spacing={2}><Text fontSize="sm" whiteSpace="nowrap">New pages cover</Text>
        <Box minW="210px"><Select size="sm" aria-label="Records for newly added pages" value={scope} isDisabled={readOnly} onChange={(event) => onScope(event.target.value)}>{SCOPES.map((item) => <option key={item} value={item}>{scopeName(item)}</option>)}</Select></Box>
        {!readOnly && active.length > 0 && <Button size="sm" variant="ghost" onClick={() => onChange(active.reduce((next, area) => areaState(area, next).scope ? setAreaScope(next, area, scope) : next, grants))}>Apply to all pages</Button>}
      </HStack>
    </div>
    {scope === 'selected' && <Text fontSize="sm" color="var(--dash-muted)" mb={3}>Choose the batches or courses when you give this role to someone.</Text>}
    <section aria-label="Pages"><h3 className="access-grid-heading">Pages <span>{active.length} of {AREAS.length} with access</span></h3>
      {visible.map((area) => <AreaRow key={area.key} area={area} info={rowInfo(area, grants)} apply={apply} scope={scope} readOnly={readOnly} />)}
      {!visible.length && <Text py={6} textAlign="center">No matching pages.</Text>}
    </section>
    <section aria-label="Personal information"><h3 className="access-grid-heading">Information on those pages</h3>
      <Text fontSize="sm" color="var(--dash-muted)" mb={2}>Controls which details people see or edit on the pages above.</Text>
      {active.length > 0 && fieldState('general', grants).level === 'none' && <HStack className="access-area-warning" spacing={2} mb={2}><AlertTriangle size={14} />
        <Text fontSize="sm">Without general record details, pages show records with names, dates and statuses blank.</Text>
        {!readOnly && <Button size="xs" variant="outline" onClick={() => onChange(setFieldLevel(grants, 'general', 'view'))}>Allow viewing</Button>}</HStack>}
      {FIELD_AREAS.map((item) => { const state = fieldState(item.key, grants); return <div className="access-area-row access-field-row" key={item.key} role="group" aria-label={`${item.label} information`}>
        <div className="access-area-name"><Text fontWeight="semibold">{item.label}</Text><Text fontSize="xs" color="var(--dash-muted)">{item.help}</Text>
          {state.limited && <Badge mt={1} title="Only some fields are included. Use Advanced to change them.">Selected fields only</Badge>}{state.level === 'custom' && <Badge colorScheme="purple" mt={1}>Custom</Badge>}</div>
        <RadioGroup className="access-level" value={state.level === 'custom' ? '' : state.level} isDisabled={readOnly} onChange={(level) => onChange(setFieldLevel(grants, item.key, level))}>
          <HStack spacing={4} flexWrap="wrap">{[['none', 'Hidden'], ['view', 'View'], ['edit', 'View & edit']].map(([level, label]) => <Radio key={level} value={level} inputProps={{ 'aria-label': `${item.label}: ${label}` }}>{label}</Radio>)}</HStack>
        </RadioGroup>
      </div>; })}
    </section>
    <section aria-label="Access administration"><h3 className="access-grid-heading">Access administration</h3>
      <Stack spacing={2} py={2}>{ADMIN_AREAS.map((item) => { const value = adminState(item, grants); return <Checkbox key={item.key} isChecked={value === true} isIndeterminate={value === 'partial'} isDisabled={readOnly}
        onChange={(event) => onChange(setAdmin(grants, item, event.target.checked || value === 'partial'))}>{item.label}</Checkbox>; })}</Stack>
      {ADMIN_AREAS.some((item) => item.key !== 'review' && adminState(item, grants)) && <Text fontSize="sm" color="var(--dash-muted)">People can only hand out access they hold themselves.</Text>}
    </section>
    <section aria-label="Own account"><h3 className="access-grid-heading">Own account</h3>
      <Stack spacing={1} py={2}>{SELF_SERVICE.map(([name]) => <HStack key={name} spacing={2}>{gaps.includes(name) ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
        <Text fontSize="sm">{gaps.includes(name) ? `Cannot ${name}` : `Can ${name}`}</Text></HStack>)}</Stack>
      {(gaps.length > 0 || missing.length > 0) && <HStack className="access-area-warning" spacing={2}><AlertTriangle size={14} />
        <Text fontSize="sm">{gaps.length ? `People who only have this role cannot ${gaps.join(', ')}. ` : 'Some own-account basics are missing. '}“Staff - Pending Assignment” stays on anyone given this role until these are added.</Text>
        {!readOnly && <Button size="xs" variant="outline" onClick={() => onChange(addSelfService(grants))}>Add basics</Button>}</HStack>}
      {others.length > 0 && <Text fontSize="sm" color="var(--dash-muted)" mt={2}>Also includes {others.length} legacy or maintenance permission{others.length === 1 ? '' : 's'}. Review them in Advanced.</Text>}
    </section>
  </div>;
}
export default memo(AccessGrid);
