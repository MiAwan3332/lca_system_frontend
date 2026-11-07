import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertIcon, Box, Text } from '@chakra-ui/react';
import axios from 'axios';
import { config } from '../utlls/config';

export default function StudentIdentityNotice({ phone, batch, authToken, active, onResult }) {
  const [result, setResult] = useState(null);
  const callback = useRef(onResult);
  callback.current = onResult;
  useEffect(() => {
    const normalized = String(phone || '').replace(/\D/g, '').slice(-10);
    setResult(null);
    if (!active || normalized.length !== 10) { callback.current({ blocked: true }); return; }
    callback.current({ blocked: true, loading: true });
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await axios.post(`${config.BASE_URL}/students/identity/lookup`, { phone }, {
          headers: { Authorization: `Bearer ${authToken}` }, signal: controller.signal, timeout: 10000 });
        if (controller.signal.aborted) return;
        const data = response.data;
        const sameBatch = Boolean(data.student && String(data.student.batch) === String(batch));
        const next = { ...data, blocked: data.pending_total > 0 || sameBatch, sameBatch };
        setResult(next);
        callback.current(next);
      } catch (error) {
        if (controller.signal.aborted) return;
        const next = { blocked: true, error: error.response?.data?.message || 'Unable to check existing student. Try entering the phone again.' };
        setResult(next); callback.current(next);
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [phone, batch, authToken, active]);
  if (!result) return active && String(phone || '').replace(/\D/g, '').length >= 10 ? <Text fontSize="xs">Checking existing student...</Text> : null;
  if (!result.found && !result.error) return <Text fontSize="xs" color="gray.600">New student</Text>;
  return <Alert status={result.blocked ? 'warning' : 'info'} mt={2} alignItems="flex-start">
    <AlertIcon /><Box><Text fontSize="sm">{result.error || (result.sameBatch ? 'Already enrolled in this batch. Use the existing record.' : result.pending_total > 0
      ? 'Pending dues must be cleared before admission.' : `Existing ${result.student?.name || 'student account'} will be reused. No duplicate account or student will be created.`)}</Text>
      {result.dues?.map((due) => <Text key={due.batch_id || 'unassigned'} fontSize="sm">{due.batch_name}: Rs. {Number(due.pending).toLocaleString('en-PK')}{due.due_date ? ` · Due ${due.due_date}` : ''}</Text>)}
    </Box></Alert>;
}
