import { CredentialExchange } from '../dto/credential-exchange.dto';

/**
 * Defines agent-agnostic holder operations for accepting or rejecting offers.
 */
export abstract class HolderPort {
  /**
   * Accepts a single credential offer exchange and resolves to the updated exchange.
   * May reject with ConnectorUnavailableError or TimeoutError.
   */
  public abstract acceptOffer(exchangeId: string): Promise<CredentialExchange>;

  /**
   * Rejects a single credential offer exchange and resolves when the rejection is recorded.
   * May reject with ConnectorUnavailableError or TimeoutError.
   */
  public abstract rejectOffer(exchangeId: string): Promise<void>;
}
