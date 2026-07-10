export interface SslConfig {
  rejectUnauthorized: boolean;
  ca?: string;
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

  if (ca) {
    sslConfig.ca = ca;
  }

  return sslConfig;
}
