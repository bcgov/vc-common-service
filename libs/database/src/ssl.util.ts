import * as fs from 'fs';

export interface SslConfig {
  rejectUnauthorized: boolean;
  ca?: string;
}

function loadCertificate(caValue: string | undefined): string | undefined {
  if (!caValue) {
    return undefined;
  }

  // Check if the value is a file path
  try {
    if (fs.existsSync(caValue)) {
      return fs.readFileSync(caValue, 'utf-8');
    }
  } catch {
    // If file check fails, treat as PEM contents
  }

  // Assume it's PEM contents directly
  return caValue;
}

export function buildSslConfig(
  sslEnabled: string | undefined,
  rejectUnauthorized: string | undefined,
  ca: string | undefined,
): boolean | SslConfig {
  if (sslEnabled !== 'true') {
    return false;
  }

  const sslConfig: SslConfig = {
    rejectUnauthorized: rejectUnauthorized !== 'false',
  };

  const certificate = loadCertificate(ca);
  if (certificate) {
    sslConfig.ca = certificate;
  }

  return sslConfig;
}
