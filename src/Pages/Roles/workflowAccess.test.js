import inventory from '../../config/accessCatalog.generated.json';
import { workflowGaps, completeWorkflowAccess } from '../../utlls/accessWorkflowRules';
import { editable, draftErrors } from './accessUi';
test('workflow repair produces a valid reviewable draft and preserves field restrictions', () => {
  const before = [{ permission: 'students.add.student', scope: 'selected' }, { permission: 'fees.pay.fee', scope: 'selected', maxAmount: 1000 },
    { permission: 'fields.general.write', scope: 'all', fields: ['name'] }];
  expect(workflowGaps(before, inventory).map(g => g.id)).toContain('student-admission');
  const next = editable({ name: 'Admissions', grants: completeWorkflowAccess(before, inventory) });
  expect(draftErrors(next)).toEqual([]);
  expect(workflowGaps(next.grants, inventory)).toEqual([]);
  expect(next.grants.find(g => g.permission === 'fees.pay.fee').maxAmount).toBe(1000);
  expect(next.grants.find(g => g.permission === 'fields.general.write').fields).toContain('batch');
  expect(next.grants.some(g => g.permission === 'fees.discount.fee')).toBe(false);
});

test('approval and discount workflows add precise input fields while preserving decision limits', () => {
 const before=[{permission:'fees.discount.fee',scope:'all',maxAmount:500},{permission:'expenses.reject.expense',scope:'all',maxAmount:1000,noSelfApproval:true},{permission:'refund-requests.approve.refund.request',scope:'all',maxAmount:2000,noSelfApproval:true}];
 const next=completeWorkflowAccess(before,inventory);
 expect(workflowGaps(next,inventory)).toEqual([]);
 expect(next.slice(0,3)).toEqual(before);
 expect(next.find(g=>g.permission==='fields.financial.write').fields).toEqual(expect.arrayContaining(['amount','discount_amount']));
 expect(next.find(g=>g.permission==='fields.financial.write').fields).not.toEqual(expect.arrayContaining(['paid_fee','pending_fee','total_fee']));
 expect(next.find(g=>g.permission==='fields.general.write').fields).toContain('comment');
});
