import React, { useState } from 'react';
import { Box, Button, Menu, MenuButton, MenuItem, MenuList, Text, useColorModeValue, useFormControlContext } from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
import { LoadState, Pager, SearchInput, useAccessData } from './AccessCommon';

export function RoleChoice({ api, value, onChange, label = 'Role to assign', exclude = [], filter = () => true }) {
  const [page, setPage] = useState(1), [query, setQuery] = useState('');
  const state = useAccessData(api, '/roles', { page, limit: 100, ...(query ? { query } : {}) });
  const form = useFormControlContext();
  const background = useColorModeValue('#ffffff', '#1e293b');
  const foreground = useColorModeValue('#263238', '#f1f5f9');
  const highlight = useColorModeValue('#edf2f7', '#334155');
  const activeRoles = state.data?.docs.filter((role) => role.active && !exclude.includes(role._id) && filter(role)) || [];
  return <Box>
    {(query || state.data?.totalDocs > 10) && !form?.isDisabled && <Box mb={2}><SearchInput label="Search roles" value={query} onChange={(next) => { setQuery(next); setPage(1); }} /></Box>}
    <LoadState state={state}>
      <Menu matchWidth placement="bottom-start" isLazy>
        <MenuButton as={Button} aria-label={label} isDisabled={form?.isDisabled} rightIcon={<ChevronDown size={16} />} width="100%" variant="outline" fontWeight="normal" textAlign="left" bg={background} color={foreground}>
          <Text as="span" display="block" isTruncated>{value ? `${value.name}${value.active === false ? ' (Disabled)' : ''}` : 'Choose a role'}</Text>
        </MenuButton>
        <MenuList bg={background} color={foreground} maxHeight="280px" overflowY="auto" zIndex={1500}>
          <MenuItem bg={background} color={foreground} _focus={{ bg: highlight }} _hover={{ bg: highlight }} onClick={() => onChange(null)}>Choose a role</MenuItem>
          {activeRoles.map((role) => <MenuItem key={role._id} bg={background} color={foreground} _focus={{ bg: highlight }} _hover={{ bg: highlight }} onClick={() => onChange(role)}>{role.name}</MenuItem>)}
          {!activeRoles.length && <Text px={3} py={2} fontSize="sm">{query ? 'No matching active roles.' : 'No active roles on this page.'}</Text>}
        </MenuList>
      </Menu>
      {state.data?.totalPages > 1 && <Pager data={state.data} onPage={setPage} label="roles" />}
    </LoadState>
  </Box>;
}
export default RoleChoice;
