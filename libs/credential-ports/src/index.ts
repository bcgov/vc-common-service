// Barrel export for @app/credential-ports.
// Enums (runtime values)
export { ConnectorType } from './enums/connector-type.enum';
export { CredentialFormat } from './enums/credential-format.enum';
export {
  ConnectionState,
  CredentialExchangeState,
  PresentationExchangeState,
} from './enums/exchange-state.enum';

// DTOs (type-only)
export type {
  CredentialAttribute,
  OfferCredentialRequest,
} from './dtos/offer-credential-request.dto';
export type { CredentialExchange } from './dtos/credential-exchange.dto';
export type {
  PresentationRequest,
  RequestedAttribute,
  RequestedPredicate,
} from './dtos/presentation-request.dto';
export type { PresentationExchange } from './dtos/presentation-exchange.dto';
export type {
  Connection,
  ConnectionFilters,
  Invitation,
  InvitationOptions,
} from './dtos/connection.dto';
export type { RevocationResult } from './dtos/revocation-result.dto';

// Errors (runtime classes)
export {
  AdapterError,
  ConnectorUnavailableError,
  FormatNotSupportedError,
  TimeoutError,
  ValidationError,
} from './errors/adapter-error';

// Validators
export {
  validateOfferCredentialRequest,
  validatePresentationRequest,
} from './validators/credential.validators';

// Ports (abstract classes — runtime values usable as DI tokens)
export { ConnectionPort } from './ports/connection.port';
export { HolderPort } from './ports/holder.port';
export { IssuerPort } from './ports/issuer.port';
export { RevocationPort } from './ports/revocation.port';
export { VerifierPort } from './ports/verifier.port';
export type { AgentAdapter } from './ports/agent-adapter';

// Testing helpers
export { StubAdapter } from './testing/stub-adapter';

// Module
export { CredentialPortsModule } from './credential-ports.module';
