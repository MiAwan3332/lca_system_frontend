import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, FormControl } from '@chakra-ui/react';
import { RoleChoice } from './PeopleAccess';

const role = { _id: 'r1', name: 'Admissions Officer', active: true };
const disabled = { _id: 'r2', name: 'Retired role', active: false };
const api = { get: async () => ({ data: { docs: [role, disabled], page: 1, totalPages: 1, totalDocs: 2 } }) };
const luminance = (color) => color.match(/\d+/g).slice(0, 3).map(Number).map((value) => {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);

test('role menu renders readable text and selects an active role without saving', async () => {
  const onChange = jest.fn();
  render(<ChakraProvider><RoleChoice api={api} value={null} onChange={onChange} /></ChakraProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Role to assign' }));
  const item = await screen.findByRole('menuitem', { name: role.name });
  expect(item).toBeVisible();
  const style = getComputedStyle(item);
  const levels = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
  expect((levels[0] + 0.05) / (levels[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
  expect(screen.queryByRole('menuitem', { name: disabled.name })).not.toBeInTheDocument();
  fireEvent.click(item);
  expect(onChange).toHaveBeenCalledWith(role);
});

test('read-only default role stays disabled and preserves its selected label', async () => {
  render(<ChakraProvider><FormControl isDisabled><RoleChoice api={api} value={disabled} onChange={jest.fn()} /></FormControl></ChakraProvider>);
  const trigger = await screen.findByRole('button', { name: 'Role to assign' });
  expect(trigger).toBeDisabled();
  expect(trigger).toHaveTextContent('Retired role (Disabled)');
});
