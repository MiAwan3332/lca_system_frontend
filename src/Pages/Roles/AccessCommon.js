import React, { useEffect, useState } from 'react';
import { Alert, AlertIcon, Button, HStack, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Textarea, FormControl, FormLabel, FormHelperText, Box } from '@chakra-ui/react';
import LcaLogoLoading from '../../Components/LcaLogoLoading';
import DataPagination from '../../Components/DataPagination';
import TableSearchControl from '../../Components/TableSearchControl';

export function useAccessData(api, path, params = {}, version = 0) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(params);
  useEffect(() => {
    if (!path) { setState({ data: null, loading: false, error: '' }); return; }
    const controller = new AbortController();
    setState({ data: null, loading: true, error: '' });
    api.get(path, { params: JSON.parse(key), signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setState({ data, loading: false, error: '' });
    }).catch((failure) => { if (!controller.signal.aborted) setState({ data: null, loading: false, error: failure.response?.data?.message || failure.message }); });
    return () => controller.abort();
  }, [api, path, key, version, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
export function LoadState({ state, children }) {
  if (state.loading) return <LcaLogoLoading size="sm" />;
  if (state.error) return <Alert status="error" flexWrap="wrap" gap={2}><AlertIcon /><Text flex="1">{state.error}</Text><Button size="sm" onClick={state.retry}>Retry</Button></Alert>;
  return children;
}
export function Pager({ data, onPage, label = 'results' }) {
  if (!data) return null;
  return <DataPagination pagination={data} onPage={onPage} label={label} />;
}
export function SearchInput({ value, onChange, label = 'Search' }) {
  return <TableSearchControl className="access-search" label={label} placeholder={label} value={value} onChange={onChange} />;
}
export const QUICK_REASONS = ['New hire', 'Role change', 'Temporary cover', 'Left the organisation', 'Correcting access', 'Updated responsibilities'];
export function ReasonField({ value, onChange, reasons = QUICK_REASONS }) {
  return <FormControl><FormLabel>Reason for change</FormLabel>
    <HStack spacing={2} mb={2} flexWrap="wrap" role="group" aria-label="Common reasons">{reasons.map((item) => <Button key={item} size="xs" variant={value === item ? 'solid' : 'outline'} borderRadius="full" onClick={() => onChange(item)}>{item}</Button>)}</HStack>
    <Textarea autoFocus isRequired maxLength={1000} rows={2} value={value} onChange={(event) => onChange(event.target.value)} /><FormHelperText>Pick a common reason or write your own (minimum 5 characters) · {value.length}/1000</FormHelperText></FormControl>;
}
export function ConfirmChange({ title, children, action, onClose, onConfirm, busy, danger = false, requireReason = true, reasons }) {
  const [reason, setReason] = useState(''), [error, setError] = useState('');
  return <Modal isOpen onClose={busy ? () => {} : onClose} closeOnOverlayClick={!busy} size="lg"><ModalOverlay /><ModalContent className="access-confirm-modal" borderRadius="8px"><ModalHeader>{title}</ModalHeader><ModalCloseButton isDisabled={busy} /><ModalBody>
    <Box mb={4}>{children}</Box>
    {requireReason && <ReasonField value={reason} onChange={setReason} reasons={reasons} />}
    {error && <Alert status="error" mt={3}><AlertIcon />{error}</Alert>}
  </ModalBody><ModalFooter gap={2}><Button variant="ghost" isDisabled={busy} onClick={onClose}>Cancel</Button><Button colorScheme={danger ? 'red' : undefined} className={danger ? undefined : 'table-action-btn table-action-btn--primary'} isLoading={busy} isDisabled={requireReason && reason.trim().length < 5} onClick={async () => { try { await onConfirm(reason.trim()); } catch (failure) { setError(failure.response?.data?.message || failure.message); } }}>{action}</Button></ModalFooter></ModalContent></Modal>;
}
