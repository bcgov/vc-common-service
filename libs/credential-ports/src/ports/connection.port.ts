import {
  Connection,
  ConnectionFilters,
  Invitation,
  InvitationOptions,
} from '../dto/connection.dto';

/**
 * Defines agent-agnostic connection operations for invitations and connection lookup.
 */
export abstract class ConnectionPort {
  /**
   * Creates one invitation from the supplied options and resolves to that invitation.
   * May reject with ConnectorUnavailableError, TimeoutError, or ValidationError.
   */
  public abstract createInvitation(
    opts: InvitationOptions,
  ): Promise<Invitation>;

  /**
   * Accepts one invitation URL and resolves to the resulting connection.
   * May reject with ConnectorUnavailableError, TimeoutError, or ValidationError.
   */
  public abstract acceptInvitation(url: string): Promise<Connection>;

  /**
   * Lists connections matching one filter request and resolves to the matching results.
   * May reject with ConnectorUnavailableError, TimeoutError, or ValidationError.
   */
  public abstract list(filters: ConnectionFilters): Promise<Connection[]>;

  /**
   * Fetches one connection by id and resolves to its current state.
   * May reject with ConnectorUnavailableError or TimeoutError.
   */
  public abstract getById(id: string): Promise<Connection>;
}
