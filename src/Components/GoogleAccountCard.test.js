import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import axios from 'axios';
import GoogleAccountCard from './GoogleAccountCard';
jest.mock('axios');
jest.mock('../utlls/authSession', () => ({ getAuthToken: () => 'fixture' }));
const mockAccess = { managed: true };
let mockGrants = [];
jest.mock('../utlls/accessCapabilities', () => ({
 accessSnapshot: () => mockAccess,
 subscribeAccess: () => () => {},
 can: permission => mockGrants.includes(permission) || mockGrants.includes('owner'),
}));
beforeEach(() => { mockGrants=[]; axios.get.mockReset(); axios.get.mockResolvedValue({data:{configured:true,connected:true,account:{name:'Fixture'}}}); });
const open=()=>render(<ChakraProvider><GoogleAccountCard /></ChakraProvider>);
test('staff without Google access never requests status or sees connection controls', () => {
 open();expect(axios.get).not.toHaveBeenCalled();expect(screen.queryByText('Google Account')).not.toBeInTheDocument();
});
test('Google view access loads status without offering ungranted connection changes', async () => {
 mockGrants=['google.get.google.status'];open();await screen.findByText('Connected');
 expect(axios.get).toHaveBeenCalledTimes(1);expect(screen.queryByRole('button',{name:'Reconnect Google'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Disconnect'})).not.toBeInTheDocument();
});
test('owner retains connection controls', async () => {
 mockGrants=['owner'];open();await waitFor(()=>expect(screen.getByRole('button',{name:'Reconnect Google'})).toBeEnabled());expect(screen.getByRole('button',{name:'Disconnect'})).toBeEnabled();
});
