jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn((url, key, options) => ({ options })) }));
test('file login persists independently without authenticating code-based campaign queries', () => {
  const previousUrl = process.env.REACT_APP_SUPABASE_URL;
  const previousKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
  process.env.REACT_APP_SUPABASE_ANON_KEY = 'public-key';
  jest.resetModules();
  try {
    const data = require('./supabase').supabase;
    const files = require('./supabaseMedia').supabaseMedia;
    expect(data).not.toBe(files);
    expect(data.options.auth).toMatchObject({ persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'darkness-data-client' });
    expect(files.options.auth).toMatchObject({ persistSession: true, autoRefreshToken: true });
    expect(files.options.auth.storageKey).toBeUndefined();
  } finally {
    if (previousUrl === undefined) delete process.env.REACT_APP_SUPABASE_URL; else process.env.REACT_APP_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.REACT_APP_SUPABASE_ANON_KEY; else process.env.REACT_APP_SUPABASE_ANON_KEY = previousKey;
  }
});
