import AccessForm from './AccessForm';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, HStack, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalHeader, ModalOverlay, Text, VStack } from '@chakra-ui/react';
import axios from 'axios';
import { config } from '../utlls/config';
import { clearCreationKey, readCreation } from '../utlls/creationRecovery';

const labelFor = (name) => name === 'welcome' ? 'WhatsApp welcome' : name.startsWith('avatar:') ? 'Avatar upload' : 'Payment evidence upload';

export default function CreationProcessing({ kind, authToken, submissionKey, recordId, requestId, initial, onResolved, onReset, onFinished }) {
  const [data, setData] = useState(initial);
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const callback = useRef(onResolved);
  const resolved = useRef(false);
  const finishedCallback = useRef(onFinished);
  finishedCallback.current = onFinished;
  callback.current = onResolved;
  useEffect(() => {
    let disposed = false;
    let timer;
    const controller = new AbortController();
    let checks = 0;
    resolved.current = false;
    const poll = async () => {
      checks++;
      try {
        const result = await readCreation(kind, authToken, submissionKey, recordId, controller.signal, requestId);
        if (disposed) return;
        setData(result);
        setMessage('');
        if (result.submission_status === 'deleted') {
          clearCreationKey(kind, authToken, submissionKey);
          setMessage('The original record was deleted. Close this window before starting a new submission.');
          return;
        }
        if (result.submission_status === 'expired') {
          clearCreationKey(kind, authToken, submissionKey);
          setMessage('This submission expired before creating a record. You can try again.');
          return;
        }
        if (result.submission_status === 'complete' && !resolved.current) {
          resolved.current = true;
          clearCreationKey(kind, authToken, submissionKey);
          callback.current?.(result);
        }
        if (result.processing_status === 'complete' || result.submission_status === 'failed' ||
          (result.processing_status === 'failed' && !result.jobs.some((job) => ['pending', 'processing'].includes(job.state)))) {
          finishedCallback.current?.(result);
          return;
        }
      } catch (error) {
        if (disposed) return;
        setMessage(error.response?.status === 404 ? 'Waiting for confirmation. Do not submit this form again.'
          : 'Status is temporarily unavailable. Your submission has not been marked as failed.');
      }
      if (!disposed && checks < 40) timer = setTimeout(poll, 3000);
      else if (!disposed) setMessage('Confirmation is taking longer than expected. Check the status again before creating another record.');
    };
    poll();
    return () => { disposed = true; clearTimeout(timer); controller.abort(); };
  }, [kind, authToken, submissionKey, recordId, requestId, revision]);

  const retry = async () => {
    setRetrying(true);
    try {
      const group = kind === 'student' ? 'students' : 'users';
      await axios.post(`${config.BASE_URL}/${group}/${recordId || data?.record_id}/processing/retry`, {},
        { headers: { Authorization: `Bearer ${authToken}`, ...(data?.idempotency_key || submissionKey ? { 'Idempotency-Key': data?.idempotency_key || submissionKey } : {}) }, timeout: 10000 });
      setRevision((value) => value + 1);
    } catch (error) { setMessage(error.response?.data?.message || 'Could not queue a retry. Check the status again.'); }
    finally { setRetrying(false); }
  };
  return <VStack align="stretch" spacing={2} width="100%">
    <Alert status={data?.processing_status === 'failed' ? 'warning' : 'info'} borderRadius="md">
      <AlertIcon />
      <Text fontSize="sm">{data?.submission_status === 'complete'
        ? data?.processing_status === 'complete' ? 'Follow-up processing complete.' : 'Record saved. Follow-up processing continues separately.'
        : data?.submission_status === 'failed' ? 'Creation needs administrator attention. Do not create another record.' : 'Confirming your submission...'}</Text>
    </Alert>
    {(data?.jobs || []).map((job) => <HStack key={job.name} justify="space-between" flexWrap="wrap">
      <Text fontSize="sm">{labelFor(job.name)}</Text>
      <Badge colorScheme={job.state === 'failed' ? 'red' : job.state === 'complete' ? 'green' : 'gray'}>
        {job.result === 'skipped_password_changed' ? 'Skipped: password changed' : job.result === 'skipped' ? 'Skipped' : job.state}
      </Badge>
      {job.error && <Text fontSize="xs" color="red.600" width="100%">{job.error}</Text>}
    </HStack>)}
    {message && <Text fontSize="sm">{message}</Text>}
    <HStack>
      {data?.processing_status === 'failed' && <Button size="sm" onClick={retry} isLoading={retrying}>Retry Failed Work</Button>}
      {message && <Button size="sm" variant="outline" onClick={() => setRevision((value) => value + 1)}>Check Status</Button>}
      {data?.submission_status === 'expired' && onReset && <Button size="sm" onClick={onReset}>Try Again</Button>}
    </HStack>
  </VStack>;
}

export function CreationStatusButton({ kind, record, authToken }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(record.processing_status);
  useEffect(() => setStatus(record.processing_status), [record.processing_status]);
  if (!record.creation_request) return null;
  return <Box>
    <Button size="xs" variant="ghost" onClick={() => setOpen(true)} colorScheme={status === 'failed' ? 'red' : 'gray'}>
      {status === 'complete' ? 'Processing complete' : `Processing: ${status || 'pending'}`}
    </Button>
    <Modal isOpen={open} onClose={() => setOpen(false)}>
      <ModalOverlay /><AccessForm component={ModalContent}><ModalHeader>Processing Status</ModalHeader><ModalCloseButton />
        <ModalBody pb={6}><CreationProcessing kind={kind} authToken={authToken} recordId={record._id}
          onResolved={(result) => setStatus(result.processing_status)} onFinished={(result) => setStatus(result.processing_status)} /></ModalBody>
      </AccessForm>
    </Modal>
  </Box>;
}
