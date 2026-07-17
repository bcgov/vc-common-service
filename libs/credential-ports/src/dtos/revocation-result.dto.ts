// Agent-agnostic credential revocation result.
export interface RevocationResult {
  readonly credentialId: string;
  readonly revoked: boolean;
  // ISO-8601 timestamp, present when revoked === true.
  readonly revokedAt?: string;
  readonly error?: string;
}
