import { ouvirCampanha } from './mesaApi';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabaseConfigurado: true,
  supabase: { channel: jest.fn(), removeChannel: jest.fn() },
}));

test('mesa 3D e ferramentas integradas mantêm assinaturas independentes', () => {
  const channels = new Map();
  supabase.channel.mockImplementation(name => {
    if (channels.has(name)) return channels.get(name);
    let subscribed = false;
    const channel = {
      on: jest.fn(() => {
        if (subscribed) throw new Error('callback added after subscribe');
        return channel;
      }),
      subscribe: jest.fn(() => { subscribed = true; return channel; }),
    };
    channels.set(name, channel);
    return channel;
  });
  const stopStage = ouvirCampanha('campaign', jest.fn());
  const stopTools = ouvirCampanha('campaign', jest.fn());
  expect(channels.size).toBe(2);
  stopStage();
  stopTools();
  expect(supabase.removeChannel.mock.calls.map(([channel]) => channel)).toEqual([...channels.values()]);
});
