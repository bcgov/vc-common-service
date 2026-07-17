import { Module } from '@nestjs/common';

import { ConnectionPort } from './ports/connection.port';
import { HolderPort } from './ports/holder.port';
import { IssuerPort } from './ports/issuer.port';
import { RevocationPort } from './ports/revocation.port';
import { VerifierPort } from './ports/verifier.port';
import { StubAdapter } from './testing/stub-adapter';

/**
 * Provides fail-closed default bindings for all credential port contracts.
 */
@Module({
  providers: [
    StubAdapter,
    { provide: IssuerPort, useExisting: StubAdapter },
    { provide: VerifierPort, useExisting: StubAdapter },
    { provide: HolderPort, useExisting: StubAdapter },
    { provide: ConnectionPort, useExisting: StubAdapter },
    { provide: RevocationPort, useExisting: StubAdapter },
  ],
  exports: [
    IssuerPort,
    VerifierPort,
    HolderPort,
    ConnectionPort,
    RevocationPort,
  ],
})
export class CredentialPortsModule {}
