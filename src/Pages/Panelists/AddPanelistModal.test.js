import React from 'react';import {render,screen,fireEvent,waitFor} from '@testing-library/react';import {ChakraProvider} from '@chakra-ui/react';import axios from 'axios';
import AddPanelistModal from './AddPanelistModal';import {DEFAULT_STAFF_PASSWORD} from '../../utlls/creationDefaults';
import {addPanelist} from '../../Features/panelistSlice';
jest.mock('axios');jest.mock('react-redux',()=>({useSelector:fn=>fn({panelists:{addStatus:'idle'}}),useDispatch:()=>jest.fn(()=>({unwrap:()=>Promise.resolve({login:{created:true,email:'fixture@example.invalid'}})}))}));
jest.mock('../../Features/panelistSlice',()=>({addPanelist:jest.fn(p=>({type:'panelist/add',payload:p})),fetchPanelists:jest.fn(()=>({type:'panelist/list'}))}));
test('new panelists show the shared staff password and submit without a password entry',async()=>{
 axios.post.mockResolvedValue({data:{found:false,needs_login:true,existing_panelist:false}});
 render(<ChakraProvider><AddPanelistModal isOpen onClose={()=>{}} /></ChakraProvider>);
 fireEvent.change(screen.getByLabelText(/Name/),{target:{value:'New Panelist'}});
 fireEvent.change(screen.getByLabelText(/Phone No/),{target:{value:'03210000123'}});
 fireEvent.change(screen.getByLabelText(/Description/),{target:{value:'Interview specialist'}});
 expect(await screen.findByText(DEFAULT_STAFF_PASSWORD)).toBeVisible();
 expect(document.querySelector('input[type="password"]')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Add Panelist',exact:true}));
 await waitFor(()=>expect(addPanelist).toHaveBeenCalled());
 const body=addPanelist.mock.calls[0][0].formData;expect(body.get('name')).toBe('New Panelist');expect(body.has('password')).toBe(false);
});
