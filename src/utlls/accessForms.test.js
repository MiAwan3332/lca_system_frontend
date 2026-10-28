import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChakraProvider, Button } from '@chakra-ui/react';
import * as Yup from 'yup';
import axios from 'axios';
import AccessForm from '../Components/AccessForm';
import FormControl from '../Components/AccessFormControl';
import { Input } from '../Components/AccessInputs';
import { useAccessUpdateFormik } from './accessForms';
import { accessSnapshot, refreshAccess, resetAccess } from './accessCapabilities';
import { permittedRequestBody, accessMutationRoute, accessFetch } from './accessRequests';
import { config } from './config';
jest.mock('axios');
const grants = [
  { permission: 'fields.general.read', scope: 'all', fields: ['name'] },
  { permission: 'fields.contact.read', scope: 'all', fields: ['phone'] },
  { permission: 'fields.contact.write', scope: 'all', fields: ['phone'] },
];
beforeEach(async () => {
  resetAccess(); axios.get.mockResolvedValue({ data: { managed: true, owner: false, grants, routes: [] } });
  await refreshAccess();
});
function Editor({ save }) {
  const formik = useAccessUpdateFormik({ initialValues: { name: 'Original', phone: '03000000000', email: '' },
    validationSchema: Yup.object({ name: Yup.string().required(), phone: Yup.string().required(), email: Yup.string().required() }),
    onSubmit: async (values) => {
      try { await save(permittedRequestBody(values, { handler: 'basicStudentUpdate' })); }
      catch (error) { formik.setStatus(error.message); }
    } });
  return <AccessForm onSubmit={formik.handleSubmit}>
    {['name', 'phone', 'email'].map((name) => <FormControl key={name} id={name}><Input aria-label={name} name={name} value={formik.values[name]} onChange={formik.handleChange} /></FormControl>)}
    <Button type="submit">Save</Button>{formik.status && <p role="alert">{formik.status}</p>}
  </AccessForm>;
}
test('phone-only editing hides private fields, disables read-only values and sends only permitted data', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  render(<ChakraProvider><Editor save={save} /></ChakraProvider>);
  expect(screen.getByLabelText('name')).toBeDisabled();
  expect(screen.queryByLabelText('email')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('phone'), { target: { value: '03001234567' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith({ phone: '03001234567' }));
});
test('failed saves retain typed values and revocation in an open form prevents another write', async () => {
  const save = jest.fn().mockRejectedValue(new Error('Network unavailable'));
  render(<ChakraProvider><Editor save={save} /></ChakraProvider>);
  fireEvent.change(screen.getByLabelText('phone'), { target: { value: '03001234567' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByRole('alert'); expect(screen.getByLabelText('phone')).toHaveValue('03001234567');
  axios.get.mockResolvedValue({ data: { managed: true, owner: false, grants: grants.filter((grant) => !grant.permission.endsWith('.write')), routes: [] } });
  await act(async () => { await refreshAccess(); });
  expect(screen.getByLabelText('phone')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('do not have access'));
  expect(save).toHaveBeenCalledTimes(1);
});
test('multipart evidence keeps every permitted attachment and strips restricted text', async () => {
  axios.get.mockResolvedValue({ data: { ...accessSnapshot(), grants: [{ permission: 'fields.evidence.write', scope: 'all', fields: ['payment_evidence'] }] } });
  await refreshAccess();
  const data = new FormData(); data.append('payment_evidence', new File(['1'], 'one.jpg')); data.append('payment_evidence', new File(['2'], 'two.jpg')); data.append('remarks', 'must not send');
  const body = permittedRequestBody(data, { handler: 'editPaymentEvidence' });
  expect(body.getAll('payment_evidence')).toHaveLength(2); expect(body.has('remarks')).toBe(false);
  expect(accessMutationRoute({ method: 'post', url: `${config.BASE_URL}/students/basic-update/abc` }).handler).toBe('basicStudentUpdate');
  expect(accessMutationRoute({ method: 'post', url: 'https://elsewhere.invalid/students/basic-update/abc' })).toBe(null);
});
test('search filters outside a form remain interactive without data-edit access', () => {
  render(<ChakraProvider><FormControl id="name"><Input aria-label="Filter" name="name" defaultValue="" /></FormControl></ChakraProvider>);
  expect(screen.getByLabelText('Filter')).not.toBeDisabled();
});
test('native fetch follows the same field policy as Axios without changing external requests', async () => {
  const previous = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  try {
    await accessFetch(`${config.BASE_URL}/students/basic-update/abc`, { method: 'POST', headers: { Authorization: 'Bearer mock' }, body: JSON.stringify({ phone: '03001234567', name: 'Read only' }) });
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ phone: '03001234567' });
    const options = { method: 'POST', body: 'external-payload' };
    await accessFetch('https://elsewhere.invalid/upload', options);
    expect(global.fetch.mock.calls[1][1]).toBe(options);
  } finally { global.fetch = previous; }
});
test('unmanaged compatibility preserves business data while dropping server-owned metadata', async () => {
  axios.get.mockResolvedValue({ data: { managed: false, owner: false, grants: [], routes: [] } }); await refreshAccess();
  expect(permittedRequestBody({ _id: 'server-id', created_by: 'server-owner', name: 'Keep', fee: 500 }, { handler: 'updateCourse' }))
    .toEqual({ name: 'Keep', fee: 500 });
});

test('unauthorized critical workflow fields are rejected instead of silently discarded', () => {
 expect(() => permittedRequestBody({paying_now:100},{handler:'addStudent'})).toThrow(/Nothing was submitted/);
 expect(() => permittedRequestBody({batch:'batch-id'},{handler:'transferStudentBatch'})).toThrow(/workflow needs permission/);
 expect(() => permittedRequestBody({is_active:false},{handler:'toggleStudentStatus'})).toThrow(/workflow needs permission/);
 expect(() => permittedRequestBody({batchId:'batch-id',courseIds:[]},{handler:'assignCoursesToBatch'})).toThrow(/workflow needs permission/);
});
