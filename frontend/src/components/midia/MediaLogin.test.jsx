import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import authenticateMedia from './MediaLogin';
import { supabase } from '../../services/supabase';
jest.mock('../../services/supabase', () => ({ supabase: { auth: { signInWithPassword: jest.fn(), signUp: jest.fn() } } }));
jest.mock('../../services/supabaseMedia', () => ({ supabaseMedia: require('../../services/supabase').supabase }));
test('upload authentication returns the Supabase session after explicit login', async () => {
  supabase.auth.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'test-session' } } });
  let result;
  await act(async () => { result = authenticateMedia(); });
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText('Senha da conta de arquivos'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar e continuar' }));
  await act(async () => { expect(await result).toEqual({ access_token: 'test-session' }); });
  expect(screen.queryByRole('dialog')).toBeNull();
});
test('cancelling authentication does not leave a dialog mounted', async () => {
  let result;
  await act(async () => { result = authenticateMedia().catch(error => error.message); });
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await result).toMatch(/Envio cancelado/);
});
