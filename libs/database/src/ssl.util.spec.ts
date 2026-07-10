import * as fs from 'fs';

import { buildSslConfig, SslConfig } from './ssl.util';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('ssl.util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildSslConfig', () => {
    describe('when SSL is disabled', () => {
      it('should return false when sslEnabled is not "true"', () => {
        const result = buildSslConfig('false', 'true', undefined);
        expect(result).toBe(false);
      });

      it('should return false when sslEnabled is undefined', () => {
        const result = buildSslConfig(undefined, 'true', undefined);
        expect(result).toBe(false);
      });

      it('should return false for any non-"true" value', () => {
        expect(buildSslConfig('True', 'true', undefined)).toBe(false);
        expect(buildSslConfig('1', 'true', undefined)).toBe(false);
        expect(buildSslConfig('yes', 'true', undefined)).toBe(false);
      });
    });

    describe('when SSL is enabled', () => {
      it('should return SslConfig with default rejectUnauthorized=true', () => {
        const result = buildSslConfig('true', undefined, undefined);
        expect(result).toEqual({ rejectUnauthorized: true });
      });

      it('should set rejectUnauthorized=false when value is "false"', () => {
        const result = buildSslConfig('true', 'false', undefined);
        expect(result).toEqual({ rejectUnauthorized: false });
      });

      it('should set rejectUnauthorized=true for non-"false" values', () => {
        const result1 = buildSslConfig('true', 'true', undefined);
        const result2 = buildSslConfig('true', 'anything', undefined);
        expect(result1).toEqual({ rejectUnauthorized: true });
        expect(result2).toEqual({ rejectUnauthorized: true });
      });

      it('should include ca from file path', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(
          '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
        );

        const result = buildSslConfig(
          'true',
          'true',
          '/etc/certs/ca.crt',
        ) as SslConfig;

        expect(result.ca).toBe(
          '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
        );
        expect(mockFs.readFileSync).toHaveBeenCalledWith(
          '/etc/certs/ca.crt',
          'utf-8',
        );
      });

      it('should include ca from PEM content directly', () => {
        const pemContent =
          '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----';
        mockFs.existsSync.mockReturnValue(false);

        const result = buildSslConfig('true', 'true', pemContent) as SslConfig;

        expect(result.ca).toBe(pemContent);
      });

      it('should handle file read errors gracefully', () => {
        mockFs.existsSync.mockImplementation(() => {
          throw new Error('Permission denied');
        });
        const pemContent =
          '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----';

        const result = buildSslConfig('true', 'true', pemContent) as SslConfig;

        expect(result.ca).toBe(pemContent);
      });

      it('should not include ca when ca is undefined', () => {
        const result = buildSslConfig('true', 'true', undefined);

        expect(result).toEqual({ rejectUnauthorized: true });
      });

      it('should not include ca when ca is empty string', () => {
        mockFs.existsSync.mockReturnValue(false);

        const result = buildSslConfig('true', 'true', '');

        expect(result).toEqual({ rejectUnauthorized: true });
      });
    });

    describe('rejectUnauthorized logic', () => {
      it('should default to true when rejectUnauthorized is undefined', () => {
        const result = buildSslConfig('true', undefined, undefined);
        expect((result as SslConfig).rejectUnauthorized).toBe(true);
      });

      it('should default to true for empty string', () => {
        const result = buildSslConfig('true', '', undefined);
        expect((result as SslConfig).rejectUnauthorized).toBe(true);
      });

      it('should set to false only when value is exactly "false"', () => {
        expect(
          (buildSslConfig('true', 'false', undefined) as SslConfig)
            .rejectUnauthorized,
        ).toBe(false);
        expect(
          (buildSslConfig('true', 'False', undefined) as SslConfig)
            .rejectUnauthorized,
        ).toBe(true);
        expect(
          (buildSslConfig('true', '0', undefined) as SslConfig)
            .rejectUnauthorized,
        ).toBe(true);
      });
    });

    describe('file vs content detection', () => {
      it('should prefer file path when file exists', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue('file-content');

        const result = buildSslConfig(
          'true',
          'true',
          '/path/to/file',
        ) as SslConfig;

        expect(result.ca).toBe('file-content');
        expect(mockFs.readFileSync).toHaveBeenCalledWith(
          '/path/to/file',
          'utf-8',
        );
      });

      it('should treat as PEM content when file does not exist', () => {
        mockFs.existsSync.mockReturnValue(false);
        const pemContent = '-----BEGIN CERTIFICATE-----';

        const result = buildSslConfig('true', 'true', pemContent) as SslConfig;

        expect(result.ca).toBe(pemContent);
      });

      it('should read relative file paths', () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue('certificate-content');

        const result = buildSslConfig(
          'true',
          'true',
          './certs/ca.pem',
        ) as SslConfig;

        expect(result.ca).toBe('certificate-content');
        expect(mockFs.readFileSync).toHaveBeenCalledWith(
          './certs/ca.pem',
          'utf-8',
        );
      });
    });
  });
});
