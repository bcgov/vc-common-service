import { ConfigService } from '@nestjs/config';

import { PgBossService } from './pg-boss.service';

describe('PgBossService', () => {
  let service: PgBossService;

  const start = jest.fn();
  const stop = jest.fn();

  const mockBoss = {
    start,
    stop,
  };

  const config = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PgBossService(config);

    jest.spyOn(service as any, 'createBoss').mockResolvedValue(mockBoss);
  });

  it('starts pg-boss on module init', async () => {
    await service.initializeBoss();

    expect(start).toHaveBeenCalledTimes(1);
    expect(service.boss).toBe(mockBoss);
  });

  it('stops pg-boss on module destroy', async () => {
    service.boss = mockBoss as any;

    await service.onModuleDestroy();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('does nothing on destroy when boss was never created', async () => {
    await expect(service.onModuleDestroy()).resolves.toBeUndefined();

    expect(stop).not.toHaveBeenCalled();
  });
});
