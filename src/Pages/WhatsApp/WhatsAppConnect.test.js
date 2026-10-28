import React from 'react';
import {render,screen,waitFor,fireEvent} from '@testing-library/react';
import {ChakraProvider} from '@chakra-ui/react';
import {MemoryRouter} from 'react-router-dom';
import axios from 'axios';
import WhatsAppConnect from './WhatsAppConnect';
jest.mock('axios');
jest.mock('../../utlls/useful',()=>({isPlatformSuperAdminRole:()=>true}));
const saved={configured:true,base_url:'https://gateway.example.invalid'};
const show=()=>render(<ChakraProvider><MemoryRouter><WhatsAppConnect/></MemoryRouter></ChakraProvider>);
beforeEach(()=>jest.clearAllMocks());
test('session failure preserves saved settings and refresh recovers',async()=>{
 let calls=0;
 axios.get.mockImplementation(url=>url.endsWith('/config')?Promise.resolve({data:saved}):(++calls===1?Promise.reject(new Error('Temporary failure')):Promise.resolve({data:[]})));
 show();await screen.findByText(/settings are saved, but WhatsApp sessions could not be loaded/);
 expect(screen.getByText('Settings saved')).toBeInTheDocument();
 expect(screen.queryByText('WhatsApp connection needs setup')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Refresh'}));
 await waitFor(()=>expect(calls).toBe(2));
 await waitFor(()=>expect(screen.queryByText(/settings are saved, but WhatsApp sessions could not be loaded/)).not.toBeInTheDocument());
});
test('a failed config request is unknown rather than missing configuration',async()=>{
 axios.get.mockRejectedValue(new Error('Network failure'));show();
 await screen.findByText(/Unable to check the WhatsApp connection/);
 expect(screen.queryByText('WhatsApp connection needs setup')).not.toBeInTheDocument();
 expect(axios.get).toHaveBeenCalledTimes(1);
});
test('only an explicit unconfigured response shows setup needed',async()=>{
 axios.get.mockResolvedValue({data:{configured:false}});show();
 await screen.findByText('WhatsApp connection needs setup');
 expect(axios.get).toHaveBeenCalledTimes(1);
 expect(screen.getByRole('button',{name:'Connect / Show QR'})).toBeDisabled();
});
