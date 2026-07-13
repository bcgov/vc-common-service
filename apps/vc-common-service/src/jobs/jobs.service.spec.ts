import { PgBossService } from '@app/pg-boss';
import { Test, TestingModule } from '@nestjs/testing';

import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let service: JobsService;

  const send = jest.fn();

  const mockPgBossService = {
    boss: {
      send,
    },
  } as unknown as PgBossService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PgBossService,
          useValue: mockPgBossService,
        },
      ],
    }).compile();

    service = module.get(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should publish a job', async () => {
    const jobId = 'job-123';
    const payload = { foo: 'bar' };

    send.mockResolvedValue(jobId);

    await expect(service.publish('test-job', payload)).resolves.toBe(jobId);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('test-job', payload);
  });

  it('should publish a job with null payload', async () => {
    send.mockResolvedValue('job-456');

    await service.publish('test-job', null);

    expect(send).toHaveBeenCalledWith('test-job', null);
  });

  it('should propagate errors from pg-boss', async () => {
    const error = new Error('send failed');

    send.mockRejectedValue(error);

    await expect(service.publish('test-job', {})).rejects.toThrow(
      'send failed',
    );
  });
});
