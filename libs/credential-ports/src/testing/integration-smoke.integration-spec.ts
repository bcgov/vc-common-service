import { MockAdapter } from './mock-adapter';

describe('integration smoke', () => {
  it('discovers integration specs with the dedicated Jest config', async () => {
    const adapter = new MockAdapter();

    const invitation = await adapter.createInvitation({
      alias: 'integration-smoke',
      label: 'Integration Smoke',
    });

    expect(invitation.connectionId).toBeDefined();
    expect(adapter.getCalls('createInvitation')).toHaveLength(1);
  });
});
