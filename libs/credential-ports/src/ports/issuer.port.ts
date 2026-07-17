import { CredentialExchange } from '../dtos/credential-exchange.dto';
import { OfferCredentialRequest } from '../dtos/offer-credential-request.dto';

/**
 * Defines agent-agnostic issuer operations for credential offers and exchanges.
 */
export abstract class IssuerPort {
  /**
   * Sends a single offer request and resolves to the resulting credential exchange.
   * May reject with ConnectorUnavailableError, FormatNotSupportedError, TimeoutError,
   * or ValidationError.
   */
  public abstract offerCredential(
    req: OfferCredentialRequest,
  ): Promise<CredentialExchange>;

  /**
   * Fetches a single credential exchange by id and resolves to its current state.
   * May reject with ConnectorUnavailableError or TimeoutError.
   */
  public abstract getExchange(id: string): Promise<CredentialExchange>;
}
