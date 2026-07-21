import { PresentationExchangeState } from '../enums/exchange-state.enum';

// Agent-agnostic presentation exchange record.
export interface PresentationExchange {
  readonly id: string;
  // Backend agent's exchange id, for correlation.
  readonly externalId?: string;
  readonly connectionId?: string;
  readonly state: PresentationExchangeState;
  readonly verified?: boolean;
  // ISO-8601 timestamps.
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly error?: string;
}
