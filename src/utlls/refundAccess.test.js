import axios from 'axios';
import { refreshAccess, resetAccess } from './accessCapabilities';
import { canDecideRefundRequest, canProcessRefundRequest } from './refundAccess';
jest.mock('axios');
const grant = (permissions) => axios.get.mockResolvedValue({ data: { managed: true, owner: false, grants: permissions.map((permission) => ({ permission, scope: 'all' })), routes: [] } });
afterEach(() => resetAccess());

test('refund payouts follow the process permission, not the approval permission', async () => {
  grant(['refund-requests.process.refund.request']); await refreshAccess();
  expect(canProcessRefundRequest()).toBe(true);
  expect(canDecideRefundRequest()).toBe(false);
  grant(['refund-requests.approve.refund.request']); await refreshAccess();
  expect(canProcessRefundRequest()).toBe(false);
  expect(canDecideRefundRequest()).toBe(true);
});
