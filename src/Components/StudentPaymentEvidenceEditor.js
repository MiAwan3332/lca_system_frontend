import { Checkbox, Select } from './AccessInputs';
import FormControl from './AccessFormControl';
import React, { useEffect, useState } from 'react';
import { Box, Button, FormLabel, Text } from '@chakra-ui/react';
import axios from 'axios';
import { config } from '../utlls/config';
import PaymentEvidenceUploader from './PaymentEvidenceUploader';
import CreationProcessing from './CreationProcessing';
import { accessSnapshot, subscribeAccess, dynamicPermission, canUseField } from '../utlls/accessCapabilities';

export default function StudentPaymentEvidenceEditor({ studentId, authToken }) {
  const access = React.useSyncExternalStore(subscribeAccess, accessSnapshot);
  const available = !access.managed || dynamicPermission(['listEvidencePayments']);
  const editable = !access.managed || (dynamicPermission(['editPaymentEvidence']) && canUseField('payment_evidence', 'write') && canUseField('keep_evidence', 'write'));
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [selected, setSelected] = useState('');
  const [keep, setKeep] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [key, setKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    if (!available) return;
    setSelected(''); setSubmission(null); setKeep([]); setFiles([]);
    const controller = new AbortController();
    axios.get(`${config.BASE_URL}/students/${studentId}/evidence-payments`, { headers: { Authorization: `Bearer ${authToken}` },
      params: { page, limit: 10 }, signal: controller.signal }).then(({ data }) => { setLogs(data.docs); setHasNext(data.hasNextPage); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.response?.data?.message || 'Unable to load payments'); });
    return () => controller.abort();
  }, [studentId, authToken, page, available]);
  const selectPayment = (id) => {
    const log = logs.find((item) => item._id === id);
    setSelected(id); setFiles([]); setSubmission(log?.evidence_edit_request ? { record_id: studentId, processing_status: log.evidence_status, jobs: [] } : null); setKey(crypto.randomUUID());
    setKeep(Array.isArray(log?.payment_evidence) ? log.payment_evidence : log?.payment_evidence ? [log.payment_evidence] : []);
  };
  const save = async () => {
    setSaving(true); setError('');
    try {
      const body = new FormData();
      body.append('keep_evidence', JSON.stringify(keep));
      files.forEach((file) => body.append('payment_evidence', file));
      const { data } = await axios.post(`${config.BASE_URL}/students/${studentId}/payment-evidence/${selected}`, body,
        { headers: { Authorization: `Bearer ${authToken}`, 'Idempotency-Key': key }, timeout: 45000 });
      setSubmission(data);
    } catch (failure) {
      if (!failure.response || failure.response.status >= 500) setSubmission({ idempotency_key: key, submission_status: 'unknown', jobs: [] });
      setError(failure.response?.data?.message || 'Evidence status is uncertain. Check processing before submitting again.');
    } finally { setSaving(false); }
  };
  const active = logs.find((item) => item._id === selected);
  const originals = Array.isArray(active?.payment_evidence) ? active.payment_evidence : active?.payment_evidence ? [active.payment_evidence] : [];
  if (!available) return null;
  return <Box mt={4} borderTopWidth="1px" pt={4}>
    <FormControl><FormLabel>Payment Evidence</FormLabel><Select value={selected} onChange={(event) => selectPayment(event.target.value)} placeholder="Select a payment">
      {logs.map((log) => <option key={log._id} value={log._id}>{new Date(log.action_date).toLocaleDateString()} · Rs. {log.action_amount} · {log.payment_method}</option>)}
    </Select></FormControl>
    <Box display="flex" gap={2} mt={2}><Button type="button" size="xs" isDisabled={page === 1 || Boolean(submission)} onClick={() => setPage(page - 1)}>Previous</Button>
      <Button type="button" size="xs" isDisabled={!hasNext || Boolean(submission)} onClick={() => setPage(page + 1)}>Next</Button></Box>
    {selected && <Box mt={3} as="fieldset" disabled={!editable}>
      {originals.map((url, index) => <Box key={url}><Checkbox isChecked={keep.includes(url)} isDisabled={Boolean(submission)} onChange={(event) => setKeep(event.target.checked ? [...keep, url] : keep.filter((item) => item !== url))}>
        Keep attachment {index + 1}</Checkbox> <a href={url} target="_blank" rel="noreferrer">View</a></Box>)}
      {!submission && <PaymentEvidenceUploader files={files} onChange={setFiles} />}
      <Button type="button" size="sm" mt={2} onClick={save} isLoading={saving} isDisabled={Boolean(submission) || keep.length + files.length < 1 || keep.length + files.length > 10}>Save Payment Evidence</Button>
      {submission && <CreationProcessing kind="student" authToken={authToken} submissionKey={active?.evidence_edit_request ? undefined : key}
        recordId={active?.evidence_edit_request ? studentId : undefined} requestId={active?.evidence_edit_request} initial={submission} />}
    </Box>}
    {error && <Text color="red.600" fontSize="sm" mt={2}>{error}</Text>}
  </Box>;
}
