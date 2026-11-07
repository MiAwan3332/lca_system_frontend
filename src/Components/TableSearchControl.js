import React from 'react';
import { IconButton, InputGroup, InputLeftElement, InputRightElement } from '@chakra-ui/react';
import { Search, X } from 'lucide-react';
import { Input } from './AccessInputs';

export default function TableSearchControl({ value, onChange, onSearch, onClear, placeholder = 'Search...', label = 'Search', className = '' }) {
  return <InputGroup size="md" h="44px" variant="filled" bg="var(--dash-surface)" w="full" className={className}>
    <InputLeftElement h="44px" pointerEvents="none" color="var(--dash-muted)"><Search size={20} /></InputLeftElement>
    <Input h="44px" pl="2.75rem" pr={value ? '2.8rem' : '1rem'} aria-label={label} placeholder={placeholder} borderRadius="xl" value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && onSearch) onSearch(value); }} />
    {value && <InputRightElement h="44px" width="2.8rem"><IconButton aria-label={`Clear ${label.toLowerCase()}`} title="Clear search" h="calc(100% - 0.9rem)" size="md" borderRadius="lg" marginRight="0.5rem" variant="ghost" onClick={() => { if (onClear) onClear(); else onChange(''); }}><X size={18} /></IconButton></InputRightElement>}
  </InputGroup>;
}
