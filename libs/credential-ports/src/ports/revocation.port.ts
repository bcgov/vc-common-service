import { RevocationResult } from '../dto/revocation-result.dto';

/**
 * Defines agent-agnostic revocation operations for credentials.
 */
export abstract class RevocationPort {
  /**
   * Revokes one credential id and resolves to the revocation result.
   * May reject with ConnectorUnavailableError, TimeoutError, or ValidationError.
   */
  public abstract revoke(credentialId: string): Promise<RevocationResult>;

  /**
   * Revokes a batch of credential ids and resolves to one result per id.
   * May reject with ConnectorUnavailableError, TimeoutError, or ValidationError.
   */
  public abstract batchRevoke(
    ids: readonly string[],
  ): Promise<RevocationResult[]>;
}
