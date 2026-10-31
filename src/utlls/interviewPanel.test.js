import {getMembersValidationError,formRowsToSchedulesPayload,flattenAllPanelSchedules,panelToScheduleRows} from './interviewPanel';
const member={panelist_id:'p1',name:'Panelist One',description:'Teacher',role:'Panelist'};
test('Solo and Team enforce the selected number of members',()=>{
 expect(getMembersValidationError([member],'solo')).toBeNull();
 expect(getMembersValidationError([member],'team')).toBeTruthy();
 expect(getMembersValidationError([member,{...member,panelist_id:'p2',name:'Two'}],'solo')).toBeTruthy();
 expect(getMembersValidationError([member,{...member,panelist_id:'p2',name:'Two'}],'team')).toBeNull();
});
test('editing times retains stable slot IDs without sending booking or progress overrides',()=>{
 const slot={_id:'slot-1',date:'2035-01-01',start_time:'09:00',end_time:'09:30',booking_status:'booked',interview_status:'completed',booked_for:'Candidate'};
 const rows=panelToScheduleRows({_id:'panel-1',members:[member],schedules:[slot]});
 expect(formRowsToSchedulesPayload(rows)[0]).toEqual({_id:'slot-1',date:'2035-01-01',start_time:'09:00',end_time:'09:30',venue:'',notes:''});
 const board=flattenAllPanelSchedules([{_id:'panel-1',members:[member],schedules:[slot],__v:2}]);
 expect(board[0]).toMatchObject({schedule_id:'slot-1',panel_revision:2,interview_status:'completed',members:[{panelist_id:'p1'}]});
});
