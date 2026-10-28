import React from 'react';
import {render,screen} from '@testing-library/react';
import {ChakraProvider} from '@chakra-ui/react';
import {MemoryRouter} from 'react-router-dom';
import ApprovalActions from './ApprovalActions';
import RequestManagement from '../RequestManagement/RequestManagement';
const mockDispatch=jest.fn();let mockPermissions=[];const mockAccess={managed:true,ready:true,grants:[]};
const mockState={expenses:{approvalStatus:'idle'},refundRequests:{requests:[{_id:'fixture',student_name:'Fixture student',amount:100,status:'Pending',reason:'Fixture refund'}],filters:{query:'',status:''},pagination:{page:1,limit:10,totalDocs:1,totalPages:1},fetchStatus:'succeeded',pendingCount:1,approvedCount:0,rejectedCount:0,decisionStatus:'idle'}};
jest.mock('react-redux',()=>({useDispatch:()=>mockDispatch,useSelector:selector=>selector(mockState)}));
jest.mock('../../utlls/accessCapabilities',()=>({...jest.requireActual('../../utlls/accessCapabilities'),accessSnapshot:()=>mockAccess,subscribeAccess:()=>()=>{},canUseField:()=>true,can:permission=>mockPermissions.includes(permission)}));
jest.mock('../../utlls/refundAccess',()=>({canAccessRequestManagement:()=>true}));
beforeEach(()=>{mockPermissions=[];mockDispatch.mockClear();});
for(const [resource,approve,reject,Component] of [
 ['expenses','expenses.approve.expense','expenses.reject.expense',()=> <ApprovalActions expense={{_id:'fixture',status:'Pending'}} onUpdated={()=>{}} />],
 ['refunds','refund-requests.approve.refund.request','refund-requests.reject.refund.request',RequestManagement],
])for(const [name,grants,shown] of [['view only',[],[]],['approve only',[approve],['Approve']],['reject only',[reject],['Reject']],['both',[approve,reject],['Approve','Reject']]]){
 test(`${resource}: ${name} shows only the assigned decision actions`,()=>{
 mockPermissions=grants;render(<ChakraProvider><MemoryRouter><Component /></MemoryRouter></ChakraProvider>);
 for(const label of ['Approve','Reject'])expect(screen.queryByRole('button',{name:label,exact:true})!==null).toBe(shown.includes(label));
 });
}

