import { CredentialFormat } from '../enums/credential-format.enum';
import { CredentialExchangeState } from '../enums/exchange-state.enum';

import { CredentialAttribute } from './offer-credential-request.dto';

// Agent-agnostic credential exchange record.
export interface CredentialExchange {
  readonly id: string;
  // Backend agent's exchange id, for correlation.
  readonly externalId?: string;
  readonly connectionId?: string;
  readonly state: CredentialExchangeState;
  readonly format: CredentialFormat;
  readonly attributes: readonly CredentialAttribute[];
  // ISO-8601 timestamps.
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly error?: string;
}
