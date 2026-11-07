import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider, FormControl, FormLabel, Modal, ModalContent } from '@chakra-ui/react';
import { useFormik } from 'formik';
import InPageSelect from './InPageSelect';

const show = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);
test('renders options in-page with selected state and the existing event contract', () => {
  const onChange = jest.fn();
  const { container, rerender } = show(<InPageSelect aria-label="Status" name="status" value="0" onChange={onChange}><option value="">All</option><option value={0}>Inactive</option><option value={1}>Active</option></InPageSelect>);
  expect(container.querySelector('select, option')).toBeNull();
  fireEvent.click(screen.getByLabelText('Status'));
  expect(screen.getByRole('menu')).toHaveAccessibleName('Status');
  expect(screen.getByRole('menuitemradio', { name: 'Inactive' })).toHaveAttribute('aria-checked', 'true');
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Active' }));
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ name: 'status', value: '1' }) }));
  rerender(<ChakraProvider><InPageSelect aria-label="Status" value="1"><option value={1}>Active</option></InPageSelect></ChakraProvider>);
  expect(screen.getByLabelText('Status')).toHaveTextContent('Active');
});

test('preserves form labels, required validation, reset values and form data', () => {
  const formRef = React.createRef();
  const options = <><option value="a">Admissions</option><option value="b" disabled>Disabled role</option></>;
  const { rerender } = show(<form ref={formRef}><FormControl isRequired id="role"><FormLabel>Role</FormLabel><InPageSelect name="role" value="" placeholder="Choose a role">{options}</InPageSelect></FormControl></form>);
  expect(screen.getByRole('button', { name: 'Role' })).toHaveTextContent('Choose a role');
  expect(formRef.current.checkValidity()).toBe(false);
  rerender(<ChakraProvider><form ref={formRef}><FormControl isRequired id="role"><FormLabel>Role</FormLabel><InPageSelect name="role" value="a" placeholder="Choose a role">{options}</InPageSelect></FormControl></form></ChakraProvider>);
  expect(formRef.current.checkValidity()).toBe(true);
  expect(new FormData(formRef.current).get('role')).toBe('a');
  fireEvent.click(screen.getByRole('button', { name: 'Role' }));
  expect(screen.getByRole('menuitemradio', { name: 'Disabled role' })).toBeDisabled();
});

test('inherits disabled state and never changes read-only fields', () => {
  const onChange=jest.fn();
  show(<><FormControl isDisabled><FormLabel>Locked</FormLabel><InPageSelect onChange={onChange}><option value="a">A</option></InPageSelect></FormControl><InPageSelect aria-label="Read only" isReadOnly onChange={onChange}><option value="b">B</option></InPageSelect></>);
  expect(screen.getByLabelText('Locked')).toBeDisabled();
  fireEvent.click(screen.getByLabelText('Locked'));
  fireEvent.click(screen.getByLabelText('Read only'));
  expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});

test('Formik keeps changed values and blur/touched behavior', () => {
  function Example() {
    const form=useFormik({initialValues:{category:''},onSubmit:jest.fn()});
    return <><InPageSelect aria-label="Category" name="category" value={form.values.category} onChange={form.handleChange} onBlur={form.handleBlur} placeholder="Choose"><option value="staff">Staff</option></InPageSelect><output>{JSON.stringify({values:form.values,touched:form.touched})}</output></>;
  }
  show(<Example/>);
  fireEvent.click(screen.getByLabelText('Category'));
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Staff' }));
  fireEvent.blur(screen.getByLabelText('Category'));
  expect(screen.getByRole('status')).toHaveTextContent('"category":"staff"');
  expect(screen.getByRole('status')).toHaveTextContent('"category":true');
});

test('dialog menus remain inside the accessible modal and return selected values', async () => {
  const onChange = jest.fn();
  show(<Modal isOpen onClose={jest.fn()}><ModalContent><InPageSelect aria-label="Dialog category" onChange={onChange} placeholder="Choose"><option value="staff">Staff</option></InPageSelect></ModalContent></Modal>);
  fireEvent.click(await screen.findByLabelText('Dialog category'));
  const item = await screen.findByRole('menuitemradio', { name: 'Staff' });
  expect(screen.getByRole('dialog')).toContainElement(item);
  fireEvent.click(item);
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ value: 'staff' }) }));
});

