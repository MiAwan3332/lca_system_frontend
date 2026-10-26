import { render, screen } from '@testing-library/react';
import Cookies from 'js-cookie';
import App from './App';

jest.mock('./routes', () => ({ routes: [] }));
jest.mock('./Pages/Login', () => () => <h1>Sign in</h1>);
jest.mock('./Layouts/Dashboard', () => () => <h1>Protected dashboard</h1>);
jest.mock('./Pages/VerifySlip/VerifySlip', () => () => <h1>Public slip verification</h1>);

beforeEach(() => { Cookies.remove('authToken'); sessionStorage.clear(); });
test('an unauthenticated private-page request redirects to sign in', async () => {
  window.history.replaceState({}, '', '/');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument();
});
test('public slip verification remains accessible without an account', async () => {
  window.history.replaceState({}, '', '/verify-slip/local-test');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Public slip verification' })).toBeInTheDocument();
});
