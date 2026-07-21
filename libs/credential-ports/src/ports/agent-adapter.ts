import { ConnectionPort } from './connection.port';
import { HolderPort } from './holder.port';
import { IssuerPort } from './issuer.port';
import { RevocationPort } from './revocation.port';
import { VerifierPort } from './verifier.port';

/**
 * Combines issuer, verifier, holder, connection, and revocation one-shot port semantics.
 */
export interface AgentAdapter
  extends
    IssuerPort,
    VerifierPort,
    HolderPort,
    ConnectionPort,
    RevocationPort {}
